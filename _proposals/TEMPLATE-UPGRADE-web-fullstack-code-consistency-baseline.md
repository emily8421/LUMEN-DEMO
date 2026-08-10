> 来源：LUMEN_demo_T2.1（emily8421/LUMEN-DEMO）派生项目回流

# TEMPLATE-UPGRADE：Web Fullstack Profile 增补「代码层一致性基线」

## 1. 动机（去项目化）

`template-docs/web-fullstack-profile.md` 已覆盖复杂 Web / 全栈项目的**结构骨架**：WSG-001~006 Gate（App Shell / 目录边界 / Vertical Slice / 验证入口 / UI 链路）、§5 文件膨胀阈值表、§5.1 主应用文件职责边界与业务下沉。这些回答了「文件怎么组织、何时该拆、主文件放什么」。

但它**完全没有覆盖「代码层一致性」**——即同一项目内，错误处理、分层 import、类型契约、工程化护栏、命名语义应有一致基线。在 AI 自主编码（功能逐个累加、缺强约束）场景下，这类一致性缺口是随机性的主要来源：每个端点 / 模块各写各的错误映射、装配样板、配置读取、日志方式，随时间漂移成「同一项目像 N 个人写的」。

**实证观察（LUMEN 派生项目，2026-08 全栈代码审查）**——结构骨架已对齐 profile（目录边界 / 膨胀阈值 / App Shell 均落地），但代码层一致性出现以下系统性缺口：

- **错误契约**：错误响应 `code` 字段二义（同一字段既是 4 位业务码、又是 HTTP 码）；`code→HTTP` 映射在 4 个 api 文件各维护一份且键集不同；多处 `detail={"msg": str(exc)}` 把 service 异常原文抛给客户端（泄露内部细节）；**只注册了 `HTTPException` handler，无兜底 5xx envelope**，service 未捕获异常走框架默认响应、不带项目 envelope，前端契约在异常路径断裂。
- **分层与装配**：18 个 router 用 `if router is not None` 逐个 `include_router`（新增必改 main）；17 个 api 文件各自复制 `try/except ImportError` 兜底块；`service/` 目录下存在 `from fastapi import HTTPException` 并直接 `raise` 的 web 适配器（分层边界活化石，无注释说明）；同文件出现 3 处分散的 `import` 块（Phase 段 + Sprint 段历史拼接未收敛，AI 追加式编码典型痕迹）。
- **类型与契约**：前后端类型手工双写（后端 dataclass ↔ 前端 TS interface），无 codegen、无 schema diff，后端加字段前端无感直至运行期；repository 双实现（demo / 真实）仅靠 docstring 声明接口对齐、无 Protocol/ABC，新增方法只加到一个实现时另一实现静默缺失；service 函数的 `repository` 形参全程无类型注解。
- **工程化护栏**：CI 只校验 whitespace + `VERSION`/`CHANGELOG` 一致性，**零代码质量门**——~30 个后端测试从未在 CI 跑、前端零测试、后端零 lint；API 测试直接 import 并调用端点函数、不经 HTTP 客户端，全局 `exception_handler`（envelope 序列化层）无回归保护；env 读取散落 6+ 处、无集中 Settings，弱默认 token 签名密钥无生产期校验；`print()` 与 `logging` 混用，降级 `except` 路径静默吞异常无日志。
- **命名语义**：纯 localStorage 序列化层（`load/persist/clamp` 纯函数，非响应式）命名为 `*-store.ts`，暗示 redux/zustand 语义，误导新 AI 误改成订阅模式；同文件端点函数后缀混用（`list_documents` vs `xxx_endpoint`）。

> 注：以上为「代码层」一致性缺口。LUMEN 同时也有强实践（统一成功 envelope、领域异常分离、零 `any` + `ReturnType<typeof useXxx>`、HTTP 单出口 `fetch` 仅存于 client、bcrypt + 防枚举恒定时序、不透明 token 仅存摘要）——这些**已落地的好实践恰恰证明：缺的不是能力，是「把好实践固化为可执行基线」的规范载体**，导致新模块不一定对齐。

