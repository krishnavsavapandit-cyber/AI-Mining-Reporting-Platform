# GeoNexus — AI-Powered Geological, Mining & Reporting Platform

> **Smart India Hackathon 2026** | **Problem Statement ID: SIH26023**  
> **Organization**: Ministry of Coal | **Department**: Coal India Limited (CIL) & CMPDI  
> **Category**: Software | **Theme**: Smart Automation

---

## Executive Summary

Coal India Limited (CIL) and its subsidiaries (*ECL, BCCL, CCL, WCL, SECL, MCL, NCL, CMPDI, NEC*) manage massive volumes of geological, operational, safety, statutory, and environmental records. These documents exist across heterogeneous formats: scanned borehole lithology logs, monthly extraction sheets, statutory DGMS safety records, overburden removal (OBR) contractor filings, and Parliamentary inquiries.

**GeoNexus** is an enterprise-grade AI intelligence platform designed specifically for CIL and CMPDI. Driven by an **8-Agent Multi-Agent Orchestration Architecture**, GeoNexus provides automated document ingestion, modular OCR preprocessing, domain KPI normalization, hybrid semantic retrieval with Reciprocal Rank Fusion (RRF), cross-document discrepancy detection, evidence-grounded report compilation (PDF/DOCX), and formal Parliamentary inquiry drafting with mandatory statutory verification watermarks.

---

## Problem Statement & Context

### The Challenge at CIL & CMPDI
1. **Heterogeneous & Unstructured Data Silos**: Mining records are scattered across multi-page PDFs, scanned legacy field reports, Excel workbooks, CSV tables, and Word documents across 8 operating subsidiaries.
2. **Cross-Document Discrepancies**: Disagreements frequently occur between provisional monthly mine-level reports and consolidated annual summaries (e.g., conflicting extraction figures, mismatched overburden volumes), leading to audit flags.
3. **High-Stakes Parliamentary & Ministry Q&A**: Preparing answers for Lok Sabha, Rajya Sabha, and Parliamentary Standing Committees demands rapid turnaround with 100% factual accuracy and verifiable citations back to physical pages.
4. **Hallucination Risk in Generic LLMs**: Standard generative AI tools fabricate figures when answering domain-specific mining queries without strict evidence bounds.
5. **Lack of Auditability & Provenance**: Decisions require transparent audit trails identifying which document, page, table, and agent produced every extracted metric.

---

## The GeoNexus Solution

GeoNexus replaces slow, manual document reconciliation with a verifiable multi-agent pipeline:

- **8 Specialized Collaborative Agents**: Supervised by a central `ManagerAgent` that plans dependency Directed Acyclic Graphs (DAGs), executes tasks concurrently via thread pools, enforces timeouts, and handles bounded retries.
- **Deterministic Extraction & Modular OCR**: High-accuracy parsing of PDFs, DOCX, XLSX, CSV, and scanned imagery with adaptive preprocessing (Otsu thresholding, deskew rotation, and quality detection).
- **Domain-Specific Mining Intelligence**: Automated unit normalization (MT, Tonnes, Lakh Tonnes, BCM), KPI computation (Stripping Ratio, LTIFR), and coal grade classification (GCV bands G1–G17).
- **Cross-Document Discrepancy Matrix**: Automated mathematical variance scanning `((|A-B|)/max(A,B))*100` that highlights conflicting figures side-by-side with severity levels.
- **Hard No-Hallucination Gate**: If retrieved evidence is insufficient or irrelevant, the system strictly outputs a refusal notice rather than synthesizing ungrounded numbers.
- **Independent Quality & Governance Gatekeeper**: `QualityGovernanceAgent` verifies physical document existence in the catalog, audits mathematical calculations, checks statutory watermarks, and issues explicit release gate decisions (`PASS`, `WARNING`, `REJECT`, `REQUIRES_HUMAN_REVIEW`).
- **Dual Database Architecture**: Production PostgreSQL with thread-local connection pooling and zero-config local SQLite fallback.
- **Dual Interface**: A modern React 19 + TypeScript SPA alongside a lightweight legacy Jinja web interface.

---

## Why GeoNexus (Key Differentiators)

| Feature | Generic Document Tools / RAG | GeoNexus Multi-Agent Platform |
| :--- | :--- | :--- |
| **Architecture** | Single-prompt LLM wrapper | **8-Agent Orchestrated DAG** with concurrent task execution |
| **Hallucination Defense** | Best-effort prompt instructions | **Hard No-Hallucination Gate** + `QualityGovernanceAgent` verification |
| **Data Discrepancies** | Ignored or silently blended | **Automated Cross-Document Variance Matrix** with side-by-side excerpts |
| **Evidence Traceability** | Generic document-level link | **Exact Page, Table & Text Excerpt Provenance** attached to every metric |
| **Domain Logic** | Generic text summarization | **Mining Domain Intelligence**: Stripping Ratio, LTIFR, Coal Grades (G1–G17), HEMM |
| **AI Reliability** | Single API dependency | **3-Tier Fallback Chain**: Gemini $\rightarrow$ Local Open-Source $\rightarrow$ Deterministic Engine |
| **Governance & Safety** | No statutory safeguards | **Mandatory Watermarks**, Role-Based Access Control, and Immutable Audit Trail |
| **Database Support** | Hardcoded single backend | **PostgreSQL Primary** with automatic **SQLite zero-config fallback** |

