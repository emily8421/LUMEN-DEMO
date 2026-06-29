# 16 文档体系全链路回溯审计

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：项目已成型（完成若干 Sprint / Phase）后，用 `ai/document-lifecycle-rules.md` 回溯审视整条 PLM 链路的合理性、可行性与一致性。

**目的**：一次性产出全链路健康度报告，而不是分别跑生成、编码前验收、合规审查再拼接；定位追溯断点、横切传播残留、外部文档孤岛和阶段可行性缺口。

**适用场景**：项目已成型，想用最新方法论回头审视「vision → 需求是否合理、需求 → 设计是否可行、设计 → 计划 → 验证是否自洽」。

**不适用场景**：

- 刚生成 03-09、准备进入编码前验收 → 用 `ai/prompts/review/10-docs-checklist.md`。
- 审查实现是否符合设计、是否越界 → 用 `ai/prompts/review/03-project-review.md`。
- 从输入生成 / 补齐文档体系 → 用 `ai/prompts/docs/00-generate-or-complete-docs.md`。

**使用前准备**：完整的 `docs/00-09`（及 `docs/design/*`、`docs/decisions/*`、`docs/inputs/*` 等项目事实）、`ai/project-rules.md`、`docs/env/local-env.md`，以及人工已知的项目边界。

**预期产出**：链路健康度总览表 + 各维度问题清单（定位 `文件:行` + 权威源）+ 回梳计划（按横切事实分组）+ 审计新发现（可行性 / 部署缺口）+ 待人工确认项。**不改文件，先出报告。**

**使用后下一步**：确认后按 `ai/prompts/docs/04-edit-single-doc.md` 做最小变更回梳；若发现实现越界，用 `ai/prompts/review/03-project-review.md` 或 `ai/prompts/dev/05-fix-bug.md`。

```text
请基于 ai/index.md 列出的规则文件（尤其 ai/document-lifecycle-rules.md）+ 本项目 docs/ 全部文档，做一次「文档体系全链路回溯审计」。

适用场景：项目已成型（完成若干 Sprint / Phase），用最新方法论回头审视整条 PLM 链路的合理性、可行性与一致性。区别于 00（生成）/ 10（编码前验收）/ 03（合规审查），本提示词是「事后全链路回溯」。

按以下维度逐段核查并输出：

1. 纵向追溯链（document-lifecycle-rules §6）：输入 → U-ID → REQ-ID → Phase → 模块 / 表 / 接口 / Sprint / 用例，是否闭合、有无悬空 ID。
2. 横切一致性（§7）：每个横切事实（平台能力 / 合规裁决 / 技术选型禁令 / 可行性核实）是否有唯一权威源；他处引用而非各自声明。
3. 变更传播（§9）：上游变更（尤其已核实横切事实）是否传播到所有下游；列出残留（措辞过时 / 未引用权威源）。
4. 外部文档接入（§8）：外部接入文档是否有锚定 / 定位 / 追溯 / 正确分区；有无命名冲突孤岛。
5. 生成矩阵（§5）：每份文档的输入 / 输出职责 / 禁止项 / 追溯锚点 / 下游影响是否兑现。
6. 可行性维度：需求 → 设计是否技术可行（受 ai/project-rules.md §2 / §2.5 + docs/env 约束）、设计 → 计划是否可执行、计划 → 验证是否可验收；各约束有无降级方案。
7. 交付物形态（ai/global-rules.md §8.1）：各 Phase 是否声明 Demo / MVP / 产品，有无 Demo 误称 MVP / 产品。
8. 规范基线对照：优先读取 `ai/doc-standards/00-09`（模板撰写规范镜像，随 `sync-template` 刷新，只读、非项目事实）；若不存在，再 fallback 到旧路径 `docs/_scaffold/00-09`。对照规范基线核查项目 `docs/00-09` 的章节完整性（文档定位 / 上游输入 / §0 文档元信息 / 撰写提要 / 追溯矩阵）与撰写规范偏离；规范镜像只作基准，不直接驱动开发。

输出：链路健康度总览表 + 各维度问题清单（定位 文件:行 + 权威源）+ 回梳计划（按横切事实分组）+ 审计新发现（可行性 / 部署缺口）+ 待人工确认项。
不改文件，先出报告；确认后按 ai/prompts/docs/04-edit-single-doc.md 最小变更回梳。
```
