# SIH26023 -- Final Demonstration & Jury Presentation Checklist

This checklist provides the exact 10-step sequence for demonstrating the **AI-Powered Geological, Mining and Reporting Solution for CMPDI/CIL Subsidiaries (SIH26023)** to Hackathon evaluators, judges, and technical officers.

---

## Pre-Demo Setup & Verification

1. **Start the Application**:
   ```bash
   cd c:/Users/admin/OneDrive/Desktop/mining
   python app.py
   ```
2. **Access Web Interface**:
   Open browser at `http://localhost:5000`
3. **Verify Header**:
   - Status: System Online (Green Indicator)
   - Active AI Provider: `deterministic` (or `gemini` / `open_model` if configured)
   - Role Selector: Default is `ADMIN` (can switch to `OFFICER`, `ANALYST`, `VIEWER`)

---

## Step-by-Step Demonstration Scripts

### Demo 1: Multi-Format Document Ingestion (Synthetic ECL Production PDF)
- **Goal**: Demonstrate zero-crash document ingestion and multi-format extraction.
- **Action**:
  1. Click the **Documents** tab in the sidebar navigation.
  2. Drag and drop or browse to select `sample_data/ECL_Monthly_Production_Report_May_2025.pdf`.
  3. Set Subsidiary to `ECL` and Document Type to `Production Report`.
  4. Click **Upload & Process Document**.
- **Expected Outcome**:
  - Processing badge changes to `PROCESSED` with green status.
  - Extracted chunks count, metadata, and token stats are displayed.
  - Document appears in the dynamic document table with instant search and filter capability.

---

### Demo 2: Structured Extraction & Source Provenance Verification
- **Goal**: Prove that numbers are not fabricated and trace back to original document coordinates.
- **Action**:
  1. In the **Documents** tab, click **Inspect Chunks / Provenance** on `ECL_Monthly_Production_Report_May_2025.pdf`.
  2. Review the structured metadata and page-level chunk breakdown.
- **Expected Outcome**:
  - Exact extracted values (e.g. Rajmahal OCP Coal Production: `3.42 MT`, Overburden Removal: `8.15 M.Cu.M`).
  - Document ID, Page Number (Page 1), Section Header, and exact raw text snippet.

---

### Demo 3: Grounded AI Assistant with Evidence Panel
- **Goal**: Show accurate retrieval-augmented question answering with transparent provenance.
- **Action**:
  1. Navigate to the **AI Assistant** tab.
  2. Type the query:
     ```text
     What was the coal production in Rajmahal in May 2025?
     ```
  3. Click **Ask AI**.
- **Expected Outcome**:
  - **Answer**: Direct, concise answer stating `3.42 MT` for Rajmahal OCP.
  - **AI Provider Badge**: Displays active engine (`Gemini`, `OpenModel`, or `Deterministic Engine`).
  - **Confidence Tag**: `[EXTRACTED FACT]` (Confidence: 0.95+).
  - **Evidence Panel (Sidebar/Bottom)**:
    - Document: `ECL_Monthly_Production_Report_May_2025.pdf`
    - Page: `Page 1`
    - Section: `Rajmahal Open Cast Project`
    - Source Text Snippet with high relevance score.

---

### Demo 4: Hard No-Hallucination & Evidence Gating
- **Goal**: Prove the system rejects out-of-scope/unsupported queries instead of fabricating answers.
- **Action**:
  1. In the **AI Assistant** tab, ask an out-of-scope query:
     ```text
     What is the weather forecast and gold mining reserve in Tokyo?
     ```
  2. Click **Ask AI**.
- **Expected Outcome**:
  - **Exact Output**:
    ```text
    Insufficient information found in the available documents.
    ```
  - **Confidence**: `0.0` with `[INSUFFICIENT EVIDENCE]` classification.
  - Zero hallucinations generated.

---

### Demo 5: Real-Time Multi-Agent Workflow Monitoring
- **Goal**: Demonstrate genuine distributed agent orchestration (Manager -> Retrieval -> Validation -> AI).
- **Action**:
  1. Navigate to the **Agent Monitor** tab.
  2. View the Live Agent Execution DAG and Recent Workflows table.
- **Expected Outcome**:
  - **ManagerAgent**: Received user task, parsed intent, generated execution plan.
  - **RetrievalAgent**: Queried TF-IDF hybrid index, retrieved top-k grounded chunks.
  - **ValidationAgent**: Assessed numerical consistency across retrieved chunks.
  - **AI Resiliency Layer**: Selected active provider and formatted response.
  - Inter-agent task IDs, execution duration (ms), and payload status are visible.

---

### Demo 6: Automated Executive Report Generation & PDF/DOCX Export
- **Goal**: Demonstrate one-click executive report compilation with synthetic disclaimer and citations.
- **Action**:
  1. Navigate to the **Reports** tab.
  2. Select Report Type: `Consolidated Mining Production Report`.
  3. Set Subsidiary: `ECL` and Period: `May 2025`.
  4. Click **Generate Automated Report**.
- **Expected Outcome**:
  - Rendered HTML report displaying:
    - Banner: `[SYNTHETIC DEMONSTRATION DATA -- NOT OFFICIAL CIL DATA]`
    - Executive Summary
    - Key Operational Figures table with document and page citations.
    - Discrepancy & Validation section.
    - Source Provenance Appendix.
  - Working **Download PDF** and **Download DOCX** buttons serving verified files.

---

### Demo 7: Cross-Document Discrepancy & Conflict Detection
- **Goal**: Show automated discrepancy detection across conflicting subsidiary reports without silent overwrite.
- **Action**:
  1. Navigate to the **Validation** tab.
  2. Click **Run Cross-Document Validation Scan**.