## 1.1 与既有规则的关系（去重）

- **`web-fullstack-profile §5` 文件膨胀阈值 / `§5.1` 主文件职责边界**（现行）：管「文件大小与主文件该放什么」。**对象不同**（结构/体量 vs 代码内部一致性），**互补不重复**——本提案在其同载体补「代码层」维度。
- **`app-main-file-size-rule`**（已归档）：代码文件膨胀阈值。**对象不同**（文件大小 vs 错误/装配/类型一致性），不重复。
- **`global-rules §2` AI 代码生成规范**（现行）：高层「生成前 / 生成时 / 生成后」要求。**层级不同**（跨所有项目形态的高层 AI 行为 vs Web 全栈特化的可执行口径），本提案把 §2 的「生成时必须先说明方案」落实为 Web 全栈的具体代码约束，互补不重复。
- **`implementation-lifecycle-rules §3` System Skeleton Gate**（现行）：管「首个业务 Sprint 前跑通最小纵切」。**阶段不同**（启动门禁 vs 持续编码一致性），不重复。

**本提案不重复它们**：现有 profile 有结构 / 膨胀 / 主文件职责，没有「代码层一致性」；global-rules §2 有高层要求，没有 Web 全栈可执行口径。差异化：给 profile 补一个与 §5/§5.1 平行的新维度（§9 代码层一致性基线），把派生项目中反复出现的代码层随机性收敛为可执行条目。

## 1.2 与 governance R1-R7 上位框架的关系（待重构标注）

`docs/research/2026-08-10-ai-code-governance-framework.md`（R1-R7 上位治理框架）§8.3 对本提案有明确评价：本提案「已覆盖错误契约、分层、类型、工程化与命名，作为第一份实证提案有价值」，但「**混合了三类内容**：① 跨项目通用（CI 必跑 test/type/lint、错误不泄露内部细节、关键 secret 非弱默认）；② Web Profile（前后端 schema 同步、HTTP 单出口、结构化客户端错误、契约序列化测试）；③ 技术栈 Adapter（FastAPI service 不抛 `HTTPException`、Python Protocol、React `ReturnType`、具体工具名）」，建议「回流前按 R1 / R3 / R5 重新分类，不要全塞进一个 Web 文档」（governance §14.3 待确认项）。

**本次处置**：作为 `_proposals` 起草区草案先提交（带本待重构标注），不本次重构。重构作为提交后独立任务：① 类拆入 R1/R2 通用层、② 类留 R3 Web Profile、③ 类移 R5 Stack Adapter。三套规则清单（本提案 §9 + L0 基线 12 条 + assessment TQG 15 条）的去重对照见 `docs/research/2026-08-10-rule-consolidation-map.md`。

## 2. 拟改（`template-docs/web-fullstack-profile.md` 增补 §9）

在现 §8「与 scaffold 实验的关系」之后新增 §9。**不引入硬 CI 门禁**（代码一致性检测依赖具体技术栈的 lint 规则，模板无法预置通用规则）、**不与 §5/§5.1 重复**（结构 vs 一致性正交）。定位为「治理提醒 + 派生项目落地口径」，派生项目在 `ai/project-rules.md §5` / `docs/05-tech-spec.md` 落地具体版本。