---

## System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Layer (React 19 + TypeScript SPA)"]
        UI_Overview["GeoNexus Overview"]
        UI_Docs["Document Intelligence Center"]
        UI_Search["Semantic Hybrid Search"]
        UI_Assistant["Mining AI Assistant"]
        UI_Discrepancy["Cross-Doc Discrepancy Matrix"]
        UI_Reports["Report Generator (PDF/DOCX)"]
        UI_Inquiry["Parliamentary Inquiries"]
        UI_Topics["Topic Clusters & Word Cloud"]
        UI_Analytics["Operational Analytics (Chart.js)"]
        UI_Monitor["8-Agent DAG Monitor"]
        UI_Audit["Audit Trail & Provenance"]
        UI_Settings["Settings & Health"]
    end

    subgraph APILayer["Flask API & Security Gateway"]
        AuthMW["RBAC Auth Middleware (Admin / Officer / Analyst / Viewer)"]
        Blueprints["11 REST Blueprints (Documents, Search, Query, Reports, etc.)"]
    end

    subgraph AgentLayer["8-Agent Multi-Agent Orchestration Subsystem"]
        Agent1["1. ManagerAgent (Orchestrator & DAG Scheduler)"]
        Agent2["2. DocumentIntelligenceAgent (Parser & OCR)"]
        Agent3["3. RetrievalAgent (BM25 + Semantic Vector RAG)"]
        Agent4["4. MiningIntelligenceAgent (KPIs, Units & Coal Grades)"]
        Agent5["5. ValidationAgent (Cross-Doc Discrepancy Scanner)"]
        Agent6["6. ReportGenerationAgent (Report Compiler)"]
        Agent7["7. GovernmentInquiryAgent (Parliamentary QA)"]
        Agent8["8. QualityGovernanceAgent (Release Gatekeeper)"]
    end

    subgraph ServiceLayer["Domain Services & Engines"]
        OCRService["Modular OCR Engine (Tesseract + Otsu + Deskew)"]
        ExtractService["Entity & Regex Extraction Service"]
        RetrievalService["Hybrid Retrieval Engine (BM25 + Cosine + RRF)"]
        ValidationService["Discrepancy & Variance Calculator"]
        ReportService["PDF (fpdf2) & DOCX (python-docx) Generators"]
        AIService["3-Tier AI Service Chain (Gemini / OpenModel / Deterministic)"]
    end

    subgraph DataLayer["Persistence & Storage Layer"]
        DBRouter["Database Abstraction Layer"]
        PG["PostgreSQL (Enterprise Primary)"]
        SQLite["SQLite (Local Fallback)"]
        VectorIdx["TF-IDF / BM25 Vector Store (vector_store/index.pkl)"]
        FileStore["Uploads & Generated Reports Storage"]
    end

    ClientLayer -->|HTTP / JSON REST API| AuthMW
    AuthMW --> Blueprints
    Blueprints --> AgentLayer
    AgentLayer <--> ServiceLayer
    ServiceLayer <--> DBRouter
    DBRouter --> PG
    DBRouter --> SQLite
    ServiceLayer <--> VectorIdx
    ServiceLayer <--> FileStore
```

---

## Multi-Agent Workflow

GeoNexus implements a true multi-agent system comprising **8 specialized agents**, each with dedicated capabilities, formal contracts, and structured handoffs.

```mermaid
flowchart TD
    UserReq(["User Query / Document Upload / Report Request"]) --> Agent1

    subgraph Orchestration["Manager Agent Execution"]
        Agent1["Agent 1: ManagerAgent<br/>• Intent Planning<br/>• DAG Scheduling<br/>• Concurrency Pool<br/>• Timeout & Retry Handler"]
    end

    subgraph ParallelPhase["Parallel Ingestion / Retrieval / Domain Phase"]
        Agent2["Agent 2: DocumentIntelligenceAgent<br/>• Multi-format Parsing<br/>• Modular OCR Subsystem<br/>• Chunking & Indexing"]
        Agent3["Agent 3: RetrievalAgent<br/>• Query Expansion<br/>• BM25 + Vector Cosine<br/>• Reciprocal Rank Fusion"]
        Agent4["Agent 4: MiningIntelligenceAgent<br/>• Unit Normalization<br/>• Stripping Ratio & LTIFR<br/>• Coal Grades (G1-G17)"]
    end

    subgraph VerificationPhase["Cross-Document Validation Phase"]
        Agent5["Agent 5: ValidationAgent<br/>• Mathematical Variance Scan<br/>• Severity Scoring<br/>• Conflict Evidence Annotation"]
    end

    subgraph SynthesisPhase["Synthesis & Output Phase"]
        Agent6["Agent 6: ReportGenerationAgent<br/>• Executive Summary Synthesis<br/>• Tabular Figures & Caveats<br/>• PDF / DOCX Compilers"]
        Agent7["Agent 7: GovernmentInquiryAgent<br/>• Parliamentary Q&A Structuring<br/>• Mandatory Watermark Injection<br/>• Human Sign-Off Preparation"]
    end

    subgraph QualityGate["Governance & Release Gate"]
        Agent8["Agent 8: QualityGovernanceAgent<br/>• Schema Completeness Check<br/>• Catalog & Page Existence Audit<br/>• Calculation Recalculation<br/>• Release Decision (PASS / WARNING / REJECT / HITL)"]
    end

    Agent1 -->|Decomposes Intent| ParallelPhase
    Agent2 & Agent3 & Agent4 -->|Accumulated Evidence & Facts| Agent5
    Agent5 -->|Validated Data + Conflict Caveats| SynthesisPhase
    SynthesisPhase -->|Draft Artifacts & Outputs| Agent8
    Agent8 -->|Release Gate Audit Report| Agent1
    Agent1 -->|Final Response + Provenance DAG| Output(["User Interface Display & Artifact Export"])
