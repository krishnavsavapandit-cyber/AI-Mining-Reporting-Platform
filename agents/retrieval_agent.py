"""
Retrieval / RAG Agent for SIH26023 Multi-Agent Platform.
Responsible for query expansion, semantic + keyword vector ranking,
evidence selection, and structured context construction with page provenance.
"""

import logging
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
from agents.agent_messages import AgentTask, AgentResult, WorkflowContext, EvidenceItem
class RetrievalAgent(BaseAgent):
    """Specialized agent for searching, ranking, and preparing grounded evidence chunks."""

    def __init__(self):
        super().__init__(
            name="RetrievalAgent",
            description="Performs domain-expanded hybrid keyword and semantic retrieval, ranking grounded evidence chunks.",
            capabilities=[
                "KEYWORD_SEARCH",
                "SEMANTIC_SEARCH",
                "QUERY_EXPANSION",
                "EVIDENCE_RANKING",
                "PROVENANCE_MAPPING"
            ]
        )

    def _execute(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        from services.retrieval_service import retrieval_service
        input_data = task.input_data or {}
        query = input_data.get("query", "").strip()
        top_k = int(input_data.get("top_k", 8))
        filter_sub = input_data.get("filter_subsidiary")
        filter_doc_id = input_data.get("filter_doc_id")

        if not query:
            return AgentResult(
                task_id=task.task_id,
                workflow_id=task.workflow_id,
                agent_name=self.name,
                status="FAILED",
                errors=["Query parameter is empty in retrieval task."]
            )

        # Execute Hybrid Search
        evidence_items = retrieval_service.hybrid_search(
            query=query,
            top_k=top_k,
            filter_subsidiary=filter_sub,
            filter_doc_id=filter_doc_id
        )

        sources = []
        seen_sources = set()
        for e in evidence_items:
            key = (e.document_name, e.page_number)
            if key not in seen_sources:
                seen_sources.add(key)
                sources.append({
                    "document_id": e.document_id,
                    "document_name": e.document_name,
                    "page_number": e.page_number,
                    "section": e.section_title,
                    "relevance_score": e.relevance_score
                })

        status = "SUCCESS" if evidence_items else "PARTIAL"
        warnings = []
        if not evidence_items:
            warnings.append("No relevant evidence chunks matched the search criteria.")

        return AgentResult(
            task_id=task.task_id,
            workflow_id=task.workflow_id,
            agent_name=self.name,
            status=status,
            result_data={
                "query": query,
                "expanded_query": retrieval_service.expand_query(query),
                "matched_count": len(evidence_items),
                "evidence_summary": [
                    {
                        "document": e.document_name,
                        "page": e.page_number,
                        "section": e.section_title,
                        "score": e.relevance_score,
                        "snippet": e.source_text[:140] + "..."
                    } for e in evidence_items
                ]
            },
            evidence=evidence_items,
            confidence=0.95 if evidence_items else 0.40,
            warnings=warnings,
            sources=sources,
            next_action="EVIDENCE_READY"
        )
