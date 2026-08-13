> 来源：LUMEN_demo_T2.1（emily8421/LUMEN-DEMO）派生项目回流

# TEMPLATE-UPGRADE：Web Profile（R3）代码层一致性基线

> 本提案是原混合提案 `TEMPLATE-UPGRADE-web-fullstack-code-consistency-baseline.md` 按 governance R1/R3/R5 分层拆分后的 **R3 Web Profile 部分**。跨项目通用条目见 `TEMPLATE-UPGRADE-universal-code-consistency-supplement.md`（R1/R2），FastAPI/React 具体写法见 `TEMPLATE-UPGRADE-stack-adapters-fastapi-react.md`（R5）。拆分依据 `docs/research/2026-08-10-rule-consolidation-map.md`；governance §8.3 要求「真正的 Web 共同规则留在 Profile」。

## 1. 动机（去项目化）

`template-docs/web-fullstack-profile.md` 已覆盖复杂 Web / 全栈项目的**结构骨架**（WSG-001~006 Gate、§5 文件膨胀阈值、§5.1 主应用职责边界）。governance 上位框架（`docs/research/2026-08-10-ai-code-governance-framework.md` §8.3）要求：真正的 **Web 共同规则留在 Profile（R3）**——即只要项目形态是「Web / 全栈」就成立、换到 CLI / 库 / 数据流水线不成立的代码层契约。

本提案补的就是这一层：Web 全栈项目在**错误响应契约、前后端类型同步、HTTP 出口、契约序列化测试、读写分层、命名风格**上应有一致基线，避免 AI 自主编码时每个端点 / 模块各写各的，漂移成「同一项目像 N 个人写的」。

**实证观察（LUMEN 派生项目，2026-08 全栈代码审查）**——Web 形态层曾出现的系统性缺口：

- 错误响应 `code` 字段二义（既是 4 位业务码、又是 HTTP 码）；只注册了 `HTTPException` handler，**无兜底 5xx envelope**，service 未捕获异常走框架默认响应、不带项目 envelope，前端契约在异常路径断裂；
- 前端靠**正则匹配错误文案**判断 auth 失败（文案一改即崩），而非靠结构化 `code`；
- 前后端类型**手工双写**（后端 dataclass ↔ 前端 TS interface），后端加字段前端无感直至运行期；
- 前端多处**裸 `fetch`** 后端，绕过统一 client；
- API 测试直接 import 并调用端点函数、**不经 HTTP 客户端**，全局 `exception_handler`（envelope 序列化层）无回归保护。

> 注：LUMEN 经 CQ-P1-005（v3.8.4）已落地错误契约 + 前端 `ApiError` + 契约序列化测试，经 `project-rules §5` 已落地 HTTP 单出口与读写分层——这些**已落地的好实践证明：缺的不是能力，是「把 Web 共同规则固化为 Profile 基线」的规范载体**，导致新 Web 项目不一定对齐。

## 1.1 与既有规则的关系（去重）

- **`web-fullstack-profile §5 / §5.1`**（现行）：管「文件结构与膨胀」。**对象不同**（结构 / 体量 vs Web 代码契约），**互补不重复**——本提案在其同载体补「Web 代码层」维度。
- **L0 通用代码原则**（`global-rules §2.1`，已由 #322 采纳）：跨所有形态的通用基线（命名意图 / 失败可见 / 对外信息最小化 / import 卫生等）。**层级不同**（L0 跨形态 vs R3 Web 专属），Web 全栈项目两者都读，不重叠。本提案**不重复** L0 通用项。
- **Stack Adapter 提案**（`TEMPLATE-UPGRADE-stack-adapters-fastapi-react.md`，R5）：FastAPI / React 具体写法（service 禁抛 `HTTPException`、`ReturnType`、`typing.Protocol` 等）。**本提案只定 Web 形态契约**（如「前端抛结构化错误含 code」），具体 class / 注解 / 工具写法交 R5。
- **通用补充提案**（`TEMPLATE-UPGRADE-universal-code-consistency-supplement.md`，R1/R2）：CI 必跑 test+type+lint、secret 校验、多实现契约等跨形态项。**层级不同**，不重复。
- **assessment TQG**（`docs/research/2026-08-10-code-quality-maintainability-assessment.md` §7）：TQG-004（前端禁靠文案判状态）→ **合并入**本提案 §9.1 结构化客户端错误；TQG-009（机器可执行 schema）→ **合并入**本提案 §9.3 单源类型；TQG-011（阈值覆盖 smoke）、TQG-012（E2E 共享 harness）同属 R3，回流时由模板维护者一并整合进 §9.4。