```

### Detailed Agent Directory

| # | Agent Name | Primary Responsibility | Inputs | Outputs |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **`ManagerAgent`** | Central orchestrator; constructs execution DAGs, manages thread pool concurrency, enforces timeouts, orchestrates bounded retries, and tracks provenance. | Intent string, raw parameters, workflow context | Orchestrated execution plan, assembled `WorkflowContext`, provenance DAG |
| **2** | **`DocumentIntelligenceAgent`** | Deterministic document parsing (PDF, DOCX, XLSX, CSV, images), modular OCR execution, chunk extraction, and vector store updates. | File path, document metadata, OCR settings | Extracted text, structured page chunks, OCR quality metrics, entity records |
| **3** | **`RetrievalAgent`** | Domain-expanded hybrid retrieval combining keyword matching (BM25) and semantic TF-IDF vector similarity via Reciprocal Rank Fusion (RRF). | Search query, top-k limit, subsidiary / document filters | Ranked list of `EvidenceItem` objects with relevance scores and page citations |
| **4** | **`MiningIntelligenceAgent`** | Mining domain entity extraction, unit normalization (MT, Tonnes, Lakh Tonnes, BCM), KPI calculations (Stripping Ratio, LTIFR), and coal grade mapping (G1–G17). | Raw text, accumulated evidence, mine / subsidiary identifiers | Structured domain facts, normalized metrics, calculated mining KPIs |
| **5** | **`ValidationAgent`** | Cross-document consistency verification; detects numerical discrepancies across reports, calculates percentage variance, and tags conflict severity. | Subsidiary filter, reporting period, extracted metrics | Detected discrepancy matrix, variance percentages, severity tags (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| **6** | **`ReportGenerationAgent`** | Multi-section executive mining report compiler; generates narrative sections, embeds key figures tables, includes discrepancy notices, and creates PDF/DOCX exports. | Report type, title, accumulated evidence, discrepancy caveats | Compiled report content, tabular data, downloadable PDF (`fpdf2`) and DOCX (`python-docx`) files |
| **7** | **`GovernmentInquiryAgent`** | Formulates formal responses for Lok Sabha, Rajya Sabha, and Ministry inquiries; grounds answers in verified evidence and applies mandatory statutory watermarks. | Parliamentary question, inquiry reference, validation warnings | Formal draft answer, evidence summary table, `DRAFT — REQUIRES HUMAN VERIFICATION` watermark |
| **8** | **`QualityGovernanceAgent`** | Independent release gatekeeper; validates schema contracts, verifies that cited pages physically exist in the catalog, recalculates mathematical variances, and decides release readiness. | Upstream `AgentResult` objects, user role, accumulated citations | Quality audit report, check lists, violations/warnings, release decision (`PASS`, `WARNING`, `REJECT`, `REQUIRES_HUMAN_REVIEW`) |

---

## End-to-End Workflow

```
[Raw Document / Scanned Report]
       │
       ▼
1. INGESTION & OCR
   ├── File format detection (PDF, DOCX, XLSX, CSV, Images)
   ├── SHA-256 byte-level deduplication
   └── Modular OCR (Otsu binarization, deskew rotation, quality scoring)
       │
       ▼
2. EXTRACTION & CHUNKING
   ├── Deterministic table and metadata extraction
   ├── Structured text chunking with page number & character offsets
   └── Vector index embedding & BM25 inverted index update
       │
       ▼
3. AGENT ORCHESTRATION (ManagerAgent)
   ├── Intent decomposition & DAG construction
   ├── Concurrent execution via ThreadPoolExecutor
   └── Timeout & bounded retry monitoring
       │
       ▼
4. HYBRID RETRIEVAL & DOMAIN NORMALIZATION
   ├── Domain vocabulary query expansion
   ├── BM25 + Cosine similarity fusion (RRF)
   └── Mining entity normalization (MT, BCM, Stripping Ratio, GCV bands)
       │
       ▼
