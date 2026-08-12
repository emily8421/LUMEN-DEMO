# task-045：前端引入 ESLint（eslint B1 / 维护态批13）

> Sprint-38（维护态批13）· P1 工程治理 · NFR-006 P1 落地。上游：`docs/research/2026-08-12-frontend-eslint-b1-assessment.md`（实证）+ `tasks/task-042-ci-minimum-gates.md` §降级边界 B1（frontend-lint P0 不做留 P1）+ `docs/research/2026-08-10-code-governance-rollout-plan.md` §3 P0-2。

## 元信息

- Sprint：Sprint-38（维护态批13）
- 关联：NFR-006（CI 最小回归门·frontend-lint P1 落地）
- 上游依据：`docs/research/2026-08-12-frontend-eslint-b1-assessment.md`、`tasks/task-042` B1、rollout §3、`docs/05-tech-spec.md §4.2.4`
- 分支：`chore/p1-eslint-b1-frontend-lint`（Slice A）+ `fix/p1-eslint-b1-slice-b-lint-cleanup`（Slice B）
- 依赖：task-042（CI 最小门，B1 留痕）

## 目标

给前端引入 ESLint（对称后端 ruff），补 tsc 管不到的盲区（React Hooks 规则、显式 any、未使用变量），CI 加 `frontend-lint` job（advisory→required）。**不改对外 API / DB / 依赖语义（新增 5 个前端 devDeps 属 lint 工具链）**。

## 修改范围（两 slice，9 文件）

### Slice A（PR #146 `92ea36a`，地基 + advisory CI）
- `frontend/package.json`：加 eslint^9 / @eslint/js^9 / typescript-eslint^8 / eslint-plugin-react-hooks^5.2 / globals^15 devDeps + `lint` / `lint:fix` 脚本
- `frontend/eslint.config.js`（新）：flat config——typescript-eslint recommended（非 type-checked，避开 tsc strict 重叠）+ react-hooks（`rules-of-hooks` error / `exhaustive-deps` warn）+ `no-explicit-any`（warn）/ `no-unused-vars`（error）
- `.github/workflows/project-check.yml`：加 `frontend-lint` job（advisory 起步 `continue-on-error: true`，对称 backend-lint；node 22.17.1 + npm ci + cache 对称 frontend-build）

### Slice B（PR #147 `c9d8911`，存量整治 + 升 required）
- **5 error 清零**：
  - `features/QuickEntryFeature.tsx`：`rules-of-hooks` **真 bug**——`useRef`/`useEffect` 原在 `if(!isOpen) return null` early return 之后调用，移到之前（tsc 没拦住，React 运行时崩溃级）
  - `app/local-vault-index.ts` / `components/MarkdownBlock.tsx`：`no-useless-escape`（字符类内 `\[`→`[`）
  - `app/markdown-toc.ts`：`no-irregular-whitespace`（regex 内全角空格 U+3000 改 `　` escape）
- **5 warning 清零**：
  - `app/useLocalVaultMount.ts`：createFile 依赖加 `mountNameOf`（声明移到 createFile 前避开 TS2448）
  - `app/useCommandPalette.ts`：`items` 改 `useMemo`（性能改进）+ import 加 `useMemo`
  - `App.tsx` / `features/DocumentsFeature.tsx`：`exhaustive-deps` 有意忽略加 disable + 理由
  - `features/DocumentsFeature.tsx:181`：删冗余 disable（unused directive）
- `.github/workflows/project-check.yml`：`frontend-lint` 移除 `continue-on-error`（升 required）

## 验收标准

1. `npm run lint` → **0 problem（0 error + 0 warning）**
2. `npm run build` → **301 modules exit 0** 零回归（tsc + vite 不受影响）
3. CI `frontend-lint` required 绿（advisory→required，基线已 0 problem）

## 完成记录

- **2026-08-12 v3.8.10**：Slice A PR #146（`92ea36a`）+ Slice B PR #147（`c9d8911`）全闭环。首跑基线 10 problems（5 error + 5 warning，含 QuickEntryFeature 2 个 `rules-of-hooks` 真 bug）→ Slice B 清零。验证：`npm run lint` 0 problem + `npm run build` 301 modules exit 0 + CI `frontend-lint` required 绿（21s）+ 其他 5 job 全绿（project-check / backend-test 3m7s / backend-integration 3m7s / frontend-build 26s / ruff advisory 12s）。回写：`docs/05 §4.2.4`（L164/L165/L171 + 新增批13 条）+ `docs/08` Sprint-38 + `ai/project-rules.md §1` 维护态批13 + 本 task + `docs/research/2026-08-12-frontend-eslint-b1-assessment.md §7` + bump v3.8.10（VERSION / CHANGELOG / CHANGELOG-PLAIN 三件套）。

## 待确认

（无；方案 plan 已批准，决策 ESLINT-C1..C5 全按推荐执行：C1 偏严规则集 / C2 advisory→required / C3 不引入 prettier / C4 存量基线 / C5 独立 frontend-lint job。）
