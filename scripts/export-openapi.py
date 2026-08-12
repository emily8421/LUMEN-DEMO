"""Export the FastAPI OpenAPI schema to the committed snapshot (CQ-P1-006).

CQ-P1-006 / response_model·codegen：固定 ``openapi/openapi.json`` 作为机器可执行
schema 快照，CI ``schema-diff`` 用它做防漂移 gate——任何端点响应 / 请求契约变更
必须同时更新快照。

用法（仓库根目录）：

    python scripts/export-openapi.py

生成 ``openapi/openapi.json``（UTF-8、缩进 2、末尾换行，便于 git diff 阅读）。
只导入并构造 app，不连数据库（lifespan 不执行）；依赖见 backend/requirements.txt。
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT = REPO_ROOT / "openapi" / "openapi.json"


def main() -> int:
    sys.path.insert(0, str(REPO_ROOT))
    from backend.main import app

    schema = app.openapi()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(schema, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"OpenAPI schema written: {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
