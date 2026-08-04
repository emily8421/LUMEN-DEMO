# RG-006 PDF 导出技术环境评估（中文样例）

| 项 | 内容 |
|---|---|
| 评估日期 | 2026-08-04 |
| 范围 | Phase1.5B REQ-027 / Sprint-18 单文档 PDF 导出依赖门禁 |
| 结论 | **Go** |
| 推荐路线 | `reportlab` 生成 PDF；Windows 中文字体嵌入；`pdftoppm` 渲染；`pdfplumber` / `pypdf` 做验证 |
| 评估当时边界 | 本报告只证明依赖和中文样例可行，不单独证明 API-019 / 产品级 PDF 导出完成 |
| 后续状态 | Sprint-18 已在同日完成 API-019 / TC-P1-017；当前事实以 `docs/08-dev-plan.md` 与 `docs/09-verification.md` 为准 |

## 1. 评估摘要

RG-006 已满足进入 Sprint-18 编码的前置条件：当前 Windows + Python 3.14.3 环境可以安装并导入 PDF 依赖，能用 ReportLab 生成含中文正文、表格、页眉页脚、分页的 PDF，并能用 Poppler 渲染为 PNG、用 pdfplumber 抽取关键中文文本。

最关键依据：
- Python 运行时：`.venv` Python 3.14.3。
- PDF 依赖安装成功：`reportlab==5.0.0`、`pypdf==6.14.2`、`pdfplumber==0.11.10`、`pillow==12.3.0`。
- 渲染工具可用：`pdftoppm` / `pdfinfo` 来自 TeX Live。
- 中文字体可用：`C:\Windows\Fonts\simhei.ttf`、`msyh.ttc`、`simsun.ttc`。
- 中文样例 smoke 通过：2 页 PDF，关键中文文本抽取命中，渲染 PNG 非空，人工视觉检查无乱码、黑块、重叠或明显裁切。

## 2. 评估范围与依据

读取依据：
- `ai/index.md`、`ai/rules-core.md`、`ai/project-rules.md`
- `ai/prompts/review/20-tech-env-evaluation.md`
- `docs/05-tech-spec.md` TCD-009 / RG-006
- `docs/07-api-spec.md` API-019
- `docs/08-dev-plan.md` Sprint-18
- `docs/09-verification.md` TC-P1-017 / RISK-P1-006
- `docs/design/export-delivery.md` Flow-008 / DEV-EXP-002
- `backend/requirements.txt`

本报告是技术环境留痕，不替代 `docs/05-tech-spec.md`、`docs/09-verification.md` 或 API 实现。

## 3. 本机环境事实

| 项 | 结果 |
|---|---|
| Python | 3.14.3 |
| PDF 生成库 | ReportLab 5.0.0 安装 / 导入通过 |
| PDF 检查库 | pypdf 6.14.2、pdfplumber 0.11.10 安装 / 导入通过 |
| PNG 检查 | Pillow 12.3.0 安装 / 导入通过 |
| Poppler 工具 | `pdftoppm`、`pdfinfo` 可用 |
| 中文字体 | `C:\Windows\Fonts\simhei.ttf` 用于本次样例；微软雅黑 / 宋体也存在 |
| 网络 / 权限 | 安装依赖需联网；已通过清华 PyPI 镜像安装 |

## 4. 技术路线候选与决策

| 候选 | 结论 | 理由 |
|---|---|---|
| ReportLab | **推荐** | Python wheel 安装顺利；无 GTK / Cairo 等系统级依赖；可直接注册 Windows 中文字体；适合受控模板、表格、页眉页脚 |
| WeasyPrint | 暂不采用 | HTML/CSS 排版能力强，但 Windows 原生依赖链更重；本次未安装 / 未验证，不作为 Sprint-18 首选 |

Sprint-18 建议走 ReportLab 首版：实现 Markdown 子集到 Platypus 元素的映射，覆盖标题、段落、列表、表格、引用、页眉页脚；失败时返回 5030，不生成坏文件。

## 5. 验证证据

执行命令：

```powershell
.\.venv\Scripts\python.exe -m pip install reportlab pypdf pdfplumber pillow
.\.venv\Scripts\python.exe scripts\smoke-pdf-rg006.py --json-out tmp\pdfs\rg006-summary.json
```

smoke 结果：
- `status=passed`
- PDF：`tmp/pdfs/rg006-chinese-reportlab-sample.pdf`
- 页数：2
- 字体：`C:\Windows\Fonts\simhei.ttf`
- PNG：`tmp/pdfs/rg006-chinese-reportlab-sample-1.png`、`tmp/pdfs/rg006-chinese-reportlab-sample-2.png`
- 页面尺寸：1241 x 1754
- 非空像素检查：page1 `dark_ratio=0.04359`，page2 `dark_ratio=0.00809`
- 文本抽取关键片段命中数：4

人工视觉检查：
- 第一页中文标题、正文、表格、页脚页码正常。
- 第二页分页、页脚页码、连续中文段落正常。
- 未发现乱码、黑块、重叠或明显裁切。

## 6. Readiness Gate

| RG-ID | 进入标准 | 必需证据 | 状态 | 阻塞项 |
|---|---|---|---|---|
| RG-006 | PDF 库可安装 / 导入；中文字体可用；能生成中文样例并渲染检查 | 依赖安装记录、smoke 脚本、PDF + PNG + 文本抽取结果、人工视觉检查 | **Go** | 无；后续 API-019 产品实现已由 Sprint-18 完成 |

## 7. 风险与降级

| Risk-ID | 优先级 | 风险 | 当前状态 | 降级 / 处理 |
|---|---|---|---|---|
| RISK-P1-006 | P1 | PDF 导出库未验证 | **已关闭**：ReportLab 中文样例通过；Sprint-18 已完成 API-019 | 运行时缺库 / 字体缺失时返回 5030 |
| PDF-IMPL-001 | P1 | Markdown 子集映射 | 已由 Sprint-18 完成首版 | 首版承诺标题、段落、列表、表格、引用、页眉页脚 |
| PDF-IMPL-002 | P1 | 导出产物权限 / 清理策略 | 权限继承已由 Sprint-18 完成；过期清理 job 留后续 | 复用文档可读权限；artifact 首版写入 `tmp/pdf_exports` |

## 8. 结论与下一步

RG-006 结论为 **Go**。本报告在评估当时只关闭技术环境门禁；后续 Sprint-18 已完成单文档 PDF 导出编码与 TC-P1-017。

后续落地：
- Sprint-18 已按 API-019 实现 `POST /api/export-pdf`。
- 后端使用 ReportLab 生成 PDF，缺依赖 / 缺字体 / 渲染失败时返回 5030。
- TC-P1-017 已覆盖权限、版本绑定、中文导出、失败态、产物访问和产品 PDF 样例。