> ### 9. 代码层一致性基线（Code Consistency Baseline）
>
> §5 / §5.1 管「文件结构与膨胀」，本节管「代码内部一致性」——同一项目内，错误处理、分层 import、类型契约、工程化护栏、命名语义应有一致基线，避免 AI 自主编码时每个模块各写各的。以下为治理提醒（非硬性编译规则），派生项目在 `ai/project-rules.md §5` / `docs/05-tech-spec.md` 落地具体执行口径与技术栈版本。
>
> #### 9.1 错误与响应契约
> - **单一业务码命名空间**：错误响应 `code` 字段为项目业务码（命名常量 / Enum）；HTTP 码只放 `status_code`。同一 `code` 字段不得既是业务码又是 HTTP 码（否则消费者无法稳定分流）。
> - **集中映射**：`code→HTTP` 映射全局唯一（单一函数或 Enum 属性），禁止每个 api 文件各维护一份映射表。
> - **envelope helper**：成功响应走单一 helper（如 `ok(data)`），禁止每个端点 inline `{"code":0,...}`。
> - **兜底 5xx**：注册通用 `Exception` handler 返回项目 envelope（如 `{code:<未分类>, msg:<固定文案>, data:null}`），生产环境不回传堆栈 / 内部路径。
> - **结构化客户端错误**：前端 HTTP 客户端抛结构化错误（含 `code`），供调用方按 `code` 分流（如 401→登出、降级码→降级提示），而非裸 `Error(msg)` 丢弃 `code`。
> - **禁泄露内部细节**：错误 `msg` 必须用固定用户文案；禁止 `str(exception)` 直传 service 异常文本（异常文本仅进日志）。
>
> #### 9.2 分层与装配纪律
> - **service 不 import web 框架**：业务 / 服务层抛领域异常，api / controller 层统一转 HTTP；web 框架类型（`HTTPException` / `Request` / `Response` 等）不得出现在 service 层。web 适配依赖（如 `Depends`）放 api 层，或物理移出 service 层并显式标注「web adapter」。
> - **批量装配循环化**：router / 路由 / 依赖注册用列表 + 循环，禁止逐个 `if-include` 累加；新增项只改列表一行。
> - **import 收敛顶部**：一个文件的 import 统一在顶部；历史段落拼接产生的新 import 块必须收敛回顶部，禁止文件中部追加 import（AI 追加式编码典型痕迹）。
> - **读 / 写分层约定**：明确「读可直连 repository、写必走 service」或「全部经 service」二选一，写进 `ai/project-rules.md §5`，项目内不混用。
> - **Repository 契约显式化**：多实现（demo / 真实）用 `Protocol` / `ABC` 显式声明接口对齐，禁止仅靠鸭子类型 + docstring 声明。
>
> #### 9.3 类型与契约同步
> - **单源类型**：后端 schema（`response_model` / OpenAPI）作为前后端类型的单一事实源，前端类型经 codegen 生成或入库基线比对，禁止手工双写后任其漂移。
> - **禁 `any` + 泛型贯穿**：前端禁 `any`，泛型从 API 客户端一路传到组件；跨层 props 用 `ReturnType<typeof useXxx>` 导出，不手写重复接口。
> - **service 参数类型化**：service 函数的 `repository` / 依赖形参必须有类型注解（指向 §9.2 的 Protocol），禁止裸参数。
>
> #### 9.4 工程化护栏
> - **CI 代码门**：CI 必须跑「测试 + 类型检查 + lint」（后端 `pytest` + `ruff`/`mypy`、前端 `tsc` + `eslint`），不得只校验文档 / 版本 / 空白。
> - **测试分层 + 契约回归**：unit / integration 分目录或 marker，CI 默认只跑 unit（无外部依赖），integration 夜跑或手动；**契约序列化层（全局 `exception_handler` / envelope）必须有经 HTTP 客户端（如 `TestClient`）的回归测试**，不能只测端点函数。
> - **配置集中**：env 读取集中在单一 config / Settings 模块，禁止各模块裸 `os.environ.get`；关键 secret 启动期校验（缺失 / 为默认值即启动失败）。
> - **日志统一**：禁 `print`（CI grep 守卫），统一 `logging`；降级 `except` 路径必须 `logger.warning(...)` 记原因，禁止静默吞。
>
> #### 9.5 命名语义一致
> - **命名反映真实语义**：文件 / 标识符命名与实际职责一致——纯持久化序列化层不得命名 `*-store` 暗示响应式；web 适配器不得放 service 层命名误导分层。
> - **端点 / 函数后缀统一**：同项目内端点函数命名风格统一（带或不带后缀二选一）。
> - **HTTP 单出口**：前端后端调用统一经 API 客户端模块，禁止 hook / 组件内裸 `fetch`；新增资源 = 新建域模块 + barrel re-export。
>
> > 与 §5 / §5.1 一致为治理提醒，非硬性；派生项目可在 `ai/project-rules.md §5` / `docs/05-tech-spec.md` 覆盖或写明豁免。技术栈无关的条目（如「service 禁 import web 框架」「CI 必跑 test+type+lint」）建议直接采纳；技术栈相关条目（具体 lint 规则、codegen 工具）由派生项目按栈落地。

