> 来源：LUMEN_demo_T2.1（emily8421/LUMEN-DEMO）派生项目回流

# TEMPLATE-UPGRADE：Stack Adapter（R5）—— FastAPI / Python + React / TypeScript

> 本提案是原混合提案 `TEMPLATE-UPGRADE-web-fullstack-code-consistency-baseline.md` 按 governance R1/R3/R5 分层拆分后的 **R5 技术栈 Adapter 部分**。跨项目通用条目见 `TEMPLATE-UPGRADE-universal-code-consistency-supplement.md`（R1/R2），Web 形态契约见 `TEMPLATE-UPGRADE-web-profile-code-consistency.md`（R3）。拆分依据 `docs/research/2026-08-10-rule-consolidation-map.md`；governance §8.3 要求「FastAPI / React / PostgreSQL 示例放进 Adapter」。

## 1. 动机（去项目化）

governance 上位框架（`docs/research/2026-08-10-ai-code-governance-framework.md` §4.5）定义 **R5 技术栈 Adapter**：把上层原则（R1-R4）翻译成当前语言 / 框架可直接执行的模式、配置和命令——回答「用 FastAPI / React 如何实现上层规则」。Adapter 只说「在该栈怎么做到」，不重复「为什么必须授权 / 为什么不能误删数据」（那是 R1/R4 的事）。

governance §9.1 给出 R5 目标载体 `template-docs/stack-adapters/`（**新建**），并明确「先放选择矩阵与少量成熟 Adapter」；§11.3 建议先从 Python+FastAPI、TypeScript+React、PostgreSQL 三种起步。本提案就是补这「少量起步 Adapter」——把原 web-fullstack 提案 §9 里**只因用了 FastAPI / React 才这么写**的条目，从 Web 文档移出，落进 Adapter 载体。

**实证观察（LUMEN 派生项目，2026-08 全栈代码审查）**——栈具体写法层曾出现的缺口：

- `service/` 目录存在 `from fastapi import HTTPException` 并直接 `raise` 的 web 适配器（分层边界活化石，无注释）；18 个 router 用 `if router is not None` 逐个 `include_router`；同文件出现 3 处分散 import 块；
- `code→HTTP` 映射在 4 个 api 文件各维护一份且键集不同；多处 `detail={"msg": str(exc)}`；
- repository 双实现（demo / 真实）仅靠 docstring 声明接口对齐、无 Protocol；service 函数 `repository` 形参全程无类型注解；
- 前后端类型手工双写；env 读取散落 6+ 处、无集中 Settings。

> 注：LUMEN 经 CQ-P1-002（v3.8.5）已落地 `RepositoryProtocol`（typing.Protocol + @runtime_checkable）+ service 参数注解；CQ-P1-005（v3.8.4）已落地集中 `code→HTTP` 映射 + `ApiError` + 兜底 envelope——这些**已落地的好实践证明缺的不是能力，是「把栈写法固化为 Adapter」的载体**，让新 FastAPI/React 项目直接对齐。

## 1.1 与既有规则的关系（去重）

- **Web Profile 提案**（`TEMPLATE-UPGRADE-web-profile-code-consistency.md`，R3）：定 Web 形态契约（如「前端抛结构化错误含 code」「单源类型」）。**本提案给该契约的具体栈实现**（如 `ApiError` class 写法、codegen 工具）。形态契约 vs 栈实现，互补不重复。
- **通用补充提案**（`TEMPLATE-UPGRADE-universal-code-consistency-supplement.md`，R1/R2）：定跨形态原则（如「多实现须显式契约」「关键 secret 启动校验」「CI 必跑 type+lint」）。**本提案给该原则的 FastAPI/React 实现写法**（`typing.Protocol`、Pydantic Settings、ruff/mypy/eslint 命令）。原则 vs 栈实现，互补不重复。
- **L0 通用代码原则**（`global-rules §2.1`，已采纳）：跨形态通用项。本提案不重复 L0；其中 L0-10「import 卫生」的**具体执行口径**（顶部收敛、禁文件中部追加）在本 FastAPI Adapter 体现。
- **assessment TQG**（`docs/research/.../2026-08-10-code-quality-maintainability-assessment.md` §7）：TQG-007（多实现共享 Protocol + contract suite）→ **合并入**本提案 FastAPI Adapter（`typing.Protocol` 实现；原则层在通用补充提案）；TQG-003（CI 必跑质量命令）的 FastAPI/React 具体命令（ruff/mypy/eslint/tsc）→ 本 Adapter 体现，元规则在通用补充。

