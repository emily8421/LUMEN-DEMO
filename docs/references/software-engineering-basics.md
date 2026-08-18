# 软件工程结构设计基础知识（目录划分依据出处）

> **定位声明**：本文是外部软件工程知识的梳理，属**外部参考、非 LUMEN 权威规格区**——不直接约束代码。约束代码的权威是 `docs/05-tech-spec.md` §4.1.0「目录划分依据」；本文是它的**出处注脚**：回答"那五条依据在软件工程学科里对应什么内容、原始论述是什么"。若本文与权威文档冲突，以权威文档为准。
> 建立日期：2026-08-18。原始文献均为公开出版物 / 经典论文，无敏感信息。

## 0. 一句话总览

`05 §4.1.0` 的五条目录划分依据，来自软件工程"结构设计"领域的**四条知识线**：

```text
模块化分解线（#1 部署边界、#3 特性纵切）
  Parnas 1972 信息隐藏 → Yourdon & Constantine 1979 内聚耦合度量 → Martin 2000s CCP
架构模式线（#2 架构分层）
  Dijkstra 1968 分层观念 → OSI 模型 → POSA Layers 模式 → Django MTV / Clean Architecture
设计规约线（#4 契约单源）
  Meyer 1986/1997 契约式设计 → contract-first / OpenAPI 生态 → SSOT 原则
配置管理线（#5 生命周期分离）
  IEEE 828 配置管理思想 → CI/CD 制品即代码文化
```

## 1. 五条依据 × 学科出处详表

### 依据 #1 部署 / 运行时边界

| 项 | 内容 |
|---|---|
| 学科线 | 模块化分解 → 部署单元 |
| 原始文献 | Parnas, D. L. 《On the Criteria To Be Used in Decomposing Systems into Modules》(1972, CACM)；软件架构学中的部署视图（SEI 视图模型） |
| 核心论述 | 划分模块的第一标准不是"功能像不像"，而是**变更的秘密藏在哪里**——预计因同一原因变化、且需一同构建交付的代码，划进同一单元 |
| 大白话 | 生铁和棉花不装一个箱：构建产物（镜像）、技术栈（语言/运行时）、发布节奏（谁先上线）不同的代码，顶层就分开 |
| LUMEN 落点 | `backend/`（Python 镜像）与 `frontend/`（Node 构建 + nginx 镜像）分立；`docker/` 编排独立——见 `05 §4.1.0` 映射表第 1 行 |

### 依据 #2 架构分层

| 项 | 内容 |
|---|---|
| 学科线 | 架构模式——Layers（分层） |
| 原始文献 | Dijkstra 1968 "THE" 系统的分层观念；OSI 七层模型（ISO 7498, 1984）；Buschmann et al. 《Pattern-Oriented Software Architecture》(1996) Layers 模式 |
| 核心论述 | 每层只服务上一层、只依赖下一层，依赖单向向下；传输（HTTP 进出）、业务规则、数据访问、领域模型各自独立，上层可替换实现对下层无感 |
| 大白话 | 公司分前台接待、干活的人、管仓库的、物品清单：客户只见接待，接待不见货架。改接待流程不用动仓库 |
| LUMEN 落点 | 后端 `api → service → repository → model` 四层（`05 §4.2` 分层与装配基线）；service 不 import fastapi 是"依赖单向向下"的机械化体现 |

### 依据 #3 业务特性纵切

| 项 | 内容 |
|---|---|
| 学科线 | 模块化分解 → 高内聚低耦合 |
| 原始文献 | Yourdon & Constantine 《Structured Design》(1979)——cohesion / coupling 可度量准则；Robert C. Martin 的 Common Closure Principle（CCP，2000s，《Agile Software Development》）；feature-sliced design 为其前端具体化 |
| 核心论述 | **内聚**（模块内元素关联度）要高，**耦合**（模块间依赖度）要低；CCP：为同一原因变更的类，聚进同一个包——"改一个功能只动一个包" |
| 大白话 | 按功能切抽屉而非按材料切：袜子一个抽屉、内衣一个抽屉（纵切），而不是"棉制品一个抽屉、白色衣物一个抽屉"（横切——找一套衣服要翻全部抽屉） |
| LUMEN 落点 | `frontend/src/features/*`（terms / timeline / import / local-mount…按功能聚合）；`web-fullstack-profile §4` "features/ 业务功能纵切" |

### 依据 #4 契约单源

