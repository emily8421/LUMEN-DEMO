# Tech Env Evaluation：RG-010 FileSystemObserver 浏览器可用性（2026-08-06）

> 评估报告留痕，不替代 `docs/env/local-env.md` / `docs/05-tech-spec.md` / `docs/09-verification.md`。

## 1. 评估摘要

- 范围：REQ-018 模式 B 增强「本地挂载自动监听」（TC-P2-VAULT-003）的前置浏览器可用性门禁。
- 目标：判断 `FileSystemObserver`（文件系统变化自动监听）在本机目标浏览器是否可用。
- 结论：**Go（2026-08-06）**——目标浏览器 Edge 139 默认可用、无需 flag；TC-P2-VAULT-003 可进入 Wave 3 立项（实现自动重扫 + 保留手动重扫兜底）。
- 是否阻塞：不阻塞当前 Wave 1 / Wave 2；解锁 TC-P2-VAULT-003 立项。

## 2. 评估范围与依据

- 读取：`docs/05-tech-spec.md` §5.1（RG 表）、`docs/09-verification.md`（TC-P2-VAULT-003 / §6）、`docs/research/2026-08-05-rg009-vault-local-mount-poc.md`（⑦ 文件变更同步留增强项）、`.ai/session-handoff.md`、`ai/prompts/review/20-tech-env-evaluation.md`。
- 未读取 / 不适用：`docs/env/local-env.md` 未记录浏览器版本（本次实测补充本机事实）；无新增依赖 / 后端 / DB 影响。

## 3. 本机环境事实

- 浏览器：仅 Edge `139.0.3405.86`（`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`）；本机未安装 Chrome。
- 前端：demo 运行于 `http://localhost:5173`（secure context，可访问 File System Access / OPFS）。

## 4. 技术路线候选与决策

- 候选：`FileSystemObserver`（Chromium 系实验性 API）实现本地挂载自动监听。
- 推荐：**Go**——Edge 139 默认暴露 `window.FileSystemObserver`；与现有 FSA 挂载（picker 句柄 / OPFS 句柄同为 `FileSystemDirectoryHandle`）接口契约一致；Chrome 同 Blink 内核可预期一致。
- 备选（若 No-Go）：保留手动重扫 + 增加扫描入口 / 提示增强。

## 5. 验证证据（headless Edge 139 CDP 实测，2026-08-06）

| 检查项 | 结果 |
|---|---|
| `typeof window.FileSystemObserver` | `function`（默认可用；`--enable-features=FileSystemObserver` 对照结果一致） |
| `new FileSystemObserver(cb)` 构造 | 成功 |
| `navigator.storage.getDirectory()`（OPFS 句柄） | 成功 |
| `observer.observe(opfsDir, { recursive: false })` | 成功 |
| 写入 + 删除探针文件后回调 | 触发 2 次（自动变更通知生效） |
| `showDirectoryPicker` / `navigator.storage` | 均在（File System Access 基线完整） |

## 6. 风险项与降级策略

| Risk-ID | 风险 | 影响 | 建议 |
|---|---|---|---|
| RG-010-N1 | 实测使用 OPFS 句柄；真实用户 picker 句柄场景待功能实现时复测 | 低（接口契约一致） | Wave 3 立项时用真实挂载目录 smoke 复测 |
| RG-010-N2 | 观察期随页面会话存活，刷新 / 关闭后丢失 | 与当前单会话挂载模型一致 | 保持手动重扫兜底 |
| RG-010-N3 | Firefox / Safari 未验证；非 Chromium 系可能不支持 | demo 目标为 Chrome / Edge，不阻塞 | 记录边界；不做目标 |

## 7. Readiness gate 结论

- RG-010：**Go（2026-08-06）**。进入标准（API 存在 + 可观察 + 变更回调）+ 必需证据（§5 CDP 实测）已满足。
- 回填：`docs/05-tech-spec.md` §5.1 RG-010 行；`docs/09-verification.md` TC-P2-VAULT-003 状态 / §6 风险；`.ai/session-handoff.md` Wave 1 收口。

## 8. 待人工确认项

| ID | 待确认项 | AI 建议 | 依据 | 备选 | 取舍 / 阻塞 |
|---|---|---|---|---|---|
| RG-010-C1 | 是否按 Go 结论将 TC-P2-VAULT-003 排入 Wave 3 立项 | 是（与跨设备 vault 元数据同批或其后） | 实测 Go + 手动重扫兜底 | 暂不立项 | 不阻塞 Wave 1 / 2 |
