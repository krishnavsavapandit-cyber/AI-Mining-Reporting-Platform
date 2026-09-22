# CIL Document Intelligence Platform -- Complete API Documentation

**Problem Statement**: SIH26023 (Ministry of Coal / Coal India Limited / CMPDI)  
**Base URL**: `http://localhost:5000`  
**Security & Headers**: Role-based access control (RBAC) enforced via header `X-User-Role` (`ADMIN`, `OFFICER`, `ANALYST`, `VIEWER`). Default fallback role is `ANALYST`.

---

## 1. Authentication & Role-Based Access Control (RBAC)

The system secures API endpoints using header-based RBAC middleware (`routes/auth_middleware.py`).

| Role | Permissions |
|---|---|
| **ADMIN** | Full administrative rights (document upload/delete, settings configuration, demo seeding, approvals, audit logs). |
| **OFFICER** | Reviewing officer rights (document upload, report generation, sign-off on parliamentary drafts, conflict resolution). |
| **ANALYST** | Operational analyst rights (document upload, search, AI query execution, report drafting, view validation). |
| **VIEWER** | Read-only access (search, view reports, view analytics, view audit trail). Blocked (HTTP 403) from mutations/deletions. |

---

## 2. Document Management Endpoints (`/api/documents`)

### `GET /api/documents`
- **Purpose**: List ingested documents with optional metadata filtering.
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST`, `VIEWER`
- **Query Parameters**:
  - `subsidiary` (string, optional): Filter by subsidiary code (e.g. `ECL`, `BCCL`, `SECL`, `CMPDI`).
  - `status` (string, optional): Filter by ingestion status (`PROCESSED`, `PROCESSING`, `FAILED`).
  - `search` (string, optional): Keyword search matching filename or mine name.
- **Response** `200 OK`:
```json
{
  "status": "success",
  "count": 6,
  "documents": [
    {
      "id": 1,
      "original_name": "ECL_Rajmahal_Monthly_Production_May_2025.pdf",
      "file_type": "pdf",
      "file_size": 145020,
      "page_count": 2,
      "subsidiary": "ECL",
      "mine": "Rajmahal",
      "reporting_period": "May 2025",
      "status": "PROCESSED",
      "created_at": "2026-09-10 10:15:30"
    }
  ]
}
```

### `GET /api/documents/<int:doc_id>`
- **Purpose**: Retrieve full details of a document, including raw chunk excerpts and extracted structured facts.
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST`, `VIEWER`
- **Response** `200 OK`:
```json
{
  "status": "success",
  "document": { "id": 1, "original_name": "...", "status": "PROCESSED" },
  "chunks": [
    { "id": 101, "page_number": 1, "section_title": "Production Summary", "chunk_text": "..." }
  ],
  "extracted_records": [
    { "field_name": "coal_production_mt", "field_value": "1.32", "confidence": 0.96 }
  ]
}
```
- **Error Codes**: `404 Not Found` if document ID does not exist.

### `POST /api/documents/upload`
- **Purpose**: Upload single or multi-part documents (`.pdf`, `.docx`, `.xlsx`, `.csv`, `.png`, `.jpg`) for automated parsing, OCR, chunking, and entity extraction.
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST` (Blocked for `VIEWER` -> `403 Forbidden`).
- **Request Format**: `multipart/form-data` with key `files`.
- **Response** `200 OK`:
```json
{
  "status": "success",
  "message": "Uploaded and queued 2 files for processing",
  "processed_files": [
    { "filename": "BCCL_Katras_Monthly_May_2025.pdf", "doc_id": 7, "status": "PROCESSED" }
  ]
}
```
- **Error Codes**: `400 Bad Request` if no file attached or invalid file extension.

### `POST /api/documents/<int:doc_id>/reprocess`
- **Purpose**: Re-trigger ingestion, OCR parsing, and extraction pipeline for a specific document.
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST`
- **Response** `200 OK`:
```json
{ "status": "success", "message": "Document reprocessed successfully", "doc_id": 1 }
```

### `DELETE /api/documents/<int:doc_id>`
- **Purpose**: Permanently delete a document and cascade deletion to associated chunks, vectors, extracted metrics, and validation entries.
- **Allowed Roles**: `ADMIN` only (Blocked for `OFFICER`, `ANALYST`, `VIEWER` -> `403 Forbidden`).
- **Response** `200 OK`:
```json
{ "status": "success", "message": "Document deleted successfully", "doc_id": 1 }
```

