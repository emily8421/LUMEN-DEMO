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

async function nextRender(client) {
  await evaluate(client, () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function assertModalFocusLifecycle(client, { name, triggerSelector, triggerText, dialogSelector, closeSelector, closeWithEscape = false }) {
  await evaluate(client, ({ selector, text }) => {
    let trigger = null;
    if (selector) {
      trigger = document.querySelector(selector);
    } else if (text) {
      trigger = Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').trim() === text) ?? null;
    }
    if (!(trigger instanceof HTMLElement)) {
      throw new Error(`${selector || text} is not a focusable trigger`);
    }
    trigger.focus();
    trigger.click();
  }, { selector: triggerSelector ?? null, text: triggerText ?? null });
  await waitForPage(client, `${name} dialog`, (selector) => Boolean(document.querySelector(selector)), [dialogSelector]);
  await nextRender(client);

  const initialFocus = await evaluate(client, (selector) => {
    const dialog = document.querySelector(selector);
    return dialog instanceof HTMLElement
      ? { containsFocus: dialog.contains(document.activeElement), ariaModal: dialog.getAttribute('aria-modal') }
      : null;
  }, dialogSelector);
  assert(initialFocus?.containsFocus, `${name} did not receive initial focus`);
  assert(initialFocus?.ariaModal === 'true', `${name} is missing aria-modal`);

  const focusCycle = await evaluate(client, async (selector) => {
    const dialog = document.querySelector(selector);
    if (!(dialog instanceof HTMLElement)) {
      throw new Error(`Dialog not found: ${selector}`);
    }
    const focusable = Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => element instanceof HTMLElement && element.getClientRects().length > 0);
    if (focusable.length < 2) {
      throw new Error(`Expected at least two focusable controls in ${selector}`);
    }
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await nextFrame();
    const tabWrapped = document.activeElement === first;
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    await nextFrame();
    return { tabWrapped, shiftTabWrapped: document.activeElement === last };
  }, dialogSelector);
  assert(focusCycle.tabWrapped, `${name} Tab escaped the dialog`);
  assert(focusCycle.shiftTabWrapped, `${name} Shift+Tab escaped the dialog`);

  if (closeWithEscape) {
    await evaluate(client, (selector) => {
      const dialog = document.querySelector(selector);
      if (!(dialog instanceof HTMLElement)) {
        throw new Error(`Dialog not found: ${selector}`);
      }
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : dialog;
      active.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }, dialogSelector);
  } else {
    await evaluate(client, (selector) => {
      const closeButton = document.querySelector(selector);
      if (!(closeButton instanceof HTMLElement)) {
        throw new Error(`Close control not found: ${selector}`);
      }
      closeButton.click();
    }, closeSelector);
  }
  await waitForPage(client, `${name} closes`, (selector) => !document.querySelector(selector), [dialogSelector]);
  const focusRestored = await evaluate(client, ({ selector, text }) => {
    const trigger = selector
      ? document.querySelector(selector)
      : Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').trim() === text) ?? null;
    return document.activeElement === trigger;
  }, { selector: triggerSelector ?? null, text: triggerText ?? null });
  assert(focusRestored, `${name} did not restore focus to its trigger`);
}

async function dismissOnboardingIfPresent(client) {
  const guideOpen = await evaluate(client, () => Boolean(document.querySelector('.onboarding-modal')));
  if (!guideOpen) {
    return;
  }
  await evaluate(client, () => {
    const closeButton = document.querySelector('.onboarding-close');
    if (!(closeButton instanceof HTMLElement)) {
      throw new Error('Onboarding close control not found.');
    }
    closeButton.click();
  });
  await waitForPage(client, 'onboarding guide closes', () => !document.querySelector('.onboarding-modal'));
}

async function assertOnboardingFocusTrap(client) {
  await evaluate(client, () => {
    window.localStorage.removeItem('lumen-demo-onboarding');
    window.location.reload();
  });
  await waitForPage(client, 'workspace after onboarding reload', () => Boolean(document.querySelector('.topbar')));
  await waitForPage(client, 'onboarding dialog', () => Boolean(document.querySelector('.onboarding-modal')));
  await nextRender(client);
  const result = await evaluate(client, async () => {
    const dialog = document.querySelector('.onboarding-modal');
    if (!(dialog instanceof HTMLElement)) {
      throw new Error('Onboarding dialog missing.');
    }
    const focusable = Array.from(dialog.querySelectorAll('button:not([disabled])'));
    if (focusable.length < 2) {
      throw new Error('Onboarding focusable controls missing.');
    }
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await nextFrame();
    const tabWrapped = document.activeElement === first;
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    await nextFrame();
    return {
      containsFocus: dialog.contains(document.activeElement),
      tabWrapped,
      shiftTabWrapped: document.activeElement === last,
    };
  });
  assert(result.containsFocus && result.tabWrapped && result.shiftTabWrapped, 'Onboarding guide focus trap failed');
  await dismissOnboardingIfPresent(client);
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
    const form = document.querySelector('#auth-panel-login');
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
    const form = document.querySelector('#auth-panel-register');
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

  const tabSemantics = await evaluate(client, () => {
    const loginTab = document.querySelector('#auth-tab-login');
    const registerTab = document.querySelector('#auth-tab-register');
    const loginPanel = document.querySelector('#auth-panel-login');
    const registerPanel = document.querySelector('#auth-panel-register');
    return {
      loginRole: loginTab?.getAttribute('role'),
      loginSelected: loginTab?.getAttribute('aria-selected'),
      loginControls: loginTab?.getAttribute('aria-controls'),
      registerRole: registerTab?.getAttribute('role'),
      registerSelected: registerTab?.getAttribute('aria-selected'),
      registerControls: registerTab?.getAttribute('aria-controls'),
      loginPanelRole: loginPanel?.getAttribute('role'),
      loginLabelledBy: loginPanel?.getAttribute('aria-labelledby'),
      registerPanelRole: registerPanel?.getAttribute('role'),
      registerLabelledBy: registerPanel?.getAttribute('aria-labelledby'),
      loginHidden: loginPanel?.hasAttribute('hidden'),
      registerHidden: registerPanel?.hasAttribute('hidden'),
    };
  });
  assert(tabSemantics.loginRole === 'tab' && tabSemantics.registerRole === 'tab', 'auth tabs missing tab roles');
  assert(tabSemantics.loginSelected === 'true' && tabSemantics.registerSelected === 'false', 'initial tab selection mismatch');
  assert(tabSemantics.loginControls === 'auth-panel-login' && tabSemantics.registerControls === 'auth-panel-register', 'tab controls mismatch');
  assert(tabSemantics.loginPanelRole === 'tabpanel' && tabSemantics.registerPanelRole === 'tabpanel', 'tabpanel roles missing');
  assert(tabSemantics.loginLabelledBy === 'auth-tab-login' && tabSemantics.registerLabelledBy === 'auth-tab-register', 'tabpanel labels mismatch');
  assert(tabSemantics.loginHidden === false && tabSemantics.registerHidden === true, 'initial hidden panel mismatch');

  // 键盘序列必须逐键等待 React 提交渲染后再采样：setState 异步批处理，
  // 同步连发 dispatchEvent 会读到按键前的旧 aria-selected（焦点因 .focus() 同步执行而看似正确）。
  const keyboardResult = await evaluate(client, async () => {
    const loginTab = document.querySelector('#auth-tab-login');
    const registerTab = document.querySelector('#auth-tab-register');
    if (!(loginTab instanceof HTMLButtonElement) || !(registerTab instanceof HTMLButtonElement)) {
      throw new Error('Auth tabs missing');
    }
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const press = async (target, key) => {
      target.focus();
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await nextFrame();
      return {
        loginSelected: loginTab.getAttribute('aria-selected'),
        registerSelected: registerTab.getAttribute('aria-selected'),
        activeId: document.activeElement?.id,
      };
    };
    return {
      end: await press(loginTab, 'End'),
      home: await press(registerTab, 'Home'),
      right: await press(loginTab, 'ArrowRight'),
      left: await press(registerTab, 'ArrowLeft'),
    };
  });
  for (const state of Object.values(keyboardResult)) {
    assert(state.loginSelected === 'true' || state.loginSelected === 'false', 'keyboard selection missing');
    assert(state.activeId === 'auth-tab-login' || state.activeId === 'auth-tab-register', 'keyboard focus did not stay on tab');
  }
  assert(keyboardResult.end.registerSelected === 'true' && keyboardResult.end.activeId === 'auth-tab-register', 'End key mismatch');
  assert(keyboardResult.home.loginSelected === 'true' && keyboardResult.home.activeId === 'auth-tab-login', 'Home key mismatch');
  assert(keyboardResult.right.registerSelected === 'true' && keyboardResult.right.activeId === 'auth-tab-register', 'ArrowRight key mismatch');
  assert(keyboardResult.left.loginSelected === 'true' && keyboardResult.left.activeId === 'auth-tab-login', 'ArrowLeft key mismatch');

  await assertModalFocusLifecycle(client, {
    name: 'password reset modal',
    triggerSelector: '.auth-link-button',
    dialogSelector: '.password-reset-modal',
    closeSelector: '.password-reset-modal button.secondary',
  });

  // 2) 注册 tab → 注册新用户（自动登录）
  await clickTab(client, '注册');
  await waitForPage(client, 'register form', () => {
    const form = document.querySelector('#auth-panel-register:not([hidden])');
    return Boolean(form && form.querySelectorAll('input').length >= 3);
  });
  await submitRegister(client, email, 'Smoke Tester', password);
  await waitForWorkspace(client);
  await dismissOnboardingIfPresent(client);
  const registerNotice = await evaluate(client, () => (document.querySelector('.status-bar span')?.textContent || ''));
  assert(registerNotice.includes('注册成功'), `register success notice missing: ${registerNotice}`);

  await assertModalFocusLifecycle(client, {
    name: 'command palette',
    triggerSelector: '.global-search-bar',
    dialogSelector: '.cmdk-panel',
    closeWithEscape: true,
  });

  await assertModalFocusLifecycle(client, {
    name: 'quick entry drawer',
    triggerSelector: '.quick-entry-trigger',
    dialogSelector: '.quick-entry-drawer',
    closeSelector: '.quick-entry-close',
  });

  // 3) 顶栏登出 → 回到登录面板
  await logoutViaTopBar(client);

  // 4) 凭证登录（新用户 email + 密码）
  await clickTab(client, '登录');
  await submitLogin(client, email, 'wrong-password-1');
  await waitForPage(client, 'login error announcement', () => Boolean(document.querySelector('.status-bar strong[role="alert"]')));
  const failureAnnouncement = await evaluate(client, () => {
    const notice = document.querySelector('.status-bar span[role="status"]');
    const error = document.querySelector('.status-bar strong[role="alert"]');
    return {
      noticeLive: notice?.getAttribute('aria-live'),
      errorText: error?.textContent || '',
    };
  });
  assert(failureAnnouncement.noticeLive === 'off', 'notice remains live while error is present');
  assert(failureAnnouncement.errorText.length > 0, 'error announcement missing text');
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

  await assertModalFocusLifecycle(client, {
    name: 'import modal',
    triggerText: '导入',
    dialogSelector: '.import-modal',
    closeSelector: '.import-modal-close',
  });

  // 6) seed 快捷登录（demo 内存仓储：alice 无密码路径）→ 登出
  await logoutViaTopBar(client);
  await clickTab(client, '登录');
  await submitLogin(client, 'alice', 'demo-pass-1234');
  await waitForWorkspace(client);
  await dismissOnboardingIfPresent(client);
  await evaluate(client, () => {
    const trigger = document.querySelector('.user-menu-trigger');
    if (!(trigger instanceof HTMLElement)) {
      throw new Error('User menu trigger not found.');
    }
    trigger.click();
  });
  await waitForPage(client, 'admin user management action', () => Boolean(document.querySelector('.user-menu-admin')));
  await evaluate(client, () => document.querySelector('.user-menu-admin')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await waitForPage(client, 'admin users panel', () => Boolean(document.querySelector('.admin-users-panel')));
  await assertModalFocusLifecycle(client, {
    name: 'user spaces drawer',
    triggerSelector: '.admin-user-actions button',
    dialogSelector: '.user-spaces-drawer',
    closeSelector: '.user-spaces-drawer .drawer-header button',
  });
  await assertOnboardingFocusTrap(client);
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
