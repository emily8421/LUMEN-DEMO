# LUMEN 后端 mypy B1 引入前现状评估（2026-08-12）

> 定位：**后端类型检查静态现状只读评估 · 方案设计实证依据 · 待人工确认治理范围**。
> 本文记录 LUMEN 后端在引入 mypy 到 CI（governance P1 子项「mypy B1」/ CQ-P1-002 Slice C 收益兑现前提）前的代码规模、类型注解覆盖度、工具链现状与首次实跑基线，为后续 mypy 配置 / CI 接入 / Slice B 清零方案提供量化实证。
> 本文不是新的产品需求、已批准实施方案或验收记录，不替代 `docs/04-architecture.md`、`docs/05-tech-spec.md`、`docs/08-dev-plan.md`、`docs/09-verification.md`。文中候选方案与建议在人工确认并进入 Sprint / Task 前，不视为已批准实施。
> 上位依据：`ai/project-rules.md §1` 维护态批8（CQ-P1-002 Slice C 闭环时登记「后续候选：引入 mypy/pyright 到 CI（Slice C 收益兑现前提，另立议题）」）+ `docs/research/2026-08-10-code-governance-rollout-plan.md` §4 轨道3。本文为该 P1 子项的落地前现状评估 + 首跑基线。

## 0. 元数据与评估边界

| 项 | 值 |
|---|---|
| 评估日期 | 2026-08-12 |
| 代码基线 | `main` @ `c4e0894`（= origin/main，工作区 clean） |
| 项目版本 | `v3.8.10` |
| mypy 版本 | `2.3.0`（compiled: yes，本地 .venv 实测；支持 `--python-version 3.14`） |
| 评估对象 | `backend/**/*.py`（55 源文件）、`backend/requirements*.txt`、`.github/workflows/project-check.yml` |
| 主要目标 | 摸清引入 mypy 前的注解覆盖度 / 工具链现状 / 首跑真实基线与分类，为方案设计（mypy 配置严格度、advisory vs required、Slice B 清零策略）提供实证 |
| 不在范围 | 前端类型检查（已由 eslint + `tsc -b` 覆盖）、pyright（选型已定 mypy，另议）、strict 全量开启（Slice C 远期 ratchet）、真实运行时行为变更 |
| 验证性质 | 静态源码审查 + Explore agent 覆盖度抽样 + `mypy --python-version 3.14 backend` 首跑实测量化 |

### 0.1 为什么需要本次评估

CQ-P1-002 Slice C（v3.8.5，PR #140）给 17 个 service 文件 ~80 个 `repository` 参数加了 `: RepositoryProtocol` 注解，但项目**无类型检查器**——`backend-lint` 只跑 ruff（E4/E7/E9/F，不查类型），CI 不守护类型。注解收益**当前只在 IDE**，「CI 抓越界 / None 流转」需先引入类型检查器。这是维护态批8 起反复登记的「另立议题」，现作为 governance rollout §4 轨道3 的后续 P1 子项推进。

引入前先做现状评估 + 首跑基线，回答：

1. 后端注解覆盖度多高，mypy 引入后存量债预计多大（决定 advisory 过渡期长度与 Slice B 清零成本）；
2. 现有工具链（ruff）已覆盖什么，mypy 应补什么、避免与 ruff/tsc（前端）重复；
3. 基线错误的结构性来源是什么，能否机械收口（决定 Slice A advisory 起步 → Slice B 清零升 required 的可行性）；
4. mypy 是否能在 ruff/tsc 抓不到的维度（None 流转、Optional 未守卫、类型契约不一致）兑现价值。

## 1. 评估方法与证据口径

### 1.1 方法

三类只读检查：

