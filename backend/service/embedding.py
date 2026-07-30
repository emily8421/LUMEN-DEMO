"""bge-small-zh Embedding service (task-008 T4).

Wraps sentence-transformers ``BAAI/bge-small-zh-v1.5`` to produce 512-dim
float32 vectors for ``lumen_chunks.embedding`` (consumed by T6 vector recall).
The model is loaded once per process (module-level singleton via lru_cache).

Env (RG-002 verified): ``HF_HUB_DISABLE_XET=1`` is MANDATORY on the corporate
network — huggingface_hub 1.22 otherwise uses the Xet protocol and bypasses the
HTTP proxy. It is set here at import time, before sentence_transformers loads
the hub client. The model is cached at ``~/.cache/huggingface/hub/``.
"""

from __future__ import annotations

import os

# Must run before huggingface_hub is imported by sentence_transformers.
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

from functools import lru_cache
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover - typing only
    from sentence_transformers import SentenceTransformer

MODEL_NAME = "BAAI/bge-small-zh-v1.5"
EMBEDDING_DIM = 512
DEFAULT_BATCH_SIZE = 32


@lru_cache(maxsize=1)
def get_model() -> "SentenceTransformer":
    """Load the bge-small-zh model once, cached for the process lifetime."""
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODEL_NAME)


def embed_texts(texts: list[str], batch_size: int = DEFAULT_BATCH_SIZE) -> list[list[float]]:
    """Encode texts into 512-dim float32 vectors, L2-normalized for cosine.

    Returns one vector (list[float]) per input text, in order. Empty input → [].
    """
    if not texts:
        return []
    vectors = get_model().encode(
        texts,
        batch_size=batch_size,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )
    return vectors.tolist()
