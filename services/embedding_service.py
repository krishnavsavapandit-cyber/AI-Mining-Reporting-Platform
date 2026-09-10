"""
Local Hybrid Embedding & Vector Store Service for SIH26023.
Provides ultra-fast local TF-IDF + dense cosine vector indexing.
Does not require external vector databases or GPUs, ensuring 100% reproducibility.
"""

import math
import pickle
import re
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
from config.settings import VECTOR_INDEX_FILE

logger = logging.getLogger(__name__)

class HybridEmbeddingService:
    """Lightweight local hybrid vector store & search engine."""

    def __init__(self, index_file: Path = VECTOR_INDEX_FILE):
        self.index_file = index_file
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.doc_vectors: List[np.ndarray] = []
        self.chunk_metadata: List[Dict[str, Any]] = []
        self._load_index()

    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text into lowercase alphanumeric words."""
        text = text.lower()
        return [w for w in re.findall(r'\b[a-z0-9_-]{2,}\b', text) if not w.isdigit()]

    def _load_index(self):
        """Load index from disk if available."""
        if self.index_file.exists():
            try:
                with open(self.index_file, "rb") as f:
                    data = pickle.load(f)
                    self.vocabulary = data.get("vocabulary", {})
                    self.idf = data.get("idf", {})
                    self.doc_vectors = data.get("doc_vectors", [])
                    self.chunk_metadata = data.get("chunk_metadata", [])
                logger.info(f"Loaded vector index with {len(self.chunk_metadata)} chunks.")
            except Exception as e:
                logger.warning(f"Failed to load vector index: {e}")

    def save_index(self):
        """Persist vector index to disk."""
        try:
            self.index_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.index_file, "wb") as f:
                pickle.dump({
                    "vocabulary": self.vocabulary,
                    "idf": self.idf,
                    "doc_vectors": self.doc_vectors,
                    "chunk_metadata": self.chunk_metadata
                }, f)
            logger.info("Saved vector index to disk.")
        except Exception as e:
            logger.error(f"Failed to save vector index: {e}")

    def rebuild_index(self, all_chunks: List[Dict[str, Any]]):
        """Build full vocabulary, IDF weights, and dense normalized vectors for all chunks."""
        if not all_chunks:
            self.vocabulary = {}
            self.idf = {}
            self.doc_vectors = []
            self.chunk_metadata = []
            self.save_index()
            return

        # 1. Build Document Frequency & Vocabulary
        doc_freq = {}
        total_docs = len(all_chunks)
        tokenized_docs = []

        for chunk in all_chunks:
            tokens = set(self._tokenize(chunk.get("content", "")))
            tokenized_docs.append(self._tokenize(chunk.get("content", "")))
            for t in tokens:
                doc_freq[t] = doc_freq.get(t, 0) + 1

        # Keep top 8000 informative terms
        sorted_terms = sorted(doc_freq.items(), key=lambda x: x[1], reverse=True)[:8000]
        self.vocabulary = {term: idx for idx, (term, _) in enumerate(sorted_terms)}
        
        # Calculate Smooth IDF
        self.idf = {term: math.log((total_docs + 1) / (freq + 1)) + 1.0 for term, freq in doc_freq.items() if term in self.vocabulary}

        # 2. Vectorize Chunks
        dim = len(self.vocabulary)
        self.doc_vectors = []
        self.chunk_metadata = all_chunks

        for tokens in tokenized_docs:
            vec = np.zeros(dim, dtype=np.float32)
            tf = {}
            for t in tokens:
                if t in self.vocabulary:
                    tf[t] = tf.get(t, 0) + 1

            for t, count in tf.items():
                idx = self.vocabulary[t]
                # Sublinear TF-IDF
                tf_score = 1.0 + math.log(count)
                idf_score = self.idf.get(t, 1.0)
                vec[idx] = tf_score * idf_score

            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            self.doc_vectors.append(vec)

        self.save_index()
        logger.info(f"Rebuilt index with {len(self.doc_vectors)} chunks, vocab size: {dim}")

    def query(self, query_text: str, top_k: int = 10, filter_subsidiary: Optional[str] = None) -> List[Tuple[Dict[str, Any], float]]:
        """Compute cosine similarity between query and all indexed chunks."""
        if not self.doc_vectors or not self.vocabulary:
            return []

        q_tokens = self._tokenize(query_text)
        dim = len(self.vocabulary)
        q_vec = np.zeros(dim, dtype=np.float32)

        tf = {}
        for t in q_tokens:
            if t in self.vocabulary:
                tf[t] = tf.get(t, 0) + 1

        for t, count in tf.items():
            idx = self.vocabulary[t]
            tf_score = 1.0 + math.log(count)
            idf_score = self.idf.get(t, 1.0)
            q_vec[idx] = tf_score * idf_score

        norm = np.linalg.norm(q_vec)
        if norm > 0:
            q_vec = q_vec / norm
        else:
            return []

        # Vectorized Dot Product
        doc_matrix = np.array(self.doc_vectors)
        scores = np.dot(doc_matrix, q_vec)

        # Pair scores with chunk metadata
        results = []
        for idx, score in enumerate(scores):
            if score > 0.05:  # Relevance threshold
                meta = self.chunk_metadata[idx]
                if filter_subsidiary and meta.get("subsidiary") and meta.get("subsidiary") != filter_subsidiary:
                    continue
                results.append((meta, float(score)))

        # Sort descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

# Global embedding service
embedding_service = HybridEmbeddingService()