---

## 3. Semantic Search Endpoints (`/api/search`)

### `POST /api/search`
- **Purpose**: Execute hybrid search combining BM25 keyword matching and dense cosine vector embeddings via Reciprocal Rank Fusion (RRF).
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST`, `VIEWER`
- **Request Body**:
```json
{
  "query": "Rajmahal Coal Production May 2025",
  "top_k": 5,
  "subsidiary": "ECL"
}
```
- **Response** `200 OK`:
```json
{
  "status": "success",
  "query": "Rajmahal Coal Production May 2025",
  "expanded_query": "rajmahal coal production may 2025 offtake dispatch tonnes mt",
  "count": 3,
  "results": [
    {
      "document_id": 1,
      "document_name": "ECL_Rajmahal_Monthly_Production_May_2025.pdf",
      "page_number": 1,
      "section_title": "Production Metrics",
      "source_text": "During May 2025, Rajmahal OCP achieved total Coal Production of 1.32 Million Tonnes...",
      "relevance_score": 0.942
    }
  ]
}
```

---

## 4. AI Assistant Endpoints (`/api/query`)

### `POST /api/query`
- **Purpose**: Execute evidence-grounded conversational query answering via multi-agent orchestration. Strictly adheres to no-hallucination rules.
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST`, `VIEWER`
- **Request Body**:
```json
{
  "query": "What was the coal production in ECL Rajmahal during May 2025?",
  "chat_history": []
}
```
- **Response** `200 OK` (Evidence Found):
```json
{
  "status": "success",
  "answer": "Based on verified records, ECL Rajmahal achieved total Coal Production of 1.32 Million Tonnes in May 2025. [EXTRACTED FACT]",
  "provider_info": {
    "provider": "gemini",
    "model": "gemini-3.8-flash",
    "is_fallback": false
  },
  "confidence_semantics": {
    "extraction_confidence": 0.95,
    "retrieval_relevance": 0.94,
    "validation_status": "CONFIRMED",
    "interpretation_type": "EXTRACTED FACT"
  },
  "sources": [
    {
      "document_id": 1,
      "document_name": "ECL_Rajmahal_Monthly_Production_May_2025.pdf",
      "page_number": 1,
      "section_title": "Production Metrics",
      "source_text": "During May 2025, Rajmahal OCP achieved total Coal Production of 1.32 Million Tonnes...",
      "relevance_score": 0.942
    }
  ],
  "validation_warnings": []
}
```
- **Response** `200 OK` (Insufficient Evidence):
```json
{
  "status": "success",
  "answer": "Insufficient information found in the available documents.",
  "provider_info": { "provider": "deterministic", "model": "rule-grounded-engine" },
  "sources": [],
  "validation_warnings": []
}
```

---

## 5. Automated Reports Endpoints (`/api/reports`)

### `POST /api/reports/generate`
- **Purpose**: Synthesize structured executive reports with production figures, key findings, validation discrepancy notes, and grounded citations.
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST` (Blocked for `VIEWER`).
- **Request Body**:
```json
{
  "report_type": "Consolidated Mining Production Report",
  "title": "ECL Rajmahal Executive Mining Audit",
  "subsidiary": "ECL",
  "reporting_period": "May 2025"
}
```
- **Response** `200 OK`:
```json
{
  "status": "success",
  "report_id": 3,
  "title": "ECL Rajmahal Executive Mining Audit",
  "pdf_path": "exports/reports/report_3.pdf",
  "docx_path": "exports/reports/report_3.docx",
  "approval_status": "DRAFT"
}
```

### `GET /api/reports`
- **Purpose**: List all generated executive reports.
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST`, `VIEWER`

### `GET /api/reports/<int:report_id>`
- **Purpose**: Retrieve full report content, key figures, and metadata.

### `POST /api/reports/<int:report_id>/approve`
- **Purpose**: Formal sign-off on generated executive report.
- **Allowed Roles**: `ADMIN`, `OFFICER` (Blocked for `ANALYST`, `VIEWER` -> `403 Forbidden`).

