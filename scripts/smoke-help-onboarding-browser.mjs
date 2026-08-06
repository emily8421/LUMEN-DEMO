// Sprint-25 帮助与引导体系 L0+L1 浏览器 smoke（TC-P2-HELP-001 自动化子集）
// 覆盖：登录 → 首次引导 3 步 → 首页未建索引提示 → 搜索/问答空态 → 标签/时间线空态入口 → 帮助速查过滤 → 跳过引导持久化。
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const DEFAULT_DEBUG_PORT = 9225;
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
  return parsed;
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
  return waitForNode('browser CDP endpoint', () => requestJson(versionUrl), 10000);
}

async function createPageTarget(debugPort, frontendUrl) {
  const targetUrl = `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(frontendUrl)}`;
  let target = null;
  try {
    target = await requestJson(targetUrl, { method: 'PUT' });
  } catch {
    target = await requestJson(targetUrl);
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

async function clickNav(client, label) {
  await evaluate(client, (navLabel) => {
    const button = Array.from(document.querySelectorAll('.view-nav button'))
      .find((element) => (element.textContent || '').includes(navLabel));
    if (!button) {
      throw new Error(`Nav button not found: ${navLabel}`);
    }
    button.click();
  }, label);
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
}async function runBrowserFlow(client) {
  // 1) 登录（全新 profile：无 session、无 onboarding 记录）
  await waitForPage(client, 'login form', () => Boolean(document.querySelector('.login-panel form')));
  await evaluate(client, (userName) => {
    const input = document.querySelector('.login-panel input');
    const button = document.querySelector('.login-panel button[type="submit"]');
    if (!input || !button) {
      throw new Error('Login controls not found.');
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, userName);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    button.click();
  }, 'alice');

  // 2) 首次引导弹层：3 步
  await waitForPage(client, 'onboarding guide', () => Boolean(document.querySelector('.onboarding-modal')));
  const steps = await evaluate(client, () =>
    Array.from(document.querySelectorAll('.onboarding-step-body strong')).map((element) => element.textContent || ''),
  );
  assert(steps.length === 3, `onboarding shows 3 steps, got ${steps.length}`);
  assert(
    steps.some((text) => text.includes('新建一篇文档')) &&
      steps.some((text) => text.includes('保存后去搜索')) &&
      steps.some((text) => text.includes('去问答提问')),
    `onboarding steps content mismatch: ${JSON.stringify(steps)}`,
  );

  // 3) 步骤 1「去完成」→ 关闭引导并进入文档编辑态
  await evaluate(client, () => {
    const step = Array.from(document.querySelectorAll('.onboarding-step'))
      .find((element) => (element.textContent || '').includes('新建一篇文档'));
    if (!step) {
      throw new Error('Onboarding step 1 not found.');
    }
    const button = step.querySelector('button');
    if (!button) {
      throw new Error('Onboarding step 1 button not found.');
    }
    button.click();
  });
  await waitForPage(client, 'editor form after step 1', () => Boolean(document.querySelector('.editor-form')));
  await waitForPage(client, 'onboarding closed after step 1', () => !document.querySelector('.onboarding-overlay'));

  // 4) 首页：新手清单 + 示例文档未建索引提示
  await clickNav(client, '首页');
  await waitForPage(client, 'welcome checklist', () => Boolean(document.querySelector('.welcome-checklist')));
  const noticeOk = await evaluate(client, () => {
    const notice = document.querySelector('.welcome-notice');
    return Boolean(notice && (notice.textContent || '').includes('未建索引'));
  });
  assert(noticeOk, 'home shows 示例文档未建索引 notice');
  const checklistProgress = await evaluate(client, () => (document.querySelector('.welcome-checklist header span')?.textContent || '').trim());
  assert(checklistProgress.includes('1/3'), `welcome checklist progress is 1/3, got ${checklistProgress}`);

  // 5) 搜索空态：引导 + 下一步按钮
  await clickNav(client, '搜索');
  await waitForPage(client, 'search empty guide', () => Boolean(document.querySelector('.search-panel .empty-state-guide')));
  const searchActions = await evaluate(client, () =>
    Array.from(document.querySelectorAll('.search-panel .empty-state-actions button')).map((element) => element.textContent || ''),
  );
  assert(
    searchActions.some((text) => text.includes('去新建文档')) && searchActions.some((text) => text.includes('去导入')),
    `search empty-state actions mismatch: ${JSON.stringify(searchActions)}`,
  );

  // 6) 问答空态：引导 + 下一步按钮
  await clickNav(client, '问答');
  await waitForPage(client, 'query empty guide', () => Boolean(document.querySelector('.query-panel .empty-state-guide')));
  const queryActions = await evaluate(client, () =>
    Array.from(document.querySelectorAll('.query-panel .empty-state-actions button')).map((element) => element.textContent || ''),
  );
  assert(
    queryActions.some((text) => text.includes('去新建文档')) && queryActions.some((text) => text.includes('去导入')),
    `query empty-state actions mismatch: ${JSON.stringify(queryActions)}`,
  );

  // 7) 时间线空态：下一步入口
  await clickNav(client, '时间线');
  await waitForPage(client, 'timeline empty guide', () => Boolean(document.querySelector('.timeline-panel .empty-state-guide')));
  const timelineHint = await evaluate(client, () => (document.querySelector('.timeline-panel .empty-state-guide')?.textContent || ''));
  assert(timelineHint.includes('去新建或导入文档'), 'timeline empty state shows next-step entry');

  // 8) 标签空态（若空间无标签）：下一步入口
  await clickNav(client, '标签');
  await waitForPage(client, 'tags view', () => Boolean(document.querySelector('.tag-panel')));
  const tagsEmpty = await evaluate(client, () => {
    const empty = document.querySelector('.tag-panel .tag-list-pane .empty-state');
    return empty ? (empty.textContent || '') : null;
  });
  if (tagsEmpty !== null) {
    assert(tagsEmpty.includes('去新建或导入文档'), `tags empty state next-step entry missing: ${tagsEmpty}`);
  }

  // 9) 帮助弹层：轻量过滤可检索到「导入」+ 完整手册链接
  await evaluate(client, () => {
    const trigger = document.querySelector('.help-trigger');
    if (!trigger) {
      throw new Error('Help trigger not found.');
    }
    trigger.click();
  });
  await waitForPage(client, 'help popover', () => Boolean(document.querySelector('.help-popover')));
  const helpTotal = await evaluate(client, () => document.querySelectorAll('.help-popover .help-list div').length);
  assert(helpTotal >= 5, `help popover has entries, got ${helpTotal}`);
  await setInputValue(client, '.help-filter', '导入');
  await waitForPage(client, 'help filtered to 导入', () => {
    const entries = Array.from(document.querySelectorAll('.help-popover .help-list div'));
    return entries.length > 0 && entries.length < document.querySelectorAll('.help-popover .help-list div').length + 1 && entries.some((element) => (element.textContent || '').includes('导入'));
  });
  const filteredCount = await evaluate(client, () => document.querySelectorAll('.help-popover .help-list div').length);
  assert(filteredCount < helpTotal, `help filter narrows results (${filteredCount} < ${helpTotal})`);
  const manualLink = await evaluate(client, () => Boolean(document.querySelector('.help-manual-link')));
  assert(manualLink, 'help popover has 查看完整手册 link');

  // 10) 跳过引导：持久化 completed=true，刷新不再弹出
  await evaluate(client, () => localStorage.removeItem('lumen-demo-onboarding'));
  await client.send('Page.reload');
  await waitForPage(client, 'onboarding guide after clearing storage', () => Boolean(document.querySelector('.onboarding-modal')));
  await evaluate(client, () => {
    const skip = Array.from(document.querySelectorAll('.onboarding-footer button'))
      .find((element) => (element.textContent || '').includes('跳过引导'));
    if (!skip) {
      throw new Error('Skip onboarding button not found.');
    }
    skip.click();
  });
  await waitForPage(client, 'onboarding closed after skip', () => !document.querySelector('.onboarding-overlay'));
  const persisted = await evaluate(client, () => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem('lumen-demo-onboarding') || '{}');
      return parsed.completed === true;
    } catch {
      return false;
    }
  });
  assert(persisted, 'skip onboarding persists completed=true');
  await client.send('Page.reload');
  await waitForPage(client, 'app reloaded', () => document.readyState === 'complete');
  await sleep(1200);
  const repop = await evaluate(client, () => Boolean(document.querySelector('.onboarding-overlay')));
  assert(!repop, 'onboarding does not repop after skip + reload');

  return { steps, searchActions, queryActions, helpTotal, filteredCount };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const frontendUrl = normalizeBaseUrl(args['frontend-url'] || DEFAULT_FRONTEND_URL);
  const debugPort = requireNumber(args['debug-port'], DEFAULT_DEBUG_PORT, 'debug-port');
  const timeoutMs = requireNumber(args.timeout, DEFAULT_TIMEOUT_MS, 'timeout');
  const headed = Boolean(args.headed);
  const keepBrowser = Boolean(args['keep-browser']);
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

  let browserProcess = null;
  let profileDir = '';
  let client = null;
  try {
    profileDir = await mkdtemp(path.join(os.tmpdir(), `lumen-help-smoke-${runId}-`));
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

    const summary = await runBrowserFlow(client);
    process.stdout.write(JSON.stringify({ result: 'PASS', ...summary }, null, 2) + '\n');
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