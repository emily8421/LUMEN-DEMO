// 批3 AI 抽屉 + 「基于知识库」开关（task 批3 / REQ-008 延续）浏览器 + API smoke
// 浏览器：登录 alice → 右下角悬浮图标 → 展开抽屉（默认「基于知识库」）→ 发送提问（RAG 降级回复）→
//         取消勾选（通用对话降级）→ 重新勾选 → Esc 收起 → Ctrl+K 命令面板「问 AI」开抽屉并预填
// API：/api/query 带 history + use_knowledge_base=false（通用对话降级）/ true（RAG）
// 复用 smoke-auth-browser.mjs 的 CDP 无依赖基础设施。
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const DEFAULT_BACKEND_URL = 'http://localhost:18000';
const DEFAULT_DEBUG_PORT = 9227;
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

async function setTextareaValue(client, selector, value) {
  await evaluate(client, (targetSelector, nextValue) => {
    const textarea = document.querySelector(targetSelector);
    if (!textarea) {
      throw new Error(`Textarea not found: ${targetSelector}`);
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(textarea, nextValue);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }, selector, value);
}

async function setSelectValue(client, selector, value) {
  await evaluate(client, (targetSelector, nextValue) => {
    const select = document.querySelector(targetSelector);
    if (!select) {
      throw new Error(`Select not found: ${targetSelector}`);
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(select, nextValue);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
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

// ---- 批3 浏览器流程 ----
async function runBrowserFlow(client) {
  // 1) 右下角悬浮图标出现
  await waitForPage(client, 'ai assistant fab', () => Boolean(document.querySelector('.ai-assistant-fab')));
  const fabVisible = await evaluate(client, () => Boolean(document.querySelector('.ai-assistant-fab')));
  assert(fabVisible, 'ai assistant fab should be visible after login');

  // 2) 点击展开抽屉，默认「基于知识库」
  await evaluate(client, () => document.querySelector('.ai-assistant-fab').click());
  await waitForPage(client, 'ai assistant drawer', () => Boolean(document.querySelector('.ai-assistant-drawer')));
  const defaultScope = await evaluate(client, () => (document.querySelector('.ai-assistant-scope')?.textContent || '').trim());
  assert(defaultScope === '基于知识库', `default scope should be 基于知识库, got ${defaultScope}`);
  // 多通道切换（2026-08-08）：抽屉底部出现 LLM 通道下拉，且包含 deepseek 选项。
  const providerOptions = await waitForPage(client, 'llm provider dropdown', () => {
    const select = document.querySelector('.ai-assistant-provider select');
    if (!select) {
      return null;
    }
    return Array.from(select.options).map((option) => option.value);
  });
  assert(providerOptions.includes('deepseek'), `provider dropdown should include deepseek, got ${JSON.stringify(providerOptions)}`);

  // 3) 输入问题并发送 → assistant 消息出现（RAG 模式，demo 无 LLM → 降级回复）
  await setTextareaValue(client, '.ai-assistant-input', 'Nova Sprint 是什么');
  await evaluate(client, () => document.querySelector('.ai-assistant-send').click());
  const firstAnswer = await waitForPage(client, 'assistant message after send', () => {
    const last = document.querySelectorAll('.ai-message-assistant');
    return last.length > 0 ? last[last.length - 1].textContent || '' : null;
  });
  assert(firstAnswer.length > 0, 'assistant should reply after sending a question');

  // 4) 取消勾选「基于知识库」→ scope 变「通用对话」→ 发送 → 通用对话降级
  await evaluate(client, () => {
    const toggle = document.querySelector('.ai-assistant-kb-toggle input');
    if (!toggle) {
      throw new Error('kb toggle not found');
    }
    toggle.click();
  });
  await waitForPage(client, 'scope switch to generic', () => {
    const scope = document.querySelector('.ai-assistant-scope')?.textContent || '';
    return scope.includes('通用对话');
  });
  // 切到 deepseek 通道（多配置切换），再发通用对话 → 应真实出文（非降级）。
  await setSelectValue(client, '.ai-assistant-provider select', 'deepseek');
  await setTextareaValue(client, '.ai-assistant-input', '你好');
  await evaluate(client, () => document.querySelector('.ai-assistant-send').click());
  // 等 assistant 消息数量增加到 2（第 3 步 1 条 + 本轮 1 条），避免抓到旧回复。
  const genericAnswer = await waitForPage(client, 'generic mode answer', () => {
    const last = document.querySelectorAll('.ai-message-assistant');
    return last.length >= 2 ? last[last.length - 1].textContent || '' : null;
  });
  // 通用对话（deepseek）应真实出文：非空且不含降级 / RAG 特征。
  assert(
    genericAnswer.length > 0 &&
      !genericAnswer.includes('降级模式') &&
      !genericAnswer.includes('标题匹配') &&
      !genericAnswer.includes('未在当前空间'),
    `generic mode (deepseek) should reply for real, got: ${genericAnswer.slice(0, 80)}`,
  );

  // 5) 重新勾选 → scope 回到「基于知识库」；多轮消息已累积（≥3 assistant？user 2 + assistant 2）
  await evaluate(client, () => document.querySelector('.ai-assistant-kb-toggle input').click());
  await waitForPage(client, 'scope back to knowledge base', () => {
    const scope = document.querySelector('.ai-assistant-scope')?.textContent || '';
    return scope.includes('基于知识库');
  });
  const messageCount = await evaluate(client, () => document.querySelectorAll('.ai-message').length);
  assert(messageCount >= 4, `expected at least 4 messages across two rounds, got ${messageCount}`);

  // 6) Esc 收起为悬浮图标
  await evaluate(client, () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await waitForPage(client, 'drawer closed on escape', () => Boolean(document.querySelector('.ai-assistant-fab') && !document.querySelector('.ai-assistant-drawer')));

  // 7) Ctrl+K 命令面板 → 输入 → 问 AI 项 → 点击 → 抽屉打开且输入框预填
  await evaluate(client, () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  });
  await waitForPage(client, 'command palette open', () => Boolean(document.querySelector('.cmdk-panel')));
  await setInputValue(client, '.cmdk-input', '触发延迟');
  await waitForPage(client, 'ask-ai palette item', () => {
    const items = Array.from(document.querySelectorAll('.cmdk-item'));
    return items.some((item) => (item.textContent || '').includes('问 AI'));
  });
  await evaluate(client, () => {
    const items = Array.from(document.querySelectorAll('.cmdk-item'));
    const hit = items.find((item) => (item.textContent || '').includes('问 AI'));
    if (!hit) {
      throw new Error('ask-ai item not found');
    }
    hit.click();
  });
  await waitForPage(client, 'drawer opens from palette with prefilled draft', () => {
    const input = document.querySelector('.ai-assistant-input');
    return Boolean(document.querySelector('.ai-assistant-drawer') && input && input.value === '触发延迟');
  });

  return { defaultScope, firstAnswer, genericAnswer, messageCount };
}

// ---- API 检查：/api/query 新字段 ----
async function runApiChecks(backendUrl) {
  const jsonPost = (url, body, token) =>
    requestJson(`${backendUrl}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body || {}),
    });

  const login = await jsonPost('/api/auth/login', { login_id: 'alice', password: 'demo-pass-1234' });
  assert(login.status === 200 && login.body.code === 0 && login.body.data.token, 'seed login failed');
  const token = login.body.data.token;

  // use_knowledge_base=false → 通用对话降级（demo LLM=mock，无来源）
  const generic = await jsonPost(
    '/api/query',
    {
      question: '你好',
      history: [{ role: 'user', content: '早上好' }, { role: 'assistant', content: '你好' }],
      use_knowledge_base: false,
    },
    token,
  );
  assert(generic.status === 200 && generic.body.code === 0, `generic query failed: ${generic.status}/${generic.body?.code}`);
  // 通用对话 = 纯聊天：不应是 RAG 降级（标题匹配 / 未在当前空间）。
  assert(
    generic.body.data.answer.length > 0 &&
      !generic.body.data.answer.includes('标题匹配') &&
      !generic.body.data.answer.includes('未在当前空间'),
    `generic should be pure chat, got: ${generic.body.data.answer.slice(0, 80)}`,
  );

  // use_knowledge_base=true（默认）→ RAG 单轮（demo 无 chunk，可能 not found / 降级）
  const rag = await jsonPost(
    '/api/query',
    {
      question: '不存在的目标词',
      history: [{ role: 'user', content: '之前的问题' }],
      use_knowledge_base: true,
    },
    token,
  );
  assert(rag.status === 200 && rag.body.code === 0, `rag query failed: ${rag.status}/${rag.body?.code}`);
  assert(Array.isArray(rag.body.data.sources), 'rag sources should be an array');

  return { genericDegrades: true, ragOk: true };
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
    profileDir = await mkdtemp(path.join(os.tmpdir(), 'lumen-ai-smoke-'));
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

    await waitForDebugEndpoint(debugPort);
    const pageWebSocketUrl = await createPageTarget(debugPort, frontendUrl);
    client = await CdpSession.connect(pageWebSocketUrl);
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    await waitForPage(client, 'frontend document ready', () => document.readyState === 'complete', [], timeoutMs);

    await waitForPage(client, 'login panel', () => Boolean(document.querySelector('.login-panel')));
    await submitLogin(client, 'alice', 'demo-pass-1234');
    await waitForWorkspace(client);

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
