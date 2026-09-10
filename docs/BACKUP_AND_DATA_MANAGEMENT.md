# CIL Document Intelligence Platform -- Backup & Data Management Guide

**Problem Statement**: SIH26023 (Ministry of Coal / Coal India Limited / CMPDI)

---

## 1. Storage Directory Structure

The platform organizes state, uploads, vector embeddings, and generated artifacts in a clean, isolated directory structure:

```
mining/
├── data/
│   ├── mining_intelligence.db       # Primary SQLite database (WAL mode enabled)
│   ├── vector_store.pkl             # Local TF-IDF & dense chunk embedding cache
│   └── uploads/                     # Ingested multi-format source files
│       ├── raw/                     # Original uploaded documents (.pdf, .docx, .xlsx, .csv, .png)
│       └── processed/               # Extracted image chunks & OCR intermediates
├── exports/
│   └── reports/                     # Generated PDF and DOCX executive reports
├── static/                          # Web assets (CSS, JS, icons)
├── templates/                       # Jinja2 HTML5 UI templates
├── config.py                        # System settings & environment parameter loader
└── app.py                           # Flask server entry point
```

---

## 2. Backup Procedures

### 2.1 SQLite Database Online Backup
Because the platform operates in SQLite **WAL (Write-Ahead Logging)** mode, online backups can be executed safely without taking the server offline:

```powershell
# Windows PowerShell SQLite online backup via vacuum into
sqlite3 data/mining_intelligence.db "VACUUM INTO 'backups/db/mining_intelligence_$(Get-Date -Format 'yyyyMMdd_HHmmss').db';"
```
*Or via standard file snapshot while server is idle*:
```powershell
Copy-Item data/mining_intelligence.db backups/db/mining_intelligence_backup.db
```

### 2.2 Ingested Document & Vector Store Backup
All uploaded documents and generated vector indexes are backed up using archive compression:

```powershell
# Archive uploads directory
Compress-Archive -Path data/uploads/* -DestinationPath "backups/uploads/uploads_backup_$(Get-Date -Format 'yyyyMMdd').zip"

# Archive vector store cache
Copy-Item data/vector_store.pkl "backups/vector_store_backup.pkl"
```

### 2.3 Generated Reports Backup
Generated executive PDF and DOCX reports residing in `exports/reports/` are backed up:

```powershell
Compress-Archive -Path exports/reports/* -DestinationPath "backups/reports/reports_backup_$(Get-Date -Format 'yyyyMMdd').zip"
```

---

## 3. Disaster Recovery & Restore Procedure

To restore the platform to a verified snapshot:

1. **Stop the Application Server**:
   ```powershell
   Stop-Process -Name "python" -Force
   ```
2. **Restore the SQLite Database**:
   ```powershell
   Copy-Item backups/db/mining_intelligence_backup.db data/mining_intelligence.db -Force
   ```
3. **Restore Ingested Files**:
   ```powershell
   Expand-Archive -Path backups/uploads/uploads_backup_*.zip -DestinationPath data/uploads/ -Force
   ```
4. **Rebuild Vector Store (Optional / Automated)**:
   If `vector_store.pkl` is missing or corrupted, the system automatically rebuilds chunk embeddings on next document query or via reprocess trigger.
5. **Restart Server & Verify**:
   ```powershell
   python app.py
   ```

---

## 4. Data Retention & Governance Considerations

- **Audit Trail Immutability**: Audit log entries in the `audit_logs` table are append-only. No UI or API endpoint permits modification or deletion of audit logs.
- **Document Soft-Deletion vs. Hard Cascade**: Document deletion via `DELETE /api/documents/<id>` cascades and purges associated chunks, entity records, and validation issues to prevent orphaned discrepancy flags.
- **Confidentiality / Secret Scrubbing**: API keys (e.g. `GEMINI_API_KEY`) and server credentials are never written to disk logs or returned in client API responses.

---

## 5. Configuration & Environment Variables

Key parameters are configured via environment variables or `config.py`:

| Variable Name | Default Value | Purpose |
|---|---|---|
| `FLASK_ENV` | `development` | Flask runtime mode (`development` or `production`). |
| `SECRET_KEY` | `cil-mining-sih-2026-secret-key` | Session and signing cryptographic key. |
| `GEMINI_API_KEY` | `""` (Empty -> triggers local fallback) | Google Gemini API key for Tier-1 cloud generation. |
| `OPEN_MODEL_ENDPOINT` | `http://localhost:11434/v1/chat/completions` | Local OpenAI-compatible LLM endpoint (Ollama / vLLM). |
| `OPEN_MODEL_NAME` | `llama3.2:1b` | Local model identifier for low-end hardware. |
| `DATABASE_PATH` | `data/mining_intelligence.db` | Path to primary SQLite database. |
| `TESSERACT_CMD` | `tesseract` | System path to Tesseract OCR binary. |

---

## 6. Architecture Evolution: Development vs. Future Production

```
+-----------------------------------------------------------------------------------+
|                            DEVELOPMENT / DEMO (Current)                            |
|  * SQLite in WAL mode (Zero-setup local persistence)                              |
|  * In-memory / local Pickle TF-IDF & Cosine vector index                          |
|  * Single-process Flask multi-agent execution DAGs (sub-10s local tests)           |
|  * File system storage for raw uploads & PDF exports                              |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         FUTURE ENTERPRISE PRODUCTION                               |
|  * PostgreSQL / CIL Enterprise Oracle Database with High Availability Cluster    |
|  * pgvector / Qdrant / Milvus dedicated production vector database               |
|  * Celery / Redis asynchronous distributed agent task queues                      |
|  * S3-compatible MinIO / Azure Blob / GCP Object Storage for petabyte archives    |
|  * CIL Single Sign-On (SSO) via Active Directory / SAML 2.0                        |
|  * DGMS / Coal India SAP ERP bidirectional API connectors                         |
+-----------------------------------------------------------------------------------+
```
