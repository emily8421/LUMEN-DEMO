# 08 开发计划

## Sprint1：命令入口 + 基础文本清洗

### 目标
实现 TextCleaner 全部 Phase1 功能（REQ-1~4），本地命令可读取文件、清洗文本并写出结果。

### 输入文档
- docs/03-prd.md（功能范围）
- docs/07-api-spec.md（CLI 命令契约）

### 修改范围
- `backend/cli/main.py`（参数解析与退出码）
- `backend/service/text_cleaner.py`（空白裁剪与空行合并）
- `tests/test_text_cleaner.py`（核心清洗逻辑测试）

### 验收标准
- 命令按 07-api-spec 的格式接收 `--input` / `--output`
- 输出文件内容符合 REQ-2 的清洗规则
- 输入文件缺失时返回非零退出码，并输出可理解错误

### 禁止事项
- 不引入第三方 CLI 框架
- 不新增数据库、HTTP API、前端界面
- 不超出 03-prd 的功能范围
