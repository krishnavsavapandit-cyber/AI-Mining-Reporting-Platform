# SIH26023 — AI-Powered Geological, Mining & Reporting Solution for CMPDI / Coal India Limited

> **Smart India Hackathon 2026** | **Problem Statement ID: SIH26023**  
> **Organization**: Ministry of Coal | **Department**: Coal India Limited (CIL)  
> **Category**: Software | **Theme**: Smart Automation

---

## Executive Summary

Coal India Limited (CIL) subsidiaries (*ECL, BCCL, CCL, WCL, SECL, MCL, NCL, CMPDI, NEC*) handle immense volumes of geological, mining, production, and administrative records scattered across digital PDFs, scanned reports, DOCX files, Excel spreadsheets, CSVs, and historical archives.

This platform provides a **unified AI document intelligence, semantic retrieval, cross-document discrepancy validation, and automated reporting suite** driven by a **genuine Multi-Agent Architecture**.

---

## Key Features

1. **Multi-Agent Orchestration**:
   - **Manager Agent**: Workflow planner, task dispatcher, and provenance DAG coordinator.
   - **Document Intelligence Agent**: Deterministic multi-format extraction (PDF, DOCX, CSV, XLSX, Images), OCR coordination, mining entity extraction, and chunking.
   - **Retrieval / RAG Agent**: Domain-expanded hybrid BM25 + Vector Cosine similarity retrieval with Reciprocal Rank Fusion.
   - **Validation Agent**: Cross-document discrepancy scanner, variance % calculator, and conflict alerter.
   - **Report Generation Agent**: Multi-format executive compiler with tabular figures, caveat notices, and PDF/DOCX exports.
   - **Government Inquiry Agent**: Parliamentary Q&A assistant with mandatory `DRAFT — REQUIRES HUMAN VERIFICATION` badges and evidence citations.
2. **AI Provider Abstraction & Fallback Chain**:
   - **Primary**: Google Gemini API (`gemini-2.0-flash`).
   - **Fallback**: Open-source / open-weight models (vLLM, Ollama, OpenAI-compatible).
   - **Offline / Local**: Deterministic Grounded Synthesizer (100% functional without API keys or internet connection).
3. **Interactive Visualizations**:
   - Live Multi-Agent Workflow Execution Step Visualizer.
   - Interactive HTML5 Canvas Mining Word Cloud.
   - Dynamic Topic Clusters.
   - Real-time Analytics with Chart.js (Production trends, Target vs Actual, Safety KPIs).
   - Cross-Document Discrepancy Matrix with side-by-side excerpt comparisons.

---

## Multi-Agent Architecture

```
                             ┌──────────────────────────────┐
                             │        MANAGER AGENT         │
                             │  Orchestrator / Provenance   │
                             └──────────────┬───────────────┘
                                            │
        ┌───────────────────────────────────┼──────────────────────────────────┐
        │                                   │                                  │
        ↓                                   ↓                                  ↓
┌───────────────────────┐       ┌───────────────────────┐          ┌───────────────────────┐
│ DOCUMENT INTELLIGENCE │       │    RETRIEVAL / RAG    │          │      VALIDATION       │
│        AGENT          │       │         AGENT         │          │         AGENT         │
│ (OCR, Parsers, Chunks)│       │(BM25 + Semantic Cosine│          │ (Cross-Doc Discrepancy│
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

## Database Architecture & Dual-Backend Support

The platform implements a unified database abstraction layer supporting **PostgreSQL as Primary/Enterprise** and **SQLite as Local Development/Fallback**:

```
                  SIH26023 Flask Application
                             │
                       Service Layer
                             │
                      Database Layer
                             │
              ┌──────────────┴──────────────┐
              │                             │
        PostgreSQL                       SQLite
         PRIMARY                       FALLBACK/DEV
      (Production DB)                (Local Zero-Config)
              │                             │
              └──────────────┬──────────────┘
                             │
                  Same Logical Schema (12 Tables)
                             │
              Agents / RAG / OCR / Reports / Analytics
```

---

## Getting Started & Local Setup

### 1. Requirements
- Python 3.10+ (Tested on Python 3.14 on Windows/Linux/macOS)
- No GPU required! Pure CPU-friendly design.

### 2. Installation
```bash
# Clone or navigate to repository
cd c:/Users/admin/OneDrive/Desktop/mining

