// TC-P2-VAULT-004 自动化 smoke（REQ-018 模式 B 增强·跨设备 vault 挂载元数据，Wave 3）
// 蓝本：scripts/smoke-vault-local-mount-browser.mjs（CdpSession / evaluate / waitForPage）。
//
// 覆盖「设备 B 侧」验收（设备 A 挂载 → 元数据入库 → 设备 B 登录可见挂载点列表）：
//   ① API 预置：登录 alice → POST /api/vault-mounts（模拟设备 A 上报 granted）
//   ② UI 可见：浏览器登录 alice → documents → 「本地挂载」分区渲染「跨设备挂载」
//      列表（含预置的挂载名 + “其他设备”标记）
//   ③ revoked 过滤：再上报 revoked → 刷新后列表不再展示该挂载
//   ④ API 契约：GET 返回行含 auth_status / source_type / device_id 元数据字段
//
// 不自动化（FSA 限制）：showDirectoryPicker 授权对话框无法 headless 触发——
// 「本机挂载成功自动上报 granted」由组件 effect + 单测覆盖，用户人工验收可选。
//
// 跑：volta run --node 22.17.1 node scripts/smoke-vault-mounts-browser.mjs [--frontend-url --backend-url --debug-port --headed --browser]
// 或经 scripts/run-smoke.ps1 -SmokeScript scripts/smoke-vault-mounts-browser.mjs -UsePostgres

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const DEFAULT_BACKEND_URL = 'http://127.0.0.1:18000';
const DEFAULT_DEBUG_PORT = 9226; // 避开 smoke-vault-local-mount(9225) / folder-tree(9224)
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
  const schema = await waitForNode('backend /openapi.json', () => requestJson(`${backendUrl}/openapi.json`), 10000);
  if (!schema.paths?.['/api/vault-mounts']) {
    throw new Error('Backend /api/vault-mounts not in OpenAPI（API-059 未部署？）');
  }
}

// ── API 侧：登录 + 上报（模拟设备 A）──

