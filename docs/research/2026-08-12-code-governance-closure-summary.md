# LUMEN 工程治理系列收尾总结（v3.8.0 → v3.8.6）

> 定位：**阶段收尾复盘记录 / 研究总结**。归纳 2026-08-11 ~ 08-12 的 P0/P1 工程治理系列（test DB guard + CI 门 + CQ-P1-005/002/003 三项收口），回答「原先什么问题、改了什么、收益 / 代码优化程度、遗留什么」。不替代实施路线或诊断；事实以 `docs/08-dev-plan.md` Sprint-31~34、`docs/09-verification.md` 验收记录、`CHANGELOG.md` v3.8.0~v3.8.6 为准。
>
> 上位依据：`docs/research/2026-08-10-code-governance-rollout-plan.md`（实施路线，PR #123）；`docs/research/2026-08-10-code-quality-maintainability-assessment.md`（诊断 CQ-P0/P1/P2）；`docs/05-tech-spec.md §4.2`（代码层一致性基线 / 债清单）。

## 1. 总览

治理范围：P0 止血（测试安全 + CI 门）→ P1 三项（错误契约 / repository 契约 / 事务边界），全部为**非功能改动**——不改 Phase、不改对外 API 语义 / DB / 依赖，用户可见功能零变化。

| 维度 | 数值 |
|---|---|
| 版本跨度 | v3.8.0 → v3.8.6（6 个 PATCH，聚合 bump） |
| 治理 PR | 20 个（#124 ~ #143，含回写） |
| 提交数 | 45（区间 `273bf14..HEAD`，含提案回流） |
| 净改动 | **+3056 / −1269 ≈ 4325 行** |
| 默认测试保护 | 286 → **306**（+20 回归用例） |
| lint 旧债基线 | 41 → **37**（F841×15 / E402×11 / F401×10 / F811×1），此后新代码零新增 |
| 隐藏 bug 修出 | 3 个（multipart 漏声明 / llm_adapter env 大小写 / create_import_job pending-id） |

## 2. 治理前的问题（归纳为四类）

1. **测试无保护（P0）**：PG 集成测试与开发库共用，误清数据无保险；CI 零代码门，提交破坏不拦；测试 unit/PG 混放、无分层标记。
2. **错误契约混乱（CQ-P1-005）**：`code` 字段业务码 / HTTP 码混用；码→HTTP 映射散落 4 份；错误 `msg` 用 `str(exc)` 直传泄露内部细节；前端靠文案匹配判断认证失效（脆）；兜底 5xx 不带统一 envelope。
3. **repository 无契约（CQ-P1-002）**：PG / demo 双实现靠鸭子类型硬凑，单侧静默缺方法无保护；service 层 `repository` 参数无类型信息，IDE 补全 / 越界提示缺失。
4. **事务边界缺失（CQ-P1-003）**：一个业务操作的多步写库各自 commit，中间失败留半截子数据；导入任务记录 / 失败标记可能被回滚抹掉。

## 3. 四个任务组：问题 → 改动 → 收益

### 3.1 P0 止血：测试安全 + CI 闸门（Sprint-31 · v3.8.0 · PR #124）

**问题**：见 §2 第 1 类。

**改动**：
- P0-1 测试库隔离 guard（NFR-005）：独立 `lumen_test` 库 + 三重 fail-closed 条件（`LUMEN_ENV=test` / 库名 `_test` 结尾 / `ALLOW_DESTRUCTIVE_TEST_DB=1`），任一不满足抛 `UnsafeTestDatabaseError`，**不降级 skip**；4 个 PG 测试面接入。
- P0-2 CI 最小门（NFR-006）：`backend-test` / `frontend-build` 必过（required）+ `backend-lint` 提示（advisory）+ `project-check`（版本 / CHANGELOG 一致性）；根 `ruff.toml` + dev 依赖锁版。
- CI 首跑修 2 潜伏 bug（`python-multipart` 漏声明 / `llm_adapter` env key 大小写，后者影响 Linux 部署 LLM 多通道）。

**收益**：破坏性测试有保险；PR 破坏功能 / 前端编译不过 / 版本号不一致一律合并不了——后续所有治理能安全推进的前提。

### 3.2 CQ-P1-005 错误契约收口（Sprint-32 · v3.8.1 ~ v3.8.4 · PR #125-138）

**问题**：见 §2 第 2 类。

**改动**（Slice A + B-1..B-6 + C）：
- Slice A 地基：`ErrorCode` IntEnum + 唯一 `code→HTTP` 映射 + `ApiError` 基类 + `main.py` 双 handler（ApiError + 兜底 5xx envelope）+ 禁 `str(exc)`。
- Slice B：**~35 个领域异常**迁移继承 `ApiError`；api 层**删 ~60 处**重复 `except` 转换；散落 `_status_for` 收口为单一映射；`main.py` HTTPException else 分支 `HTTP_TO_CODE` 反向映射消除 code 二义。
- Slice C 前端：`client.ts` 新增 `ApiError`（保留 code+status）；`session-store` 删文案正则，改 `code===4001` 判认证失效。