## 3. 版本

模板版本：下一 **MINOR**。仅 `template-docs/web-fullstack-profile.md` 同文件内增补 §9 及 §9.1~§9.5（纯文本规范，无新文件结构、无脚本、无 CI 强制、无 Gate 新增——本节自述为治理提醒）。不触碰 WSG-001~006、§5 膨胀阈值表、§5.1 主文件职责。

## 4. 影响

- **改动文件**：`template-docs/web-fullstack-profile.md`（+§9 及 §9.1~§9.5）。
- **不触碰**：WSG-001~006 Gate 定义与通过条件；§5 文件膨胀阈值表；§5.1 主应用文件职责边界；`global-rules §2`；`app-main-file-size-rule`（已归档）；`implementation-lifecycle-rules §3` System Skeleton Gate。
- **预期效果**：派生项目（尤其 AI 自主编码）在「代码层一致性」上有可执行基线，降低错误处理 / 分层装配 / 类型契约 / 工程化护栏 / 命名语义的随机性；新派生项目的 `ai/project-rules.md §5` 不再大量「待回填」，而是基于 §9 裁剪。
- **回测口径**：采纳后，新派生项目 `ai/project-rules.md §5`「编码约定」应基于 §9 给出具体执行口径而非占位；现有派生项目可对照 §9 补齐 `docs/05` 编码约定并标注「已落地 / 待对齐」。

## 5. 备选（已评估未采）

- **把 §9 内容放进 `global-rules §2`**：§2 是跨所有项目形态（CLI / 库 / Web / 纯计算）的高层 AI 行为规范；代码层一致性（错误契约 / 装配 / web 框架分层）属 Web 全栈特化，与 §5 膨胀阈值同载体（profile）更内聚。否决。
- **设为硬 CI 门禁**：代码一致性（如「service 禁 import web 框架」「禁裸 fetch」）技术上可用 lint 规则检测，但派生项目技术栈各异（FastAPI / Spring / Express、React / Vue），模板无法预置通用 lint 规则；本节定位「治理提醒 + 派生项目落地口径」，CI 门禁由派生项目按技术栈自建（§9.4 只要求「CI 必跑 test+type+lint」这一条元规则）。否决模板层硬门禁。
- **只给检查清单、不给落地口径**：纯 checklist 无法约束 AI 自主编码的具体行为（AI 会按 checklist 勾选但代码仍各写各的）。本提案给「应该怎样」的可执行口径，派生项目直接裁剪。否决纯清单形态。
- **不改（接受随机性）**：AI 自主编码的代码层不一致持续累积，「同一项目像 N 个人写的」。否决。

## 6. 后续

- 本提案在派生项目 `_proposals/` 起草；成熟后经 `ai/commands/submit-proposal.md` 跨仓开 issue 回流 `emily8421/ai-project-template`。
- 模板维护者处理时按 `global-rules §9` 流程：读全部 `TEMPLATE-UPGRADE-*.md` → 去重 / 冲突 / 依赖分析（注意与 `app-main-file-size-rule` 同涉「代码文件」，但对象正交：文件大小 vs 代码一致性，不冲突）→ 辅助修改 `web-fullstack-profile.md` → PR 落地。
- 派生项目侧落地样本：LUMEN 已同步在 `docs/05-tech-spec.md §4.2` 写项目版本（含「已落地好实践 / 待对齐技术债」），并在 `ai/project-rules.md §5` 回填精炼指针，作为本提案的实证样本。
- 合并并下行同步后，本提案移入 `_archive/proposals/`。
