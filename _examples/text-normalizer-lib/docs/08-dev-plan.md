# 08 开发计划

## Sprint1：公开函数 + 空白标准化

### 目标
实现 TextNormalizer 全部 Phase1 功能（REQ-1~3），调用方可直接导入函数并得到标准化结果。

### 输入文档
- docs/03-prd.md（功能范围）
- docs/05-tech-spec.md（纯函数实现约束）

### 修改范围
- `backend/normalizer.py`（公开函数与规则实现）
- `tests/test_normalizer.py`（正常路径与异常路径测试）

### 验收标准
- `normalize_text` 满足 REQ-1~3
- 连续空白被压缩为单个空格，首尾空白被移除
- 非字符串输入抛出可理解错误

### 禁止事项
- 不新增 CLI、HTTP API、数据库
- 不引入第三方依赖
- 不超出 03-prd 的功能范围