**收益**：错误返回统一、单一事实源；内部细节不外泄；前端判断从脆弱文案匹配变稳定契约。**量化**：重复异常转换 −60 处、映射 4→1、异常体系 35+ 统一继承。

### 3.3 CQ-P1-002 repository 契约化（Sprint-33 · v3.8.5 · PR #139-140）

**问题**：见 §2 第 3 类。

**改动**：
- Slice A：`RepositoryProtocol`（typing.Protocol + @runtime_checkable），**98 方法机器提取**自 PgRepository；pg / demo 显式继承；contract test 4 测试守护双实现方法面零漂移。
- Slice C：17 个 service 文件 **~80 个** `repository` 参数加 `: RepositoryProtocol` 注解；`timeline`/`search` 动态 getattr 死兜底收口为直接调用。
- Slice B（按域拆 god object）：评估后**搁置**（service 平均跨 3-4 域、DemoRepository 已抵消 mock 痛点、无类型检查器 CI → ROI 不足）。

**收益**：双实现一致性机器守护（不再靠人眼对方法名）；service 层恢复类型信息（IDE 补全 / 跳转 / 越界提示）。**诚实声明**：项目暂无 mypy/pyright，CI 不守护类型，当前收益在 IDE 层；要 CI 自动抓「用错方法」需先引入类型检查器（留候选）。

### 3.4 CQ-P1-003 事务边界 UoW（Sprint-34 · v3.8.6 · PR #141-143）

**问题**：见 §2 第 4 类。

**改动**（三 slice）：
- Slice A 地基：`backend/repository/uow.py`（contextvar 感知 `_session_scope` 收口 commit + `UnitOfWork`/`DemoUnitOfWork` 双实现 + `unit_of_work` 工厂按 is_demo 分流 + 契约）；pg_repository **96 处** `with SessionLocal()`→`_session_scope()`、**删 50 处** `session.commit()`。
- Slice B service 包：`document.py` create/update/restore 三函数写步包 `with unit_of_work(repository):`；`imports.py` 主流程原子事务，`create_import_job`/`fail_import_job` **事务外独立提交**（失败标记不随 rollback 抹掉、不掩盖原异常），删 :108 重复 `replace_document_chunks`。
- Slice C 验证 + 修复：`test_uow_rollback.py`（integration，patch `replace_document_wikilinks` 注入 RuntimeError）验证主事务真正回滚 + import_job 不残留 done；**修复 `create_import_job` pending-id 缺陷**（读 id 前显式 `flush`）。

**收益**：数据一致性——出错不留半截子数据、失败标记可靠；顺手修 1 个隐藏 bug；识别 7 个存量债。

## 4. 收益 / 代码优化程度（量化汇总）

| 维度 | 治理前 | 治理后 |
|---|---|---|
| CI 代码门 | 零（无保护） | 3 道闸门（测试 / 构建必过 + 版本校验） |
| 破坏性测试库保险 | 无（误清风险） | 三重 fail-closed guard + 独立 `lumen_test` |
| 错误码映射 | 4 份散落 | 1 份唯一 |
| 重复异常转换 | ~60 处 | 删除收口 |
| 领域异常体系 | 各写各的 | 35+ 统一继承 `ApiError` |
| repository 契约 | 无（鸭子类型） | 98 方法机器守护 + 双实现 contract test |
| service 类型信息 | 80+ 函数裸参 | 全部 `: RepositoryProtocol` 注解 |
| 手工会话 / 提交管理 | 96 处 / 50 处 | 统一入口收口 |
| 默认测试保护 | 286 个 | 306 个（+20 回归用例） |
| lint 旧债 | 基线 41 | 37，新代码零新增（ratchet 纪律） |
| 隐藏 bug 修出 | — | 3 个（multipart / env 大小写 / pending-id） |

## 5. 顺手修出的隐藏 bug 与遗留债

**已修（3 个）**：
1. `python-multipart` 漏声明（CI 首跑暴露）
2. `llm_adapter` env key 大小写（Linux case-sensitive，影响 LLM 多通道）
3. `create_import_job` pending-id：`_to_import` 在 commit 前读主键 → `ImportJob.id=None` → 真实 PG 下导入必崩（Slice C 暴露并修复）

**遗留债**：
- **7 个存量 PG integration 失败**（此前被默认 `not integration` 跳过、从未全量跑）：`create_term` 等 pending-id 类（与 #3 同类，系统性风险，建议优先）、datetime `isoformat` 序列化、LLM mock 环境。已登记 `docs/05-tech-spec.md §4.2.4`，待单独立项整治。
- ruff 37 旧债（ratchet 逐步）、eslint B1、引入 mypy/pyright 到 CI（Slice C 收益兑现前提）、模板同步 v1.61.0 / web-fullstack 提案回流（#332/#333/#334）等后续 P1 候选。

## 6. 一句话总结

**这波工程治理 = 从「没人拦、各写各的、出错留半截子数据」进化到「CI 有闸门、契约有机器守护、多步写有事务兜底、错误返回有唯一口径」**——功能没变，代码从「能跑」走向「可靠 + 可维护」，过程中还顺手修出 3 个潜伏 bug。
