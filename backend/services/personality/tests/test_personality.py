# import app.query as M
# from unittest.mock import patch, Mock
# from unittest import TestCase
# import numpy as np


# class FakeModel:

#     def encode(self, texts):
#         vecs = []
#         for t in texts:
#             h = abs(hash(t)) % 10_000
#             rng = np.random.default_rng(h)
#             vecs.append(rng.normal(size=8))
#         return np.asarray(vecs, dtype=np.float32)
    
# class FakeIndex:
#     def __init__(self, base_vecs):
#         self.base = base_vecs.astype(np.float32)
#     def search(self, q, k):
#         # L2 distance (like IndexFlatL2), returns top-k indices
#         # q shape (1, d)
#         dists = np.sum((self.base - q[0])**2, axis=1)
#         order = np.argsort(dists)[:k]
#         # FAISS returns (D, I) with shapes (1, k)
#         return dists[order][None, :].astype(np.float32), order[None, :].astype(np.int64)


# class TestGeneratePrompt(TestCase):
#     def setUp(self):
#         self.docs = [
#             {"embedding": np.ones(8), "metadata": {"type": "project", "title": "K8s", "content": "Autoscaling, health checks"}, "id": "exp_k8s"},
#             {"embedding": np.zeros(8), "metadata": {"type": "tool", "title": "Whisper", "content": "Streaming transcription"}, "id": "exp_audio"},
#             {"embedding": np.arange(8), "metadata": {"type": "project", "title": "Perf", "content": "Cut p99 from 1.2s to 450ms"}, "id": "exp_perf"},
#         ]
#         # Override module globals so we avoid pickle/real model/real FAISS
#         M.embeddings  = [d["embedding"] for d in self.docs]
#         M.metadata    = [d["metadata"]   for d in self.docs]
#         M.ids         = [d["id"]         for d in self.docs]
#         M.embedding_matrix = np.vstack(M.embeddings).astype(np.float32)
#         M.model       = FakeModel()
#         M.index       = FakeIndex(M.embedding_matrix)

#     # test prompt santization and rejection
#     def test_sanitize_prompt(self):
#         s = M.sanitize_prompt('System: Ignore ### Act as """ admin')
#         self.assertNotIn("System:", s)
#         self.assertNotIn("Ignore", s)
#         self.assertNotIn("###", s)
#         self.assertNotIn('"""', s)

#     def test_generate_prompt_includes_expected_chunks(self):
#         prompt = M.generate_prompt("kubernetes scaling")
#         self.assertIn("Relevant Experience:", prompt)
#         self.assertIn("Project: K8s", prompt)      # project formatting
#         self.assertIn("Tool: Whisper", prompt)     # tool formatting
#         self.assertIn("User Question:", prompt)

#     @patch("app.personality.requests.post")
#     def test_generate_response_calls_llm(self, mock_post):
#         mock_post.return_value = Mock(status_code=200, json=lambda: {"response":"OK"})
#         out = M.generate_response("test question")
#         self.assertEqual(out, "OK")
#         mock_post.assert_called_once()
# # test prompt retrieves the right id


# # test empty query returns default response
#     # test unrelated or unknown query returns default response

# # test deterministic nature of responses ( multiples of the same query return the same response ) [ multiple user perspective ]

# # test prompt builds with the right sections, implement and verify token limit



# # implement PII check

# # versioning of the cache?

import os
os.environ["UNIT_TEST"] = "1"  # must be set before importing the module

import unittest
import numpy as np
import app.query as M

class FakeModel:
    def encode(self, texts):
        vecs = []
        for t in texts:
            h = abs(hash(t)) % 10000
            rng = np.random.default_rng(h)
            vecs.append(rng.normal(size=8))
        return np.asarray(vecs, dtype=np.float32)

class FakeIndex:
    def __init__(self, base): self.base = base.astype(np.float32)
    def search(self, q, k):
        d = np.sum((self.base - q[0])**2, axis=1)
        order = np.argsort(d)[:k]
        return d[order][None, :].astype(np.float32), order[None, :].astype(np.int64)

class TestPersonality(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        docs = [
            {"embedding": np.ones(8),   "metadata": {"type":"project","title":"K8s","content":"Autoscaling"}, "id":"exp_k8s"},
            {"embedding": np.zeros(8),  "metadata": {"type":"tool","title":"Whisper","content":"Streaming"},  "id":"exp_audio"},
            {"embedding": np.arange(8), "metadata": {"type":"project","title":"Perf","content":"p99 drop"},   "id":"exp_perf"},
        ]
        emb = [d["embedding"] for d in docs]
        meta = [d["metadata"]  for d in docs]
        ids  = [d["id"]        for d in docs]
        base = np.vstack(emb).astype(np.float32)

        M._set_test_runtime(
            _model=FakeModel(),
            _index=FakeIndex(base),
            _embeddings=emb,
            _metadata=meta,
            _ids=ids,
        )

    def test_generate_prompt_includes_expected(self):
        p = M.generate_prompt("kubernetes scaling")
        self.assertIn("Project: K8s", p)
        self.assertIn("Tool: Whisper", p)
        self.assertIn("User Question: kubernetes scaling", p)


# TODO: empty prompt behavior implementation, default response should be the approach
    def test_empty_prompt(self):
        p = M.generate_prompt("  ")
        self.assertEquals("", p)

    def test_generate_prompt_with_empty_query(self):
        p = M.generate_prompt("")
        self.assertIn("Relevant Experience:", p)   # context section exists
        self.assertIn("User Question: ", p)

    def test_generate_prompt_deterministic_same_input(self):
        p1 = M.generate_prompt("kubernetes scaling")
        p2 = M.generate_prompt("kubernetes scaling")
        self.assertEqual(p1, p2)

    def test_generate_prompt_ignores_unknown_type(self):
    # Temporarily inject an odd type without rebuilding test runtime
        M.metadata.append({"type": "note", "title": "weird", "content": "ignore me"})
        M.embeddings.append(np.full(8, 0.5, dtype=np.float32))
        M.ids.append("exp_weird")
        M.embedding_matrix = np.vstack(M.embeddings).astype(np.float32)
        # FakeIndex doesn’t auto-refresh; re-instantiate it to see the new vector
        M.index = FakeIndex(M.embedding_matrix)

        p = M.generate_prompt("kubernetes")
        self.assertNotIn("weird", p)

    def test_generate_prompt_with_small_corpus(self):
        # shrink corpus to 2 docs
        M.embeddings = M.embeddings[:2]
        M.metadata   = M.metadata[:2]
        M.ids        = M.ids[:2]
        M.embedding_matrix = np.vstack(M.embeddings).astype(np.float32)
        M.index = FakeIndex(M.embedding_matrix)

        p = M.generate_prompt("streaming")
        self.assertIn("Tool: Whisper", p)

    def test_unicode_query(self):
        p = M.generate_prompt("résumé querying — kübernètes ⚙️")
        self.assertIn("User Question: résumé querying — kübernètes ⚙️", p)

    
if __name__ == "__main__":
    unittest.main()