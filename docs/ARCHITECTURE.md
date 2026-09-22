# Multi-Agent Architecture & System Design — SIH26023

## Platform Overview
**SIH26023** is an AI-powered document intelligence, semantic retrieval, cross-document discrepancy validation, and automated reporting platform engineered specifically for **Coal India Limited (CIL)** subsidiaries (*ECL, BCCL, CCL, WCL, SECL, MCL, NCL, CMPDI, NEC*) and the **Ministry of Coal**.

---

## 1. Multi-Agent System Design

The system implements a genuine modular multi-agent architecture with structured task envelopes, evidence-grounded message passing, and centralized lifecycle tracking.

```
                             ┌──────────────────────────────┐
                             │        MANAGER AGENT         │
                             │   (Planner & Orchestrator)   │
                             └──────────────┬───────────────┘
                                            │
        ┌───────────────────────────────────┼──────────────────────────────────┐
        │                                   │                                  │
        ↓                                   ↓                                  ↓
┌───────────────────────┐       ┌───────────────────────┐          ┌───────────────────────┐
│ DOCUMENT INTELLIGENCE │       │    RETRIEVAL / RAG    │          │      VALIDATION       │
│        AGENT          │       │         AGENT         │          │         AGENT         │
│ (OCR, Parsers, Chunks)│       │ (BM25 + Cosine Vector)│          │(Cross-Doc Discrepancy)│
└───────────────────────┘       └───────────────────────┘          └───────────────────────┘
        │                                   │                                  │
        └───────────────────────────────────┼──────────────────────────────────┘
                                            │
                        ┌───────────────────┴───────────────────┐
                        ↓                                       ↓
            ┌───────────────────────┐               ┌───────────────────────┐
            │   REPORT GENERATION   │               │ PARLIAMENTARY INQUIRY │
            │         AGENT         │               │         AGENT         │
            │(Multi-format PDF/DOCX)│               │ (Evidence-backed QA)  │
            └───────────────────────┘               └───────────────────────┘
```

---

## 2. Specialized Agent Roles & Capabilities

### 1. Manager / Orchestrator Agent (`ManagerAgent`)
- **Role**: Coordinates workflows, analyzes user intent, builds DAG execution plans, routes tasks to specialized sub-agents, aggregates results, handles retries, and records provenance.
- **Capabilities**: `INTENT_PLANNING`, `WORKFLOW_ORCHESTRATION`, `AGENT_COORDINATION`, `FAILURE_RECOVERY`, `PROVENANCE_CHAIN_TRACKING`.
- **Handoff Logic**:
  - *Query Workflow*: Manager → RetrievalAgent → ValidationAgent → AIService Synthesis → Client.
  - *Report Workflow*: Manager → RetrievalAgent → ValidationAgent → ReportGenerationAgent → Client.
  - *Inquiry Workflow*: Manager → RetrievalAgent → ValidationAgent → GovernmentInquiryAgent → Client.

### 2. Document Intelligence Agent (`DocumentIntelligenceAgent`)
- **Role**: Coordinates deterministic parsing of PDF (digital & scanned), DOCX, CSV, XLSX, and images. Coordinates OCR, extracts mining metadata and structured KPIs (Production, OBR, Seams, HEMM, Safety), and creates overlapping searchable chunks.
- **Capabilities**: `DOCUMENT_CLASSIFICATION`, `OCR_COORDINATION`, `TEXT_EXTRACTION`, `TABLE_EXTRACTION`, `METADATA_EXTRACTION`, `CHUNKING`, `CHUNK_INDEXING`.

### 3. Retrieval / RAG Agent (`RetrievalAgent`)
- **Role**: Expands mining domain queries (e.g., OBR, ROM, HEMM, Seams), executes hybrid BM25 full-text match and Vector Cosine semantic search, applies Reciprocal Rank Fusion (RRF), and structures evidence envelopes.
- **Capabilities**: `KEYWORD_SEARCH`, `SEMANTIC_SEARCH`, `QUERY_EXPANSION`, `EVIDENCE_RANKING`, `PROVENANCE_MAPPING`.