# Install dependencies (includes Flask, PyMuPDF, PIL, psycopg, pandas, python-docx, fpdf2)
pip install -r requirements.txt
```

### 3. Option A: SQLite Quick Start (Default / Zero-Config)
No database setup or environment variables are required! The application automatically initializes a local SQLite database at `database/mining_platform.db`:
```bash
# Start Flask server
python app.py
```

### 4. Option B: PostgreSQL Setup (Enterprise / Production)
1. **Install PostgreSQL** (v12+) and create a database:
   ```sql
   CREATE DATABASE sih26023;
   ```
2. **Configure `DATABASE_URL`** in your `.env` file (see `.env.example`):
   ```bash
   DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/sih26023
   ```
3. **(Optional) Migrate Existing SQLite Data to PostgreSQL**:
   ```bash
   python -m database.migrate_to_postgres --pg-url postgresql://USER:PASSWORD@localhost:5432/sih26023
   ```
4. **Start Flask server**:
   ```bash
   python app.py
   ```
5. **Verify Database Health**:
   Navigate to `http://localhost:5000/api/health` — it will report `"database": "postgresql", "database_connected": true`.

---

## Demonstration Workflow (Step-by-Step)

1. **Dashboard Overview**: Inspect empirical KPIs (Total Documents, Production MT, OBR volume, Discrepancies).
2. **Seed Demo Data**: Click **"Seed Demo Documents"** on the top bar to ingest pre-generated ECL, BCCL, SECL, WCL, and CMPDI sample files.
3. **Document Center**: View parsed files, inspect extracted facts, text chunks, and OCR quality badges.
4. **Semantic Search**: Search for *"Rajmahal May 2025 Production"* or *"Borehole seam ash content"*.
5. **Mining Intelligence Assistant**: Ask questions (e.g. *"What was the coal production in ECL Rajmahal during May 2025?"*), view live sub-agent trace steps, and inspect grounded citations.
6. **Validation & Conflicts**: View the detected conflict between `ECL_Rajmahal_Monthly_Production_May_2025.pdf` (1.32 MT) and `ECL_Annual_Production_Summary_Discrepancy_Check_2025.pdf` (1.28 MT).
7. **Report Generator**: Select *Consolidated Mining Production Report* and click **Generate Official Report**. Download PDF or DOCX export.
8. **Parliamentary Inquiries**: Load *Lok Sabha Starred Question No. 142* and generate an evidence-grounded draft with watermarking and verification sign-off.
9. **Topics & Word Cloud**: Explore dynamic topic clusters and interactive canvas word cloud.
10. **Multi-Agent Monitor**: Inspect registered agents, task counts, error logs, and execution DAGs.

---

## Running Automated Tests

```bash
python -m unittest discover -s tests -p "test_*.py"
```
Runs the **78 automated unit and integration tests (100% pass rate)** covering:
- Database Abstraction & Multi-Dialect (PostgreSQL + SQLite + Migration)
- Advanced Modular OCR Subsystem (Preprocessing, Otsu binarization, rotation, quality detector)
- Multi-format document parsing (PDF, DOCX, CSV, XLSX, Corrupt files)
- Specialized agent lifecycles (`DocumentIntelligenceAgent`, `RetrievalAgent`, `ValidationAgent`, `ReportGenerationAgent`, `GovernmentInquiryAgent`)
- Multi-agent orchestration workflows via `ManagerAgent`
- AI Provider 3-tier cascading fallback chain (Gemini $\rightarrow$ OpenModel $\rightarrow$ Deterministic)
- Cross-document validation & discrepancy detection engine
- Security & Role-Based Access Control (`ADMIN`, `OFFICER`, `ANALYST`, `VIEWER`)
- Mathematical KPI calculation framework
- REST API routes, parameter validations, and health checks

---

## Technical Documentation
- [System Architecture](file:///docs/ARCHITECTURE.md)
- [Requirements Traceability Matrix](file:///docs/SIH26023_REQUIREMENTS_TRACEABILITY.md)
- [Final Demo Checklist](file:///docs/FINAL_DEMO_CHECKLIST.md)
- [Risk Register & Mitigation](file:///docs/RISK_REGISTER.md)
- [REST API Documentation](file:///docs/API_DOCS.md)

---

## License & Attribution
Developed for **Smart India Hackathon 2026** (Problem Statement SIH26023).  
All synthetic demonstration files are strictly labeled:  
`SYNTHETIC DEMONSTRATION DATA — NOT OFFICIAL CIL DATA`.