| 项 | 内容 |
|---|---|
| 学科线 | 设计规约——契约式设计（DbC）+ 单一事实源（SSOT） |
| 原始文献 | Meyer, B. 《Object-Oriented Software Construction》(1986 首版 / 1997 二版)——precondition / postcondition / invariant；OpenAPI / contract-first 生态（2010s）；SSOT 为信息工程一般原则 |
| 核心论述 | 调用方与被调方各自的权利义务要**前置声明、集中一处、机器可验证**（前置条件=调用方义务，后置条件=被调方承诺），不靠口头约定；同一事实（接口结构）全系统只在一处定义，其余全部派生 |
| 大白话 | 租房合同：房东承诺房子什么样、租客承诺怎么用，白纸黑字一份，双方手里的是同一份的复印件——谁私自改了，验合同（CI 检查）就露馅 |
| LUMEN 落点 | `openapi/openapi.json` 契约唯一手写源；`frontend/src/api/generated.ts` 派生；CI schema-diff / codegen drift = 违约探测器（`05 §4.2` 类型与契约同步基线） |

### 依据 #5 开发生命周期分离

| 项 | 内容 |
|---|---|
| 学科线 | 配置管理 / 软件生命周期 |
| 原始文献 | IEEE 828 配置管理标准思想（不同变更来源的制品分开标识与控制）；CI/CD "everything as code" 文化（2010s DevOps 运动） |
| 核心论述 | 源码、测试、构建产物、工具脚本的**变更原因与受众不同**（开发者 / CI / 运维 / 所有协作者），混放会导致变更责任不清、失效影响面无法评估 |
| 大白话 | 食材、成品、菜谱、账本不放一个柜子：坏一批食材不用重写菜谱，改菜谱不等于动账本 |
| LUMEN 落点 | `tests/`（pytest）与 `scripts/smoke-*`（冒烟）分置；`frontend/dist/` 构建产物不手改；`scripts/` 工具链独立 |

## 2. 术语小词典（大白话）

| 术语 | 大白话解释 | 出身 |
|---|---|---|
| 契约（contract） | 双方对接口结构（路径/参数/返回/错误码）的书面约定；谁擅自改谁"违约" | DbC，Meyer 1986 |
| 前置/后置条件 | 前置=调用前你必须满足什么（义务）；后置=被调方保证返回什么（承诺） | DbC |
| 分层（layers） | 代码按职责叠楼：每层只跟上下层说话，不跨层喊话 | 架构模式 |
| 纵切（vertical slice） | 按业务功能从 UI 到数据整条切一块，而不是按技术角色横着切 | CCP / feature-sliced |
| 内聚 / 耦合 | 内聚=一个模块内部"齐心程度"；耦合=模块之间"纠缠程度"。要内聚高、耦合低 | Yourdon & Constantine 1979 |
| 信息隐藏 | 模块内部怎么实现是它的秘密，外界只看承诺的接口——秘密可换，接口不动 | Parnas 1972 |
| CCP（同闭包原则） | 为同一原因变更的东西放同一个包——改动集中一处 | Martin 2000s |
| SSOT（单一事实源） | 同一事实全系统只在一处定义，其他全是引用或派生，防止"两份记忆打架" | 信息工程通用原则 |
| 部署单元 | 能独立构建、发布、运行的最小代码集合（一个镜像 / 一个进程） | 软件架构学 |
| IaC（基础设施即代码） | 部署拓扑（compose 编排等）也当代码管理：进版本库、可 review、可重放 | DevOps 运动 |

## 3. 与 LUMEN 权威文档的关系

```text
本文（references，外部知识梳理）
  └─ 出处注脚 → docs/05-tech-spec.md §4.1.0（权威：五条依据 + 目录映射，约束代码）
                  ├─ 术语「契约」注解亦在 05 §4.1.0 尾部
                  └─ 模板回流提案 _proposals/TEMPLATE-UPGRADE-directory-partition-principles.md
```

按 `docs/references/00-index.md` §2 使用边界：本文可解释设计出处，但采纳任何新规则仍须先经 `docs/research/` 评审或 `docs/decisions/` 裁决，再回填 `00-09` / `design/*`。

## 4. 风险与校对状态

- 原始文献年份与论著名凭公开常识整理，**未逐篇复核原文页码**；正式论文级引用前需人工校对（同目录其他参考的口径一致）。
- "大白话"列是助记类比，不是原文翻译；与原文有出入时以原始文献为准。