### `GET /api/reports/download/<filename>`
- **Purpose**: Download binary export (`.pdf` or `.docx`).
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST`, `VIEWER`

---

## 6. Parliamentary Inquiries Endpoints (`/api/inquiries`)

### `POST /api/inquiries/generate`
- **Purpose**: Draft an evidence-grounded response for Lok Sabha, Rajya Sabha, or Ministry Parliamentary inquiries. Enforces mandatory `DRAFT — REQUIRES HUMAN VERIFICATION` watermark.
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST` (Blocked for `VIEWER`).
- **Request Body**:
```json
{
  "inquiry_ref": "Lok Sabha Starred Question No. 142",
  "ministry_body": "Ministry of Coal / Parliament of India",
  "question_text": "Will the Minister of Coal be pleased to state: (a) Details of coal production targets vs achievements in ECL; (b) Steps taken to improve safety..."
}
```
- **Response** `200 OK`:
```json
{
  "status": "success",
  "inquiry_id": 1,
  "inquiry_ref": "Lok Sabha Starred Question No. 142",
  "status": "DRAFT",
  "requires_human_verification": true,
  "watermark": "DRAFT -- REQUIRES HUMAN VERIFICATION",
  "draft_response": "..."
}
```

### `GET /api/inquiries`
- **Purpose**: List recorded parliamentary inquiry responses.

### `POST /api/inquiries/<int:inquiry_id>/approve`
- **Purpose**: Official sign-off by a Reviewing Officer or Admin.
- **Allowed Roles**: `ADMIN`, `OFFICER` (Blocked for `ANALYST`, `VIEWER` -> `403 Forbidden`).

---

## 7. Validation & Conflict Detection Endpoints (`/api/validation`)

### `GET /api/validation/issues`
- **Purpose**: List detected numerical discrepancies across documents (e.g. monthly production vs annual review vs railway dispatch logs).
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST`, `VIEWER`

### `POST /api/validation/scan`
- **Purpose**: Trigger immediate scan of all extracted metrics across documents to compute variance % and flag discrepancies.
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST`

### `POST /api/validation/resolve/<int:issue_id>`
- **Purpose**: Resolve flagged conflict by human officer decision.
- **Allowed Roles**: `ADMIN`, `OFFICER` (Blocked for `ANALYST`, `VIEWER` -> `403 Forbidden`).

---

## 8. Analytics & KPI Framework Endpoints (`/api/analytics`)

### `GET /api/analytics/summary`
- **Purpose**: Return aggregated metrics (total docs, production MT, OBR M.Cum, conflict count) derived from database state.

### `GET /api/analytics/charts`
- **Purpose**: Return time-series production trends, target vs actual breakdowns, and safety incident distributions.

### `GET /api/analytics/kpi-framework`
- **Purpose**: Return formal KPI framework containing 8 mathematical formulas, targets, measured results, and sample sizes.

---

## 9. Topics & Word Cloud Endpoints (`/api/topics`)

### `GET /api/topics/word-cloud`
- **Purpose**: Return mining domain term frequencies for HTML5 Canvas rendering.

### `GET /api/topics/clusters`
- **Purpose**: Return discovered unsupervised topic clusters with document associations.

---

## 10. Multi-Agent Observability Endpoints (`/api/agents`)

### `GET /api/agents/status`
- **Purpose**: Return registry health, operational status, and processed task counters for all 6 agents.

### `GET /api/agents/workflows`
- **Purpose**: List multi-agent workflow DAG execution history.

### `GET /api/agents/workflows/<workflow_id>`
- **Purpose**: Return detailed execution trace with task transitions and sub-agent results.

---

## 11. Audit Trail Endpoints (`/api/audit`)

### `GET /api/audit/logs`
- **Purpose**: Retrieve timestamped governance audit entries (uploads, queries, approvals, deletions, system events).
- **Query Parameters**: `action` (optional string filter).

---

## 12. Settings & System Management (`/api/settings`)

### `GET /api/settings`
- **Purpose**: Inspect active AI provider status, model fallbacks, and endpoint URLs (never exposes secret keys).

### `POST /api/settings/ai`
- **Purpose**: Update preferred AI provider (`gemini`, `open_model`, `deterministic`) and endpoint URLs.
- **Allowed Roles**: `ADMIN` only.

### `POST /api/settings/seed`
- **Purpose**: Seed synthetic multi-subsidiary test documents for live demonstration.
- **Allowed Roles**: `ADMIN`, `OFFICER`, `ANALYST`.