5. CROSS-DOCUMENT VALIDATION
   ├── Pairwise metric comparison across documents
   ├── Variance calculation: ((|A - B|) / max(|A|, |B|)) * 100
   └── Conflict severity classification (Low / Medium / High / Critical)
       │
       ▼
6. SYNTHESIS & REPORTING
   ├── Grounded AI / Deterministic synthesis
   ├── Executive summary & multi-section narrative generation
   └── Parliamentary Q&A drafting with mandatory statutory watermarking
       │
       ▼
7. QUALITY GOVERNANCE RELEASE GATE
   ├── Output schema contract validation
   ├── Citation existence check against physical catalog
   ├── Recalculation audit & negative quantity check
   └── Release gate decision (PASS / WARNING / REJECT / HITL)
       │
       ▼
8. PERSISTENCE & AUDIT TRAIL
   ├── PostgreSQL / SQLite transactional commit
   ├── Complete Provenance DAG serialized to database
   └── Immutable audit log recorded with RBAC attribution
```

---

## Evidence Grounding & Provenance Architecture

Every extracted fact, search result, AI answer, and report section in GeoNexus is tied to an explicit `EvidenceItem` structure:

```python
class EvidenceItem:
    document_id: int          # Database primary key
    document_name: str        # e.g., "ECL_Rajmahal_Monthly_Production_May_2025.pdf"
    page_number: int          # Physical page number (1-indexed)
    section_title: str        # e.g., "Table 3: Overburden & Coal Extraction"
    source_text: str          # Exact verbatim excerpt
    relevance_score: float    # RRF fused similarity score (0.0 to 1.0)
    confidence: float         # Extraction / OCR confidence (0.0 to 1.0)
    producing_agent: str      # Name of the agent that extracted the evidence
```

### Full Provenance DAG Tracking
Workflows generate a complete Directed Acyclic Graph (DAG) saved to `agent_workflows.provenance_dag_json`. Each node represents an input file, task execution, evidence extraction, or quality gate, connected by explicit relationship edges (`DERIVED_FROM`, `EXTRACTED_FROM`, `VALIDATED_BY`, `CITED_BY`, `APPROVED_BY`).

---

## Validation & Discrepancy Detection Engine

When multiple documents report on the same operational entity (e.g., subsidiary, mine, reporting period, metric), the `ValidationAgent` executes automated cross-document comparisons:

$$\text{Variance Percentage} = \frac{|V_A - V_B|}{\max(|V_A|, |V_B|)} \times 100$$

### Severity Thresholds
- **LOW** ($\le 2\%$): Minor operational variance (e.g., rounding differences).
- **MEDIUM** ($2\% < \text{Variance} \le 5\%$): Noticeable variance flagged for review.
- **HIGH** ($5\% < \text{Variance} \le 10\%$): Significant conflict; caveats automatically embedded into reports.
- **CRITICAL** ($> 10\%$): Major data contradiction; triggers mandatory Human-in-the-Loop (HITL) review.

---

## AI Provider Architecture & Cascading Fallback

GeoNexus implements a 3-tier cascading fallback chain ensuring the platform remains **100% operational in any environment** (cloud, on-premise air-gapped server, or local offline development):

```
       ┌────────────────────────────────────────────────────────┐
       │             User Query / Report Request                │
       └──────────────────────────┬─────────────────────────────┘
                                  │
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │   Tier 1: Google Gemini API (gemini-3.8-flash)         │
       │   • High-speed cloud reasoning & synthesis             │
       └──────────────────────────┬─────────────────────────────┘
                                  │ (On Timeout / Rate Limit / No Key)
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │   Tier 2: Open-Source / Local LLM                      │
       │   • Ollama / vLLM / OpenAI-compatible endpoint         │
       │   • e.g. Llama-3.2, Mistral, Qwen                      │
       └──────────────────────────┬─────────────────────────────┘
                                  │ (On Connection Refusal / Offline)
                                  ▼
       ┌────────────────────────────────────────────────────────┐
       │   Tier 3: Deterministic Grounded Engine                │
       │   • 100% Offline Rule-Based Extraction & Synthesis     │
       │   • Zero API keys, zero network, zero cost             │
       │   • Strictly grounded in verified document excerpts    │
       └────────────────────────────────────────────────────────┘
