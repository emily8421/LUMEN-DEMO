// REQ-051 浏览器 UI smoke（登录密码小眼睛 + 忘记密码 modal）—— TC-P2-AUTH-002「浏览器 smoke」证据（原留候选）。
//
// 覆盖：
//   小眼睛 toggle（登录 + 注册密码框）：input.type password↔text + aria-label「显示密码」↔「隐藏密码」双向
//   忘记密码 modal：入口（.auth-link-button）→ step email 申请（注册 email，恒响应 .modal-notice）→
//                   step confirm（invalid token + 合规新密码 → .modal-error，对应 API-056 4010）→
//                   短密码 submit disabled（组件 newPassword.length < 8）→ 关闭
//
// 不覆盖（由其他证据兜底）：
//   - confirm 成功路径（valid token → 新密码登录 → session 吊销）：demo 无 SMTP，token 写后端日志，UI 无法稳定获取；
//     由后端 reset 单测（tests/backend，含 confirm 成功 + session 全吊销）覆盖
//   - 防枚举（注册 vs 未注册响应一致）：由 batch5 API smoke API-055 覆盖；UI smoke 聚焦前端交互，不重复 API 行为
//
// 模式：CDP 直连（参考 smoke-auth-browser.mjs），零依赖（原生 WebSocket + node:child_process spawn Chrome/Edge）。
// 前置：demo 已起（backend :18000 + frontend :5173，内存或 PG 模式均可——demo_repository 与 PgRepository 均实现 reset）。
// 用法：node scripts/smoke-req051-password-ui-browser.mjs [--frontend-url http://localhost:5173] [--backend-url http://localhost:18000] [--headed] [--keep-browser]
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const DEFAULT_BACKEND_URL = 'http://localhost:18000';
const DEFAULT_DEBUG_PORT = 9227; // 避开 smoke-auth-browser(9226)
const DEFAULT_TIMEOUT_MS = 15000;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) {
      throw new Error(`Unexpected argument: ${item}`);
    }
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function requireNumber(value, fallback, label) {
  if (value === undefined || value === true) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive number.`);
  }
  return parsed;
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 200)}`);
  }
  return { status: response.status, body: parsed };
}

async function waitForNode(label, fn, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const value = await fn();
      if (value) {
        return value;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? ` (${lastError})` : ''}.`);
}

function browserCandidates(explicitBrowser) {
  return [
    explicitBrowser,
    process.env.LUMEN_BROWSER,
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.ProgramFiles || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.ProgramFiles || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
    'chrome',
    'msedge',
  ].filter(Boolean);
}

function findBrowser(explicitBrowser) {
  for (const candidate of browserCandidates(explicitBrowser)) {
    if (candidate === 'chrome' || candidate === 'msedge' || existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error('Could not find Chrome or Edge. Pass --browser <path> or set LUMEN_BROWSER.');
}

async function waitForDebugEndpoint(debugPort) {
  const versionUrl = `http://127.0.0.1:${debugPort}/json/version`;
  return waitForNode('browser CDP endpoint', () => requestJson(versionUrl).then((r) => r.status === 200), 10000);
}

async function createPageTarget(debugPort, frontendUrl) {
  const targetUrl = `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(frontendUrl)}`;
  let target = null;
  try {
    target = (await requestJson(targetUrl, { method: 'PUT' })).body;
  } catch {
    target = (await requestJson(targetUrl)).body;
  }
  if (!target?.webSocketDebuggerUrl) {
    throw new Error('Browser target did not expose webSocketDebuggerUrl.');
  }
  return target.webSocketDebuggerUrl;
}

class CdpSession {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          pending.reject(new Error(`${message.error.message || 'CDP error'} (${message.method || pending.method})`));
        } else {
          pending.resolve(message.result || {});
        }
      }
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out opening CDP websocket.')), 10000);
      socket.addEventListener('open', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });
      socket.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('Failed to open CDP websocket.'));
      }, { once: true });
    });
    return new CdpSession(socket);
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(client, fn, ...args) {
  const expression = `(${fn.toString()})(${args.map((arg) => JSON.stringify(arg)).join(',')})`;
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
    throw new Error(`Browser evaluation failed: ${description}`);
  }
  return result.result?.value;
}

async function waitForPage(client, label, fn, args = [], timeoutMs = DEFAULT_TIMEOUT_MS) {
  return waitForNode(label, async () => evaluate(client, fn, ...args), timeoutMs);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
}

async function clickTab(client, tabLabel) {
  await evaluate(client, (label) => {
    const button = Array.from(document.querySelectorAll('.auth-tabs button')).find(
      (element) => (element.textContent || '').trim() === label,
    );
    if (!button) {
      throw new Error(`Auth tab not found: ${label}`);
    }
    button.click();
  }, tabLabel);
}