**本提案不重复它们**：L0 有通用基线、Stack Adapter 有栈写法、通用补充有 CI / secret；Web Profile 缺一份「Web 共同代码契约」基线。差异化：给 `web-fullstack-profile.md` 补 §9 的 **R3 子集**。

## 1.2 与 governance R1-R7 上位框架的关系

本提案对应 governance **R3 项目形态 Profile（Web / 全栈）**，目标载体 `template-docs/web-fullstack-profile.md`（governance §9.1 行 695；第一阶段在现有文件增补）。governance §8.3 明确要求「真正的 Web 共同规则留在 Profile」。本提案每条按 governance §1.2 试金石归位：**换到 CLI / 库 / 数据流水线不成立**才入本提案（仍成立者归 R1/R2 通用层或 R5 Stack Adapter）。

三套规则清单去重对照见 `docs/research/2026-08-10-rule-consolidation-map.md`。

## 2. 拟改（`template-docs/web-fullstack-profile.md` 增补 §9）

在现 §8「与 scaffold 实验的关系」之后新增 §9。**只含 Web Profile（R3）条目**——跨项目通用条目指向 L0 / 通用补充提案，具体栈写法指向 Stack Adapter 提案。**不引入硬 CI 门禁**（Web 契约检测依赖具体栈 lint，模板无法预置通用规则）、**不与 §5 / §5.1 重复**（结构 vs 契约正交）。定位为「治理提醒 + 派生项目落地口径」，派生项目在 `ai/project-rules.md §5` / `docs/05-tech-spec.md` 落地具体版本。

> ### 9. 代码层一致性基线（Web Profile / R3 子集）
>
> §5 / §5.1 管「文件结构与膨胀」，本节管「Web 全栈代码层契约」——只要项目形态是 Web / 全栈就应成立的错误响应、前后端类型、HTTP 出口、契约测试、读写分层与命名基线。跨形态通用基本功（命名意图 / 失败可见 / import 卫生等）见 `global-rules §2.1` L0 基线；具体栈写法（FastAPI / React）见 `template-docs/stack-adapters/`。
>
> #### 9.1 错误与响应契约（Web 形态）
> - **单一业务码命名空间**：错误响应 `code` 字段为项目业务码（命名常量 / Enum）；HTTP 码只放 `status_code`。同一 `code` 字段不得既是业务码又是 HTTP 码（否则消费者无法稳定分流）。
> - **兜底 5xx envelope**：注册通用 `Exception` handler 返回项目 envelope（如 `{code:<未分类>, msg:<固定文案>, data:null}`），生产环境不回传堆栈 / 内部路径（兼 R1「对外信息最小化」= L0-7；具体 handler 注册写法见 Stack Adapter）。
> - **结构化客户端错误**：前端 HTTP 客户端抛**结构化错误（含 `code`）**，供调用方按 `code` 分流（401→登出、降级码→降级提示），而非裸 `Error(msg)` 丢弃 `code`（合并 assessment TQG-004；具体 `ApiError` class 写法见 Stack Adapter）。
>
> #### 9.2 读写分层与命名风格（Web 形态）
> - **读 / 写分层约定**：明确「读可直连 repository、写必走 service」或「全部经 service」二选一，写进 `ai/project-rules.md §5`，项目内不混用（consolidation-map 原归 R6 项目基线；去项目化后归 Web Profile 通用分层，因换 Web 栈仍成立）。
> - **端点 / 函数后缀统一**：同项目内端点函数命名风格统一（带或不带后缀二选一）。
> - **HTTP 单出口**：前端后端调用统一经 API 客户端模块，禁 hook / 组件内裸 `fetch`；新增资源 = 新建域模块 + barrel re-export（兼 R6；LUMEN 已落 `api/client.ts`）。
>
> #### 9.3 类型与契约同步（Web 形态）
> - **单源类型**：后端 schema（`response_model` / OpenAPI）作为前后端类型**单一事实源**，前端类型经 codegen 生成或入库基线比对，禁止手工双写任其漂移（合并 assessment TQG-009；具体 codegen 工具见 Stack Adapter）。
>
> #### 9.4 工程化护栏（Web 形态）
> - **测试分层 + 契约序列化回归**：unit / integration 分目录或 marker，CI 默认只跑 unit（无外部依赖），integration 夜跑或手动；**契约序列化层（全局 `exception_handler` / envelope）必须有经 HTTP 客户端（如 `TestClient`）的回归测试**，不能只测端点函数。（CI 必跑 test+type+lint 的元规则在通用补充提案 R2 Gate。）
>
> > 与 §5 / §5.1 一致为治理提醒，非硬性；派生项目可在 `ai/project-rules.md §5` / `docs/05-tech-spec.md` 覆盖或写明豁免。

