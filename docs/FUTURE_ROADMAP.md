# CIL Document Intelligence Platform -- Strategic Future Roadmap

**Problem Statement ID**: SIH26023  
**Organization**: Ministry of Coal / Coal India Limited (CIL) / Central Mine Planning and Design Institute (CMPDI)

---

## 1. Executive Summary

This roadmap establishes a clear boundary between capabilities that are **CURRENTLY IMPLEMENTED & VERIFIED** in the SIH26023 solution versus **FUTURE PRODUCTION ENHANCEMENTS** planned for full-scale CIL nationwide enterprise deployment.

---

## 2. Currently Implemented & Verified Capabilities

The following features are 100% implemented, tested with 45 passing automated tests, and demonstrable in the current software:

- **Multi-Format Ingestion**: PyMuPDF, python-docx, openpyxl, pandas, and Tesseract OCR extracting structured data across PDF, DOCX, XLSX, CSV, PNG, JPG, TIFF.
- **Genuine Multi-Agent Architecture**: 6 specialized agents (`ManagerAgent`, `DocumentIntelligenceAgent`, `RetrievalAgent`, `ValidationAgent`, `ReportGenerationAgent`, `InquiryAgent`) communicating via strongly-typed message envelopes.
- **3-Tier AI Resiliency & Degradation Chain**:
  1. Google Gemini API (Primary Cloud AI)
  2. Open-Source Local Model (`OpenModelProvider` over Ollama/vLLM)
  3. Deterministic Grounded Engine (100% Offline Python RAG, zero API key required)
- **Zero-Hallucination & Gating**: Mandatory emission of `"Insufficient information found in the available documents."` on out-of-domain queries.
- **Cross-Document Discrepancy Detection**: Automated detection of numerical conflicts (>5% variance) with source attribution and human resolution workflows.
- **Government & Parliamentary Inquiries**: Automatic question breakdown, grounded drafting, and mandatory `DRAFT -- REQUIRES HUMAN VERIFICATION` watermarking.
- **Multi-Format Report Export**: Dynamic generation of executive reports with key figures, tables, and binary exports in HTML, PDF, and DOCX.
- **Formal KPI Measurement Framework**: 8 mathematical formulas evaluating report speedup, extraction accuracy, citation correctness, and retrieval relevance.
- **Role-Based Access Control (RBAC)**: 4-tier enforcement (`ADMIN`, `OFFICER`, `ANALYST`, `VIEWER`) protecting destructive and sign-off endpoints.
- **Full Provenance & Audit Trail**: Comprehensive audit logging of all system actions and chunk-level evidence inspection.

---

## 3. Future Production Enhancements (Target Architecture)

| Category | Enhancement | Production Benefit | Target Timeline |
|---|---|---|---|
| **Identity & Access** | **CIL Active Directory / SAML 2.0 SSO** | Seamless single sign-on integration with Ministry of Coal & CIL enterprise identity providers. | Phase 1 (Post-Hackathon) |
| **Database & Scale** | **Enterprise PostgreSQL + pgvector / Qdrant** | Transition from SQLite/Pickle to distributed PostgreSQL cluster handling millions of historical geological archives. | Phase 1 |
| **Queue & Workers** | **Celery + Redis Distributed Task Queues** | Asynchronous worker pool for background ingestion of 1,000+ page borehole geophysical logs without web server blocking. | Phase 2 |
| **Enterprise Storage** | **S3-Compatible Object Storage (MinIO / AWS / Azure)** | Scalable object store with versioning, lifecycle retention, and geospatial indexing for massive mine maps. | Phase 2 |
| **Domain Integrations** | **CIL SAP/ERP & DGMS Direct Connectors** | Automated bidirectional data sync with live SAP coal dispatch feeds and DGMS safety incident reporting portals. | Phase 3 |
| **Geological AI** | **CMPDI Borehole & Stratigraphic AI Model** | Fine-tuned open-source model (e.g. Llama-3-70B / Qwen-2.5-Coder) specialized in Indian coal seam nomenclature (Seam I to Seam X). | Phase 3 |
| **OCR & Vision** | **LayoutLMv3 / Document Vision Transformer** | Advanced visual document understanding for 50-year-old degraded handwritten geological survey logs. | Phase 4 |
| **High Availability** | **Kubernetes Multi-Region Deployment** | High-availability multi-node deployment across CIL subsidiary headquarters (Kolkata, Ranchi, Dhanbad, Bilaspur, Singrauli). | Phase 4 |

---

## 4. Hardware Sizing & Deployment Matrix

| Tier | Deployment Profile | Minimum Hardware Requirement | AI Execution Mode |
|---|---|---|---|
| **Edge / Field Office** | Local CMPDI Exploration Camp | Intel Core i3 / 4 GB RAM / No GPU | Deterministic Grounded Engine + Local TF-IDF (<50 MB RAM) |
| **Subsidiary HQ (Standard)** | Regional CIL Office (ECL / BCCL) | Intel Core i5/i7 / 8-16 GB RAM / No GPU | Local Quantized LLM (`llama3.2:1b` via Ollama CPU) or Gemini API |
| **Enterprise Datacenter** | CIL Central HQ (Kolkata) | Multi-Core Xeon / 64 GB RAM / NVIDIA A100/H100 GPU | vLLM cluster serving 70B fine-tuned mining model + Qdrant Vector DB |
