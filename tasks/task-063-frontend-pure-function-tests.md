# task-063：前端 Markdown TOC 与草稿纯函数单测

> Sprint-63（维护态批38）/ REQ-011 既有桌面端体验质量保障 / TC-P2-GOV-027。
> 状态：已完成（2026-08-20）。与 Task-062 共用 Vitest 基础，但独立覆盖另一组纯函数边界。

## 目标

为 `markdown-toc` 和 `drafts` 添加风险驱动单测，锁定标题锚点与草稿提交前规范化行为。

## 依据

- `docs/08-dev-plan.md` Sprint-63 / FEP-04
- `docs/research/2026-08-19-frontend-remediation-plan.md` §6
- `docs/09-verification.md` TC-P2-GOV-027

## 修改范围

- `frontend/src/app/markdown-toc.test.ts`：slug、ATX 标题、重复锚点、目录深度。
- `frontend/src/app/drafts.test.ts`：初始值、标题规范化、权限 / 正文 / 文件夹归属。

## 验收标准

1. 与 Task-062 合计形成 15-25 个独立断言场景。
2. 所有测试使用内存输入，不读取浏览器状态、真实数据或服务端。
3. `npm test`、lint、build 通过。

## 禁止事项

- 不改变 TOC slug、草稿归一化或文档提交的现有语义。
- 不接入组件渲染、localStorage、API 或浏览器自动化测试。

## 完成记录

- `markdown-toc.test.ts` 与 `drafts.test.ts` 共 9 个用例通过，覆盖标题锚点、目录深度与草稿规范化边界。
- 与 Task-062 合计 19 个纯函数用例；完整质量门结果见 `docs/09-verification.md` TC-P2-GOV-027。