async function registerSmokeUser(backendUrl) {
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const email = `smoke-req051-${runId}@example.com`;
  const res = await requestJson(`${backendUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name: 'REQ051 Smoke', password: 'smoke-pass-1234' }),
  });
  assert(res.status === 200 && res.body.code === 0, `smoke register failed: ${res.status}/${res.body?.code}`);
  return email;
}

async function runReq051Flow(client, smokeEmail) {
  const results = {};

  // 1) 登录页 + 小眼睛就绪
  await waitForPage(client, 'login panel with password toggle', () =>
    Boolean(
      document.querySelector('.login-panel') &&
        document.querySelector('.login-panel form .password-input') &&
        document.querySelector('.login-panel form .password-toggle'),
    ),
  );

  // 2) 小眼睛 toggle（登录密码框）双向：password/显示密码 → text/隐藏密码 → password/显示密码
  const loginBefore = await evaluate(client, () => {
    const input = document.querySelector('.login-panel form .password-input input');
    const toggle = document.querySelector('.login-panel form .password-toggle');
    return { type: input?.type, aria: toggle?.getAttribute('aria-label') };
  });
  assert(
    loginBefore.type === 'password' && loginBefore.aria === '显示密码',
    `login toggle before: ${JSON.stringify(loginBefore)}`,
  );
  await evaluate(client, () => document.querySelector('.login-panel form .password-toggle').click());
  await waitForPage(client, 'login toggle → text/隐藏密码', () => {
    const input = document.querySelector('.login-panel form .password-input input');
    const toggle = document.querySelector('.login-panel form .password-toggle');
    return input?.type === 'text' && toggle?.getAttribute('aria-label') === '隐藏密码';
  });
  await evaluate(client, () => document.querySelector('.login-panel form .password-toggle').click());
  await waitForPage(client, 'login toggle → back to password/显示密码', () => {
    const input = document.querySelector('.login-panel form .password-input input');
    const toggle = document.querySelector('.login-panel form .password-toggle');
    return input?.type === 'password' && toggle?.getAttribute('aria-label') === '显示密码';
  });
  results.loginToggleBidirectional = true;

  // 3) 注册 tab 小眼睛 toggle（注册密码框）
  await clickTab(client, '注册');
  await waitForPage(client, 'register form (>=3 inputs + toggle)', () => {
    const form = document.querySelector('.login-panel form');
    return Boolean(
      form &&
        form.querySelectorAll('input').length >= 3 &&
        form.querySelector('.password-toggle'),
    );
  });
  const registerBefore = await evaluate(client, () => {
    const form = document.querySelector('.login-panel form');
    return { type: form.querySelector('.password-input input')?.type };
  });
  assert(
    registerBefore.type === 'password',
    `register toggle before: ${JSON.stringify(registerBefore)}`,
  );
  await evaluate(client, () => {
    const form = document.querySelector('.login-panel form');
    form.querySelector('.password-toggle').click();
  });
  await waitForPage(client, 'register toggle → text', () => {
    const form = document.querySelector('.login-panel form');
    return form.querySelector('.password-input input')?.type === 'text';
  });
  results.registerToggle = true;

  // 4) 回登录 tab → 点「忘记密码？」→ modal 打开
  await clickTab(client, '登录');
  await waitForPage(client, 'login form (2 inputs)', () => {
    const form = document.querySelector('.login-panel form');
    return Boolean(form && form.querySelectorAll('input').length === 2);
  });
  await evaluate(client, () => {
    const btn = document.querySelector('.auth-link-button');
    if (!btn) {
      throw new Error('forgot-password link (.auth-link-button) not found');
    }
    btn.click();
  });
  await waitForPage(client, 'password reset modal', () =>
    Boolean(document.querySelector('.password-reset-modal')),
  );
  const modalAria = await evaluate(client, () =>
    document.querySelector('.password-reset-modal')?.getAttribute('aria-label'),
  );
  assert(modalAria === '重置密码', `modal aria-label: ${modalAria}`);
  results.modalOpened = true;

  // 5) step email：注册 email 申请 → 进 confirm（.modal-notice + token input）
  await evaluate(client, (email) => {
    const form = document.querySelector('.password-reset-modal form');
    const emailInput = form.querySelector('input[type="email"]');
    if (!emailInput) {
      throw new Error('email input not found in reset modal');
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(emailInput, email);
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    form.querySelector('button[type="submit"]').click();
  }, smokeEmail);
  await waitForPage(
    client,
    'confirm step (notice + token input)',
    () => {
      const modal = document.querySelector('.password-reset-modal');
      if (!modal) return false;
      const form = modal.querySelector('form');
      if (!form) return false;
      const inputs = Array.from(form.querySelectorAll('input'));
      const hasToken = inputs.some((i) => !i.closest('.password-input'));
      return Boolean(modal.querySelector('.modal-notice') && hasToken);
    },
    [],
    10000,
  );
  const notice = await evaluate(client, () =>
    (document.querySelector('.password-reset-modal .modal-notice')?.textContent || '').trim(),
  );
  assert(notice.length > 0, 'reset request notice empty');
  results.resetRequestNotice = notice.slice(0, 80);

  // 6) step confirm：invalid token + 合规新密码 → 提交 → .modal-error（API-056 4010 → 前端 setError）
  await evaluate(
    client,
    (token, pwd) => {
      const form = document.querySelector('.password-reset-modal form');
      const inputs = Array.from(form.querySelectorAll('input'));
      const tokenInput = inputs.find((i) => !i.closest('.password-input'));
      const pwdInput = inputs.find((i) => i.closest('.password-input'));
      if (!tokenInput || !pwdInput) {
        throw new Error('confirm inputs not found');
      }
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(tokenInput, token);
      tokenInput.dispatchEvent(new Event('input', { bubbles: true }));
      setter.call(pwdInput, pwd);
      pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
      form.querySelector('button[type="submit"]').click();
    },
    'invalid-token-x',
    'newpass123',
  );
  await waitForPage(
    client,
    'confirm error (invalid token)',
    () => Boolean(document.querySelector('.password-reset-modal .modal-error')),
    [],
    10000,
  );
  const errorText = await evaluate(client, () =>
    (document.querySelector('.password-reset-modal .modal-error')?.textContent || '').trim(),
  );
  assert(errorText.length > 0, 'confirm error empty (invalid token should produce .modal-error)');
  results.confirmInvalidTokenError = errorText.slice(0, 80);

  // 7) 短密码 → submit disabled（组件 newPassword.length < 8）
  await evaluate(client, (shortPwd) => {
    const form = document.querySelector('.password-reset-modal form');
    const pwdInput = Array.from(form.querySelectorAll('input')).find((i) => i.closest('.password-input'));
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(pwdInput, shortPwd);
    pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
  }, 'short');
  await waitForPage(client, 'short password disables confirm submit', () => {
    const form = document.querySelector('.password-reset-modal form');
    return Boolean(form.querySelector('button[type="submit"]')?.disabled);
  });
  const shortDisabled = await evaluate(client, () => {
    const form = document.querySelector('.password-reset-modal form');
    const btn = form.querySelector('button[type="submit"]');
    return Boolean(btn?.disabled);
  });
  assert(shortDisabled === true, 'short password should disable confirm submit');
  results.shortPasswordDisablesSubmit = true;

  // 8) 关闭 modal（「关闭」按钮）→ modal 消失
  await evaluate(client, () => {
    const modal = document.querySelector('.password-reset-modal');
    const closeBtn = modal.querySelector('.modal-header button');
    if (closeBtn) {
      closeBtn.click();
    }
  });
  await waitForPage(client, 'modal closed', () => !document.querySelector('.password-reset-modal'));
  results.modalClosed = true;

  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const frontendUrl = normalizeBaseUrl(args['frontend-url'] || DEFAULT_FRONTEND_URL);
  const backendUrl = normalizeBaseUrl(args['backend-url'] || DEFAULT_BACKEND_URL);
  const debugPort = requireNumber(args['debug-port'], DEFAULT_DEBUG_PORT, 'debug-port');
  const timeoutMs = requireNumber(args.timeout, DEFAULT_TIMEOUT_MS, 'timeout');
  const headed = Boolean(args.headed);
  const keepBrowser = Boolean(args['keep-browser']);
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

  let browserProcess = null;
  let profileDir = '';
  let client = null;
  try {
    profileDir = await mkdtemp(path.join(os.tmpdir(), `lumen-req051-smoke-${runId}-`));
    const browser = findBrowser(args.browser === true ? '' : args.browser);
    const browserArgs = [
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-gpu',
      '--no-sandbox',
      'about:blank',
    ];
    if (!headed) {
      browserArgs.unshift('--headless=new');
    }
    browserProcess = spawn(browser, browserArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
    browserProcess.on('exit', (code, signal) => {
      if (code !== null && code !== 0 && !keepBrowser) {
        process.stderr.write(`Browser exited with code ${code} signal ${signal || ''}\n`);
      }
    });

    await waitForDebugEndpoint(debugPort);
    const pageWebSocketUrl = await createPageTarget(debugPort, frontendUrl);
    client = await CdpSession.connect(pageWebSocketUrl);
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await waitForPage(client, 'frontend document ready', () => document.readyState === 'complete', [], timeoutMs);

    const smokeEmail = await registerSmokeUser(backendUrl);
    const flowSummary = await runReq051Flow(client, smokeEmail);
    process.stdout.write(JSON.stringify({ result: 'PASS', smokeEmail, ...flowSummary }, null, 2) + '\n');
  } finally {
    if (client) {
      client.close();
    }
    if (browserProcess && !keepBrowser) {
      browserProcess.kill();
    }
    if (profileDir) {
      await rm(profileDir, { recursive: true, force: true }).catch(() => null);
    }
  }
}

main().catch((error) => {
  process.stderr.write(`SMOKE FAILED: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
