"""Shared text cleaning and chunking helpers for degraded indexing."""

from __future__ import annotations


MAX_CHUNK_CHARS = 900
CHUNK_OVERLAP_CHARS = 120


def clean_text(source_text: str) -> str:
    lines = [line.rstrip() for line in source_text.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return "\n".join(lines)


def split_text_into_chunks(text: str, max_chars: int = MAX_CHUNK_CHARS, overlap_chars: int = CHUNK_OVERLAP_CHARS) -> list[str]:
    if max_chars <= 0:
        raise ValueError("max_chars must be positive")
    if overlap_chars < 0 or overlap_chars >= max_chars:
        raise ValueError("overlap_chars must be smaller than max_chars")

    paragraphs = [paragraph.strip() for paragraph in text.split("\n\n") if paragraph.strip()]
    if not paragraphs:
        paragraphs = [text.strip()]

    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        candidate = paragraph if not current else f"{current}\n\n{paragraph}"
        if len(candidate) <= max_chars:
            current = candidate
            continue
        if current:
            chunks.extend(_split_long_text(current, max_chars, overlap_chars))
        current = paragraph

    if current:
        chunks.extend(_split_long_text(current, max_chars, overlap_chars))

    return chunks


def _split_long_text(text: str, max_chars: int, overlap_chars: int) -> list[str]:
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    start = 0
    step = max_chars - overlap_chars
    while start < len(text):
        chunk = text[start : start + max_chars].strip()
        if chunk:
            chunks.append(chunk)
        start += step
    return chunks
