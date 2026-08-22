import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  CdpSession,
  createPageTarget,
  evaluate,
  findBrowser,
  sleep,
  waitForCondition as waitForNode,
  waitForDebugEndpoint,
  waitForPage,
} from './lib/cdp-smoke.mjs';

const DEFAULT_FRONTEND_URL = 'http://127.0.0.1:5173';
const DEFAULT_BACKEND_URL = 'http://127.0.0.1:18000';
const DEFAULT_DEBUG_PORT = 9224;
const DEFAULT_TIMEOUT_MS = 15000;

const UI_TEXT = {
  documentsView: '\u6587\u6863',
  createChildFolder: '\u65b0\u5efa\u5b50\u6587\u4ef6\u5939',
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
    } catch (error) {
      throw new Error(`Expected JSON from ${url}, got: ${text.slice(0, 200)}`);
    }
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}: ${text.slice(0, 300)}`);
  }
  return body;
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

async function checkOpenApi(backendUrl) {
  const openapi = await requestJson(`${backendUrl}/openapi.json`);
  const required = [
    ['get', '/api/folders'],
    ['post', '/api/folders'],
    ['patch', '/api/documents/{document_id}/folder'],
  ];
  for (const [method, route] of required) {
    if (!openapi.paths?.[route]?.[method]) {
      throw new Error(`Required runtime route missing: ${method.toUpperCase()} ${route}`);
    }
  }
}

async function createFixture(backendUrl, userName, runId) {
  const session = await api(backendUrl, '/api/auth/login', {
    method: 'POST',
    body: { external_id: userName },
  });
  const token = session.token;
  const rootName = `Smoke Root ${runId}`;
  const childName = `Smoke Child ${runId}`;
  const docTitle = `Smoke Move ${runId}`;
  const root = await api(backendUrl, '/api/folders', {
    method: 'POST',
    token,
    body: { name: rootName },
  });
  const document = await api(backendUrl, '/api/documents', {
    method: 'POST',
    token,
    body: {
      title: docTitle,
      content_md: `# ${docTitle}\n\nFolder browser smoke fixture.`,
      permission: 'team',
    },
  });
  return { token, root, rootName, childName, document, docTitle };
}

async function cleanupFixture(backendUrl, fixture) {
  if (!fixture?.token) {
    return;
  }
  const token = fixture.token;
  const requests = [];
  if (fixture.document?.id) {
    requests.push(api(backendUrl, `/api/documents/${fixture.document.id}`, { method: 'DELETE', token }).catch(() => null));
  }
  await Promise.all(requests);
  if (fixture.child?.id) {
    await api(backendUrl, `/api/folders/${fixture.child.id}`, { method: 'DELETE', token }).catch(() => null);
  }
  if (fixture.root?.id) {
    await api(backendUrl, `/api/folders/${fixture.root.id}`, { method: 'DELETE', token }).catch(() => null);
  }
}

async function findChildFolder(backendUrl, token, parentId, childName) {
  return waitForNode(`created child folder ${childName}`, async () => {
    const response = await api(backendUrl, `/api/folders?parent_id=${encodeURIComponent(parentId)}`, { token });
    const folders = Array.isArray(response) ? response : response?.items;
    if (!Array.isArray(folders)) {
      throw new Error('Unexpected /api/folders response shape; expected array or {items: array}.');
    }
    return folders.find((folder) => folder.name === childName) || null;
  });
}

