# task-034：TC-P2-VAULT-001 自动化 smoke + 验收回写（Sprint-23C · REQ-018 模式 B）

## 任务元信息

- 所属 Sprint：Sprint-23C
- 关联 REQ：REQ-018 模式 B
- 关联 TC：TC-P2-VAULT-001（①-⑥ 全覆盖）
- 状态：待编码（依赖 task-031/032/033）

## 目标

新增 TC-P2-VAULT-001 自动化 smoke（蓝本 `smoke-folder-tree-browser.mjs`），覆盖 ①授权 + 刷新恢复 ②1000+ 文件本地树 ③本地关键词搜索 ④左侧分区视觉隔离 ⑤按需导入走 API-029 ⑥Network 零上传；通过后回写 09/08 验收。

## 上游依据

- `docs/09-verification.md` TC-P2-VAULT-001（:95，6 口径）
- `scripts/smoke-folder-tree-browser.mjs`（蓝本：`CdpSession`/`evaluate`/`waitForPage`/`api`/fixture）
- PoC 报告 §5（8 能力 + 5 场景验证方法）

## 修改范围

| 文件 | 变更 |
|---|---|
| `scripts/smoke-vault-local-mount-browser.mjs` | 新增：默认 `--frontend-url http://localhost:5173`；`runBrowserFlow` 覆盖 TC ①-⑥；CDP Network 域监听 `uploadCount=0`；合成 vault fixture |
| `docs/09-verification.md` | §2 TC-P2-VAULT-001 状态→通过；§5 验收记录；§6 RISK-VISION-002 关闭 |
| `docs/08-dev-plan.md` | Sprint-23C 总览表行状态→已完成 + 完成记录 |
| `ai/project-rules.md` | §1 进度（Phase2C 编码完成） |

## 验证包

- `node scripts/smoke-vault-local-mount-browser.mjs` → 通过（TC ①-⑥ + Network 零上传）
- 用户浏览器 smoke 确认隐私红线（Network 面板零请求）

## 验收标准

- TC-P2-VAULT-001 六口径全覆盖：①刷新恢复 granted ②1000+ 本地树 ③本地索引命中 ④分区徽标 ⑤按需导入获完整能力 ⑥不上传。
- CDP Network 监听确认零上传（隐私红线）。
- 09/08/project-rules 验收留痕回写。

## 降级 / Mock 边界

- smoke 须 localhost 访问（task-033 host 修正后）；Chrome/Edge only。

## 残留风险 / 未验证

- 自动文件变更监听 / 万级性能 / 桌面形态留后续（PoC ⑦⑧）。

## 完成记录

（待编码后回写）

## 待确认项

- 版本 bump MAJOR（v2.0.0）vs MINOR → Phase C 与用户确认。
