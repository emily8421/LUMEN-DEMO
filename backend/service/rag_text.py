"""Pure text utilities for RAG candidate scoring (split from rag.py, WSG).

Tokenization (extract / trim / CJK windows / dedupe), chunk scoring against
terms, and snippet building. No RAG state, no repository, no LLM — pure helpers
shared by ``rag.answer_question`` and ``ai_polish`` citation retrieval.
"""

from __future__ import annotations

import re

MAX_SNIPPET_CHARS = 180


def _score_chunk(text: str, terms: list[str]) -> int:
    normalized_text = text.lower()
    return sum(normalized_text.count(term) for term in terms if term in normalized_text)


def _extract_terms(question: str) -> list[str]:
    terms: list[str] = []
    for token in re.findall(r"[0-9a-zA-Z一-鿿]+", question):
        normalized_token = _trim_question_words(token)
        if len(normalized_token) >= 2:
            terms.append(normalized_token)
        if _is_cjk(normalized_token) and len(normalized_token) > 6:
            terms.extend(_cjk_windows(normalized_token, 4))
    return _dedupe_terms(terms)


def _trim_question_words(token: str) -> str:
    trimmed = token
    for phrase in ("请问", "请说明", "请介绍", "是什么", "是多少", "有哪些", "为什么", "怎么", "如何", "多少"):
        trimmed = trimmed.replace(phrase, "")
    return trimmed.strip()


def _is_cjk(text: str) -> bool:
    return bool(text) and all("一" <= character <= "鿿" for character in text)


def _cjk_windows(text: str, size: int) -> list[str]:
    if len(text) <= size:
        return [text]
    return [text[index : index + size] for index in range(0, len(text) - size + 1)]


def _dedupe_terms(terms: list[str]) -> list[str]:
    deduped_terms: list[str] = []
    for term in terms:
        if term not in deduped_terms:
            deduped_terms.append(term)
    return deduped_terms


def _build_snippet(text: str, terms: list[str]) -> str:
    normalized_text = text.lower()
    match_index = _first_match_index(normalized_text, terms)
    if match_index < 0:
        return _truncate(text.strip(), MAX_SNIPPET_CHARS)

    half_window = MAX_SNIPPET_CHARS // 2
    start = max(match_index - half_window, 0)
    end = min(start + MAX_SNIPPET_CHARS, len(text))
    start = max(end - MAX_SNIPPET_CHARS, 0)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = f"…{snippet}"
    if end < len(text):
        snippet = f"{snippet}…"
    return snippet


def _first_match_index(normalized_text: str, terms: list[str]) -> int:
    indexes = [normalized_text.find(term) for term in terms if normalized_text.find(term) >= 0]
    return min(indexes) if indexes else -1


def _truncate(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return f"{text[: max_chars - 1].rstrip()}…"
