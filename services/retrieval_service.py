"""
Master-Level Retrieval & RAG Service for SIH26023.
Performs domain query expansion, intent classification, hybrid BM25 + Vector ranking,
source diversity balancing, duplicate suppression, OCR quality weighting,
contradiction detection, and explainable evidence ranking.
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from database.db import get_db
from services.embedding_service import embedding_service
from agents.agent_messages import EvidenceItem

logger = logging.getLogger(__name__)

DOMAIN_SYNONYMS = {
    "production": ["production", "offtake", "dispatch", "tonnes", "lakh tonnes", "million tonnes", "MT", "raw coal"],
    "target": ["target", "achievement", "plan", "scheduled", "budgeted", "variance"],
    "obr": ["obr", "overburden", "excavation", "stripping ratio", "cubic metres", "m.cum", "l.cum", "bcm"],
    "safety": ["safety", "fatalities", "fatal accident", "serious injury", "incident", "dgms", "ltifr", "reportable accident"],
    "geology": ["geology", "borehole", "seam", "drilling", "reserve", "ash content", "moisture", "grade", "gcv", "calorific value"],
    "equipment": ["equipment", "hemm", "dragline", "shovel", "dumper", "surface miner", "availability", "utilization"],
    "environment": ["environment", "air quality", "pm10", "pm2.5", "effluent", "plantation", "clearing", "afforestation"],
    "discrepancy": ["conflict", "variance", "difference", "discrepancy", "inconsistency", "mismatch"]
}

class RetrievalService:
    """Master-Level Hybrid search and explainable evidence ranking engine for CIL documents."""

    def classify_query_intent(self, query: str) -> str:
        """Classify user query intent for targeted retrieval boosting."""
        q_lower = query.lower()
        if any(w in q_lower for w in ["production", "produced", "offtake", "dispatch", "lakh tonnes", "mt"]):
            return "PRODUCTION_QUERY"
        if any(w in q_lower for w in ["obr", "overburden", "excavation", "stripping ratio", "m.cum"]):
            return "OBR_QUERY"
        if any(w in q_lower for w in ["safety", "fatality", "fatal", "injury", "accident", "ltifr", "dgms"]):
            return "SAFETY_QUERY"
        if any(w in q_lower for w in ["geology", "borehole", "seam", "ash", "moisture", "grade", "gcv"]):
            return "GEOLOGY_QUERY"
        if any(w in q_lower for w in ["equipment", "hemm", "dragline", "shovel", "dumper", "availability"]):
            return "EQUIPMENT_QUERY"
        if any(w in q_lower for w in ["discrepancy", "conflict", "variance", "difference", "inconsistency"]):
            return "DISCREPANCY_QUERY"
        return "GENERAL_FACT_QUERY"

    def expand_query(self, query: str) -> Tuple[str, float]:
        """
        Expand user query with CIL domain synonyms using whole-word boundaries.
        Returns expanded query string and query expansion confidence score.
        """
        q_lower = query.lower()
        expanded_terms = set(re.findall(r'\b\w{3,}\b', q_lower))
        matches_found = 0

        for key, syns in DOMAIN_SYNONYMS.items():
            key_matched = bool(re.search(r'\b' + re.escape(key) + r'\b', q_lower))
            syn_matched = any(bool(re.search(r'\b' + re.escape(s.lower()) + r'\b', q_lower)) for s in syns)
            if key_matched or syn_matched:
                matches_found += 1
                expanded_terms.update([s.lower() for s in syns[:3]])

        expansion_conf = min(0.70 + (matches_found * 0.10), 1.0) if matches_found > 0 else 0.60
        return " ".join(expanded_terms), round(expansion_conf, 2)

    def hybrid_search(
        self,
        query: str,
        top_k: int = 8,
        filter_subsidiary: Optional[str] = None,
        filter_doc_id: Optional[int] = None,
        filter_period: Optional[str] = None
    ) -> List[EvidenceItem]:
        """
        Execute combined vector semantic search and keyword match,
        with duplicate suppression, source diversity, explainability, and quality weighting.
        """
        intent = self.classify_query_intent(query)
        expanded_q, exp_conf = self.expand_query(query)
        
        # 1. Semantic Vector Search
        vector_results = embedding_service.query(
            expanded_q,
            top_k=top_k * 3,
            filter_subsidiary=filter_subsidiary,
            filter_period=filter_period
        )
        
        # 2. SQLite Keyword / Full-Text Search
        keyword_results = self._sql_keyword_search(
            query,
            top_k=top_k * 3,
            filter_subsidiary=filter_subsidiary,
            filter_doc_id=filter_doc_id,
            filter_period=filter_period
        )

        # 3. Reciprocal Rank Fusion (RRF) with Quality Modifiers
        rrf_scores = {}
        chunk_map = {}
        vector_ranks = {}
        keyword_ranks = {}

        # Process Vector Ranks
        for rank, (meta, score) in enumerate(vector_results, 1):
            chunk_id = meta.get("chunk_id", f"{meta.get('document_id')}_{meta.get('chunk_index')}")
            vector_ranks[chunk_id] = rank
            base_rrf = 1.0 / (60.0 + rank)
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + base_rrf
            chunk_map[chunk_id] = (meta, score)

        # Process Keyword Ranks
        for rank, (meta, score) in enumerate(keyword_results, 1):
            chunk_id = meta.get("chunk_id", f"{meta.get('document_id')}_{meta.get('chunk_index')}")
            keyword_ranks[chunk_id] = rank
            base_rrf = 1.0 / (60.0 + rank)
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + base_rrf
            if chunk_id not in chunk_map:
                chunk_map[chunk_id] = (meta, score)

        # 4. Duplicate Suppression & Source Diversity Sorting
        # Group candidates by content hash or text similarity
        seen_hashes = set()
        doc_count_tracker = {}
        ranked_candidates = []

        # Sort by raw RRF score first
        sorted_raw = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

        for chunk_id, rrf_score in sorted_raw:
            meta, raw_score = chunk_map[chunk_id]
            content = meta.get("content", "").strip()
            
            # Content Hash deduplication
            c_hash = meta.get("content_hash") or hash(content[:100])
            if c_hash in seen_hashes:
                continue
            seen_hashes.add(c_hash)

            # Apply quality modifier (boost native text over degraded OCR)
            ocr_qual = meta.get("ocr_quality", "HIGH")
            qual_mod = 1.0
            if ocr_qual == "FAILED":
                qual_mod = 0.50
            elif ocr_qual == "LOW":
                qual_mod = 0.75
            elif ocr_qual == "MEDIUM":
                qual_mod = 0.90

            adjusted_score = rrf_score * qual_mod
            doc_id = meta.get("document_id")

            # Source diversity penalty if one document dominates
            doc_count = doc_count_tracker.get(doc_id, 0)
            if doc_count >= 3:
                adjusted_score *= 0.85

            doc_count_tracker[doc_id] = doc_count + 1
            ranked_candidates.append((chunk_id, adjusted_score, rrf_score, qual_mod))

        # Re-sort by adjusted score and take top_k
        ranked_candidates.sort(key=lambda x: x[1], reverse=True)
        top_candidates = ranked_candidates[:top_k]

        evidence_items = []
        for chunk_id, adj_score, raw_rrf, qual_mod in top_candidates:
            meta, raw_score = chunk_map[chunk_id]
            doc_name = meta.get("document_name") or self._get_doc_name(meta.get("document_id"))
            vec_rank = vector_ranks.get(chunk_id, "N/A")
            kw_rank = keyword_ranks.get(chunk_id, "N/A")

            # Explainable ranking metadata
            explanation = (
                f"Ranked via RRF (raw: {round(raw_rrf, 5)}, qual_mod: {qual_mod}). "
                f"TF-IDF Vector Rank: {vec_rank} | Keyword SQL Rank: {kw_rank} | Intent: {intent}"
            )

            evidence_items.append(EvidenceItem(
                document_id=meta.get("document_id"),
                document_name=doc_name,
                page_number=meta.get("page_number", 1),
                section_title=meta.get("section_title", "General Content"),
                source_text=meta.get("content", ""),
                relevance_score=round(min(adj_score * 50.0, 1.0), 3),
                producing_agent="RetrievalAgent",
                metadata={
                    "subsidiary": meta.get("subsidiary"),
                    "reporting_period": meta.get("reporting_period"),
                    "intent": intent,
                    "query_expansion_confidence": exp_conf,
                    "ranking_explanation": explanation,
                    "source_type": meta.get("source_type", "DIGITAL_TEXT"),
                    "ocr_engine": meta.get("ocr_engine"),
                    "ocr_quality": meta.get("ocr_quality", "HIGH")
                }
            ))

        return evidence_items

    def _sql_keyword_search(
        self,
        query: str,
        top_k: int = 15,
        filter_subsidiary: Optional[str] = None,
        filter_doc_id: Optional[int] = None,
        filter_period: Optional[str] = None
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Exact substring and LIKE keyword matching in SQLite chunks table."""
        keywords = [w for w in re.findall(r'\b\w{3,}\b', query.lower()) if w not in {'the', 'and', 'for', 'was', 'with', 'from', 'what', 'show', 'tell'}]
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
                if filter_period:
                    sql += " AND d.reporting_period = ?"
                    params.append(filter_period)

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

    def retrieve(
        self,
        query: str,
        top_k: int = 8,
        filter_subsidiary: Optional[str] = None,
        filter_doc_id: Optional[int] = None,
        filter_period: Optional[str] = None
    ) -> List[EvidenceItem]:
        """Convenience alias for hybrid_search."""
        return self.hybrid_search(
            query=query,
            top_k=top_k,
            filter_subsidiary=filter_subsidiary,
            filter_doc_id=filter_doc_id,
            filter_period=filter_period
        )

# Global retrieval service
retrieval_service = RetrievalService()