## 3. 版本

模板版本：下一 **MINOR**。仅 `template-docs/web-fullstack-profile.md` 同文件内 §8 之后增补 §9 及子节（纯文本规范，无新文件结构、无脚本、无 CI 强制、无 Gate 新增——本节自述为治理提醒）。不触碰 WSG-001~006、§5 膨胀阈值表、§5.1 主文件职责。

## 4. 影响

- **改动文件**：`template-docs/web-fullstack-profile.md`（+§9 及 §9.1~§9.4）。
- **不触碰**：WSG-001~006 Gate 定义与通过条件；§5 文件膨胀阈值表；§5.1 主应用职责边界；`global-rules §2 / §2.1`（L0）；Stack Adapter（R5，另案）；通用补充（R1/R2，另案）。
- **预期效果**：Web 全栈派生项目（尤其 AI 自主编码）在「Web 代码层契约」有可执行基线，降低错误响应 / 类型同步 / HTTP 出口 / 契约测试的随机性；新派生项目的 `ai/project-rules.md §5` 基于 §9 裁剪而非从零。
- **回测口径**：采纳后，新 Web 派生项目 `project-rules §5` 的错误契约 / 类型同步 / HTTP 出口 / 契约测试应基于 §9 给出具体执行口径；现有派生项目（如 LUMEN）可对照 §9 标注「已落地 / 待对齐」。

## 5. 备选（已评估未采）

- **把通用项 / 栈写法也塞进本 §9**：governance §8.3 明确要求通用项「提升到 R1/R2」、栈写法「放进 Adapter」，不得全塞一个 Web 文档（否则 CLI / 数据流水线项目重复发明同类规则）。否决。
- **设为硬 CI 门禁**：Web 契约（如「禁裸 fetch」「兜底 envelope」）部分可 lint，但派生项目栈各异（FastAPI / Spring / Express、React / Vue），模板无法预置通用 lint；本节定位「治理提醒 + 落地口径」，CI 门由派生项目按栈自建（CI 必跑 test+type+lint 的元规则在通用补充提案 R2）。否决模板层硬门禁。
- **只给检查清单、不给落地口径**：纯 checklist 无法约束 AI 自主编码；本提案给「应该怎样」的可执行口径。否决纯清单形态。

## 6. 后续

- 本提案在派生项目 `_proposals/` 起草；与 R1/R2（通用补充）、R5（Stack Adapter）提案同批成熟后，经 `ai/commands/submit-proposal.md` 跨仓开 issue 回流 `emily8421/ai-project-template`。
- 模板维护者处理时按 `global-rules §9` 流程：读全部 `TEMPLATE-UPGRADE-*.md` → 去重 / 冲突 / 依赖分析（注意与 L0 §2.1、Stack Adapter、通用补充提案的同批整合，consolidation-map §5 建议按 R1-R7 统一回流，不强制以三提案名义）→ 辅助修改 `web-fullstack-profile.md` → PR 落地。
- 派生项目侧实证：LUMEN `docs/05-tech-spec.md §4.2` 已写项目版本（含 CQ-P1-005 错误契约落地证据），作为本提案实证样本。
- 合并并下行同步后，本提案移入 `_archive/proposals/`。
