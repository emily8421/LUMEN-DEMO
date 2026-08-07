// Sprint-27 权限多人化（TC-P2-ACC-001）双用户隔离 smoke（task-039 / REQ-043/044）
// API：注册 A/B → 跨空间零泄露（列表/搜索/doc-links 404）；seed alice+kira 同空间 →
//      PRIVATE 列表/搜索/读取/导出零命中 + doc-links 404 + external 成员只读 4003
// 浏览器：kira 登录 → 目录树无 Kira Secret / 有 Kira Team；alice 登录 → 有 Kira Secret
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const DEFAULT_BACKEND_URL = 'http://localhost:18000';
const DEFAULT_DEBUG_PORT = 9227;
const DEFAULT_TIMEOUT_MS = 20000;

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

async function rawRequest(url, options = {}) {
  const response = await fetch(url, options);
  const buffer = Buffer.from(await response.arrayBuffer());
  return { status: response.status, headers: response.headers, body: buffer };
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
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

async function authGet(backendUrl, apiPath, token) {
  return requestJson(`${backendUrl}${apiPath}`, { headers: { Authorization: `Bearer ${token}` } });
}

async function authPut(backendUrl, apiPath, payload, token) {
  return requestJson(`${backendUrl}${apiPath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
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

async function openDocumentsView(client) {
  await evaluate(client, () => {
    const button = Array.from(document.querySelectorAll('.view-nav button')).find(
      (element) => (element.textContent || '').includes('文档'),
    );
    if (button) {
      button.click();
    }
  });
}

async function treeTitles(client) {
  await waitForPage(client, 'documents tree', () =>
    Boolean(document.querySelector('.document-view-grid') && document.querySelector('.tree-document-row')),
  );
  return evaluate(client, () =>
    Array.from(document.querySelectorAll('.tree-document-row span')).map((element) => (element.textContent || '').trim()),
  );
}

async function runApiChecks(backendUrl) {
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const password = 'smoke-pass-1234';
  const emailA = `iso-a-${runId}@example.com`;
  const emailB = `iso-b-${runId}@example.com`;

  const regA = await jsonPost(backendUrl, '/api/auth/register', { email: emailA, name: 'Iso A', password });
  const regB = await jsonPost(backendUrl, '/api/auth/register', { email: emailB, name: 'Iso B', password });
  assert(regA.status === 200 && regB.status === 200, `register A/B failed: ${regA.status}/${regB.status}`);
  const loginA = await jsonPost(backendUrl, '/api/auth/login', { login_id: emailA, password });
  const loginB = await jsonPost(backendUrl, '/api/auth/login', { login_id: emailB, password });
  assert(loginA.status === 200 && loginB.status === 200, `login A/B failed: ${loginA.status}/${loginB.status}`);
  const tokenA = loginA.body.data.token;
  const tokenB = loginB.body.data.token;

  const spacesA = await authGet(backendUrl, '/api/spaces', tokenA);
  const spacesB = await authGet(backendUrl, '/api/spaces', tokenB);
  const spaceA = spacesA.body.data[0].id;
  const spaceB = spacesB.body.data[0].id;
  assert(spaceA !== spaceB, 'A/B personal spaces must differ');

  const make = (title, permission) => jsonPost(backendUrl, '/api/documents', { title, content_md: `${title} content`, permission }, tokenA);
  const privateA = await make('A Secret', 'private');
  const teamA = await make('A Team', 'team');
  const externalA = await make('A External', 'external');
  assert(privateA.status === 200 && teamA.status === 200 && externalA.status === 200, 'A create docs failed');
  const privateAId = privateA.body.data.id;

  // B 跨空间：列表/搜索零 A 文档；doc-links 对不可见文档 → 404
  const listB = await authGet(backendUrl, '/api/documents', tokenB);
  assert(listB.body.data.every((d) => !d.title.startsWith('A ')), 'cross-space leak: B saw A documents');
  const searchB = await authGet(backendUrl, `/api/search?q=${encodeURIComponent('A Secret')}`, tokenB);
  assert(searchB.body.data.items.every((item) => item.title !== 'A Secret'), 'cross-space leak: B search hit A private doc');
  const linksB = await authGet(backendUrl, `/api/doc-links?document_id=${privateAId}&direction=outbound`, tokenB);
  assert(linksB.status === 404 && linksB.body.code === 4004, `doc-links on invisible doc expected 404/4004, got ${linksB.status}/${linksB.body?.code}`);

  // seed 同空间对：alice + kira（space 10）
  const loginAlice = await jsonPost(backendUrl, '/api/auth/login', { login_id: 'alice', password: 'demo-pass-1234' });
  const loginKira = await jsonPost(backendUrl, '/api/auth/login', { login_id: 'kira', password: 'demo-pass-1234' });
  assert(loginAlice.status === 200 && loginKira.status === 200, `seed login failed: ${loginAlice.status}/${loginKira.status}`);
  const tokenAlice = loginAlice.body.data.token;
  const tokenKira = loginKira.body.data.token;
  const spaceAlice = loginAlice.body.data.current_space_id;
  const spaceKira = loginKira.body.data.current_space_id;
  assert(spaceAlice === spaceKira, `seed alice/kira should share space, got ${spaceAlice}/${spaceKira}`);

  const makeInShared = (title, permission, token) => jsonPost(backendUrl, '/api/documents', { title, content_md: `${title} content`, permission }, token);
  const secret = await makeInShared('Kira Secret', 'private', tokenAlice);
  const team = await makeInShared('Kira Team', 'team', tokenAlice);
  const external = await makeInShared('Kira External', 'external', tokenAlice);
  assert(secret.status === 200 && team.status === 200 && external.status === 200, 'alice create in shared space failed');
  const secretId = secret.body.data.id;
  const externalId = external.body.data.id;

  // kira 同空间：PRIVATE 列表/搜索/读取/导出零命中 + doc-links 404 + external 只读 4003
  const listKira = await authGet(backendUrl, '/api/documents', tokenKira);
  const kiraTitles = listKira.body.data.map((d) => d.title);
  assert(kiraTitles.includes('Kira Team') && kiraTitles.includes('Kira External'), `kira missing visible docs: ${JSON.stringify(kiraTitles)}`);
  assert(!kiraTitles.includes('Kira Secret'), 'leak: kira saw alice private doc in list');

  const searchKira = await authGet(backendUrl, `/api/search?q=${encodeURIComponent('Kira Secret')}`, tokenKira);
  assert(searchKira.body.data.items.every((item) => item.title !== 'Kira Secret'), 'leak: kira search hit alice private doc');

  const getKira = await authGet(backendUrl, `/api/documents/${secretId}`, tokenKira);
  assert(getKira.status === 404 && getKira.body.code === 4004, `kira read private doc expected 404/4004, got ${getKira.status}`);

  const linksKira = await authGet(backendUrl, `/api/doc-links?document_id=${secretId}&direction=outbound`, tokenKira);
  assert(linksKira.status === 404 && linksKira.body.code === 4004, `kira doc-links on private doc expected 404/4004, got ${linksKira.status}/${linksKira.body?.code}`);

  const updateExternal = await authPut(backendUrl, `/api/documents/${externalId}`, { title: 'Kira External', content_md: 'hijacked', permission: 'external' }, tokenKira);
  assert(updateExternal.status === 403 && updateExternal.body.code === 4003, `kira update external expected 403/4003, got ${updateExternal.status}/${updateExternal.body?.code}`);

  const exportKira = await rawRequest(`${backendUrl}/api/export/space`, { headers: { Authorization: `Bearer ${tokenKira}` } });
  assert(exportKira.status === 200, `kira export expected 200, got ${exportKira.status}`);
  assert(exportKira.body.includes(Buffer.from('Kira Team.md', 'utf8')), 'export zip missing Kira Team entry');
  assert(!exportKira.body.includes(Buffer.from('Kira Secret.md', 'utf8')), 'leak: export zip contains Kira Secret entry');

  const listAlice = await authGet(backendUrl, '/api/documents', tokenAlice);
  assert(listAlice.body.data.some((d) => d.title === 'Kira Secret'), 'alice should see own private doc');

  return { spaceA, spaceB, secretId, teamTitle: 'Kira Team', secretTitle: 'Kira Secret' };
}

async function runBrowserChecks(frontendUrl, debugPort, ids) {
  const pageWebSocketUrl = await createPageTarget(debugPort, frontendUrl);
  const client = await CdpSession.connect(pageWebSocketUrl);

  // kira：同空间成员 → 私有文档不出现在目录树
  await waitForPage(client, 'login panel', () => Boolean(document.querySelector('.login-panel')));
  await submitLogin(client, 'kira', 'demo-pass-1234');
  await waitForWorkspace(client);
  await openDocumentsView(client);
  const kiraTitles = await treeTitles(client);
  assert(kiraTitles.includes(ids.teamTitle), `kira tree missing visible doc: ${JSON.stringify(kiraTitles)}`);
  assert(!kiraTitles.includes(ids.secretTitle), `leak: kira tree shows private doc: ${JSON.stringify(kiraTitles)}`);

  // alice：owner → 私有文档出现在目录树
  await logoutViaTopBar(client);
  await submitLogin(client, 'alice', 'demo-pass-1234');
  await waitForWorkspace(client);
  await openDocumentsView(client);
  const aliceTitles = await treeTitles(client);
  assert(aliceTitles.includes(ids.secretTitle), `alice tree missing own private doc: ${JSON.stringify(aliceTitles)}`);
  return { kiraTitles, aliceTitles };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const frontendUrl = normalizeBaseUrl(args['frontend-url'] || DEFAULT_FRONTEND_URL);
  const backendUrl = normalizeBaseUrl(args['backend-url'] || DEFAULT_BACKEND_URL);
  const debugPort = requireNumber(args['debug-port'], DEFAULT_DEBUG_PORT, 'debug-port');
  const headed = Boolean(args.headed);
  const keepBrowser = Boolean(args['keep-browser']);
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

  const apiResult = await runApiChecks(backendUrl);
  process.stdout.write('API isolation checks passed (register A/B cross-space + alice/kira same-space).\n');

  let browserProcess = null;
  let profileDir = '';
  try {
    profileDir = await mkdtemp(path.join(os.tmpdir(), `lumen-s27-smoke-${runId}-`));
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
    const browserResult = await runBrowserChecks(frontendUrl, debugPort, apiResult);
    process.stdout.write('Browser isolation checks passed (kira no private doc / alice sees private doc).\n');
    process.stdout.write(`OK: cross-space + same-space isolation verified. kira=${JSON.stringify(browserResult.kiraTitles)} alice=${JSON.stringify(browserResult.aliceTitles)}\n`);
  } finally {
    if (browserProcess && !keepBrowser) {
      browserProcess.kill();
      await new Promise((resolve) => browserProcess.once('exit', resolve));
    }
    if (!keepBrowser && profileDir) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          await rm(profileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
          break;
        } catch (error) {
          if (attempt === 4) {
            process.stderr.write(`cleanup warning: could not remove profile dir: ${error.message}\n`);
          } else {
            await sleep(400);
          }
        }
      }
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});