async function runBrowserFlow(client, fixture) {
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

  await waitForPage(client, 'workspace shell', () => Boolean(document.querySelector('.workspace-layout')));
  await evaluate(client, (documentsLabel) => {
    const button = Array.from(document.querySelectorAll('.view-nav button'))
      .find((element) => (element.textContent || '').includes(documentsLabel));
    if (!button) {
      throw new Error('Documents view nav button not found.');
    }
    button.click();
  }, UI_TEXT.documentsView);
  await waitForPage(client, 'folder tree', () => Boolean(document.querySelector('.folder-tree[role="tree"]')));
  await waitForPage(client, `root folder ${fixture.rootName}`, (rootName) => {
    return Array.from(document.querySelectorAll('.tree-folder-label span'))
      .some((element) => (element.textContent || '').trim() === rootName);
  }, [fixture.rootName]);
  await waitForPage(client, `root document ${fixture.docTitle}`, (docTitle) => {
    return Array.from(document.querySelectorAll('.tree-document-row span'))
      .some((element) => (element.textContent || '').trim() === docTitle);
  }, [fixture.docTitle]);

  await evaluate(client, (rootName) => {
    const label = Array.from(document.querySelectorAll('.tree-folder-label'))
      .find((element) => (element.textContent || '').trim() === rootName);
    if (!label) {
      throw new Error(`Folder label not found: ${rootName}`);
    }
    const rect = label.getBoundingClientRect();
    label.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 20,
      clientY: rect.top + 10,
      button: 2,
    }));
  }, fixture.rootName);

  await waitForPage(client, 'folder context menu', (menuText) => {
    return Array.from(document.querySelectorAll('.tree-menu-popover [role="menuitem"]'))
      .some((element) => (element.textContent || '').includes(menuText));
  }, [UI_TEXT.createChildFolder]);

  await evaluate(client, (menuText) => {
    const button = Array.from(document.querySelectorAll('.tree-menu-popover [role="menuitem"]'))
      .find((element) => (element.textContent || '').includes(menuText));
    if (!button) {
      throw new Error('Create-child menu item not found.');
    }
    button.click();
  }, UI_TEXT.createChildFolder);

  await waitForPage(client, 'inline folder editor', () => Boolean(document.querySelector('.tree-inline-row input')));
  await evaluate(client, (childName) => {
    const input = document.querySelector('.tree-inline-row input');
    if (!input) {
      throw new Error('Inline folder editor not found.');
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, childName);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, fixture.childName);

  await sleep(100);
  await evaluate(client, () => {
    const input = document.querySelector('.tree-inline-row input');
    if (!input) {
      throw new Error('Inline folder editor disappeared before submit.');
    }
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      cancelable: true,
    }));
  });

  await waitForPage(client, `child folder ${fixture.childName}`, (childName) => {
    return Array.from(document.querySelectorAll('.tree-folder-label span'))
      .some((element) => (element.textContent || '').trim() === childName);
  }, [fixture.childName]);

  await evaluate(client, (docTitle) => {
    const documentButton = Array.from(document.querySelectorAll('.tree-document-row'))
      .find((element) => (element.textContent || '').trim() === docTitle);
    if (!documentButton) {
      throw new Error(`Document row not found: ${docTitle}`);
    }
    const rect = documentButton.getBoundingClientRect();
    documentButton.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 20,
      clientY: rect.top + 10,
      button: 2,
    }));
  }, fixture.docTitle);

  await waitForPage(client, 'document move target', (childName) => {
    const select = document.querySelector('.tree-menu-popover select');
    if (!select) {
      return false;
    }
    return Array.from(select.options).some((option) => (option.textContent || '').trim() === childName);
  }, [fixture.childName]);

  await evaluate(client, (childName) => {
    const select = document.querySelector('.tree-menu-popover select');
    if (!select) {
      throw new Error('Document move select not found.');
    }
    const target = Array.from(select.options)
      .find((option) => (option.textContent || '').trim() === childName);
    if (!target) {
      throw new Error(`Document move target not found: ${childName}`);
    }
    select.value = target.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, fixture.childName);

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

  await checkOpenApi(backendUrl);
  const fixture = await createFixture(backendUrl, userName, runId);
  let browserProcess = null;
  let profileDir = '';
  let client = null;
  let movedDocument = null;

  try {
    profileDir = await mkdtemp(path.join(os.tmpdir(), `lumen-folder-tree-smoke-${runId}-`));
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
    let browserStderr = '';
    browserProcess.stderr.on('data', (chunk) => {
      browserStderr += String(chunk).slice(0, 1000);
    });
    browserProcess.on('exit', (code, signal) => {
      if (code !== null && code !== 0 && !keepBrowser) {
        browserStderr += `\nBrowser exited with code ${code} signal ${signal || ''}`;
      }
    });

    await waitForDebugEndpoint(debugPort);
    const pageWebSocketUrl = await createPageTarget(debugPort, frontendUrl);
    client = await CdpSession.connect(pageWebSocketUrl);
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await waitForPage(client, 'frontend document ready', () => document.readyState === 'complete', [], timeoutMs);

    fixture.child = await findChildFolder(backendUrl, fixture.token, fixture.root.id, fixture.childName)
      .catch(() => null);
    if (fixture.child) {
      throw new Error(`Unexpected existing child folder fixture: ${fixture.childName}`);
    }

    await runBrowserFlow(client, fixture);
    fixture.child = await findChildFolder(backendUrl, fixture.token, fixture.root.id, fixture.childName);

    movedDocument = await waitForNode('document folder move persisted', async () => {
      const document = await api(backendUrl, `/api/documents/${fixture.document.id}`, { token: fixture.token });
      return document.folder_id === fixture.child.id ? document : null;
    }, timeoutMs);

    await waitForPage(client, 'child folder label clickable after move', (childName) => {
      const label = Array.from(document.querySelectorAll('.tree-folder-label'))
        .find((element) => (element.textContent || '').trim() === childName);
      return Boolean(label && !label.disabled);
    }, [fixture.childName], timeoutMs);
    await evaluate(client, (childName) => {
      const childLabel = Array.from(document.querySelectorAll('.tree-folder-label'))
        .find((element) => (element.textContent || '').trim() === childName);
      if (!childLabel) {
        throw new Error(`Child folder label not found: ${childName}`);
      }
      childLabel.click();
    }, fixture.childName);
    await waitForPage(client, 'moved document visible under expanded child folder', (docTitle) => {
      return Array.from(document.querySelectorAll('.tree-document-row span'))
        .some((element) => (element.textContent || '').trim() === docTitle);
    }, [fixture.docTitle], timeoutMs);

    const result = {
      ok: true,
      checked_at: new Date().toISOString(),
      frontend_url: frontendUrl,
      backend_url: backendUrl,
      root_folder_id: fixture.root.id,
      child_folder_id: fixture.child.id,
      document_id: movedDocument.id,
      document_folder_id: movedDocument.folder_id,
    };
    if (jsonOut) {
      await writeFile(jsonOut, JSON.stringify(result, null, 2), 'utf8');
    }
    console.log(`FOLDER_TREE_BROWSER_SMOKE ok root=${fixture.root.id} child=${fixture.child.id} document=${movedDocument.id}`);
  } catch (error) {
    throw error;
  } finally {
    if (client) {
      client.close();
    }
    if (browserProcess && !keepBrowser) {
      browserProcess.kill();
    }
    await cleanupFixture(backendUrl, fixture);
    if (profileDir && !keepBrowser) {
      await rm(profileDir, { recursive: true, force: true }).catch(() => null);
    }
  }
}

main().catch((error) => {
  const detail = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error && error.cause ? ` (cause: ${error.cause.code || error.cause.message || error.cause})` : '';
  console.error(`FOLDER_TREE_BROWSER_SMOKE failed: ${detail}${cause}`);
  process.exitCode = 1;
});
