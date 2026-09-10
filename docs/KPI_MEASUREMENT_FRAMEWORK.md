# SIH26023 -- KPI Integrity & Operational Measurement Framework

**Problem Statement ID**: SIH26023 (Ministry of Coal / Coal India Limited / CMPDI)  
**Standard**: ISO/IEC 25010 Software Quality & Anti-Fabrication Measurement Principles

---

## 1. Principles of Truthful Measurement

1. **Strict Distinction between Definition, Target, and Measured Result**:
   - **KPI Definition**: Mathematical formulation and operational scope.
   - **Target / Benchmark**: Project-defined performance target (e.g. `≥ 70.0% reduction`). **Targets are NOT achieved results.**
   - **Actual Measured Result**: Dynamically evaluated metrics derived strictly from the active database state or reproducible controlled test fixtures.
2. **Strict Anti-Fabrication Policy**:
   - If empirical real-world data does not exist, the platform explicitly displays:
     > *"Not yet measured."* or *"No measured result available."*
   - No baseline time savings, extraction accuracy, or retrieval relevance percentages may be invented or hard-coded.
3. **Measurement Classification Types**:
   - `REAL-WORLD`: Measured from authorized live Coal India production systems (Future work).
   - `CONTROLLED TEST`: Derived from automated test suite runs or active session database state.
   - `SYNTHETIC EVALUATION`: Evaluated against reproducible ground-truth benchmark fixtures (`services/evaluation_service.py`).
   - `NOT YET MEASURED`: Measurement formula and telemetry implemented; empirical measurement requires field data.
4. **No Real CIL Performance Claims**: No claims of live operational CIL performance are made without authorized CIL organizational data.

---

## 2. Comprehensive 8-KPI Measurement Matrix

| KPI ID | KPI Name | Mathematical Formula & Methodology | Target / Benchmark | Measurement Type | Data Source & Evaluation Method | Status |
|---|---|---|---|---|---|---|
| **KPI-01** | **Report Preparation Time Reduction** | `((T_manual_baseline - T_automated) / T_manual_baseline) * 100` | `≥ 70.0% time reduction` *(Project-defined target)* | `NOT YET MEASURED` | Requires formal empirical time-motion study with CIL reviewing officers comparing manual collation vs. automated pipeline compilation. | `TARGET ONLY` |
| **KPI-02** | **Structured Extraction Accuracy** | `(Matched_Verified_Fields / Total_Ground_Truth_Fields) * 100` | `≥ 90.0% field accuracy` *(Project-defined target)* | `SYNTHETIC EVALUATION` | Evaluated against canonical synthetic ground-truth records ($N = 7$ fields across PDF, DOCX, XLSX) via `services/evaluation_service.py`. | `MEASURED` *(when DB populated)* / `INSUFFICIENT DATA` *(when empty)* |
| **KPI-03** | **Query-Answer Accuracy & Grounding** | `(Correctly_Grounded_Answers / Total_Audited_Queries) * 100` | `100.0% grounded answers` *(Zero hallucination target)* | `SYNTHETIC EVALUATION` | Evaluates domain extraction queries and out-of-domain rejection queries via `services/evaluation_service.py`. | `MEASURED` *(when DB populated)* / `TARGET ONLY` |
| **KPI-04** | **Citation Correctness & Provenance Precision** | `(Valid_Provenance_Citations / Total_Generated_Citations) * 100` | `≥ 95.0% citation precision` *(Project-defined target)* | `SYNTHETIC EVALUATION` | Validates that every citation contains non-empty document name, page number, and matching SQLite chunk excerpt. | `MEASURED` *(when DB populated)* / `INSUFFICIENT DATA` |
| **KPI-05** | **Automation Percentage in Report Lifecycle** | `(Automated_Lifecycle_Stages / Total_Eligible_Lifecycle_Stages) * 100` | `80.0% - 90.0% automated` *(Project-defined target)* | `CONTROLLED TEST` | Architecture analysis: 7 of 8 core lifecycle stages (87.5%) are fully automated; the final stage (Official Sign-off) is strictly Human-In-The-Loop. | `MEASURED` |
| **KPI-06** | **Document Processing Success Rate** | `(Successfully_Processed_Docs / Total_Uploaded_Docs) * 100` | `≥ 95.0% processing success` *(Project-defined target)* | `CONTROLLED TEST` | Calculated dynamically from active SQLite `documents` table (`processed_docs / total_docs * 100`). | `MEASURED` *(when docs > 0)* / `INSUFFICIENT DATA` *(when docs = 0)* |
| **KPI-07** | **Hybrid Retrieval Relevance (Top-1 Relevant Yield)** | `(Queries_with_Top1_Relevant_Doc / Total_Domain_Queries) * 100` | `≥ 85.0% top-ranked precision` *(Project-defined target)* | `SYNTHETIC EVALUATION` | Evaluated via Sublinear TF-IDF + Cosine Reciprocal Rank Fusion (RRF) on controlled query set. | `MEASURED` *(when DB populated)* / `TARGET ONLY` |
| **KPI-08** | **Multi-Agent Workflow Execution Reliability** | `(Completed_Workflows / Total_Dispatched_Workflows) * 100` | `≥ 95.0% workflow completion` *(Project-defined target)* | `CONTROLLED TEST` | Calculated dynamically from active SQLite `agent_workflows` table (`completed_wf / total_wf * 100`). | `MEASURED` *(when workflows > 0)* / `INSUFFICIENT DATA` *(when workflows = 0)* |

