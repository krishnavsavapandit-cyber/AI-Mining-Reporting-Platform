"""
Retrieval & RAG Service for SIH26023.
Performs domain-specific query expansion, hybrid BM25 + Vector ranking,
and constructs structured evidence items with page-level provenance.
"""

import re
import logging
from typing import List, Dict, Any, Optional
from database.db import get_db
from services.embedding_service import embedding_service
from agents.agent_messages import EvidenceItem

logger = logging.getLogger(__name__)

DOMAIN_SYNONYMS = {
    "production": ["production", "offtake", "dispatch", "tonnes", "lakh tonnes", "million tonnes", "MT"],
    "target": ["target", "achievement", "plan", "scheduled", "budgeted"],
    "obr": ["obr", "overburden", "excavation", "stripping ratio", "cubic metres", "m.cum", "l.cum"],
    "safety": ["safety", "fatalities", "fatal accident", "serious injury", "incident", "dgms", "ltifr"],
    "geology": ["geology", "borehole", "seam", "drilling", "reserve", "ash content", "moisture", "grade"],
    "equipment": ["equipment", "hemm", "dragline", "shovel", "dumper", "surface miner", "availability", "utilization"],
    "environment": ["environment", "air quality", "pm10", "pm2.5", "effluent", "plantation", "clearing"],
    "discrepancy": ["conflict", "variance", "difference", "discrepancy", "inconsistency"]
}

class RetrievalService:
    """Hybrid search and evidence ranking engine for CIL documents."""

    def expand_query(self, query: str) -> str:
        """Expand user query with CIL domain synonyms using whole-word boundaries."""
        q_lower = query.lower()
        expanded_terms = set(re.findall(r'\b\w{3,}\b', q_lower))

        for key, syns in DOMAIN_SYNONYMS.items():
            key_matched = bool(re.search(r'\b' + re.escape(key) + r'\b', q_lower))
            syn_matched = any(bool(re.search(r'\b' + re.escape(s.lower()) + r'\b', q_lower)) for s in syns)
            if key_matched or syn_matched:
                expanded_terms.update([s.lower() for s in syns[:3]])

        return " ".join(expanded_terms)

    def hybrid_search(
        self,
        query: str,
        top_k: int = 8,
        filter_subsidiary: Optional[str] = None,
        filter_doc_id: Optional[int] = None
    ) -> List[EvidenceItem]:
        """
        Execute combined vector semantic search and keyword match,
        returning ranked structured EvidenceItem objects.
        """
        expanded_q = self.expand_query(query)
        
        # 1. Semantic Vector Search
        vector_results = embedding_service.query(expanded_q, top_k=top_k * 2, filter_subsidiary=filter_subsidiary)
        
        # 2. SQLite Keyword / Full-Text Search
        keyword_results = self._sql_keyword_search(query, top_k=top_k * 2, filter_subsidiary=filter_subsidiary, filter_doc_id=filter_doc_id)

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores = {}
        chunk_map = {}

        # Process Vector Ranks
        for rank, (meta, score) in enumerate(vector_results, 1):
            chunk_id = meta.get("chunk_id", f"{meta.get('document_id')}_{meta.get('chunk_index')}")
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + (1.0 / (60.0 + rank))
            chunk_map[chunk_id] = (meta, score)

        # Process Keyword Ranks
        for rank, (meta, score) in enumerate(keyword_results, 1):
            chunk_id = meta.get("chunk_id", f"{meta.get('document_id')}_{meta.get('chunk_index')}")
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + (1.0 / (60.0 + rank))
            if chunk_id not in chunk_map:
                chunk_map[chunk_id] = (meta, score)

        # Sort by combined RRF score
        sorted_chunks = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        evidence_items = []
        for chunk_id, rrf_score in sorted_chunks:
            meta, raw_score = chunk_map[chunk_id]
            
            # Enrich document metadata if needed
            doc_name = meta.get("document_name") or self._get_doc_name(meta.get("document_id"))

            evidence_items.append(EvidenceItem(
                document_id=meta.get("document_id"),
                document_name=doc_name,
                page_number=meta.get("page_number", 1),
                section_title=meta.get("section_title", "General Content"),
                source_text=meta.get("content", ""),
                relevance_score=round(min(rrf_score * 50.0, 1.0), 3),
                producing_agent="RetrievalAgent",
                metadata={
                    "subsidiary": meta.get("subsidiary"),
                    "reporting_period": meta.get("reporting_period")
                }
            ))

        return evidence_items

    def _sql_keyword_search(
        self,
        query: str,
        top_k: int = 15,
        filter_subsidiary: Optional[str] = None,
        filter_doc_id: Optional[int] = None
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Exact substring and LIKE keyword matching in SQLite chunks table."""
        keywords = [w for w in re.findall(r'\b\w{3,}\b', query.lower()) if w not in {'the', 'and', 'for', 'was', 'with', 'from'}]
        if not keywords:
            return []

        results = []
        try:
            with get_db() as conn:
                like_clauses = " OR ".join(["c.content LIKE ?"] * len(keywords))
                params = [f"%{k}%" for k in keywords]

                sql = f"""
                    SELECT c.id as chunk_id, c.document_id, c.chunk_index, c.page_number, c.section_title, c.content,
                           d.original_name as document_name, d.subsidiary, d.reporting_period
                    FROM document_chunks c
                    JOIN documents d ON c.document_id = d.id
                    WHERE ({like_clauses})
                """

                if filter_subsidiary:
                    sql += " AND d.subsidiary = ?"
                    params.append(filter_subsidiary)
                if filter_doc_id:
                    sql += " AND d.id = ?"
                    params.append(filter_doc_id)

                sql += f" LIMIT {top_k}"
                cursor = conn.execute(sql, params)
                rows = cursor.fetchall()

                for r in rows:
                    content_lower = r["content"].lower()
                    match_count = sum(1 for k in keywords if k in content_lower)
                    score = float(match_count) / max(len(keywords), 1)
                    results.append((r, score))
        except Exception as e:
            logger.error(f"SQL keyword search failed: {e}")

        return results

    def _get_doc_name(self, doc_id: Optional[int]) -> str:
        if not doc_id:
            return "Unknown Document"
        try:
            with get_db() as conn:
                r = conn.execute("SELECT original_name FROM documents WHERE id = ?", (doc_id,)).fetchone()
                return r["original_name"] if r else "Document"
        except Exception:
            return "Document"

# Global retrieval service
retrieval_service = RetrievalService()