### 4. Validation Agent (`ValidationAgent`)
- **Role**: Scans extracted structured records and retrieved evidence across disparate documents. Detects conflicting metrics for the same subsidiary, mine, or reporting period, computes variance percentages, determines severity (LOW, MEDIUM, HIGH), and flags uncertainties.
- **Capabilities**: `CROSS_DOCUMENT_VALIDATION`, `DISCREPANCY_DETECTION`, `NUMERICAL_VARIANCE_ANALYSIS`, `UNCERTAINTY_FLAGGING`.

### 5. Report Generation Agent (`ReportGenerationAgent`)
- **Role**: Synthesizes formal multi-section executive mining reports, extracts tabular key figures from verified database records, appends validation discrepancy caveats, and exports reports into HTML, PDF (via FPDF2), and DOCX formats.
- **Capabilities**: `REPORT_SYNTHESIS`, `TABULAR_GENERATION`, `EXECUTIVE_SUMMARY`, `PDF_DOCX_EXPORT`, `CITATION_ASSEMBLY`.

### 6. Government & Parliamentary Inquiry Agent (`GovernmentInquiryAgent`)
- **Role**: Deconstructs complex Lok Sabha / Rajya Sabha parliamentary questions and Standing Committee inquiries into structured sub-clauses, correlates retrieved evidence, includes discrepancy warnings, and formats official draft responses with mandatory `DRAFT — REQUIRES HUMAN VERIFICATION` banners.
- **Capabilities**: `PARLIAMENTARY_QA`, `MINISTRY_INQUIRY_DECOMPOSITION`, `EVIDENCE_GROUNDED_DRAFTING`, `VERIFICATION_WATERMARKING`, `CONFLICT_ANNOTATION`.

---

## 3. AI Provider Abstraction & Fallback Chain

```
                    ┌────────────────────────┐
                    │      AI SERVICE        │
                    │   Fallback Manager     │
                    └───────────┬────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ↓                     ↓                     ↓
┌──────────────────┐  ┌───────────────────┐  ┌──────────────────┐
│  GEMINI PROVIDER │  │OPEN MODEL PROVIDER│  │  DETERMINISTIC   │
│ (Primary Cloud)  │  │ (vLLM / Ollama)   │  │ (100% Offline)   │
└──────────────────┘  └───────────────────┘  └──────────────────┘
```

1. **Primary Provider (Google Gemini API)**: High-speed, high-reasoning cloud LLM (`gemini-3.8-flash`).
2. **Fallback Provider (Open-Weight Model)**: Standard OpenAI-compatible REST endpoint for local Ollama, vLLM, or cloud GPU instances.
3. **Deterministic Grounded Synthesizer**: Zero-cost, 100% local heuristic synthesis engine based strictly on regex matching, sentence boundary extraction, and fact-grounded templates. Never fabricates and ensures the platform is 100% functional offline without an API key or GPU!

---

## 4. SQLite Database Schema & Provenance Storage

- `documents`: Document catalog, subsidiary metadata, page counts, processing status.
- `document_chunks`: Text chunks with page number, section title, character offsets, token count.
- `extracted_data`: Structured mining figures with field category, raw value, normalized numeric value, unit, page, and excerpt.
- `validation_issues`: Cross-document discrepancies with Doc A vs Doc B values, variance %, severity, and status.
- `reports`: Generated reports with HTML content, JSON metadata, file paths, and human approval sign-off.
- `inquiries`: Parliamentary questions, draft responses, validation notes, and human verification badges.
- `agent_workflows`: Master workflow runs, initial prompts, start/end timestamps, and provenance DAG logs.
- `agent_tasks`: Granular sub-agent tasks with input data and evidence requirements.
- `agent_results`: Granular sub-agent results with evidence, confidence, warnings, errors, and execution metrics.
- `audit_logs`: Governance and security audit trail for all system activities.