1. **注解覆盖度抽样**：Explore agent 抽样 service/api/repository/model 四层代表性文件，统计返回类型 / 参数注解 / `Any` / pydantic·ORM 模型完整度 / 动态类型模式。
2. **工具链核查**：`backend/requirements*.txt`、CI workflow 后端 job、根配置文件清单。
3. **首跑实测量化**：本地 `.venv` 装 `mypy==2.3.0`，`mypy --python-version 3.14 backend` 首跑，按 error-code 分类 + 按文件分布 + 抽样性质判定。

### 1.2 证据等级

| 等级 | 含义 | 本文使用方式 |
|---|---|---|
| E1 | 源码 / 配置 / 命令输出直接证明 | 规模、覆盖度计数、首跑 error 数与分类、依赖清单 → 可写成已确认事实 |
| E2 | 多处模式与统计共同支持 | 基线结构判断、工具链覆盖判断 |
| E3 | 基于类型系统机制推断，未做故障注入 | mypy 能抓什么、Slice B 收口可行性 |
| E4 | 候选治理建议 | Slice B 收口方式、配置选项 → 不写成已批准方案 |

### 1.3 限制

- 覆盖度比例为抽样估算（非全量逐行），但首跑基线为 mypy 全量实测（55 源文件），二者交叉印证。
- 基线为默认（非 strict）配置；strict 模式 error 数会显著上升（见 §2.3），Slice C 远期再议。
- 未跑 `mypy tests`（起步只守 backend）；tests 注解覆盖较低，扩范围另议。

## 2. 量化基线

### 2.1 注解覆盖度（Explore agent 抽样，E1/E2）

| 维度 | 数据 | 证据 |
|---|---|---|
| 源文件 | **55**（backend/ 全量：api 18 + service 18 + repository 5 + model 3 + 根 2 + `__init__` 9） | E1 |
| 函数返回类型注解 | **~98%**（708 `def` 中仅 ~15 无 `-> X`：`main.create_app` / `lifespan`、`auth_context.require_space_member`、`db.get_connection`、若干私有 helper） | E1 |
| 参数类型注解 | **>90%**（Slice C 已加 ~80 个 repository 参数；剩余缺口集中在 `memberships`×4 / `session`×3 / `_build_table` 与 `_markdown_to_pdf_story` 各 5-6 个 reportlab 参数 / `**extra`×2） | E1 |
| `Any` 使用 | **8 处 / 3 文件**（`folder.py`/`term_category.py` 的 UNSET sentinel ×6、`auth.py` 的 base64 token payload `dict[str, Any]` ×2）；**零 `-> Any`、零 `list[Any]`** | E1 |
| `type: ignore` / `cast(` / `__getattr__` | **0 / 0 / 0** | E1 |
| DTO 模型 | `model/entities.py` 为 **frozen dataclass**（非 pydantic），22 类逐字段全类型；API 层 pydantic BaseModel 字段完整 | E1 |
| ORM 模型 | `model/orm.py` 全 **SQLAlchemy 2.0 `Mapped[]` 风格**（零旧式 `Column()`）；仅 2 处裸 `Mapped[list]`（JSONB：`aliases` / `cited_chunk_ids`） | E1 |
| `RepositoryProtocol` | `@runtime_checkable Protocol`，98 方法签名，pg/demo 显式继承，contract test 守护方法面零漂移 → **类型检查器友好结构** | E1 |

**结论**：注解覆盖度远高于一般 Python 项目，无重度动态分发、无 metaclass 魔法、无既有 `type: ignore` 债。引入 mypy 的存量摩擦主要来自一个结构性惯用法（§3），而非注解缺失。

### 2.2 现有后端工具链（E1）

| 项 | 现状 |
|---|---|
| ruff | `backend-lint` job，`ruff==0.15.14`，根 `ruff.toml`，`E4/E7/E9/F`，**恒 advisory**（`continue-on-error: true`），查 `backend/ tests/backend/` |
| 类型检查 | **无**（CI 零类型门） |
| mypy / pyright | 未安装（`requirements-dev.txt` = pytest/httpx/ruff） |
| 根配置 | `ruff.toml` + `pytest.ini`（每工具独立配置，无 `pyproject.toml`） |

