# task-062：前端纯函数单测基础与本地索引 / 文件夹工具

> Sprint-63（维护态批38）/ REQ-011 既有桌面端体验质量保障 / TC-P2-GOV-027。
> 状态：已完成（2026-08-20）。不新增产品需求、API、后端逻辑或运行时能力。

## 目标

引入轻量 Vitest 单测入口，为 `local-vault-index` 和 `folder-utils` 建立风险驱动回归用例，并在前端 CI 中执行。

## 依据

- `docs/08-dev-plan.md` Sprint-63 / FEP-04
- `docs/research/2026-08-19-frontend-remediation-plan.md` §6
- `docs/09-verification.md` TC-P2-GOV-027

## 修改范围

- `frontend/package.json`、锁文件、`frontend/vite.config.ts`：Vitest 开发依赖与 Node 环境测试命令。
- `.github/workflows/frontend-ci.yml`：新增单元测试 job。
- `frontend/src/features/local-mount/local-vault-index.test.ts`、`frontend/src/app/folder-utils.test.ts`：本地索引与文件夹移动纯函数测试。

## 验收标准

1. `npm test` 发现并执行纯函数测试，不依赖浏览器目录授权或后端服务。
2. 本地索引覆盖 token、搜索排序、空查询与上限；文件夹工具覆盖根目录、自身 / 后代排除与异常父链。
3. CI 在 `npm ci` 后执行 `npm test`。

## 禁止事项

- 不修改本地 Vault 的索引、搜索、目录读写或导入运行时逻辑。
- 不新增浏览器、DOM、File System Access 或后端测试环境。
- 不改 API、数据库、权限和既有浏览器 smoke。

## 完成记录

- Vitest `node` 测试环境、`npm test` 脚本与 Frontend CI 单测 job 已建立。
- `local-vault-index.test.ts` 与 `folder-utils.test.ts` 共 10 个用例通过，覆盖索引 token / 搜索边界及文件夹移动环路保护。
- `npm test`、lint、build、CSS token 与文件体量检查均通过；完整验收见 `docs/09-verification.md` TC-P2-GOV-027。
