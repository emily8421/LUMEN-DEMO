# 07 API设计

## 1. 统一约定
- 命令格式：`text-cleaner --input <path> --output <path>`
- 成功：退出码 `0`
- 用户输入或文件错误：退出码非 `0`，标准错误输出简短报错

## 2. 接口清单

| 命令 | 用途 | 对应需求 |
|---|---|---|
| `text-cleaner --input <path> --output <path>` | 读取输入文件、执行清洗、写出结果 | REQ-1~4 |

## 3. 请求 / 响应示例

```text
命令：
text-cleaner --input draft.txt --output clean.txt

成功输出：
Cleaned text written to clean.txt
退出码：0
```

```text
命令：
text-cleaner --input missing.txt --output clean.txt

错误输出：
Input file not found: missing.txt
退出码：2
```