### 2.3 首跑基线（mypy 2.3.0 默认非 strict，`--python-version 3.14 backend`，E1）

```
Found 190 errors in 28 files (checked 55 source files)
```

**按 error-code 分类**（行末真实 code，剔除消息体内 `type[...]` 误匹配）：

| error-code | 计数 | 性质 |
|---|---|---|
| `[assignment]` | 78 | §3 optional-import stub 重赋值簇（`APIRouter = None` / `BaseModel = object` / `HTTPException = Exception` / `JSONResponse = None` 等） |
| `[misc]` | 42 | §3 同簇（`Cannot assign to a type`） |
| `[arg-type]` | 57 | 混合：api 层 45（current_space_id None 传播，§4）+ 非 api 12（真实 Optional / dataclass `replace **dict` / ContextVar.reset） |
| `[import-untyped]` | 8 | `reportlab.*` 缺 stub（`export.py`，§5 配置处理） |
| `[union-attr]` | 2 | `export.py:438/439` `re.match` 返回 `Match[str] | None` 未守卫即 `.group()` |
| `[return-value]` | 1 | `tag.py:188` 返回 `Tag | None` 但声明 `-> Tag` |
| `[index]` | 1 | `db.py:70` `tuple[Any, ...] | None` not indexable |
| `[attr-defined]` | 1 | `pg_repository.py:1162` `Result[Any]` has no attribute `rowcount`（SQLAlchemy 2.0 Result 语义） |
| 合计 | **190** | — |

**按文件分布 top 8**（E1）：`api/documents.py` 16 / `api/tags.py` 14 / `api/export.py` 14 / `api/imports.py` 11 / `service/export.py` 10 / `api/terms.py` 10 / `api/term_categories.py` 10 / `api/folders.py` 10。

**结构性结论**：`[assignment]`78 + `[misc]`42 = **120（63%）全部来自 §3 optional-import 簇**；该簇是基线主导，且为单一机械模式（19 文件同构），可批量收口。剔除该簇后，剩余 70 条为 arg-type（57）+ import-untyped（8）+ 零星（5），其中含 mypy 的真实价值捕获（§4）。

> strict 模式预估：在默认 190 基础上叠加 `disallow_untyped_defs`（~15 无返回类型）+ `disallow_any_generics`（5 裸 `list`/`dict`）+ `disallow_untyped_calls`（波及 reportlab 参数函数）+ `warn_return_any` 等，预估升至 250-350 量级。**起步不开 strict**（Slice C 远期 ratchet）。

## 3. optional-import 重赋值簇根因分析（基线主导，E1/E3）

### 3.1 模式

`backend/api/*.py`（17 文件）+ `main.py` + `service/auth_context.py` 共 ~19 文件采用同构惯用法：

```python
try:
    from fastapi import APIRouter, BaseModel, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - allows service tests before dependencies are installed
    APIRouter = None
    BaseModel = object
    HTTPException = Exception

if APIRouter is not None:
    router = APIRouter(...)
    ...
else:
    router = None
```

mypy 在 venv 内解析 `from fastapi import APIRouter` 为 `type[APIRouter]`，随后 `APIRouter = None` / `BaseModel = object` / `HTTPException = Exception` / `JSONResponse = None` 触发 `[assignment]` + `[misc]`（Cannot assign to a type），每文件 4-8 处，合计 120 条。

### 3.2 根因（E1，已确认）

源码注释明确该模式意图：**`# pragma: no cover - allows tests before dependencies are installed`**（`main.py:11`、`documents.py:32` 等一致）。即「让 service / api 层在 fastapi / pydantic 未安装时也能被 import 跑测试」的**防御性降级模式**——非死代码，是有意保留的设计。

