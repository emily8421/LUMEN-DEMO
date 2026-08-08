// 批2 UI 维护态增强浏览器 smoke（2026-08-08）：
// 验证 ④ TOC 目录导航、⑤ md 编辑工具栏、⑥ 文件夹右键「在此新建文档」。
// 复用 smoke-folder-tree-browser.mjs 的 CDP 驱动骨架；内存模式 alice 免密。
// 注意：前端 dev server 绑 ::1（IPv6），必须用 http://localhost:5173，127.0.0.1 连不上。

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const DEFAULT_BACKEND_URL = 'http://127.0.0.1:18000';
const DEFAULT_DEBUG_PORT = 9227;
const DEFAULT_TIMEOUT_MS = 20000;

const UI_TEXT = {
  documentsView: '文档',
  createDocInFolder: '在此新建文档',
  newDocTitle: '批2 文件夹内新建文档',
  tocTitle: '目录',
  headingText: '批2 标题一',
  mdToolbarBold: '加粗',
};

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeBaseUrl(url) {
  return String(url).replace(/\/+$/, '');
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON from ${url}, got: ${text.slice(0, 200)}`);
    }
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}: ${text.slice(0, 300)}`);
  }
  return body;
}

async function waitForNode(label, predicate, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
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
  const candidates = [
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
  return candidates;
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
    this.events = [];

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
      if (message.method) {
        this.events.push(message);
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
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const value = await evaluate(client, fn, ...args);
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

async function api(backendUrl, pathName, { method = 'GET', token = '', body = undefined } = {}) {
  const headers = { Accept: 'application/json' };
  const options = { method, headers };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const envelope = await requestJson(`${backendUrl}${pathName}`, options);
  if (envelope?.code !== 0) {
    throw new Error(`API ${method} ${pathName} failed: ${envelope?.msg || 'unknown error'}`);
  }
  return envelope.data;
}

async function login(backendUrl, userName) {
  const session = await api(backendUrl, '/api/auth/login', {
    method: 'POST',
    body: { external_id: userName },
  });
  return session.token;
}

async function runBrowserFlow(client, fixture) {
  // 登录（内存模式 alice 免密）
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
  }, fixture.userName);
  await waitForPage(client, 'workspace shell', () => Boolean(document.querySelector('.workspace-layout')));

  // 切到文档视图
  await evaluate(client, (documentsLabel) => {
    const button = Array.from(document.querySelectorAll('.view-nav button'))
      .find((element) => (element.textContent || '').includes(documentsLabel));
    if (!button) {
      throw new Error('Documents view nav button not found.');
    }
    button.click();
  }, UI_TEXT.documentsView);
  await waitForPage(client, 'folder tree', () => Boolean(document.querySelector('.folder-tree[role="tree"]')));

  // 找到夹具文件夹
  await waitForPage(client, `fixture folder ${fixture.folderName}`, (folderName) => {
    return Array.from(document.querySelectorAll('.tree-folder-label span'))
      .some((element) => (element.textContent || '').trim() === folderName);
  }, [fixture.folderName]);

  // ⑥ 右键文件夹 → 「在此新建文档」
  await evaluate(client, (folderName) => {
    const label = Array.from(document.querySelectorAll('.tree-folder-label'))
      .find((element) => (element.textContent || '').trim() === folderName);
    if (!label) {
      throw new Error(`Folder label not found: ${folderName}`);
    }
    const rect = label.getBoundingClientRect();
    label.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 20,
      clientY: rect.top + 10,
      button: 2,
    }));
  }, fixture.folderName);
  await waitForPage(client, '「在此新建文档」菜单项', (menuText) => {
    return Array.from(document.querySelectorAll('.tree-menu-popover [role="menuitem"]'))
      .some((element) => (element.textContent || '').includes(menuText));
  }, [UI_TEXT.createDocInFolder]);
  await evaluate(client, (menuText) => {
    const button = Array.from(document.querySelectorAll('.tree-menu-popover [role="menuitem"]'))
      .find((element) => (element.textContent || '').includes(menuText));
    if (!button) {
      throw new Error('Create-in-folder menu item not found.');
    }
    button.click();
  }, UI_TEXT.createDocInFolder);

  // 新建文档编辑态出现 + md 工具栏（⑤）
  await waitForPage(client, 'new doc editor (新建文档标题)', () => {
    const heading = document.querySelector('.workspace-toolbar .view-title h2');
    return heading && heading.textContent === '新建文档';
  });
  await waitForPage(client, 'md toolbar', (title) => {
    const toolbar = document.querySelector('.editor-md-toolbar');
    return toolbar && Array.from(toolbar.querySelectorAll('button'))
      .some((element) => element.getAttribute('aria-label') === title);
  }, [UI_TEXT.mdToolbarBold]);

  // ⑤ 点「加粗」按钮 → 插入 **加粗文字**，光标落在占位内
  await evaluate(client, (title) => {
    const button = Array.from(document.querySelectorAll('.editor-md-toolbar button'))
      .find((element) => element.getAttribute('aria-label') === title);
    if (!button) {
      throw new Error(`md toolbar button not found: ${title}`);
    }
    button.click();
  }, UI_TEXT.mdToolbarBold);
  await waitForPage(client, 'bold markers inserted', () => {
    const textarea = document.querySelector('.editor-field textarea');
    return textarea && textarea.value.includes('**加粗文字**');
  });

  // 填标题 + 正文（含标题，供 TOC ④）
  await evaluate(client, (docTitle, headingText) => {
    const titleInput = document.querySelector('.editor-title-input');
    if (!titleInput) {
      throw new Error('Editor title input not found.');
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(titleInput, docTitle);
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    titleInput.dispatchEvent(new Event('change', { bubbles: true }));

    const textarea = document.querySelector('.editor-field textarea');
    if (!textarea) {
      throw new Error('Editor textarea not found.');
    }
    const textSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    const body = `# ${headingText}\n\n正文内容一。\n\n## 二级小节\n\n正文内容二。`;
    textSetter.call(textarea, body);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  }, fixture.docTitle, UI_TEXT.headingText);

  // 保存
  await evaluate(client, () => {
    const saveButton = Array.from(document.querySelectorAll('.editor-toolbar-actions button'))
      .find((element) => (element.textContent || '').trim() === '保存');
    if (!saveButton) {
      throw new Error('Save button not found.');
    }
    saveButton.click();
  });

  // 保存后回到阅读态 → ④ TOC 出现
  await waitForPage(client, '阅读态 TOC 目录', (tocTitle) => {
    const toc = document.querySelector('.markdown-toc-title');
    return toc && toc.textContent.trim() === tocTitle;
  }, [UI_TEXT.tocTitle]);
  await waitForPage(client, 'TOC 含标题一', (headingText) => {
    return Array.from(document.querySelectorAll('.markdown-toc-item button'))
      .some((element) => (element.textContent || '').trim() === headingText);
  }, [UI_TEXT.headingText]);
  await waitForPage(client, '正文标题带 id 锚点', (headingText) => {
    const header = Array.from(document.querySelectorAll('.markdown-body h1'))
      .find((element) => (element.textContent || '').trim() === headingText);
    return header && header.id.length > 0;
  }, [UI_TEXT.headingText]);

  // ⑥ 后端持久化：新文档 folder_id = 夹具文件夹 id
  await waitForNode('文档 folder_id 持久化', async () => {
    const documents = await api(fixture.backendUrl, '/api/documents', { token: fixture.token });
    const doc = Array.isArray(documents)
      ? documents.find((item) => item.title === fixture.docTitle)
      : null;
    return doc && doc.folder_id === fixture.folderId ? doc : null;
  }, DEFAULT_TIMEOUT_MS);

  // 无错误条
  await waitForPage(client, 'no status-bar error', () => {
    return !(document.querySelector('.status-bar strong')?.textContent || '').trim();
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const frontendUrl = normalizeBaseUrl(args['frontend-url'] || DEFAULT_FRONTEND_URL);
  const backendUrl = normalizeBaseUrl(args['backend-url'] || DEFAULT_BACKEND_URL);
  const userName = String(args.user || 'alice');
  const debugPort = requireNumber(args['debug-port'], DEFAULT_DEBUG_PORT, 'debug-port');
  const timeoutMs = requireNumber(args.timeout, DEFAULT_TIMEOUT_MS, 'timeout');
  const headed = Boolean(args.headed);
  const keepBrowser = Boolean(args['keep-browser']);
  const jsonOut = args['json-out'] === true ? '' : args['json-out'];
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

  const token = await login(backendUrl, userName);
  const folderName = `批2 Smoke 目录 ${runId}`;
  const docTitle = `批2 Smoke 文档 ${runId}`;
  const folder = await api(backendUrl, '/api/folders', {
    method: 'POST',
    token,
    body: { name: folderName },
  });

  const fixture = {
    token,
    backendUrl,
    userName,
    folderId: folder.id,
    folderName,
    docTitle,
  };

  let browserProcess = null;
  let profileDir = '';
  let client = null;

  try {
    profileDir = await mkdtemp(path.join(os.tmpdir(), `lumen-batch2-smoke-${runId}-`));
    const browser = findBrowser(args.browser === true ? '' : args.browser);
    const browserArgs = [
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-gpu',
      'about:blank',
    ];
    if (!headed) {
      browserArgs.unshift('--headless=new');
    }

    browserProcess = spawn(browser, browserArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
    await waitForDebugEndpoint(debugPort);
    const pageWebSocketUrl = await createPageTarget(debugPort, frontendUrl);
    client = await CdpSession.connect(pageWebSocketUrl);
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await waitForPage(client, 'frontend document ready', () => document.readyState === 'complete', [], timeoutMs);

    await runBrowserFlow(client, fixture);

    const result = {
      ok: true,
      checked_at: new Date().toISOString(),
      frontend_url: frontendUrl,
      backend_url: backendUrl,
      folder_id: fixture.folderId,
      document_title: docTitle,
      toc_verified: true,
      md_toolbar_verified: true,
      create_in_folder_verified: true,
    };
    if (jsonOut) {
      await writeFile(jsonOut, JSON.stringify(result, null, 2), 'utf8');
    }
    console.log(`BATCH2_UI_BROWSER_SMOKE ok folder=${fixture.folderId} document="${docTitle}"`);
  } catch (error) {
    throw error;
  } finally {
    if (client) {
      client.close();
    }
    if (browserProcess && !keepBrowser) {
      browserProcess.kill();
    }
    if (profileDir && !keepBrowser) {
      await rm(profileDir, { recursive: true, force: true }).catch(() => null);
    }
  }
}

main().catch((error) => {
  console.error(`BATCH2_UI_BROWSER_SMOKE failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
