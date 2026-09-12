"""
Document Intelligence Agent for SIH26023.
Coordinates document parsing, OCR, table extraction, metadata detection,
entity extraction, chunk generation, and vector index updates.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
from agents.agent_messages import AgentTask, AgentResult, WorkflowContext, EvidenceItem
from services.document_processor import document_processor
from services.extraction_service import extraction_service
from services.embedding_service import embedding_service
from database.db import get_db, log_audit

logger = logging.getLogger(__name__)

class DocumentIntelligenceAgent(BaseAgent):
    """Specialized agent for ingesting, parsing, classifying, and extracting mining records."""

    def __init__(self):
        super().__init__(
            name="DocumentIntelligenceAgent",
            description="Performs deterministic document parsing, OCR, entity extraction, chunking, and indexing.",
            capabilities=[
                "DOCUMENT_CLASSIFICATION",
                "OCR_COORDINATION",
                "TEXT_EXTRACTION",
                "TABLE_EXTRACTION",
                "METADATA_EXTRACTION",
                "CHUNKING",
                "CHUNK_INDEXING"
            ]
        )

    def _execute(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        """
        Execute document processing task.
        Input data should contain 'file_path' and 'original_filename' or 'document_id'.
        """
        input_data = task.input_data or {}
        file_path_str = input_data.get("file_path")
        orig_name = input_data.get("original_filename", "document")
        doc_id = input_data.get("document_id")

        if not file_path_str:
            return AgentResult(
                task_id=task.task_id,
                workflow_id=task.workflow_id,
                agent_name=self.name,
                status="FAILED",
                errors=["No 'file_path' provided in task input data."]
            )

        file_path = Path(file_path_str)
        
        # 1. Parse Document using Deterministic Processor
        proc_res = document_processor.process_document(file_path, orig_name)
        if proc_res.get("status") == "FAILED":
            # Update doc status in DB if doc_id exists
            if doc_id:
                self._update_doc_status(doc_id, "FAILED", proc_res.get("error"))

            return AgentResult(
                task_id=task.task_id,
                workflow_id=task.workflow_id,
                agent_name=self.name,
                status="FAILED",
                errors=[proc_res.get("error", "Unknown parsing error")]
            )

        full_text = proc_res.get("full_text", "")
        pages = proc_res.get("pages", [])
        chunks = proc_res.get("chunks", [])
        page_count = proc_res.get("page_count", 1)

        # 2. Extract Mining Metadata and Structured Records
        meta_res = extraction_service.extract_metadata_and_records(full_text, pages)
        subsidiary = meta_res.get("subsidiary", "CIL")
        mine = meta_res.get("mine")
        period = meta_res.get("reporting_period")
        doc_type = meta_res.get("document_type", "General Mining Document")
        extracted_records = meta_res.get("records", [])

        # Build OCR metadata summary if OCR was executed
        ocr_pages = [p.get("ocr_metadata") for p in pages if p.get("ocr_metadata")]
        ocr_summary = {}
        if ocr_pages or proc_res.get("ocr_performed"):
            ocr_summary = {
                "ocr_performed": True,
                "pages_ocr_processed": len(ocr_pages),
                "primary_engine": ocr_pages[0].get("engine_used", "Tesseract") if ocr_pages else "Tesseract",
                "overall_quality": min((p.get("ocr_quality", "HIGH") for p in ocr_pages), key=lambda q: {"FAILED": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "NOT_REQUIRED": 4}.get(q, 2)) if ocr_pages else "HIGH",
                "average_confidence": round(sum(p.get("confidence", 0.9) for p in ocr_pages) / len(ocr_pages), 2) if ocr_pages else 0.90,
                "human_review_required": any(p.get("human_review_required", False) for p in ocr_pages),
                "page_details": ocr_pages
            }
        
        doc_meta = {"ocr_summary": ocr_summary} if ocr_summary else {}
        doc_metadata_json = json.dumps(doc_meta) if doc_meta else None

        # 3. Persist / Update Database
        checksum = proc_res.get("checksum")
        if not doc_id:
            doc_id = self._insert_document_record(
                file_path=file_path,
                original_name=orig_name,
                page_count=page_count,
                subsidiary=subsidiary,
                mine=mine,
                period=period,
                doc_type=doc_type,
                doc_metadata_json=doc_metadata_json,
                checksum=checksum
            )
        else:
            self._update_document_metadata(doc_id, page_count, subsidiary, mine, period, doc_type, doc_metadata_json=doc_metadata_json, checksum=checksum)

        # 4. Save Chunks and Extracted Records to Database
        self._save_chunks_and_records(doc_id, chunks, extracted_records, orig_name, subsidiary, period)

        # 5. Update Hybrid Embedding Index
        self._reindex_vector_store()

        # Build evidence items from top extracted facts
        evidence_items = []
        for r in extracted_records[:8]:
            evidence_items.append(EvidenceItem(
                document_id=doc_id,
                document_name=orig_name,
                page_number=r.get("page_number", 1),
                section_title=r.get("section_name", "Extraction"),
                source_text=r.get("source_excerpt", ""),
                relevance_score=1.0,
                field_name=r.get("field_name"),
                extracted_value=r.get("raw_value"),
                confidence=r.get("confidence", 0.95),
                producing_agent=self.name
            ))

        log_audit("DOCUMENT_PROCESSED", resource_type="document", resource_id=doc_id, details={
            "filename": orig_name,
            "page_count": page_count,
            "subsidiary": subsidiary,
            "records_extracted": len(extracted_records),
            "ocr_performed": bool(ocr_summary)
        })

        return AgentResult(
            task_id=task.task_id,
            workflow_id=task.workflow_id,
            agent_name=self.name,
            status="SUCCESS",
            result_data={
                "document_id": doc_id,
                "original_name": orig_name,
                "page_count": page_count,
                "subsidiary": subsidiary,
                "mine": mine,
                "reporting_period": period,
                "document_type": doc_type,
                "chunks_created": len(chunks),
                "records_extracted_count": len(extracted_records),
                "extracted_records": extracted_records,
                "ocr_summary": ocr_summary
            },
            evidence=evidence_items,
            confidence=0.96,
            sources=[{"document_id": doc_id, "document_name": orig_name, "page_count": page_count}],
            next_action="INDEXING_COMPLETE"
        )

    def _insert_document_record(self, file_path: Path, original_name: str, page_count: int, subsidiary: str, mine: Optional[str], period: Optional[str], doc_type: str, doc_metadata_json: Optional[str] = None, checksum: Optional[str] = None) -> int:
        filename = file_path.name
        file_size = file_path.stat().st_size if file_path.exists() else 0
        file_ext = file_path.suffix.lower().lstrip(".")
        with get_db() as conn:
            existing = None
            if checksum:
                existing = conn.execute("SELECT id FROM documents WHERE checksum = ?", (checksum,)).fetchone()
            if not existing:
                existing = conn.execute("SELECT id FROM documents WHERE filename = ?", (filename,)).fetchone()

            if existing:
                doc_id = existing["id"]
                conn.execute(
                    """
                    UPDATE documents 
                    SET original_name = ?, file_type = ?, file_size = ?, file_path = ?, checksum = COALESCE(?, checksum), page_count = ?, subsidiary = ?, mine = ?, reporting_period = ?, doc_metadata_json = ?, status = 'PROCESSED', error_message = NULL, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (original_name, file_ext, file_size, str(file_path), checksum, page_count, subsidiary, mine, period, doc_metadata_json, doc_id)
                )
                return doc_id

            cursor = conn.execute(
                """
                INSERT INTO documents 
                (filename, original_name, file_type, file_size, file_path, checksum, page_count, subsidiary, mine, reporting_period, doc_metadata_json, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROCESSED')
                """,
                (filename, original_name, file_ext, file_size, str(file_path), checksum, page_count, subsidiary, mine, period, doc_metadata_json)
            )
            return cursor.lastrowid

    def _update_document_metadata(self, doc_id: int, page_count: int, subsidiary: str, mine: Optional[str], period: Optional[str], doc_type: str, doc_metadata_json: Optional[str] = None, checksum: Optional[str] = None):
        with get_db() as conn:
            conn.execute(
                """
                UPDATE documents 
                SET page_count = ?, subsidiary = ?, mine = ?, reporting_period = ?, checksum = COALESCE(?, checksum), doc_metadata_json = COALESCE(?, doc_metadata_json), status = 'PROCESSED', error_message = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (page_count, subsidiary, mine, period, checksum, doc_metadata_json, doc_id)
            )


    def _update_doc_status(self, doc_id: int, status: str, error_msg: Optional[str]):
        with get_db() as conn:
            conn.execute(
                "UPDATE documents SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (status, error_msg, doc_id)
            )

    def _save_chunks_and_records(self, doc_id: int, chunks: List[Dict[str, Any]], records: List[Dict[str, Any]], filename: str, sub: str, period: Optional[str]):
        with get_db() as conn:
            # Clear old chunks/records for re-processing safety
            conn.execute("DELETE FROM document_chunks WHERE document_id = ?", (doc_id,))
            conn.execute("DELETE FROM extracted_data WHERE document_id = ?", (doc_id,))

            for c in chunks:
                conn.execute(
                    """
                    INSERT INTO document_chunks 
                    (document_id, chunk_index, page_number, section_title, content, char_start, char_end, token_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        doc_id, c.get("chunk_index", 0), c.get("page_number", 1),
                        c.get("section_title", "General"), c.get("content", ""),
                        c.get("char_start", 0), c.get("char_end", 0), c.get("token_count", 0)
                    )
                )

            for r in records:
                conn.execute(
                    """
                    INSERT INTO extracted_data 
                    (document_id, field_name, field_category, raw_value, numeric_value, unit, subsidiary, mine, reporting_period, page_number, section_name, source_excerpt, confidence)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        doc_id, r.get("field_name"), r.get("field_category"), r.get("raw_value"),
                        r.get("numeric_value"), r.get("unit"), r.get("subsidiary", sub),
                        r.get("mine"), r.get("reporting_period", period), r.get("page_number", 1),
                        r.get("section_name"), r.get("source_excerpt"), r.get("confidence", 1.0)
                    )
                )

    def _reindex_vector_store(self):
        try:
            with get_db() as conn:
                rows = conn.execute(
                    """
                    SELECT c.id as chunk_id, c.document_id, c.chunk_index, c.page_number, c.section_title, c.content,
                           d.original_name as document_name, d.subsidiary, d.reporting_period
                    FROM document_chunks c
                    JOIN documents d ON c.document_id = d.id
                    """
                ).fetchall()
                embedding_service.rebuild_index(rows)
        except Exception as e:
            logger.error(f"Failed to reindex vector store: {e}")