> 现实环境（CI `backend-test` 装 `-r requirements.txt -r requirements-dev.txt`、本地 venv 均 fastapi 可用）下该 except 分支不触发，`# pragma: no cover` 亦承认其为不可达分支。但其「依赖未装可 import」的语义被保留。

### 3.3 Slice B 收口候选（E4，待 Slice B 立项决策）

根因决定 **Slice B 不能简单删 except 分支**（会破坏设计意图）。三种候选收口方式：

| 候选 | 做法 | 取舍 |
|---|---|---|
| A（推荐初判） | stub 赋值改带类型注解：`APIRouter: type[APIRouter] | None` 后再 `= None`，`BaseModel: type[BaseModel] \| type[object]` 等；保留 try/except 与降级语义 | 类型精确、语义保留；每文件 3-5 行注解，机械但需逐文件调 |
| B | 批量 `# type: ignore[assignment,misc]` | 最快；但堆 19×4-8 处 ignore 注释，与项目「零 type: ignore」现状冲突，`warn_unused_ignores` 后维护负担 |
| C | 重构为 `if TYPE_CHECKING:` 纯类型守卫 + 运行期 try/except 分离 | 最干净；但改动最大，可能触及 `router = None` 下游消费方 |

> 候选不预设批准；Slice B 立项时结合实测收口成本再定（A 与 C 均可保语义，B 仅作 fallback）。

## 4. mypy 核心价值兑现（E1/E3）

mypy 在 ruff（E4/E7/E9/F 不查类型）与前端 `tsc -b`（不覆盖后端）都抓不到的维度捕获了真实问题——这正是引入 mypy 的核心 ROI：

### 4.1 current_space_id None 传播缺口（api 层 45 条 `[arg-type]`，E1）

`TokenContext.current_space_id` 声明为 `int | None`（空间未选时可为 None），但 service 层函数参数（`list_visible_documents` / `create_document` / `update_document` / `delete_document` / `list_versions` / `restore_version` / `polish_selection` 等）声明为 `int`。mypy 在每个 api 调用点报：

```
Argument "current_space_id" to "list_visible_documents" has incompatible type "int | None"; expected "int"
```

**性质**：真实的类型契约不一致——业务上「未选空间时调用文档操作」的 None 路径未被 service 层处理。这是 None 流转类潜在缺陷，ruff 完全无法发现。`documents.py` 9 条 arg-type 全属此模式；api 层 45 条同构。

### 4.2 真实类型 bug（零星 5 + 非 api arg-type 12，E1）

| 位置 | 问题 |
|---|---|
| `service/db.py:70` | `tuple[Any, ...] \| None` not indexable（None 未守卫） |
| `service/tag.py:188` | 返回 `Tag \| None` 但签名 `-> Tag` |
| `service/export.py:438-439` | `re.match` 返回 `Match[str] \| None`，未守卫即 `.group()`（潜在 AttributeError） |
| `repository/pg_repository.py:1162` | SQLAlchemy 2.0 `Result[Any]` 无 `rowcount`（API 误用） |
| `repository/uow.py:87` | `ContextVar.reset` 传 `None`，期望 `Token[Session \| None]` |
| `repository/demo_repository.py:841/941` | `dataclasses.replace(**dict[str, object])` 解包类型不精确 |
| `service/quick_entry.py:150/178` + `pg_repository.py:599/609` | `int \| None` / `UserORM \| None` 传给期望非 None 的函数 |

这些是 Slice B 需逐个核实修复的真实类型债（部分可能是真 bug，如 export.py 的 `re.match` None 守卫缺失）。

## 5. Slice B 清零策略（E4，候选 · 待立项）

剔除 §3 簇后，Slice B 清零路径（候选，不预设批准）：