**本提案不重复它们**：Web Profile 有形态契约、通用补充有跨形态原则、L0 有通用基线；缺一份「FastAPI/React 栈具体写法」Adapter。差异化：新建 `stack-adapters/` 补 R5 起步内容。

## 1.2 与 governance R1-R7 上位框架的关系

本提案对应 governance **R5 技术栈 Adapter**，目标载体 `template-docs/stack-adapters/`（**新建**，governance §9.1 行 702）。governance §4.5 给出 Adapter 应包含的 7 项（推荐目录与依赖方向 / 语言命名类型异常约定 / 框架边界类型与 helper / formatter-lint-type-test-build 命令 / 危险默认值与禁止模式 / 最小好/坏代码示例 / 版本兼容范围）与上层原则→三栈映射矩阵（§4.5 行 418-424）。本提案先落「少量起步 Adapter」，按 §11.3 从 Python+FastAPI、TypeScript+React 起步（PostgreSQL Adapter 留后续）。

每条按 governance §1.2 试金石归位：**换栈（Spring/Express/Vue）即失效**才入本提案（换栈仍成立者归 R1/R2 通用层或 R3 Web Profile）。

三套规则清单去重对照见 `docs/research/2026-08-10-rule-consolidation-map.md`。

## 2. 拟改（新建 `template-docs/stack-adapters/`）

新建目录，先放 README 选择矩阵 + 两份起步 Adapter。**不引入硬 CI 门禁**（Adapter 是栈写法参考，CI 门元规则在通用补充提案 R2）；**不重复 R1-R4 原则**（只说在该栈怎么做到）。

### 2.0 `stack-adapters/README.md`（选择矩阵 + 索引）

- 说明 R5 Adapter 定位（governance §4.5：翻译上层原则到具体栈，不重复「为什么」）。
- **上层原则 → 三栈映射矩阵**（直接引用 governance §4.5 行 418-424，不重抄）：领域层不依赖传输框架 / 契约单一事实源 / 错误结构化 / 自动验证 / 事务明确 → 各自的 FastAPI·Python、React·TypeScript、PostgreSQL 口径。
- 索引：`fastapi-python.md`、`react-typescript.md`（本提案落）；`postgresql.md`（后续）。

### 2.1 `stack-adapters/fastapi-python.md`（FastAPI / Python Adapter）

从原 §9 抽出的 FastAPI/Python 具体写法：

- **service 禁 import web 框架**：`service/` 层不得 `from fastapi import HTTPException / Request / Response`；业务层抛领域异常（继承项目 `ApiError` 基类），api 层统一转 `HTTPException(detail={"code":...,})`。web 适配依赖（`Depends`）放 api 层；历史破例须显式标注 `# web adapter`。（原 §9.2；§9 独有）
- **集中 `code→HTTP` 映射**：`code→HTTP` 映射全局唯一（单一函数或 `ErrorCode` Enum 属性 + `CODE_TO_HTTP` 反向映射），禁止每个 api 文件各维护一份映射表。（原 §9.1；§9 独有）
- **envelope helper**：成功响应走单一 helper（如 `ok(data)`），禁止每个端点 inline `{"code":0,"msg":"ok",...}`。（原 §9.1；§9 独有）
- **批量装配循环化**：router / 路由注册用列表 + 循环，禁止逐个 `if router is not None: include_router(...)` 累加；新增 router 只改列表一行。（原 §9.2；§9 独有）
- **Repository Protocol 实现**：多实现（demo / 真实）用 `typing.Protocol` + `@runtime_checkable` 显式声明接口对齐，双实现继承同一 Protocol；配 contract test（`inspect` 取方法面，守护双实现零漂移）。**原则层**（多实现须显式契约）在通用补充提案 R1；本条给 Python 写法。（原 §9.2；合并 TQG-007）
- **service 参数类型化**：service 函数的 `repository` / 依赖形参必须有类型注解（指向上面的 Protocol，如 `repository: RepositoryProtocol`），禁止裸参数。（原 §9.3；§9 独有）
- **配置集中 + 启动校验**：env 读取集中在单一 Pydantic `Settings` 模块（`backend/config.py`），禁止各模块裸 `os.environ.get`；关键 secret（token 签名密钥等）启动期校验——缺失或为默认值即启动失败。**原则层**（secret 非弱默认）在通用补充提案 R1；本条给 FastAPI/Pydantic 写法。（原 §9.4；§9 独有）
- **import 卫生执行**：一个文件的 import 统一收敛顶部；历史段落拼接产生的新 import 块必须收敛回顶部，禁文件中部追加（AI 追加式编码典型痕迹）。口径：ruff `F401`（未用 import）+ review。（对应 L0-10 的 FastAPI 执行口径）

