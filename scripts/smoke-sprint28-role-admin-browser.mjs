// Sprint-28 角色分层 + 用户管理 + 团队空间加入（TC-P2-ACC-002，task-040）smoke
// 浏览器：admin（alice）用户菜单「用户管理」入口 + 成员视图管理控件可见；member（kira）两者均不可见
// API：login 响应 role / admin 列表（无 password_hash）/ member 4030 / 改角色 / 禁用登录 403 /
//      成员按 email 添加 409 重复 / 改空间角色 / 移除后失权 / 最后一个 admin 4090 / 搜索 4030
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const DEFAULT_BACKEND_URL = 'http://localhost:18000';
const DEFAULT_DEBUG_PORT = 9229;
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

async function jsonPost(backendUrl, apiPath, payload, token) {
  return requestJson(`${backendUrl}${apiPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
}

async function jsonRequest(backendUrl, method, apiPath, payload, token) {
  return requestJson(`${backendUrl}${apiPath}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
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

async function runBrowserFlow(client) {
  // admin（alice）：用户菜单含「用户管理」入口，导航含「成员」视图，成员页有添加表单
  await submitLogin(client, 'alice', 'demo-pass-1234');
  await waitForWorkspace(client);

  await evaluate(client, () => {
    const trigger = document.querySelector('.user-menu-trigger');
    if (!trigger) {
      throw new Error('User menu trigger not found.');
    }
    trigger.click();
  });
  await waitForPage(client, 'admin user-menu entry', () => Boolean(document.querySelector('.user-menu-admin')));

  const adminEntryText = await evaluate(client, () => {
    const button = document.querySelector('.user-menu-admin');
    return button ? button.textContent.trim() : '';
  });
  assert(adminEntryText.includes('用户管理'), `admin menu entry expected 用户管理, got ${adminEntryText}`);

  // 进入用户管理页
  await evaluate(client, () => {
    const button = document.querySelector('.user-menu-admin');
    if (!button) {
      throw new Error('User management entry not found.');
    }
    button.click();
  });
  await waitForPage(client, 'admin users table', () => Boolean(document.querySelector('.admin-users-table tbody tr')));
  const adminRowCount = await evaluate(client, () => document.querySelectorAll('.admin-users-table tbody tr').length);
  assert(adminRowCount >= 3, `admin users rows expected >= 3, got ${adminRowCount}`);

  // 导航「成员」视图（alice = 全局 admin，应可见）
  await evaluate(client, () => {
    const button = Array.from(document.querySelectorAll('.view-nav button')).find(
      (element) => (element.textContent || '').includes('成员'),
    );
    if (!button) {
      throw new Error('Members nav entry not found.');
    }
    button.click();
  });
  await waitForPage(client, 'members page', () => Boolean(document.querySelector('.members-table tbody tr')));
  const hasAddForm = await evaluate(client, () => Boolean(document.querySelector('.member-add-form')));
  assert(hasAddForm, 'admin should see member add form');

  // 切到 kira（member）：用户菜单无「用户管理」、导航无「成员」
  await logoutViaTopBar(client);
  await submitLogin(client, 'kira', 'demo-pass-1234');
  await waitForWorkspace(client);

  const memberHasAdminEntry = await evaluate(client, () => {
    const trigger = document.querySelector('.user-menu-trigger');
    if (!trigger) {
      return false;
    }
    trigger.click();
    return Boolean(document.querySelector('.user-menu-admin'));
  });
  assert(!memberHasAdminEntry, 'member should NOT see admin user-management entry');

  const memberHasMembersNav = await evaluate(client, () =>
    Array.from(document.querySelectorAll('.view-nav button')).some((element) => (element.textContent || '').includes('成员')),
  );
  assert(!memberHasMembersNav, 'member should NOT see members nav entry');

  return {
    adminEntryVisible: true,
    adminRowCount,
    membersViewVisible: true,
    memberEntryHidden: !memberHasAdminEntry,
    memberMembersNavHidden: !memberHasMembersNav,
  };
}

async function runApiChecks(backendUrl) {
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const password = 'smoke-pass-1234';
  const email = `role-${runId}@example.com`;

  const loginAlice = await jsonPost(backendUrl, '/api/auth/login', { login_id: 'alice', password: 'demo-pass-1234' });
  const loginKira = await jsonPost(backendUrl, '/api/auth/login', { login_id: 'kira', password: 'demo-pass-1234' });
  assert(loginAlice.status === 200 && loginKira.status === 200, `seed login failed: ${loginAlice.status}/${loginKira.status}`);
  assert(loginAlice.body.data.role === 'admin', `alice role expected admin, got ${loginAlice.body.data.role}`);
  assert(loginKira.body.data.role === 'member', `kira role expected member, got ${loginKira.body.data.role}`);
  const aliceToken = loginAlice.body.data.token;
  const kiraToken = loginKira.body.data.token;

  // 注册新用户（默认 member）
  const reg = await jsonPost(backendUrl, '/api/auth/register', { email, name: 'Role Smoke', password });
  assert(reg.status === 200, `register failed: ${reg.status} ${JSON.stringify(reg.body)}`);
  const newUserId = reg.body.data.user_id;

  // admin 列表：member 4030；admin 200 且不泄露 password_hash
  const kiraList = await jsonRequest(backendUrl, 'GET', '/api/admin/users', undefined, kiraToken);
  assert(kiraList.status === 403 && kiraList.body.code === 4030, `member admin list expected 403/4030, got ${kiraList.status}/${kiraList.body.code}`);
  const adminList = await jsonRequest(backendUrl, 'GET', '/api/admin/users', undefined, aliceToken);
  assert(adminList.status === 200, `admin list expected 200, got ${adminList.status}`);
  assert(Array.isArray(adminList.body.data) && adminList.body.data.length >= 4, 'admin list should include registered user');
  assert(adminList.body.data.every((row) => !('password_hash' in row)), 'admin list must not expose password_hash');
  assert(adminList.body.data.every((row) => typeof row.role === 'string' && typeof row.last_login_at === 'string'), 'admin list should include role/last_login_at');

  // 改全局角色 + 禁用 → 登录 403 → 启用（恢复）
  const promote = await jsonRequest(backendUrl, 'PATCH', `/api/admin/users/${newUserId}`, { role: 'admin' }, aliceToken);
  assert(promote.status === 200 && promote.body.data.role === 'admin', `promote failed: ${promote.status}`);
  const disable = await jsonRequest(backendUrl, 'PATCH', `/api/admin/users/${newUserId}`, { status: 'disabled' }, aliceToken);
  assert(disable.status === 200 && disable.body.data.status === 'disabled', `disable failed: ${disable.status}`);
  const disabledLogin = await jsonPost(backendUrl, '/api/auth/login', { login_id: email, password });
  assert(disabledLogin.status === 403 && disabledLogin.body.code === 4030, `disabled login expected 403/4030, got ${disabledLogin.status}`);
  const enable = await jsonRequest(backendUrl, 'PATCH', `/api/admin/users/${newUserId}`, { status: 'active' }, aliceToken);
  assert(enable.status === 200 && enable.body.data.status === 'active', `enable failed: ${enable.status}`);
  const demote = await jsonRequest(backendUrl, 'PATCH', `/api/admin/users/${newUserId}`, { role: 'member' }, aliceToken);
  assert(demote.status === 200 && demote.body.data.role === 'member', `demote failed: ${demote.status}`);

  // 空间成员：member 添加 4030；admin 按 email 添加 → 重复 409 → 改角色 → 移除 → 移除后失权
  const kiraAdd = await jsonPost(backendUrl, '/api/spaces/10/members', { email, role: 'member' }, kiraToken);
  assert(kiraAdd.status === 403 && kiraAdd.body.code === 4030, `member add expected 403/4030, got ${kiraAdd.status}/${kiraAdd.body.code}`);
  const addOk = await jsonPost(backendUrl, '/api/spaces/10/members', { email, role: 'member' }, aliceToken);
  assert(addOk.status === 200 && addOk.body.data.user_id === newUserId, `add member failed: ${addOk.status} ${JSON.stringify(addOk.body)}`);
  const addDup = await jsonPost(backendUrl, '/api/spaces/10/members', { email, role: 'member' }, aliceToken);
  assert(addDup.status === 409 && addDup.body.code === 4090, `duplicate add expected 409/4090, got ${addDup.status}/${addDup.body.code}`);
  const roleChange = await jsonRequest(backendUrl, 'PATCH', `/api/spaces/10/members/${newUserId}`, { role: 'admin' }, aliceToken);
  assert(roleChange.status === 200 && roleChange.body.data.role === 'admin', `role change failed: ${roleChange.status}`);
  // 最后一个空间 admin（空间 20 仅 alice）降级 → 4090
  const lastAdminDemote = await jsonRequest(backendUrl, 'PATCH', '/api/spaces/20/members/1', { role: 'member' }, aliceToken);
  assert(lastAdminDemote.status === 409 && lastAdminDemote.body.code === 4090, `last admin demote expected 409/4090, got ${lastAdminDemote.status}/${lastAdminDemote.body.code}`);
  const removeOk = await jsonRequest(backendUrl, 'DELETE', `/api/spaces/10/members/${newUserId}`, undefined, aliceToken);
  assert(removeOk.status === 200, `remove member failed: ${removeOk.status}`);
  const loginNew = await jsonPost(backendUrl, '/api/auth/login', { login_id: email, password });
  const newToken = loginNew.body.data.token;
  const removedAccess = await jsonRequest(backendUrl, 'GET', '/api/spaces/10/members', undefined, newToken);
  assert(removedAccess.status === 403 && removedAccess.body.code === 4003, `removed member access expected 403/4003, got ${removedAccess.status}/${removedAccess.body.code}`);

  // 用户搜索：admin 200 / member 4030；不泄露 password_hash
  const searchAdmin = await jsonRequest(backendUrl, 'GET', '/api/users/search?q=kira', undefined, aliceToken);
  assert(searchAdmin.status === 200 && searchAdmin.body.data.some((row) => row.email === 'kira@example.com'), 'admin search should find kira');
  assert(!('password_hash' in searchAdmin.body.data[0]), 'search must not expose password_hash');
  const searchMember = await jsonRequest(backendUrl, 'GET', '/api/users/search?q=kira', undefined, kiraToken);
  assert(searchMember.status === 403 && searchMember.body.code === 4030, `member search expected 403/4030, got ${searchMember.status}/${searchMember.body.code}`);

  return {
    loginRoleOk: true,
    memberAdminList403: kiraList.status,
    adminListRows: adminList.body.data.length,
    noPasswordHash: true,
    promoteDisableEnableOk: true,
    memberAdd403: kiraAdd.status,
    duplicate409: addDup.status,
    lastAdminDemote409: lastAdminDemote.status,
    removeLosesAccess: true,
    searchMember403: searchMember.status,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const frontendUrl = normalizeBaseUrl(args['frontend-url'] || DEFAULT_FRONTEND_URL);
  const backendUrl = normalizeBaseUrl(args['backend-url'] || DEFAULT_BACKEND_URL);
  const debugPort = requireNumber(args['debug-port'], DEFAULT_DEBUG_PORT, 'debug-port');
  const timeoutMs = requireNumber(args.timeout, DEFAULT_TIMEOUT_MS, 'timeout');
  const headed = Boolean(args.headed);
  const keepBrowser = Boolean(args['keep-browser']);

  let browserProcess = null;
  let profileDir = '';
  let client = null;
  try {
    profileDir = await mkdtemp(path.join(os.tmpdir(), `lumen-sprint28-smoke-`));
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

    const browserSummary = await runBrowserFlow(client);
    const apiSummary = await runApiChecks(backendUrl);
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
