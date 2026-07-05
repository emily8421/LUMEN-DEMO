# 10 docs/03-09 文档验收 checklist

> Sync notice: This file is maintained by `ai-project-template` and may be overwritten when a derived project syncs template methodology.
> Do not edit it directly in derived projects; propose reusable changes in `_proposals/` and upstream them to the template repository.

**用途**：生成 03-09 后、进入编码前，人工逐项核对；也可让 AI 自查。

**目的**：在「代码写错」之前，先拦住「文档本身错了 / 空了 / AI 自行加料」。

**与 docs-evaluation 的区别**：`docs-evaluation` 输出整体 / 阶段 / 单文档的 `Go / Conditional Go / No Go` 评估结论和可落盘报告；本文是编码前 checklist，偏最后一道就绪拦截，不替代正式评估报告。

**适用场景**：刚用 `ai/prompts/docs/00-generate-or-complete-docs.md` 生成 / 更新 03-09，准备进入 Sprint 开发。

**不适用场景**：已经进入代码修复或实现细节定位；这种情况用 `ai/prompts/dev/02-run-task.md` / `ai/prompts/dev/05-fix-bug.md`。

**使用前准备**：准备完整的 00-09 文档、`ai/project-rules.md`、`docs/env/local-env.md` 和人工已知的项目边界。

**预期产出**：通过 / 未通过项清单，以及需要修订的文档位置。

**使用后下一步**：未通过则先修文档；通过后再用 `ai/prompts/dev/02-run-task.md` 执行 Sprint。

### A. 00-02 输入门槛（生成 03-09 前先确认输入够不够）
- [ ] 00-scenario：背景 / 目标用户 / 典型场景均已填写，非空
- [ ] 01-user-requirements：功能点可枚举、不模糊（"一个好用的系统"不算需求）
- [ ] 02-srs：每条 REQ 可验证（能说清"怎样算满足这条"）
- [ ] docs/env/local-env.md：已由 `scripts/collect-env.ps1` 生成；人工确认项未补齐时，后续方案已明确列为待确认
- 判据：若你自己都无法凭 00-02 向同事讲清"要做什么"——补输入，别让 AI 用幻觉补