```

### Hard No-Hallucination Gate
If retrieved evidence does not contain sufficient discriminating keywords or relevance score is below threshold, `AIService` strictly returns:
> *"Insufficient information found in the available documents."*

The platform never hallucinates or fabricates mining figures.

---

## Key Implemented Features

- **Document Processing**: Ingestion of PDF, DOCX, XLSX, CSV, and image files with SHA-256 byte-level deduplication.
- **Modular OCR Subsystem**: Grayscale conversion, Otsu binarization, deskew rotation, and quality detection with Tesseract routing.
- **Semantic & Hybrid Search**: BM25 keyword search combined with TF-IDF vector cosine similarity using Reciprocal Rank Fusion.
- **AI Mining Intelligence Assistant**: Grounded conversational interface with live sub-agent trace steps, evidence drawer, and citation pills.
- **Cross-Document Discrepancy Matrix**: Side-by-side excerpt comparisons with variance calculations and resolution tracking.
- **Automated Report Generation**: Multi-section executive reports with embedded key figures, discrepancy caveats, and export to PDF and DOCX.
- **Parliamentary & Ministry Inquiries**: Lok Sabha / Rajya Sabha draft generation with mandatory `DRAFT — REQUIRES HUMAN VERIFICATION` watermarking and officer sign-off.
- **Dynamic Topic Clustering & Word Cloud**: Term frequency analysis, topic cluster grouping, and an interactive HTML5 canvas mining word cloud.
- **Operational Analytics**: Chart.js visualizations for production trends, target vs. actual extraction, and safety metrics.
- **Multi-Agent Orchestrator Monitor**: Real-time agent status, health probes, latency tracking, interactive DAG visualization, and HITL pause/resume controls.
- **Security & RBAC**: Role-Based Access Control supporting `ADMIN`, `OFFICER`, `ANALYST`, and `VIEWER` roles with path traversal protection and audit logging.

---

## User Interface (GeoNexus React SPA)

The frontend is built with React 19, TypeScript, Vite, and Vanilla CSS (Dark Glassmorphism theme):

| Page / Navigation Tab | Purpose & Features |
| :--- | :--- |
| **GeoNexus Overview** | Executive landing page with 4 KPI cards, Quality Gate status, recent workflows, and quick actions. |
| **Document Intelligence** | Ingestion hub, multi-format file upload, deduplication detector, OCR quality badges, and extracted entity viewer. |
| **Semantic & Hybrid Search** | Natural language keyword + semantic search with relevance score pills and page snippet previews. |
| **AI Mining Assistant** | Grounded conversational Q&A, sub-agent execution timeline, evidence drawer, and citation badges. |
| **Discrepancy Center** | Cross-document conflict matrix with side-by-side document excerpts, variance percentage badges, and resolution workflow. |
| **Report Generator** | Production, geological, safety, and equipment report synthesis with PDF (`.pdf`) and Word (`.docx`) exports. |
| **Parliamentary Inquiries** | Lok Sabha / Rajya Sabha Q&A drafter with statutory verification watermark and officer sign-off modal. |
| **Topics & Word Cloud** | Dynamic topic clusters and an interactive HTML5 canvas word cloud with subsidiary filtering. |
| **Operational Analytics** | Interactive Chart.js graphs: Coal production by subsidiary, Target vs. Actual, and Safety KPIs. |
| **8-Agent DAG Monitor** | Real-time agent health monitors, task execution history, interactive DAG modal, and pause/resume buttons. |
| **Audit Trail & Provenance** | Searchable audit event log with user role attribution, IP address, timestamp, and JSON payloads. |
| **System Settings & Health** | AI provider health status (Gemini, OpenModel, Deterministic), database configuration info, and demo data seeder. || **AI Providers** | Google Gemini, Open-Model, Deterministic | `gemini-3.8-flash`, Ollama / vLLM, Offline Synthesizer |
| **Backend Testing** | Python `unittest` | 117 automated unit, integration, and failure injection tests |
| **Frontend Testing** | Vitest + React Testing Library | Vitest `^3.0.5`, `@testing-library/react ^16.2.0` |

---

## Database & Persistence Architecture

GeoNexus implements a dual-backend abstraction layer with identical logical schemas across PostgreSQL and SQLite:

- **PostgreSQL (Primary / Enterprise Production)**:
  - Supports thread-local pooling, parameterized queries via `%s` translation, and automated column migrations.
  - Configured via standard connection URL: `postgresql://USER:PASSWORD@HOST:PORT/DBNAME`.
- **SQLite (Fallback / Local Development)**:
  - Zero-configuration local database at `database/mining_platform.db` with WAL journal mode and 30-second busy timeout.

### Complete Schema (13 Relational Tables)
1. `documents`: Ingested file metadata, SHA-256 checksums, page counts, subsidiary, mine, and processing status.
2. `document_chunks`: Text chunks with page numbers, character start/end offsets, and token counts.
3. `extracted_data`: Structured metrics (production, OBR, ash %, moisture %, stripping ratio) with confidence scores.
4. `topics`: Discovered topic clusters with keyword frequencies and coherence scores.
5. `queries`: Query history, AI responses, execution latencies, and evidence counts.
6. `reports`: Generated reports with HTML content, summary, and PDF/DOCX file paths.
7. `inquiries`: Parliamentary questions, parsed requirements, draft responses, and human approval status.
8. `validation_issues`: Cross-document discrepancies with Doc A vs. Doc B values, variance percentages, and severity.
9. `agent_workflows`: Multi-agent execution tracking with provenance DAG JSON, quality reports, and pause states.
10. `agent_tasks`: Granular task executions with agent assignments, dependency JSON, and retry counters.
11. `agent_results`: Structured task outputs, confidence scores, evidence arrays, warnings, and errors.
12. `workflow_checkpoints`: Human-in-the-loop pause/resume checkpoints with state snapshots.
13. `audit_logs`: Immutable security audit log with user role, action type, resource ID, and JSON details.