async function apiLogin(backendUrl) {
  const login = await requestJson(`${backendUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: 'alice', password: 'demo-pass-1234' }),
  });
  if (login.code !== 0) throw new Error(`alice login failed: ${JSON.stringify(login).slice(0, 200)}`);
  return login.data.token;
}

async function apiReport(backendUrl, token, payload) {
  const response = await requestJson(`${backendUrl}/api/vault-mounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (response.code !== 0) throw new Error(`report failed: ${JSON.stringify(response).slice(0, 200)}`);
  return response.data;
}

async function apiList(backendUrl, token) {
  const response = await requestJson(`${backendUrl}/api/vault-mounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.code !== 0) throw new Error(`list failed: ${JSON.stringify(response).slice(0, 200)}`);
  return response.data;
}

// ── UI 侧（蓝本 smoke-vault-local-mount-browser 的登录 / 导航）──

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const frontendUrl = (args['frontend-url'] || DEFAULT_FRONTEND_URL).replace(/\/+$/, '');
  const backendUrl = (args['backend-url'] || DEFAULT_BACKEND_URL).replace(/\/+$/, '');
  const debugPort = Number(args['debug-port'] || DEFAULT_DEBUG_PORT);
  const headed = Boolean(args.headed);
  const keepBrowser = Boolean(args['keep-browser']);
  const MOUNT_NAME = 'smoke-device-a-vault';

  await checkBackend(backendUrl);

  // ① API 预置：模拟设备 A 挂载上报（granted）——demo 登录密码为 seed demo-pass-1234；
  //    PG 真实模式亦适用（migration 014 seed 同密码）。登录失败时给出定位提示。
  let token;
  try {
    token = await apiLogin(backendUrl);
  } catch (error) {
    throw new Error(`alice 登录失败（demo/PG seed 密码 demo-pass-1234）：${error instanceof Error ? error.message : error}`);
  }
  const reported = await apiReport(backendUrl, token, {
    device_id: 'smoke-device-a',
    mount_name: MOUNT_NAME,
    source_type: 'obsidian',
  });
  if (!reported || reported.auth_status !== 'granted') {
    throw new Error(`设备 A 上报异常：${JSON.stringify(reported).slice(0, 200)}`);
  }
  const rows = await apiList(backendUrl, token);
  const mine = rows.find((r) => r.mount_name === MOUNT_NAME && r.auth_status === 'granted');
  if (!mine || !mine.source_type || !mine.device_id) {
    throw new Error(`GET 清单缺元数据字段：${JSON.stringify(mine).slice(0, 200)}`);
  }

  // ② UI：设备 B（浏览器）登录同一账号 → 本地挂载分区展示跨设备清单
  const browser = findBrowser(args.browser);
  const profileDir = await mkdtemp(path.join(os.tmpdir(), 'lumen-vault-mounts-smoke-'));
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

    await loginAlice(client);
    await waitForPage(client, 'workspace shell', () => document.querySelector('.workspace-shell') !== null);
    await goToDocuments(client);
    await waitForPage(client, 'local mount pane', () => document.querySelector('.local-mount-pane') !== null);

    const remoteSummary = await waitForPage(client, 'remote mounts summary', () => {
      const toggle = document.querySelector('.local-mount-remote-toggle');
      return toggle ? toggle.textContent || '' : '';
    });
    if (!remoteSummary.includes(MOUNT_NAME) && !remoteSummary.includes('跨设备挂载')) {
      throw new Error(`跨设备清单摘要异常：${remoteSummary.slice(0, 120)}`);
    }
    if (!remoteSummary.includes('其他设备')) {
      throw new Error(`摘要未标记其他设备（device_id=smoke-device-a ≠ 本机 token）：${remoteSummary.slice(0, 120)}`);
    }

    // 展开核对挂载名行
    await evaluate(client, () => document.querySelector('.local-mount-remote-toggle')?.click());
    const listText = await waitForPage(client, 'remote mounts list', () => {
      const list = document.querySelector('.local-mount-remote-list');
      return list ? list.textContent || '' : '';
    });
    if (!listText.includes(MOUNT_NAME)) {
      throw new Error(`跨设备清单缺挂载名 ${MOUNT_NAME}：${listText.slice(0, 160)}`);
    }
    if (!listText.includes('其他设备')) {
      throw new Error(`清单行未标注其他设备：${listText.slice(0, 160)}`);
    }

    // ③ revoked 软撤销 → 刷新后 UI 不再展示
    await apiReport(backendUrl, token, {
      device_id: 'smoke-device-a',
      mount_name: MOUNT_NAME,
      source_type: 'obsidian',
      auth_status: 'revoked',
    });
    await evaluate(client, () => location.reload());
    await waitForPage(client, 'workspace shell after reload', () => document.querySelector('.workspace-shell') !== null);
    await goToDocuments(client);
    await waitForPage(client, 'local mount pane after reload', () => document.querySelector('.local-mount-pane') !== null);
    // revoked 无 granted 行时清单整体隐藏（.local-mount-remote 不渲染）
    const remoteGone = await waitForPage(client, 'remote list hides revoked', () => {
      const pane = document.querySelector('.local-mount-pane');
      if (!pane) return false;
      // 等待清单加载稳定：有 .local-mount-remote 且含挂载名（失败态）或无该节点（通过）
      const node = pane.querySelector('.local-mount-remote');
      return !node || !(node.textContent || '').includes(MOUNT_NAME);
    });
    if (!remoteGone) throw new Error('revoked 上报后清单仍展示该挂载');

    console.log(
      `VAULT_MOUNTS_BROWSER_SMOKE ok mount="${MOUNT_NAME}" rows=${rows.length} revoked_filtered=true`
    );
    console.log('注：本机挂载即自动上报（showDirectoryPicker）走用户人工验收；本 smoke 覆盖设备 B 侧可见性 + revoked 过滤。');
  } finally {
    if (client) client.close();
    if (!keepBrowser) child.kill();
    if (!keepBrowser) {
      try { await rm(profileDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  }
}

main().catch((error) => {
  console.error('VAULT_MOUNTS_BROWSER_SMOKE FAIL:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
