"""Tests for the bge-small-zh embedding service (task-008 T4).

Loads the real model (RG-002 verified, cached at ~/.cache/huggingface/hub/).
The whole class is skipped when the model cannot be loaded (no cache / no
network), so this file does not break the test suite in environments without
the embedding stack.
"""

from __future__ import annotations

import unittest

from backend.service.embedding import EMBEDDING_DIM, embed_texts


class EmbeddingTest(unittest.TestCase):
    sample: list[list[float]]

    @classmethod
    def setUpClass(cls) -> None:
        try:
            cls.sample = embed_texts(["触发延迟是开关动作的时间间隔。"])
        except Exception as exc:  # pragma: no cover - env-dependent
            raise unittest.SkipTest(f"embedding model unavailable: {exc}") from exc

    def test_produces_512_dim_vector(self) -> None:
        self.assertEqual(len(self.sample), 1)
        self.assertEqual(len(self.sample[0]), EMBEDDING_DIM)

    def test_batch_preserves_order_and_dim(self) -> None:
        vecs = embed_texts(["第一个文本", "第二个文本", "第三个文本"])
        self.assertEqual(len(vecs), 3)
        self.assertTrue(all(len(v) == EMBEDDING_DIM for v in vecs))
        # distinct texts → distinct vectors
        self.assertNotEqual(vecs[0], vecs[1])

    def test_normalized_unit_length(self) -> None:
        norm = sum(x * x for x in self.sample[0]) ** 0.5
        self.assertAlmostEqual(norm, 1.0, places=4)

    def test_empty_input(self) -> None:
        self.assertEqual(embed_texts([]), [])


if __name__ == "__main__":
    unittest.main()