---

## REST API Summary

| Category | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Documents** | `POST` | `/api/documents/upload` | Upload and process single/multiple documents with deduplication |
| | `POST` | `/api/documents/seed` | Ingest synthetic CIL demonstration documents |
| | `GET` | `/api/documents` | List uploaded documents with subsidiary/status filters |
| | `GET` | `/api/documents/<id>` | Fetch document details, chunks, and extracted entities |
| | `DELETE` | `/api/documents/<id>` | Delete document and cascading chunks/facts (Requires Admin/Officer) |
| | `GET` | `/api/documents/download/<id>` | Download original document file |
| **Search** | `POST` | `/api/search` | Execute hybrid search (BM25 + Vector Cosine with RRF) |
| **AI Assistant** | `POST` | `/api/query` | Execute grounded Q&A query via 8-agent orchestration pipeline |
| | `GET` | `/api/query/history` | Retrieve historical queries and answers |
| **Reports** | `POST` | `/api/reports/generate` | Generate executive mining report via `ReportGenerationAgent` |
| | `GET` | `/api/reports` | List generated reports |
| | `GET` | `/api/reports/<id>` | Get report details |
| | `GET` | `/api/reports/download/<id>/<fmt>` | Download compiled report as `pdf` or `docx` |
| **Inquiries** | `POST` | `/api/inquiries/generate` | Draft evidence-grounded parliamentary answer |
| | `GET` | `/api/inquiries` | List parliamentary inquiries |
| | `POST` | `/api/inquiries/<id>/approve` | Formal officer sign-off and approval |
| **Validation** | `GET` | `/api/validation/issues` | Retrieve cross-document discrepancies |
| | `POST` | `/api/validation/run` | Trigger cross-document validation scan |
| | `POST` | `/api/validation/resolve/<id>` | Resolve or acknowledge discrepancy |
| **Analytics** | `GET` | `/api/analytics/summary` | Fetch top-level KPIs (Total docs, Coal MT, OBR, Conflicts) |
| | `GET` | `/api/analytics/charts` | Retrieve trend chart datasets for Chart.js |
| **Topics** | `GET` | `/api/topics` | Get discovered topic clusters |
| | `GET` | `/api/topics/wordcloud` | Retrieve mining word cloud frequencies |
| **Agents** | `GET` | `/api/agents/status` | Real-time health and task metrics for all 8 agents |
| | `GET` | `/api/agents/workflows` | List multi-agent execution workflows |
| | `GET` | `/api/agents/workflows/<id>` | Retrieve workflow provenance DAG and quality report |
| | `POST` | `/api/agents/workflows/<id>/pause` | Pause running workflow for human intervention |
| | `POST` | `/api/agents/workflows/<id>/resume` | Resume paused workflow |
| | `POST` | `/api/agents/workflows/<id>/cancel` | Cancel active workflow |
| **Settings** | `GET` | `/api/settings` | Retrieve database connection and AI provider health |
| | `POST` | `/api/settings/provider` | Update active AI provider configuration |
| **Audit** | `GET` | `/api/audit/logs` | Query immutable audit log records |

---

## Automated Test Suite

GeoNexus includes **125 automated tests** across the backend and frontend with a 100% pass rate.

```
----------------------------------------------------------------------
Backend: Ran 117 tests in 30.049s — OK (skipped=1)
Frontend: Ran 8 tests in 3 files — OK (100% passed)
----------------------------------------------------------------------
Total: 125 Automated Tests
```

### Key Test Suites Breakdown
1. **`test_8_agent_orchestration.py`**: Validates 8-agent DAG scheduling, dependency resolution, parallel execution, timeout enforcement, failure handling, and the complete Rajmahal E2E workflow.
2. **`test_failure_injection.py`** (20 tests): Injects simulated faults (agent timeouts, corrupted PDFs, multi-delimiter CSVs, circular DAGs, invalid calculations, missing evidence) to verify zero hallucination and graceful recovery.
3. **`test_database_abstraction.py`** (16 tests): Validates PostgreSQL adapter, cursor context manager (`__enter__`/`__exit__`), connection wrapper, executescript, SQLite fallback, credential masking, and migration dry run.
4. **`test_ocr_advanced.py`**: Tests Otsu binarization, preprocessing filters, deskew rotation, image quality detector, and multi-pass OCR routing.
5. **`test_security_rbac.py`**: Validates role enforcement (`ADMIN`, `OFFICER`, `ANALYST`, `VIEWER`), path traversal blocks on file downloads, and audit logging.
6. **`test_kpi_framework.py` & `test_validation_engine.py`**: Tests mathematical variance calculation, severity assignment, and mining KPI normalization.

