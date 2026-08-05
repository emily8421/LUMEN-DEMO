#!/usr/bin/env python3
"""Obsidian vault 导入 smoke（REQ-018 模式 A 验证，2026-08-05）。

用 DemoRepository（内存）直接调 ``imports_api.import_batch_endpoint``，验证现有导入对真实
Obsidian vault 的表现：目录树保留 / 文档入库 / wikilink 是否自动建链 / .obsidian 与附件是否
被拒 / 关键词搜索命中。不起独立 HTTP 服务（绕过管理员 / 进程回收），覆盖 endpoint + service 全链。

性质：REQ-018 模式 A 可行性验证用脚本，非正式验收；结果人工核对，发现回写 docs/09。
"""
import asyncio
import os
import sys
import traceback

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from backend.api import imports as imports_api
from backend.api.auth import TOKEN_SIGNING_KEY
from backend.repository.demo_repository import DemoRepository
from backend.service.auth import create_demo_token

VAULT = os.path.join("tmp", "test-vault")
USER_ID = 1
SPACE_ID = 10


class FakeUploadFile:
    """模拟 starlette UploadFile（test_import_api.py 同款）。"""

    def __init__(self, filename, content):
        self.filename = filename
        self.content = content

    async def read(self):
        return self.content


def main():
    os.chdir(PROJECT_ROOT)
    repo = DemoRepository()
    imports_api.repository = repo

    token = create_demo_token(user_id=USER_ID, current_space_id=SPACE_ID, signing_key=TOKEN_SIGNING_KEY)
    auth = f"Bearer {token}"

    # 收集 vault 全部文件（含 .obsidian / 附件，验证它们被拒）
    files, relpaths = [], []
    for root, _dirs, fnames in os.walk(VAULT):
        for fn in sorted(fnames):
            full = os.path.join(root, fn)
            rel = os.path.relpath(full, VAULT).replace("\\", "/")
            with open(full, "rb") as fh:
                files.append(FakeUploadFile(fn, fh.read()))
            relpaths.append(rel)

    print(f"=== vault 文件 ({len(files)}) ===")
    for rp in relpaths:
        print(f"  {rp}")

    response = asyncio.run(
        imports_api.import_batch_endpoint(
            files=files,
            relative_paths=relpaths,
            conflict_policy="skip",
            permission="team",
            authorization=auth,
        )
    )
    data = response["data"]
    print(
        f"\n=== 导入结果 total={data['total']} success={data['success_count']} "
        f"failed={data['failed_count']} skipped={data['skipped_count']} ==="
    )
    for it in data["items"]:
        print(
            f"  [{it['status']}] {it['relative_path']} folder_id={it.get('folder_id')} "
            f"chunk={it.get('chunk_count')} title={it.get('title')!r} err={it.get('error')}"
        )

    # 目录树
    try:
        folders = repo.list_folders(SPACE_ID)
        print(f"\n=== 目录树 ({len(folders)} folders) ===")
        for f in folders:
            print(f"  id={f.id} name={f.name!r} parent_id={getattr(f, 'parent_id', None)}")
    except Exception:
        traceback.print_exc()

    # 文档
    docs = []
    try:
        docs = repo.list_documents()
        print(f"\n=== 文档 ({len(docs)}) ===")
        for d in docs:
            print(f"  id={d.id} title={d.title!r} folder_id={getattr(d, 'folder_id', None)}")
    except Exception:
        traceback.print_exc()

    # wikilink 建链检查：README -> 概念A 是否自动建 doc-link
    try:
        readme = next((d for d in docs if d.title == "README"), None)
        if readme:
            for direction in ("outgoing", "incoming"):
                links = repo.list_doc_links(SPACE_ID, readme.id, direction)
                print(f"\n=== README doc_links ({direction}): {len(links)} ===")
                for lk in links:
                    print(
                        f"  src={getattr(lk, 'source_document_id', None)} "
                        f"tgt={getattr(lk, 'target_document_id', None)}"
                    )
        else:
            print("\n=== README 未找到（标题可能被解析为别的），跳过 wikilink 检查 ===")
    except Exception:
        traceback.print_exc()

    # 关键词搜索（demo 无向量召回，仅验证关键词子串路径）
    try:
        doc_ids = [d.id for d in docs]
        hits = repo.search_chunks(doc_ids, "概念A", 10)
        print(f"\n=== 关键词搜索 '概念A' 命中 chunk: {len(hits)} ===")
        for h in hits[:5]:
            print(f"  doc={getattr(h, 'document_id', None)} text={getattr(h, 'text', '')[:60]!r}")
    except Exception:
        traceback.print_exc()


if __name__ == "__main__":
    main()
