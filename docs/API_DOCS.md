# SIH26023 — REST API Documentation

Base URL: `http://localhost:5000`

---

## 1. Document Management (`/api/documents`)

### `GET /api/documents`
List uploaded documents with optional filters.
- **Query Params**: `subsidiary` (e.g. `ECL`), `status` (`PROCESSED`/`FAILED`), `search` (text query)
- **Response**:
```json
{
  "status": "success",
  "count": 6,
  "documents": [
    {
      "id": 1,
      "original_name": "ECL_Rajmahal_Monthly_Production_May_2025.pdf",
      "file_type": "pdf",
      "page_count": 2,
      "subsidiary": "ECL",
      "mine": "Rajmahal",
      "reporting_period": "May 2025",
      "status": "PROCESSED"
    }
  ]
}
```

### `GET /api/documents/<id>`
Inspect full document details, chunks, and extracted structured records.

### `POST /api/documents/upload`
Upload single or multipart documents (`multipart/form-data`).

### `POST /api/documents/<id>/reprocess`
Reprocess document through `DocumentIntelligenceAgent`.

### `DELETE /api/documents/<id>`
Deletes document and cascades all chunks and records.

---

## 2. Hybrid Semantic Search (`/api/search`)

### `POST /api/search`
- **Request Body**:
```json
{
  "query": "Rajmahal Coal Production May 2025",
  "top_k": 8,
  "subsidiary": "ECL"
}
```
- **Response**:
```json
{
  "status": "success",
  "query": "Rajmahal Coal Production May 2025",
  "expanded_query": "rajmahal coal production may 2025 offtake dispatch tonnes mt",
  "count": 4,
  "results": [
    {
      "document_name": "ECL_Rajmahal_Monthly_Production_May_2025.pdf",
      "page_number": 1,
      "section_title": "Production Metrics",
      "source_text": "During May 2025, Rajmahal OCP achieved a total Coal Production of 1.32 Million Tonnes...",
      "relevance_score": 0.94
    }
  ]
}
```

---

## 3. Mining Intelligence Assistant (`/api/query`)

### `POST /api/query`
- **Request Body**:
```json
{
  "query": "What was the coal production in ECL Rajmahal during May 2025?",
  "user_role": "Analyst",
  "chat_history": []
}
```
- **Response**:
```json
{
  "status": "success",
  "answer": "Based on verified document records, Rajmahal OCP achieved total Coal Production of 1.32 Million Tonnes...",
  "provider_info": { "provider": "gemini", "model": "gemini-3.8-flash" },
  "sources": [
    { "document_name": "ECL_Rajmahal_Monthly_Production_May_2025.pdf", "page_number": 1 }
  ],
  "validation_warnings": []
}
```

---

## 4. Automated Report Generator (`/api/reports`)

### `POST /api/reports/generate`
- **Request Body**:
```json
{
  "report_type": "Consolidated Mining Production Report",
  "title": "ECL Rajmahal Executive Audit",
  "subsidiary": "ECL",
  "reporting_period": "May 2025"
}
```

### `GET /api/reports/download/<filename>`
Download generated PDF or DOCX file.

---

## 5. Parliamentary & Ministry Inquiries (`/api/inquiries`)

### `POST /api/inquiries/generate`
- **Request Body**:
```json
{
  "inquiry_ref": "Lok Sabha Question No. 142",
  "ministry_body": "Ministry of Coal / Lok Sabha",
  "question_text": "Details of coal production targets vs achievements in ECL..."
}
```

---

## 6. Cross-Document Validation (`/api/validation`)

### `GET /api/validation/issues`
List detected cross-document discrepancies.

### `POST /api/validation/scan`
Triggers immediate cross-document consistency scan.

---

## 7. Multi-Agent Observability (`/api/agents`)

### `GET /api/agents/status`
List all registered agents and their health metrics.

### `GET /api/agents/workflows`
List recent multi-agent workflow runs and provenance logs.

### `GET /api/agents/workflows/<id>`
Fetch complete execution DAG with tasks and sub-agent results.