### Running Backend Tests
```bash
# Run the complete test suite
python -m unittest discover -s tests -v

# Run the 8-Agent Orchestration & Rajmahal E2E test
python -m unittest tests.test_8_agent_orchestration.Test8AgentOrchestration.test_e2e_rajmahal_discrepancy_demo_workflow -v

# Run the 20-case Failure Injection suite
python -m unittest tests.test_failure_injection -v
```

### Running Frontend Tests & Production Build
```bash
cd frontend
npm test
npm run build
cd ..
```

---

## Local Development & Setup Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.10 – 3.14 on Windows, Linux, macOS)
- Node.js 18+ and npm (for frontend build)
- Optional: Tesseract OCR (`tesseract` in system PATH for scanned image OCR)
- Optional: PostgreSQL 12+ (if testing PostgreSQL locally; SQLite is default)

### 1. Clone the Repository
```bash
git clone https://github.com/krishnavsavapandit-cyber/AI-Mining-Reporting-Platform.git
cd AI-Mining-Reporting-Platform
```

### 2. Backend Setup
```bash
# Create and activate a virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup & Build
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Configure Environment Variables (Optional)
Copy `.env.example` to `.env` to configure external AI keys or PostgreSQL (zero-config defaults work automatically):
```bash
# Windows:
copy .env.example .env
# Linux/macOS:
cp .env.example .env
```

### 5. Start the Application
```bash
python app.py
```
Open your browser at `http://localhost:5000` to access the GeoNexus platform.

---

## Production Deployment Configuration

GeoNexus is pre-configured for one-click deployment on platforms such as **Render**:

- **Gunicorn Production Server**: Configured in `gunicorn.conf.py` with dynamic port binding (`$PORT`), 2 sync worker processes (optimized for 512MB RAM free-tier instances), and a 120-second timeout for LLM/OCR workloads.
- **Frontend SPA Serving**: Flask serves the pre-built React SPA directly from `frontend/dist/` with asset routing.
- **PostgreSQL Ready**: Simply supply `DATABASE_URL` in the hosting environment settings. The platform automatically detects PostgreSQL and executes schema initialization and migrations on startup.

### Render Build & Start Commands
- **Build Command**: `pip install -r requirements.txt && cd frontend && npm install && npm run build && cd ..`
- **Start Command**: `gunicorn -c gunicorn.conf.py app:app`

---

## Environment Variables Reference

| Variable | Description | Default Value | Required? |
| :--- | :--- | :---: | :---: |
| `PORT` | Web server listening port | `5000` (Local) / `10000` (Render) | Optional |
| `SECRET_KEY` | Flask session encryption key | `sih26023-coal-india-secret-key-2026` | Optional |
| `DATABASE_URL` | PostgreSQL connection URL (defaults to SQLite if unset) | `""` (Uses SQLite fallback) | Optional |
| `AI_PROVIDER` | Preferred AI provider (`gemini`, `open_model`, `deterministic`) | `gemini` | Optional |
| `AI_FALLBACK_PROVIDER` | Secondary AI provider | `open_model` | Optional |
| `GEMINI_API_KEY` | Google Gemini API Key for Tier 1 cloud AI | `""` (Falls back to Tier 2/3) | Optional |
| `GEMINI_MODEL` | Gemini model identifier | `gemini-3.8-flash` | Optional |rom `frontend/dist/` with asset routing.
- **PostgreSQL Ready**: Simply supply `DATABASE_URL` in the hosting environment settings. The platform automatically detects PostgreSQL and executes schema initialization and migrations on startup.

### Render Build & Start Commands
- **Build Command**: `pip install -r requirements.txt && cd frontend && npm install && npm run build && cd ..`
- **Start Command**: `gunicorn -c gunicorn.conf.py app:app`

---

## Environment Variables Reference

| Variable | Description | Default Value | Required? |
| :--- | :--- | :---: | :---: |
| `PORT` | Web server listening port | `5000` (Local) / `10000` (Render) | Optional |
| `SECRET_KEY` | Flask session encryption key | `sih26023-coal-india-secret-key-2026` | Optional |
| `DATABASE_URL` | PostgreSQL connection URL (defaults to SQLite if unset) | `""` (Uses SQLite fallback) | Optional |
| `AI_PROVIDER` | Preferred AI provider (`gemini`, `open_model`, `deterministic`) | `gemini` | Optional |
| `AI_FALLBACK_PROVIDER` | Secondary AI provider | `open_model` | Optional |
| `GEMINI_API_KEY` | Google Gemini API Key for Tier 1 cloud AI | `""` (Falls back to Tier 2/3) | Optional |
| `GEMINI_MODEL` | Gemini model identifier | `gemini-2.0-flash` | Optional |
| `OPEN_MODEL_ENDPOINT` | Endpoint for local/remote OpenAI-compatible LLM (Ollama/vLLM) | `http://localhost:11434/v1/chat/completions` | Optional |
| `OPEN_MODEL_NAME` | Model name for open-model endpoint | `llama3.2:3b` | Optional |
| `TESSERACT_CMD` | System path to Tesseract executable | `tesseract` | Optional |
| `ADVANCED_OCR_ENABLED`| Enable image preprocessing and deskew filters | `true` | Optional |
| `MAX_CONTENT_LENGTH` | Maximum upload file size in bytes | `52428800` (50 MB) | Optional |