1. **§3 optional-import 收口**（120 条）：按 §3.3 候选 A/B/C 选一，19 文件机械批量。
2. **current_space_id None 传播**（45 条）：设计决策——候选 a) service 参数放宽 `int | None` + 内部 guard / b) api 层调用前 assert 非 None / c) `TokenContext.current_space_id` 收紧为 `int`（需业务确认「未选空间」是否合法状态）。涉及面广，须结合 `docs/design/accounts-auth.md` 语义定。
3. **reportlab 缺 stub**（8 条）：`mypy.ini` per-module `ignore_missing_imports`（reportlab 无官方 py.typed stubs）。
4. **真实类型 bug**（零星 5 + 非 api arg-type 12）：逐个核实修复。

预估 Slice B 清零工作量中等（§3 批量 + current_space_id 设计决策为主），可达成 `mypy backend` → 0 error 后升 required。

## 6. Slice A 配置决策（已纳入本次实施，E4 候选已拍板）

| 决策点 | 取值 | 依据 |
|---|---|---|
| 选型 | **mypy**（不引 pyright） | 工具链统一 Python；SQLAlchemy 2.0 + pydantic 2 有 stub；与 ruff 平行 |
| 起步严格度 | **默认（非 strict）** | 默认基线 190（可清）；strict 预估 250-350，Slice C 远期 ratchet |
| CI 起步 | **advisory**（`continue-on-error: true`） | 复刻 eslint B1 / ruff；基线失败不阻断 |
| 升 required | **Slice B 清零后** | 复刻 eslint B1；ruff 恒 advisory 不适用（mypy 基线可清零） |
| 检查范围 | **`mypy backend`**（不含 tests） | tests 注解覆盖低；起步只守 backend |
| 配置文件 | 根 `mypy.ini` | 与 `ruff.toml` / `pytest.ini` 风格一致 |
| mypy 版本 | `mypy>=2.3.0`（实测支持 py3.14） | 锁 `requirements-dev.txt` |

`mypy.ini` 起步（默认 + 少量 warn，不开 strict）：

```ini
[mypy]
python_version = 3.14
packages = backend
namespace_packages = True
explicit_package_bases = True
warn_unused_ignores = True
warn_redundant_casts = True
warn_unused_configs = True
# 起步不开（Slice C 远期 ratchet）：disallow_untyped_defs / disallow_any_generics / warn_return_any / disallow_untyped_calls
# reportlab 缺 stub：Slice B 加 [[tool.mypy.overrides]] module="reportlab.*" ignore_missing_imports=true
```

## 7. 落地结果与下一步

**Slice A（本次，本评估报告所属）**：
- 装 mypy 到 `requirements-dev.txt`（dev 依赖）+ 根 `mypy.ini` + CI `backend-typecheck` advisory job（复刻 `backend-lint` 结构）。
- 首跑基线 **190 errors / 28 files** 已量化（§2.3），§3 optional-import 簇根因已确认（有意保留的防御性模式，非死代码），mypy 核心价值已兑现（§4 current_space_id None 传播 + 真实类型 bug）。
- **不消任何类型错误**（Slice A 只装工具 + 配置 + advisory CI + 摸基线）；**不 bump**（advisory 未落地 required，复刻 eslint B1 Slice A #146）。
- `docs/05 §4.2.4` 加 backend-typecheck advisory 起步留痕。

**Slice B（后续单独 PR，待立项）**：
- 按 §5 清零：§3 簇收口（19 文件）+ current_space_id 设计决策（45 条）+ reportlab 配置（8 条）+ 真实 bug 修复（~17 条）→ `mypy backend` 0 error → 升 required。
- 回写：`docs/05 §4.2.4`（advisory→required）+ `docs/08` Sprint-39 + `ai/project-rules.md §1` 维护态批14 + `tasks/task-046-backend-mypy.md` + rollout plan §8.1 进度表 + bump `v3.8.11`（PATCH）三件套。

**Slice C（远期）**：mypy 默认 required 稳定后，ratchet 升 strict（`disallow_untyped_defs` 等）。独立议题。