### B. 03-09 逐项验收（生成后逐项打钩）
- [ ] 03-prd：覆盖 02-srs 全部 REQ，无遗漏；无 00-02 未提及的新增功能；§3 每个 Phase 同时声明功能范围、交付物形态（Demo/MVP/产品）和进入/退出标准
- [ ] 04-architecture：模块划分对应 03 的功能范围；技术选型有理由；部署 / 运行拓扑受 `docs/env/local-env.md` 约束
- [ ] 05-tech-spec：技术栈与版本明确；Phase 边界与 ai/project-rules.md §1 一致；技术状态区分「已用 / 预留·未启用 / 默认关闭」；已给出本机 Demo 可行性、资源瓶颈、降级 / Mock 策略和服务器资源预案；若 §5 尚未填写，编码约定处已明确标注待回填
- [ ] 技术环境评估：若项目含 backend / frontend / docker / 数据库 / 本机模型 / 外部 API 等真实运行依赖，已存在 `docs/research/*tech-env-evaluation*.md` 或在 `project-rules` / 05 中记录豁免理由、风险和补做时点
- [ ] 06-db-design（如有）：每张表可追溯到某个 REQ；无"看起来有用但没人查"的表
- [ ] 07-api-spec（如有）：每个接口对应一个需求/功能；无孤立接口
- [ ] docs/design/frontend-interaction.md 或 docs/design/*interaction*.md（如触发）：独立 Web / 移动端 / 小程序 / 桌面端、多页面、多角色、复杂表单、状态流或点击路径验收已补前端交互设计；不补时有豁免理由
- [ ] 08-dev-plan：Sprint 拆分合理，单 Sprint 限制在 1~3 个文件；验收标准可判断；当前阶段 Sprint 支撑对应交付物形态
- [ ] 09-verification：REQ → 用例追溯矩阵覆盖当前阶段全部 REQ，包含交付物形态；包含本机启动、内存 / 显存 / 磁盘 / 端口等资源验证项
- [ ] 待人工确认项：不是纯问题列表；每项包含 ID、AI 建议、建议依据、备选方案、取舍影响 / 阻塞关系；高风险项未被 AI 建议自动视为已确认

### B0. 文档生命周期追溯
- [ ] 每个 `01` U-ID 都能回到愿景锚点、`docs/inputs/` 原始输入来源或反向摘要来源。
- [ ] 每个 `02` REQ-ID 都能回到一个或多个 U-ID。
- [ ] `03` 覆盖全部 REQ，并给出阶段归属。
- [ ] `04-07` 的模块、技术决策、表、接口、子系统均能追溯到 REQ 或明确的非功能约束。
- [ ] `08/09` 覆盖当前阶段全部 REQ，且未把后续阶段 / 愿景功能作为当前阶段必做项。
- [ ] 本次上游文档变更已列出下游影响；横切事实 / 约束变更已列出权威源、引用同步范围和聚焦一致性检查结果。

### C. 交叉一致性（最易出错，单独核一遍）
- 04 模块 ⊆ 03 功能范围（架构不超出 PRD）
- 上游输入锚点 → U-ID → REQ-ID → 03 §3 阶段 → 04/05 模块与技术决策 → 08 Sprint → 09 验收用例可追溯，无悬空 ID
- README / 03 / 05 / 09 对 Demo / MVP / 产品的说法一致，未把 Demo 声称为 MVP 或产品
- 横切事实有唯一权威源，其他文档引用权威源而非各自重新声明；权威源变更后引用处已同步
- 04 / 05 / 09 的运行环境假设一致，且与 `ai/project-rules.md` §2.5、`docs/env/local-env.md` 不冲突
- 06 表 / 07 接口 ⊆ 04 模块（若有 06/07，其数据与接口都落在架构内）
- 08-09 ⊆ 05-07 中实际保留的文档（开发计划不引入技术方案外的依赖）
- 前端交互设计只承接 03/04/05/07/08/09 已授权内容；页面 / 路由、状态、文案、接口依赖和验收路径可追溯到 REQ / Sprint / Test Case
- 前端隐藏入口、按钮禁用、路由守卫只作为可见性控制；权限必须由后端接口和服务层执行

### D. 一票否决
- 03-09 中任何"00-02 未提及、AI 自行添加"的功能 → 删除（对应 global-rules「AI不可自主扩展需求」）
- 出现无上游依据的 U-ID / REQ / 模块 / 表 / 接口 / Sprint / 验证用例 → 退回补追溯或删除
- 上游文档发生变更但未评估下游影响，或横切事实变更未建立权威源与引用同步计划 → 退回补影响分析
- 技术方案默认使用本机无法承载的重资源组件，且未给出降级 / Mock 或服务器资源预案 → 退回重写
- 把候选、预留或默认关闭的技术写成已用，或把未实现集成写成已接入 → 退回核实
- 真实运行依赖项目进入首个编码 Sprint 前缺少技术环境评估报告 / 明确跳过记录，或把 collect-env 事实采集写成依赖验证通过 → 退回补评估
- 待人工确认项只有问题、没有 AI 建议 / 建议依据 / 备选方案 / 取舍影响，或把 AI 建议写成已确认事实 → 退回补齐
- UI 型项目触发前端交互设计但缺失文档 / 豁免理由，或在交互设计中新增未授权需求、接口、验收目标 → 退回补设计或同步上游文档
- 把前端隐藏、按钮禁用或路由守卫写成唯一权限边界 → 退回补后端接口 / 服务层权限设计
- 任何文档只剩标题、无实质内容 → 要么补全，要么按 project-rules §3 声明省略，不留空壳
