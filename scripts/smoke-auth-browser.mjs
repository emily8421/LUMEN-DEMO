// Sprint-26 账号体系（TC-P2-AUTH-001 浏览器 + API 子集）smoke（task-038 / REQ-040/041/042）
// 浏览器：登录页（登录/注册 tab）→ 注册新用户自动登录 → 顶栏登出 → 凭证登录 → 受保护视图加载 → seed 快捷登录
// API：refresh 轮换旧 token 失效 / sessions 多设备与撤销 / 重复 email 409 / 短密码 422 / 错误凭证 401
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const DEFAULT_BACKEND_URL = 'http://localhost:18000';
const DEFAULT_DEBUG_PORT = 9226;
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
        return;
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

async function setInputValue(client, selector, value) {
  await evaluate(client, (targetSelector, nextValue) => {
    const input = document.querySelector(targetSelector);
    if (!input) {
      throw new Error(`Input not found: ${targetSelector}`);
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, nextValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
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

async function submitLogin(client, loginId, password) {
  await evaluate(client, (userId, userPassword) => {
    const form = document.querySelector('.login-panel form');
    if (!form) {
      throw new Error('Login form not found.');
    }
    const inputs = form.querySelectorAll('input');
    if (inputs.length < 2) {
      throw new Error(`Login form inputs mismatch: ${inputs.length}`);
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inputs[0], userId);
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    setter.call(inputs[1], userPassword);
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
    form.querySelector('button[type="submit"]').click();
  }, loginId, password);
}

async function submitRegister(client, email, name, password) {
  await evaluate(client, (userEmail, userName, userPassword) => {
    const form = document.querySelector('.login-panel form');
    if (!form) {
      throw new Error('Register form not found.');
    }
    const inputs = form.querySelectorAll('input');
    if (inputs.length < 3) {
      throw new Error(`Register form inputs mismatch: ${inputs.length}`);
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const values = [userEmail, userName, userPassword];
    inputs.forEach((input, index) => {
      setter.call(input, values[index]);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    form.querySelector('button[type="submit"]').click();
  }, email, name, password);
}

async function waitForWorkspace(client) {
  await waitForPage(client, 'workspace after auth', () => {
    const loginPanel = document.querySelector('.login-panel');
    const topBar = document.querySelector('.topbar');
    return Boolean(!loginPanel && topBar);
  });
}

async function logoutViaTopBar(client) {
  await evaluate(client, () => {
    const trigger = document.querySelector('.user-menu-trigger');
    if (!trigger) {
      throw new Error('User menu trigger not found.');
    }
    trigger.click();
  });
  await waitForPage(client, 'user menu popover', () => Boolean(document.querySelector('.user-menu-logout')));
  await evaluate(client, () => {
    const button = document.querySelector('.user-menu-logout');
    if (!button) {
      throw new Error('Logout button not found.');
    }
    button.click();
  });
  await waitForPage(client, 'login panel after logout', () => Boolean(document.querySelector('.login-panel')));
}

async function runBrowserFlow(client, email, password) {
  // 1) 登录页：登录 / 注册 tab
  await waitForPage(client, 'login panel with auth tabs', () =>
    Boolean(document.querySelector('.login-panel') && document.querySelector('.auth-tabs')),
  );
  const tabs = await evaluate(client, () =>
    Array.from(document.querySelectorAll('.auth-tabs button')).map((element) => (element.textContent || '').trim()),
  );
  assert(tabs.includes('登录') && tabs.includes('注册'), `auth tabs mismatch: ${JSON.stringify(tabs)}`);

  // 2) 注册 tab → 注册新用户（自动登录）
  await clickTab(client, '注册');
  await waitForPage(client, 'register form', () => {
    const form = document.querySelector('.login-panel form');
    return Boolean(form && form.querySelectorAll('input').length >= 3);
  });
  await submitRegister(client, email, 'Smoke Tester', password);
  await waitForWorkspace(client);
  const registerNotice = await evaluate(client, () => (document.querySelector('.status-bar span')?.textContent || ''));
  assert(registerNotice.includes('注册成功'), `register success notice missing: ${registerNotice}`);

  // 3) 顶栏登出 → 回到登录面板
  await logoutViaTopBar(client);

  // 4) 凭证登录（新用户 email + 密码）
  await clickTab(client, '登录');
  await submitLogin(client, email, password);
  await waitForWorkspace(client);
  // 登录态确认：顶栏用户菜单存在即视为已登录（status-bar notice 可能已被后续加载覆盖）
  await waitForPage(client, 'user menu trigger after login', () => Boolean(document.querySelector('.user-menu-trigger')));
  const loginNotice = await evaluate(client, () => (document.querySelector('.status-bar span')?.textContent || '').slice(0, 60));

  // 5) 受保护视图加载（文档视图）
  await evaluate(client, () => {
    const button = Array.from(document.querySelectorAll('.view-nav button')).find(
      (element) => (element.textContent || '').includes('文档'),
    );
    if (button) {
      button.click();
    }
  });
  await waitForPage(client, 'documents panel', () =>
    Boolean(document.querySelector('.document-view-grid')),
  );

  // 6) seed 快捷登录（demo 内存仓储：alice 无密码路径）→ 登出
  await logoutViaTopBar(client);
  await clickTab(client, '登录');
  await submitLogin(client, 'alice', 'demo-pass-1234');
  await waitForWorkspace(client);
  await logoutViaTopBar(client);

  return { registeredEmail: email, tabs, registerNotice, loginNotice };
}

async function runApiChecks(backendUrl, email, password) {
  const jsonPost = (url, body, token) =>
    requestJson(`${backendUrl}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body || {}),
    });

  // 重复 email → 409
  const duplicate = await jsonPost('/api/auth/register', { email, name: 'Dupe', password });
  assert(duplicate.status === 409 && duplicate.body.code === 4090, `duplicate register expected 409/4090, got ${duplicate.status}/${duplicate.body?.code}`);

  // 短密码 → 422
  const shortPassword = await jsonPost('/api/auth/register', { email: 'short@example.com', name: 'Short', password: '1234567' });
  assert(shortPassword.status === 422 && shortPassword.body.code === 4220, `short password expected 422/4220, got ${shortPassword.status}/${shortPassword.body?.code}`);

  // 错误凭证 → 401（统一防枚举）
  const badLogin = await jsonPost('/api/auth/login', { login_id: email, password: 'wrong-password-1' });
  assert(badLogin.status === 401 && badLogin.body.code === 4010, `bad login expected 401/4010, got ${badLogin.status}/${badLogin.body?.code}`);

  // seed 快捷登录（demo 内存仓储允许无密码）
  const seedLogin = await jsonPost('/api/auth/login', { login_id: 'alice', password: 'demo-pass-1234' });
  assert(seedLogin.status === 200 && seedLogin.body.code === 0 && seedLogin.body.data.token, 'seed login failed');
  const seedToken = seedLogin.body.data.token;

  // 受保护 API：GET /api/spaces
  const spaces = await requestJson(`${backendUrl}/api/spaces`, { headers: { Authorization: `Bearer ${seedToken}` } });
  assert(spaces.status === 200 && Array.isArray(spaces.body.data), 'protected /api/spaces access failed');

  // refresh 轮换：旧 token 失效
  const refreshed = await jsonPost('/api/auth/refresh', {}, seedToken);
  assert(refreshed.status === 200 && refreshed.body.data.token, 'refresh failed');
  const oldTokenRejected = await requestJson(`${backendUrl}/api/spaces`, { headers: { Authorization: `Bearer ${seedToken}` } });
  assert(oldTokenRejected.status === 401, `old token should be invalid after refresh, got ${oldTokenRejected.status}`);
  const newToken = refreshed.body.data.token;

  // 多设备会话：再登录一次 → sessions 列表 ≥2 → 撤销 secondToken 自身会话（用 newToken 作为 owner）
  const secondLogin = await jsonPost('/api/auth/login', { login_id: 'alice', password: 'demo-pass-1234' });
  const secondToken = secondLogin.body.data.token;
  const sessions = await requestJson(`${backendUrl}/api/auth/sessions`, { headers: { Authorization: `Bearer ${newToken}` } });
  assert(sessions.status === 200 && Array.isArray(sessions.body.data) && sessions.body.data.length >= 2, `sessions list expected >=2, got ${sessions.body.data?.length}`);
  const mySessions = await requestJson(`${backendUrl}/api/auth/sessions`, { headers: { Authorization: `Bearer ${secondToken}` } });
  const targetId = mySessions.body.data.find((row) => row.current)?.id;
  assert(targetId !== undefined, 'no current session id found for secondToken');
  const revoke = await requestJson(`${backendUrl}/api/auth/sessions/${targetId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${newToken}` } });
  assert(revoke.status === 200, `revoke session expected 200, got ${revoke.status}`);
  // 撤销幂等：重复撤销同一会话仍 200；不存在 / 非本人 → 404（不泄露存在性）
  const revokeAgain = await requestJson(`${backendUrl}/api/auth/sessions/${targetId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${newToken}` } });
  assert(revokeAgain.status === 200, `re-revoke expected 200 (idempotent), got ${revokeAgain.status}`);
  const revokeMissing = await requestJson(`${backendUrl}/api/auth/sessions/999999`, { method: 'DELETE', headers: { Authorization: `Bearer ${newToken}` } });
  assert(revokeMissing.status === 404, `revoke missing session expected 404, got ${revokeMissing.status}`);

  // 撤销后该会话 token 失效
  const revokedTokenRejected = await requestJson(`${backendUrl}/api/spaces`, { headers: { Authorization: `Bearer ${secondToken}` } });
  assert(revokedTokenRejected.status === 401, `revoked session token should be invalid, got ${revokedTokenRejected.status}`);

  return { duplicateStatus: duplicate.status, shortPasswordStatus: shortPassword.status, badLoginStatus: badLogin.status, refreshRotates: true, sessionsCount: sessions.body.data.length, revokeStatus: revoke.status, revokeIdempotent: revokeAgain.status, revokeMissingStatus: revokeMissing.status };
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
  const email = `smoke-${runId}@example.com`;
  const password = 'smoke-pass-1234';

  let browserProcess = null;
  let profileDir = '';
  let client = null;
  try {
    profileDir = await mkdtemp(path.join(os.tmpdir(), `lumen-auth-smoke-${runId}-`));
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

    const browserSummary = await runBrowserFlow(client, email, password);
    const apiSummary = await runApiChecks(backendUrl, email, password);
    process.stdout.write(JSON.stringify({ result: 'PASS', ...browserSummary, ...apiSummary }, null, 2) + '\n');
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
