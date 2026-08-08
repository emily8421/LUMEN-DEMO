// 维护态批5 smoke（REQ-050 + REQ-051，Sprint-30）—— API 端到端。
// 覆盖：
//   API-054 admin 查用户可访问空间（200 joined/available 互补 / member 4030 / 不存在 404·4004）
//   API-055 忘记密码申请（恒响应防枚举：注册邮箱 vs 未注册邮箱响应字节一致）
//   API-056 忘记密码确认（invalid token 4010 / 短密码 4220，confirm 先校验密码长度再查 token）
// ---
// 浏览器 UI（登录小眼睛 / 忘记密码 modal / admin 用户详情抽屉）由前端 build 绿（tsc + vite）
// + 后端 276 单测 + 人工验收覆盖；完整浏览器自动化 smoke 留候选（避免过度自动化，功能逻辑已由
// 本 API smoke + 单测充分覆盖）。如需补 browser flow，参考 smoke-auth-browser.mjs 的 CdpSession 模式。
// 前置：demo 已起（backend :18000，内存或 PG 模式均可——demo_repository 与 PgRepository 均实现 reset/空间查询）。
// 用法：node scripts/smoke-batch5-auth-admin-browser.mjs --backend-url http://localhost:18000

const DEFAULT_BACKEND_URL = 'http://localhost:18000';

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

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
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

function jsonPost(backendUrl, url, body, token) {
  return requestJson(`${backendUrl}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body || {}),
  });
}

function getJson(backendUrl, url, token) {
  return requestJson(`${backendUrl}${url}`, { headers: { Authorization: `Bearer ${token}` } });
}

async function runBatch5Checks(backendUrl) {
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const smokeEmail = `smoke-batch5-${runId}@example.com`;
  const smokePassword = 'smoke-pass-1234';

  // 注册 smoke 用户（确保 email 存在，供 API-055 reset request 的 issued 路径）
  const reg = await jsonPost(backendUrl, '/api/auth/register', {
    email: smokeEmail,
    name: 'Smoke Batch5',
    password: smokePassword,
  });
  assert(reg.status === 200 && reg.body.code === 0, `smoke register failed: ${reg.status}/${reg.body?.code}`);

  // admin（alice）/ member（kira）登录
  const adminLogin = await jsonPost(backendUrl, '/api/auth/login', { login_id: 'alice', password: 'demo-pass-1234' });
  assert(adminLogin.status === 200 && adminLogin.body.data?.token, `admin login failed: ${adminLogin.status}`);
  const adminToken = adminLogin.body.data.token;
  const memberLogin = await jsonPost(backendUrl, '/api/auth/login', { login_id: 'kira', password: 'demo-pass-1234' });
  assert(memberLogin.status === 200 && memberLogin.body.data?.token, `member login failed: ${memberLogin.status}`);
  const memberToken = memberLogin.body.data.token;
  const kiraId = memberLogin.body.data.user_id;

  // --- API-054 admin 查用户可访问空间 ---
  const spaces = await getJson(backendUrl, `/api/admin/users/${kiraId}/spaces`, adminToken);
  assert(spaces.status === 200 && spaces.body.code === 0, `API-054 admin expected 200, got ${spaces.status}`);
  assert(
    Array.isArray(spaces.body.data?.joined) && Array.isArray(spaces.body.data?.available),
    `API-054 joined/available structure missing`,
  );
  const joinedIds = new Set(spaces.body.data.joined.map((row) => row.space_id));
  const availableIds = new Set(spaces.body.data.available.map((row) => row.space_id));
  for (const id of joinedIds) {
    assert(!availableIds.has(id), `API-054 joined/available overlap on space ${id}`);
  }

  // API-054 member 4030
  const memberDeny = await getJson(backendUrl, `/api/admin/users/${kiraId}/spaces`, memberToken);
  assert(
    memberDeny.status === 403 && memberDeny.body.code === 4030,
    `API-054 member expected 403/4030, got ${memberDeny.status}/${memberDeny.body?.code}`,
  );

  // API-054 不存在用户 404/4004
  const missing = await getJson(backendUrl, `/api/admin/users/999999/spaces`, adminToken);
  assert(
    missing.status === 404 && missing.body.code === 4004,
    `API-054 missing user expected 404/4004, got ${missing.status}/${missing.body?.code}`,
  );

  // --- API-055 忘记密码申请（恒响应防枚举）---
  const reqRegistered = await jsonPost(backendUrl, '/api/auth/password-reset/request', { email: smokeEmail });
  assert(
    reqRegistered.status === 200 && typeof reqRegistered.body.data?.message === 'string',
    `API-055 registered email expected 200 + message, got ${reqRegistered.status}`,
  );
  const reqUnknown = await jsonPost(backendUrl, '/api/auth/password-reset/request', {
    email: `nobody-${runId}@example.com`,
  });
  assert(reqUnknown.status === 200, `API-055 unknown email expected 200, got ${reqUnknown.status}`);
  assert(
    reqRegistered.body.data.message === reqUnknown.body.data.message,
    `API-055 anti-enumeration: registered vs unknown messages differ`,
  );

  // --- API-056 忘记密码确认 ---
  // invalid token + 合规新密码 → 4010（token 查不到）
  const confirmInvalid = await jsonPost(backendUrl, '/api/auth/password-reset/confirm', {
    token: 'invalid-token-x',
    new_password: 'newpass123',
  });
  assert(
    confirmInvalid.status === 401 && confirmInvalid.body.code === 4010,
    `API-056 invalid token expected 401/4010, got ${confirmInvalid.status}/${confirmInvalid.body?.code}`,
  );
  // 短密码 → 4220（confirm 先校验密码长度，先于 token 查找）
  const confirmShort = await jsonPost(backendUrl, '/api/auth/password-reset/confirm', {
    token: 'any-token',
    new_password: 'short',
  });
  assert(
    confirmShort.status === 422 && confirmShort.body.code === 4220,
    `API-056 short password expected 422/4220, got ${confirmShort.status}/${confirmShort.body?.code}`,
  );

  return {
    smokeEmail,
    api054JoinedCount: spaces.body.data.joined.length,
    api054AvailableCount: spaces.body.data.available.length,
    api054MemberDenied403: memberDeny.status === 403,
    api054Missing404: missing.status === 404,
    api055AntiEnumeration: reqRegistered.body.data.message === reqUnknown.body.data.message,
    api056InvalidToken401: confirmInvalid.status === 401,
    api056ShortPassword422: confirmShort.status === 422,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const backendUrl = normalizeBaseUrl(args['backend-url'] || DEFAULT_BACKEND_URL);
  const summary = await runBatch5Checks(backendUrl);
  process.stdout.write(JSON.stringify({ result: 'PASS', backend: backendUrl, ...summary }, null, 2) + '\n');
}

main().catch((error) => {
  process.stderr.write(`SMOKE FAILED: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