> Adapter 另可按 governance §4.5 的 7 项补：推荐目录（api/service/repository/model 四层）、formatter/lint/type/test 命令（ruff/mypy/pytest）、最小好/坏代码示例、版本兼容范围——本提案先落上述从 §9 抽出的条目，其余由模板维护者按 §4.5 逐步补全。

### 2.2 `stack-adapters/react-typescript.md`（React / TypeScript Adapter）

从原 §9 抽出的 React/TS 具体写法：

- **禁 `any` + 泛型贯穿 + `ReturnType` 跨层**：前端禁 `any`，泛型从 API 客户端一路传到组件；跨层 props 用 `ReturnType<typeof useXxx>` 导出，不手写重复 interface；后端 schema（OpenAPI / `response_model`）作为前后端类型单一事实源，前端经 codegen 生成或基线比对。**形态契约**（单源类型）在 Web Profile 提案 R3；本条给 React/TS 写法。（原 §9.3；§9 独有）

> Adapter 另可按 governance §4.5 补：ESLint/tsc/Vitest/Playwright 命令、命名约定（组件 PascalCase、hook `use*`）、最小好/坏示例——本提案先落上述从 §9 抽出的条目。

## 3. 版本

模板版本：下一 **MINOR**。新建 `template-docs/stack-adapters/`（README + `fastapi-python.md` + `react-typescript.md`，纯文本规范，无新可执行脚本、无 CI 强制——Adapter 自述为栈写法参考）。不触碰任何现有 profile / global-rules / project-rules；不新增 Gate。

## 4. 影响

- **改动文件**：新建 `template-docs/stack-adapters/README.md`、`template-docs/stack-adapters/fastapi-python.md`、`template-docs/stack-adapters/react-typescript.md`。
- **不触碰**：`web-fullstack-profile.md`（R3，Web Profile 提案另改）；`global-rules §2 / §2.1`（L0）；`implementation-lifecycle-rules.md`（R1/R2，通用补充提案另改）；WSG-001~006。
- **预期效果**：FastAPI / React 项目在「栈具体写法」有可对齐 Adapter，新项目不再各写各的 service 装配 / 错误映射 / 类型注解；与 Web Profile（形态契约）+ 通用补充（跨形态原则）+ L0（通用基线）构成完整 R1-R5 分层。
- **回测口径**：采纳后，新 FastAPI/React 派生项目的 service 分层 / 集中映射 / Protocol / 类型注解 / Settings 应对照 Adapter；现有派生项目（如 LUMEN）可对照标注「已落地 / 待对齐」（LUMEN 多数已由 CQ-P1-002/005 落地）。

## 5. 备选（已评估未采）

- **把栈写法留在 Web Profile 文档**：governance §8.3 明确要求「FastAPI / React 示例放进 Adapter」，不得留在 Web 文档（否则 Spring/Express 项目无法复用上层契约）。否决。
- **一次铺满 governance §4.5 的 7 项**：§9.1 说「先放选择矩阵与少量 Adapter」；本提案先落从 §9 抽出的起步条目 + 选择矩阵，7 项其余由模板维护者按 §4.5 逐步补，避免一次铺满空壳。否决一次铺满。
- **把原则层（secret 校验、多实现契约）也写进 Adapter**：原则换栈仍成立（属 R1），Adapter 只给栈实现；原则在通用补充提案。否决混层。
- **设为硬 CI 门禁**：Adapter 是栈写法参考，CI 门元规则（test+type+lint）在通用补充提案 R2，具体命令由派生项目按 Adapter 自建。否决模板层硬门禁。

## 6. 后续

- 本提案在派生项目 `_proposals/` 起草；与 R1/R2（通用补充）、R3（Web Profile）提案同批成熟后，经 `ai/commands/submit-proposal.md` 跨仓开 issue 回流 `emily8421/ai-project-template`。
- 模板维护者处理时按 `global-rules §9` 流程：读全部 `TEMPLATE-UPGRADE-*.md` → 去重 / 冲突 / 依赖分析（注意 Protocol / secret / 单源类型与通用补充、Web Profile 提案的原则/实现配合，consolidation-map §5 建议按 R1-R7 统一回流）→ 新建 `stack-adapters/` → PR 落地。
- 后续可补 `postgresql.md`（PostgreSQL Adapter：schema migration 为 DB 契约源 / SQLSTATE 转领域错误 / 单一事务所有者，见 governance §4.5 映射矩阵）。
- 派生项目侧实证：LUMEN CQ-P1-002（RepositoryProtocol）+ CQ-P1-005（错误契约）已落地本 Adapter 多数条目，作为实证样本。
- 合并并下行同步后，本提案移入 `_archive/proposals/`。