---

## Recommended Step-by-Step Demo Workflow (For SIH Judges)

To evaluate the complete working capability of GeoNexus in 5 minutes:

1. **Dashboard Overview**:
   - Open the web application. Note the 4 Hero Metric Cards (Total Documents, Production MT, Overburden BCM, Discrepancies Flagged) and the Quality Release Gate badge.
2. **One-Click Synthetic Data Seeding**:
   - Click **"Seed Demo Documents"** on the top bar. This instantly loads verified synthetic operational documents covering ECL, BCCL, SECL, WCL, and CMPDI.
3. **Document Intelligence Center**:
   - Navigate to **Document Intelligence**. Inspect ingested PDF and spreadsheet files, view OCR quality badges, and click **Inspect** on `ECL_Rajmahal_Monthly_Production_May_2025.pdf` to see extracted chunks, page numbers, and structured entity tags.
4. **Inspect the Discrepancy Matrix**:
   - Navigate to **Discrepancy Center**. Observe the flagged discrepancy between `ECL_Rajmahal_Monthly_Production_May_2025.pdf` (1.32 MT) and `ECL_Annual_Production_Summary_Discrepancy_Check_2025.pdf` (1.28 MT). Review the 3.03% variance calculation and side-by-side excerpts.
5. **AI Assistant with Live Sub-Agent Trace**:
   - Navigate to **AI Assistant**. Ask: *"What was the coal production in ECL Rajmahal during May 2025?"*
   - Watch the live sub-agent trace steps (`RetrievalAgent` $\rightarrow$ `MiningIntelligenceAgent` $\rightarrow$ `ValidationAgent` $\rightarrow$ `QualityGovernanceAgent`), inspect the exact page citation badges, and view the discrepancy warning.
6. **Generate an Official Executive Report**:
   - Navigate to **Report Generator**. Select *Consolidated Mining Production Report* for ECL and click **Generate Official Report**.
   - Review the compiled executive summary, key figures table, and embedded discrepancy caveats. Click **Download PDF** or **Download DOCX** to inspect the exported document.
7. **Parliamentary Inquiries with Watermarking**:
   - Navigate to **Parliamentary Inquiries**. Load *Lok Sabha Starred Question No. 142* regarding Rajmahal extraction.
   - Click **Draft Response**. Note the mandatory `DRAFT — REQUIRES HUMAN VERIFICATION` watermark and click **Sign-Off & Approve** using the officer workflow.
8. **Inspect the 8-Agent Orchestrator Monitor**:
   - Navigate to **Agent Monitor**. View all 8 registered agents, check individual health metrics, and click **Inspect DAG** on the latest workflow to view the interactive provenance graph.

---

## SIH26023 Alignment & Innovation Summary

- **Problem Statement ID**: SIH26023
- **Organization**: Ministry of Coal / Coal India Limited (CIL) & CMPDI
- **Core Innovation**:
  1. **8-Agent DAG Orchestration** replacing simple prompt wrappers with deterministic planning, parallel execution, and strict governance.
  2. **Independent Quality Gatekeeper (`QualityGovernanceAgent`)** enforcing evidence existence, calculation recalculation, and statutory compliance.
  3. **Automated Cross-Document Discrepancy Matrix** detecting numerical conflicts across reports.
  4. **3-Tier AI Fallback Chain** ensuring 100% offline functionality without API keys.
  5. **Dual Database Architecture** with seamless SQLite fallback and enterprise PostgreSQL support.

---

## Future Scope

- **Multilingual Support**: Ingestion and synthesis in regional languages (Hindi, Bengali, Odia) for field reports across mining subsidiaries.
- **SCADA & IoT Telemetry Ingestion**: Real-time streaming ingestion from dispatch control systems, conveyor weightometers, and HEMM GPS trackers.
- **GIS & Satellite Map Integration**: Direct overlay of borehole lithology and extraction boundaries onto CMPDI geospatial mine plans.
- **Enterprise SSO & Active Directory**: Integration with CIL single-sign-on and LDAP directories.

---

## Project Status

- **Status**: Complete, Functional Prototype & Tested Codebase
- **Backend Test Coverage**: 117 tests (100% pass rate)
- **Frontend Test Coverage**: 8 tests across 3 suites (100% pass rate)
- **Deployment Status**: Production-ready on Render with Gunicorn WSGI & PostgreSQL adapter
- **Demo Data**: Includes complete synthetic test suite with zero real CIL proprietary data.

---

## License & Attribution

Developed for **Smart India Hackathon 2026** under Problem Statement **SIH26023**.  
All sample files and entities are synthetic demonstration data: `SYNTHETIC DEMONSTRATION DATA — NOT OFFICIAL CIL DATA`.
