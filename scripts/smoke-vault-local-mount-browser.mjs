// TC-P2-VAULT-001 自动化 smoke（REQ-018 模式 B，本地 Vault 仅本地挂载）
// 蓝本：scripts/smoke-folder-tree-browser.mjs（CdpSession / evaluate / waitForPage / findBrowser）。
//
// 自动化覆盖（CDP 可靠）：
//   - 前提：localhost secure context + showDirectoryPicker + IndexedDB 可用（RG-009 前提）
//   - UI：登录 → 进 documents 视图 → 「本地挂载」分区（.local-mount-pane）渲染 + 挂载按钮存在
//
// 不自动化（FSA 限制）：showDirectoryPicker 授权对话框需用户手势 + 系统级弹窗，CDP 无法触发。
//   核心能力（① 授权 + 刷新恢复 granted / ② 本地树 / ③ 本地搜索 / ④ 分区隔离 /
//   ⑤ 按需导入 API-029 / ⑥ Network 零上传）走用户人工 smoke（与 PoC §5.2 一致），
//   清单见 tasks/task-034-vault-tc-smoke.md。
//
// 跑：volta run --node 22.17.1 node scripts/smoke-vault-local-mount-browser.mjs [--frontend-url --backend-url --debug-port --headed --browser]

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_FRONTEND_URL = 'http://localhost:5173'; // secure context 硬前提（FSA）
const DEFAULT_BACKEND_URL = 'http://127.0.0.1:18000';
const DEFAULT_DEBUG_PORT = 9225; // 避开 smoke-folder-tree-browser.mjs 的 9224
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function waitForNode(label, predicate, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
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
          pending.reject(new Error(`${message.error.message || 'CDP error'} (${pending.method})`));
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
      socket.addEventListener('open', () => { clearTimeout(timeout); resolve(); }, { once: true });
      socket.addEventListener('error', () => { clearTimeout(timeout); reject(new Error('Failed to open CDP websocket.')); }, { once: true });
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
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const value = await evaluate(client, fn, ...args);
      if (value) return value;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? ` (${lastError})` : ''}.`);
}

async function checkBackend(backendUrl) {
  await waitForNode('backend /openapi.json', () => requestJson(`${backendUrl}/openapi.json`), 10000);
}

async function loginAlice(client) {
  await waitForPage(client, 'login panel', () => document.querySelector('.login-panel') !== null);
  await evaluate(client, (username) => {
    const input = document.querySelector('.login-panel input');
    if (input) {
      input.value = username;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const form = document.querySelector('.login-panel form');
    if (form) form.requestSubmit();
  }, 'alice');
}

async function goToDocuments(client) {
  // WorkspaceViewNav「文档」入口
  await waitForPage(client, 'documents nav', () => {
    const btns = Array.from(document.querySelectorAll('.workspace-view-nav button, nav button, [role="tab"]'));
    return btns.some((b) => (b.textContent || '').includes('文档'));
  });
  await evaluate(client, () => {
    const btns = Array.from(document.querySelectorAll('.workspace-view-nav button, nav button, [role="tab"]'));
    const target = btns.find((b) => (b.textContent || '').includes('文档'));
    if (target) target.click();
  });
}

async function runBrowserFlow(client) {
  // ① 前提：secure context + FSA + IndexedDB
  const prereq = await evaluate(client, () => ({
    secure: window.isSecureContext,
    host: location.hostname,
    fsa: typeof window.showDirectoryPicker === 'function',
    idb: 'indexedDB' in window,
  }));
  if (!prereq.secure) throw new Error(`前提失败：isSecureContext=false（host=${prereq.host}）；须 http://localhost 访问。`);
  if (!prereq.fsa) throw new Error('前提失败：showDirectoryPicker 不可用（须 Chrome/Edge）。');
  if (!prereq.idb) throw new Error('前提失败：IndexedDB 不可用。');

  // ② 登录 → 进 documents 视图
  await loginAlice(client);
  await waitForPage(client, 'workspace shell', () => document.querySelector('.workspace-shell') !== null);
  await goToDocuments(client);
  await waitForPage(client, 'documents context pane', () => document.querySelector('.context-pane.context-documents') !== null);

  // ③ UI：「本地挂载」分区渲染
  await waitForPage(client, 'local mount pane', () => document.querySelector('.local-mount-pane') !== null);
  const paneText = await evaluate(client, () => document.querySelector('.local-mount-pane')?.textContent ?? '');
  if (!paneText.includes('本地挂载')) throw new Error(`本地挂载分区文案异常：${paneText.slice(0, 120)}`);

  // ④ 无运行时 JS 错误（收集 console error / exception）
  // 注：核心 FSA 授权 / 挂载 / 索引 / 搜索 / 恢复 / 导入 / Network 零上传走用户人工 smoke。

  return { prereq, paneSnippet: paneText.slice(0, 80) };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const frontendUrl = (args['frontend-url'] || DEFAULT_FRONTEND_URL).replace(/\/+$/, '');
  const backendUrl = (args['backend-url'] || DEFAULT_BACKEND_URL).replace(/\/+$/, '');
  const debugPort = Number(args['debug-port'] || DEFAULT_DEBUG_PORT);
  const headed = Boolean(args.headed);
  const keepBrowser = Boolean(args['keep-browser']);

  await checkBackend(backendUrl);

  const browser = findBrowser(args.browser);
  const profileDir = await mkdtemp(path.join(os.tmpdir(), 'lumen-vault-smoke-'));
  const browserArgs = [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
  ];
  if (!headed) browserArgs.push('--headless=new');
  const child = spawn(browser, browserArgs, { stdio: 'ignore' });

  let client = null;
  try {
    await waitForDebugEndpoint(debugPort);
    const wsUrl = await createPageTarget(debugPort, frontendUrl);
    client = await CdpSession.connect(wsUrl);
    await client.send('Runtime.enable');
    await client.send('Page.enable');

    const result = await runBrowserFlow(client);
    console.log(
      `VAULT_LOCAL_MOUNT_BROWSER_SMOKE ok host=${result.prereq.host} secure=${result.prereq.secure} fsa=${result.prereq.fsa} idb=${result.prereq.idb} pane="${result.paneSnippet}"`
    );
    console.log('注：核心 FSA 授权 / 挂载 / 索引 / 搜索 / 恢复 / 导入 / Network 零上传走用户人工 smoke（见 tasks/task-034）。');
  } finally {
    if (client) client.close();
    if (!keepBrowser) child.kill();
    if (!keepBrowser) {
      try { await rm(profileDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  }
}

main().catch((error) => {
  console.error('VAULT_LOCAL_MOUNT_BROWSER_SMOKE FAIL:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