---

## 3. Mathematical Formula & Methodology Specifications

### 3.1 KPI-01: Report Preparation Time Reduction
$$R_{time} = \frac{T_{manual\_baseline} - T_{automated}}{T_{manual\_baseline}} \times 100\%$$
- **Parameters**:
  - $T_{manual\_baseline}$: Average minutes required by human officers to collate, calculate, cross-check, and format multi-source reports.
  - $T_{automated}$: Execution time of `ReportGenerationAgent` compiling and rendering HTML/PDF/DOCX outputs.
- **Honest Status**: `Not yet measured.` Requires field measurement at CIL subsidiaries.

### 3.2 KPI-02: Structured Extraction Accuracy
$$A_{extract} = \frac{\sum_{i=1}^{N} \mathbb{I}(|\hat{y}_i - y_i| \le \epsilon_i)}{N} \times 100\%$$
- **Parameters**:
  - $\hat{y}_i$: Numerical value extracted by regex / table parser in `extracted_data`.
  - $y_i$: Canonical ground-truth figure in `services/evaluation_service.py`.
  - $\epsilon_i$: Tolerance boundary ($\pm 0.05$ MT).
- **Honest Status**: Evaluated against synthetic test fixture when documents are ingested.

### 3.3 KPI-03: Query-Answer Grounding Accuracy
$$A_{ground} = \frac{N_{grounded\_or\_correctly\_rejected}}{N_{total\_queries}} \times 100\%$$
- **Parameters**:
  - A response is counted as accurate if it extracts verified document facts, or emits verbatim *"Insufficient information found in the available documents."* when given out-of-domain prompts.
- **Honest Status**: Evaluated dynamically via controlled query benchmark suite.

### 3.4 KPI-04: Citation Precision
$$P_{cite} = \frac{N_{valid\_citations}}{N_{total\_citations}} \times 100\%$$
- **Parameters**:
  - A citation is valid if `document_name`, `page_number`, and `source_text` correspond to an actual chunk in the database without fabrication.

### 3.5 KPI-05: Automation Percentage
$$P_{auto} = \frac{7 \text{ automated stages}}{8 \text{ total lifecycle stages}} \times 100\% = 87.5\%$$
- **Stages**:
  1. Document ingestion & format detection (Automated)
  2. OCR & text stream extraction (Automated)
  3. Chunking & vector embedding (Automated)
  4. Structured metric extraction (Automated)
  5. Cross-document discrepancy scanning (Automated)
  6. Hybrid retrieval & relevance ranking (Automated)
  7. Multi-section report / draft synthesis (Automated)
  8. Official Government / Reviewing Officer Sign-off (Mandatory Human-in-the-Loop)

### 3.6 KPI-06: Document Processing Success Rate
$$P_{doc} = \frac{\text{COUNT}(\text{status} = \text{'PROCESSED'})}{\text{COUNT}(*)} \times 100\%$$
- Derived directly from `documents` table in SQLite.

### 3.7 KPI-07: Hybrid Retrieval Relevance
$$R_{top1} = \frac{N_{top1\_canonical\_match}}{N_{domain\_queries}} \times 100\%$$
- Evaluates whether the top retrieved chunk originates from the ground-truth document for domain questions.

### 3.8 KPI-08: Agent Workflow Success Rate
$$P_{workflow} = \frac{\text{COUNT}(\text{status} = \text{'COMPLETED'})}{\text{COUNT}(*)} \times 100\%$$
- Derived directly from `agent_workflows` table in SQLite.

---

## 4. REST API Endpoint

- **Endpoint**: `GET /api/analytics/kpi-framework`
- **Output**: Returns dynamic JSON containing all 8 KPI objects with `kpi_id`, `name`, `formula`, `definition`, `target_benchmark`, `target_type`, `measured_result`, `formatted_result`, `sample_size`, `data_source`, `measurement_type`, `status`, and `methodology_note`.