- **Expected Outcome**:
  - Conflict list displays flagged variances (e.g. `Variance: 6.72%` or `12.5%` between internal production log and ministry submission).
  - Clear comparison matrix: Source A vs Source B with document names, page numbers, values, and severity levels (`HIGH`, `MEDIUM`).
  - Human resolution button allowing an Officer to select the authoritative figure.

---

### Demo 8: Parliamentary Inquiry Drafting with Mandatory Watermark
- **Goal**: Show automated drafting of Ministry/Lok Sabha inquiries with strict governance safeguards.
- **Action**:
  1. Navigate to the **Parliamentary Inquiries** tab.
  2. Enter Question:
     ```text
     What were the safety incidents and production targets across ECL mines in May 2025?
     ```
  3. Set Inquiry Reference: `LS-STARRED-Q-2025-05-ECL`.
  4. Click **Generate Inquiry Draft**.
- **Expected Outcome**:
  - Draft response generated with prominent header:
    ```text
    DRAFT — REQUIRES HUMAN VERIFICATION
    ```
  - Factually grounded points mapped to source chunks.
  - Status displayed as `PENDING_REVIEW` (no auto-publishing).

---

### Demo 9: Role-Based Access Control (RBAC) Security Denial
- **Goal**: Demonstrate server-side authorization enforcement and prevention of unauthorized approvals.
- **Action**:
  1. Switch Role Selector in top navigation to **VIEWER** (or **ANALYST**).
  2. Attempt to click **Approve & Sign-Off** on the Parliamentary Inquiry or attempt to Delete a Document.
- **Expected Outcome**:
  - Server rejects operation with **HTTP 403 Forbidden**.
  - UI displays clear notification: `Access Denied: Role VIEWER lacks permission for this action.`
  - Document/Inquiry state remains unchanged.

---

### Demo 10: Human-in-the-Loop Sign-Off & Immutable Audit Logging
- **Goal**: Demonstrate official sign-off by authorized personnel and verify the audit trail.
- **Action**:
  1. Switch Role Selector to **OFFICER** (or **ADMIN**).
  2. Click **Approve & Sign-Off** on the inquiry draft.
  3. Navigate to the **Audit Log** tab.
- **Expected Outcome**:
  - Inquiry status updates to `OFFICIALLY_APPROVED`.
  - Audit Log records entry:
    - Event: `INQUIRY_HUMAN_APPROVED`
    - User Role: `OFFICER`
    - Timestamp & Resource ID recorded.
    - Verified: Zero private API keys or secrets exposed in log details.

---

### Demo 11: Scanned Document Ingestion & Advanced OCR Provenance
- **Goal**: Demonstrate automated quality assessment, multi-filter preprocessing, and chunk-level OCR engine/confidence tracking.
- **Action**:
  1. In the **Documents** tab, upload a scanned or image document (e.g. JPG, PNG, or image-only PDF).
  2. Inspect the document modal by clicking **Inspect Chunks / Provenance**.
  3. Review the OCR summary badges in the document header and on individual chunks.
- **Expected Outcome**:
  - OCR metadata header displays:
    - **Engine**: `advanced` or `tesseract`
    - **Quality Level**: `HIGH`, `MEDIUM`, or `LOW`
    - **Average Word Confidence**: e.g., `88.5%`
    - **Review Status**: Flagged for human review if confidence < 70% or low contrast detected.
  - Chunk cards display provenance tags such as `[OCR: advanced | Conf: 89.2%]`.

---

### Demo 12: Dual Database Architecture (PostgreSQL Primary + SQLite Fallback)
- **Goal**: Demonstrate database portability, safe zero-config SQLite startup, explicit PostgreSQL connectivity, and zero secret leakage.
- **Action**:
  1. Open browser to `http://localhost:5000/api/health` and `http://localhost:5000/api/settings`.
  2. Inspect the returned JSON payload.
- **Expected Outcome**:
  - `/api/health` reports:
    ```json
    {
      "database": "sqlite",
      "database_connected": true,
      "status": "healthy"
    }
    ```
  - `/api/settings` displays sanitized database target (e.g. `sqlite:///mining_platform.db` or masked `postgresql://user:***@host:5432/dbname`) with 0 credentials leaked.
  - Zero application code rewrite needed to switch between enterprise PostgreSQL and local SQLite.

---

## Summary of Key Architectural Truths for Judges

| Evaluation Pillar | Implementation Reality |
|---|---|
| **Database Architecture** | Dual-backend abstraction: PostgreSQL (Primary / Enterprise) + SQLite (Local / Fallback). Safe migration utility (`migrate_to_postgres`) migrates all 12 tables with sequence sync. |
| **AI Fallback** | 3-tier cascade: Gemini API -> OpenModelProvider (Ollama) -> Deterministic RAG. 100% operational offline. |
| **Advanced OCR** | Modular pipeline: Quality heuristic detector -> Adaptive PIL/NumPy filters (Otsu binarization, dynamic range contrast, rotation correction) -> Multi-engine routing (`ADVANCED` -> `TESSERACT` -> Human Review) with chunk-level confidence tracking. |
| **Vector Index** | Lightweight pure Python TF-IDF + Cosine index (<50MB RAM). No heavy external vector DB required. |
| **Data Integrity** | All sample documents are synthetic demonstrations (`[SYNTHETIC DEMONSTRATION DATA -- NOT OFFICIAL CIL DATA]`). |
| **No Hallucination** | Mathematical threshold gating intercepts queries before LLM; returns exact no-evidence message. |
| **RBAC Security** | Server-side role validation on every mutating endpoint with least-privilege degradation. |
