"""
Database Schema Definitions for SIH26023 Mining Platform.
Defines dual-dialect DDL schemas for both SQLite (Fallback/Dev) and PostgreSQL (Primary/Enterprise).
Upgraded for 8-Agent Multi-Agent Orchestration Architecture with DAG tasks, SHA-256 deduplication checksums,
quality governance records, and HITL workflow checkpoints.
"""

SCHEMA_SQL_SQLITE = """
-- 1. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    checksum TEXT,
    page_count INTEGER DEFAULT 1,
    subsidiary TEXT,
    mine TEXT,
    reporting_period TEXT,
    status TEXT DEFAULT 'PENDING',
    error_message TEXT,
    doc_metadata_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Document Chunks Table (for Retrieval & Evidence)
CREATE TABLE IF NOT EXISTS document_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER DEFAULT 1,
    section_title TEXT,
    content TEXT NOT NULL,
    char_start INTEGER,
    char_end INTEGER,
    token_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 3. Extracted Structured Data Table
CREATE TABLE IF NOT EXISTS extracted_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    field_name TEXT NOT NULL,
    field_category TEXT,
    raw_value TEXT NOT NULL,
    numeric_value REAL,
    unit TEXT,
    subsidiary TEXT,
    mine TEXT,
    reporting_period TEXT,
    page_number INTEGER DEFAULT 1,
    section_name TEXT,
    source_excerpt TEXT,
    confidence REAL DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 4. Discovered Topics Table
CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_name TEXT NOT NULL,
    keywords_json TEXT,
    document_ids_json TEXT,
    frequency INTEGER DEFAULT 1,
    coherence_score REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. User Queries & AI Responses Table
CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_text TEXT NOT NULL,
    user_role TEXT DEFAULT 'Analyst',
    workflow_id TEXT,
    response_text TEXT,
    ai_provider_used TEXT,
    execution_time_ms INTEGER,
    evidence_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Generated Reports Table (with Multi-Version & Shared Run Support)
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id_str TEXT,
    run_id TEXT,
    version_number INTEGER DEFAULT 1,
    document_id INTEGER,
    title TEXT NOT NULL,
    report_type TEXT NOT NULL,
    reporting_period TEXT,
    subsidiary TEXT,
    mine TEXT,
    status TEXT DEFAULT 'GENERATED',
    quality_gate_status TEXT DEFAULT 'PASSED',
    human_review_status TEXT DEFAULT 'NOT_REQUIRED',
    discrepancy_count INTEGER DEFAULT 0,
    evidence_count INTEGER DEFAULT 0,
    summary TEXT,
    content_json TEXT,
    html_content TEXT,
    file_path TEXT,
    docx_path TEXT,
    human_approved INTEGER DEFAULT 0,
    approved_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE SET NULL
);

-- 7. Government & Parliamentary Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inquiry_ref TEXT,
    ministry_body TEXT DEFAULT 'Ministry of Coal / Parliament',
    question_text TEXT NOT NULL,
    parsed_requirements_json TEXT,
    draft_response TEXT,
    status TEXT DEFAULT 'DRAFT_GENERATED',
    confidence REAL DEFAULT 0.85,
    validation_notes TEXT,
    human_approved INTEGER DEFAULT 0,
    approved_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Cross-Document Validation Issues Table
CREATE TABLE IF NOT EXISTS validation_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_type TEXT NOT NULL,
    field_name TEXT NOT NULL,
    subsidiary TEXT,
    reporting_period TEXT,
    doc_a_id INTEGER,
    doc_a_name TEXT,
    doc_a_page INTEGER,
    doc_a_value TEXT,
    doc_b_id INTEGER,
    doc_b_name TEXT,
    doc_b_page INTEGER,
    doc_b_value TEXT,
    variance_percentage REAL,
    severity TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'UNRESOLVED',
    resolved_at TIMESTAMP,
    resolved_by TEXT,
    resolved_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(doc_a_id) REFERENCES documents(id) ON DELETE SET NULL,
    FOREIGN KEY(doc_b_id) REFERENCES documents(id) ON DELETE SET NULL
);

-- 9. Agent Workflows Table (8-Agent Orchestration & Single Shared Processing Runs)
CREATE TABLE IF NOT EXISTS agent_workflows (
    id TEXT PRIMARY KEY,
    workflow_type TEXT NOT NULL,
    document_id INTEGER,
    document_name TEXT,
    initial_prompt TEXT,
    status TEXT DEFAULT 'RUNNING',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    created_by TEXT DEFAULT 'System',
    error_message TEXT,
    provenance_summary TEXT,
    quality_decision TEXT,
    paused_reason TEXT,
    resume_state_json TEXT,
    quality_report_json TEXT,
    provenance_dag_json TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE SET NULL
);

-- 10. Agent Tasks Table (DAG and Dependency Tracking)
CREATE TABLE IF NOT EXISTS agent_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL,
    task_id TEXT NOT NULL UNIQUE,
    source_agent TEXT NOT NULL,
    destination_agent TEXT NOT NULL,
    task_type TEXT NOT NULL,
    input_data_json TEXT,
    evidence_req_json TEXT,
    dependencies_json TEXT,
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'PENDING',
    timeout_seconds REAL DEFAULT 30.0,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY(workflow_id) REFERENCES agent_workflows(id) ON DELETE CASCADE
);

-- 11. Agent Results Table (Structured AgentResult Persistence)
CREATE TABLE IF NOT EXISTS agent_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    agent_id TEXT,
    status TEXT NOT NULL,
    result_data_json TEXT,
    evidence_json TEXT,
    confidence REAL DEFAULT 1.0,
    warnings_json TEXT,
    errors_json TEXT,
    sources_json TEXT,
    next_action TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workflow_id) REFERENCES agent_workflows(id) ON DELETE CASCADE
);

-- 12. Workflow Checkpoints Table (HITL Pause / Resume)
CREATE TABLE IF NOT EXISTS workflow_checkpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL,
    paused_task_id TEXT,
    paused_reason TEXT,
    state_json TEXT NOT NULL,
    reviewer TEXT,
    reviewer_role TEXT,
    reviewer_note TEXT,
    status TEXT DEFAULT 'PAUSED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resumed_at TIMESTAMP,
    FOREIGN KEY(workflow_id) REFERENCES agent_workflows(id) ON DELETE CASCADE
);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    user_role TEXT DEFAULT 'Analyst',
    resource_type TEXT,
    resource_id TEXT,
    details_json TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Revoked Tokens Table (Persistent Blacklist for Server Restarts & Multi-Worker RBAC)
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    user_email TEXT,
    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Indices for rapid retrieval
CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_field ON extracted_data(field_name, subsidiary, reporting_period);
CREATE INDEX IF NOT EXISTS idx_extracted_doc ON extracted_data(document_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow ON agent_tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_results_workflow ON agent_results(workflow_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_workflow ON workflow_checkpoints(workflow_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_validation_status ON validation_issues(status);
CREATE INDEX IF NOT EXISTS idx_docs_checksum ON documents(checksum);
CREATE INDEX IF NOT EXISTS idx_revoked_token_hash ON revoked_tokens(token_hash);
"""

SCHEMA_SQL_POSTGRES = """
-- 1. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(512) NOT NULL UNIQUE,
    original_name VARCHAR(512) NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(1024) NOT NULL,
    checksum VARCHAR(128),
    page_count INTEGER DEFAULT 1,
    subsidiary VARCHAR(64),
    mine VARCHAR(128),
    reporting_period VARCHAR(64),
    status VARCHAR(64) DEFAULT 'PENDING',
    error_message TEXT,
    doc_metadata_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Document Chunks Table (for Retrieval & Evidence)
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER DEFAULT 1,
    section_title TEXT,
    content TEXT NOT NULL,
    char_start INTEGER,
    char_end INTEGER,
    token_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Extracted Structured Data Table
CREATE TABLE IF NOT EXISTS extracted_data (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    field_name VARCHAR(256) NOT NULL,
    field_category VARCHAR(128),
    raw_value TEXT NOT NULL,
    numeric_value DOUBLE PRECISION,
    unit VARCHAR(64),
    subsidiary VARCHAR(64),
    mine VARCHAR(128),
    reporting_period VARCHAR(64),
    page_number INTEGER DEFAULT 1,
    section_name TEXT,
    source_excerpt TEXT,
    confidence REAL DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Discovered Topics Table
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    topic_name VARCHAR(256) NOT NULL,
    keywords_json TEXT,
    document_ids_json TEXT,
    frequency INTEGER DEFAULT 1,
    coherence_score REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. User Queries & AI Responses Table
CREATE TABLE IF NOT EXISTS queries (
    id SERIAL PRIMARY KEY,
    query_text TEXT NOT NULL,
    user_role VARCHAR(64) DEFAULT 'Analyst',
    workflow_id VARCHAR(128),
    response_text TEXT,
    ai_provider_used VARCHAR(64),
    execution_time_ms INTEGER,
    evidence_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Generated Reports Table (with Multi-Version & Shared Run Support)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_id_str VARCHAR(128),
    run_id VARCHAR(128),
    version_number INTEGER DEFAULT 1,
    document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    title VARCHAR(512) NOT NULL,
    report_type VARCHAR(128) NOT NULL,
    reporting_period VARCHAR(64),
    subsidiary VARCHAR(64),
    mine VARCHAR(128),
    status VARCHAR(64) DEFAULT 'GENERATED',
    quality_gate_status VARCHAR(64) DEFAULT 'PASSED',
    human_review_status VARCHAR(64) DEFAULT 'NOT_REQUIRED',
    discrepancy_count INTEGER DEFAULT 0,
    evidence_count INTEGER DEFAULT 0,
    summary TEXT,
    content_json TEXT,
    html_content TEXT,
    file_path VARCHAR(1024),
    docx_path VARCHAR(1024),
    human_approved INTEGER DEFAULT 0,
    approved_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Government & Parliamentary Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    inquiry_ref VARCHAR(128),
    ministry_body VARCHAR(256) DEFAULT 'Ministry of Coal / Parliament',
    question_text TEXT NOT NULL,
    parsed_requirements_json TEXT,
    draft_response TEXT,
    status VARCHAR(64) DEFAULT 'DRAFT_GENERATED',
    confidence REAL DEFAULT 0.85,
    validation_notes TEXT,
    human_approved INTEGER DEFAULT 0,
    approved_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Cross-Document Validation Issues Table
CREATE TABLE IF NOT EXISTS validation_issues (
    id SERIAL PRIMARY KEY,
    issue_type VARCHAR(128) NOT NULL,
    field_name VARCHAR(256) NOT NULL,
    subsidiary VARCHAR(64),
    reporting_period VARCHAR(64),
    doc_a_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    doc_a_name VARCHAR(512),
    doc_a_page INTEGER,
    doc_a_value TEXT,
    doc_b_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    doc_b_name VARCHAR(512),
    doc_b_page INTEGER,
    doc_b_value TEXT,
    variance_percentage REAL,
    severity VARCHAR(32) DEFAULT 'MEDIUM',
    status VARCHAR(32) DEFAULT 'UNRESOLVED',
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(128),
    resolved_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Agent Workflows Table (8-Agent Orchestration & Single Shared Processing Runs)
CREATE TABLE IF NOT EXISTS agent_workflows (
    id VARCHAR(128) PRIMARY KEY,
    workflow_type VARCHAR(128) NOT NULL,
    document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    document_name VARCHAR(512),
    initial_prompt TEXT,
    status VARCHAR(64) DEFAULT 'RUNNING',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    created_by VARCHAR(128) DEFAULT 'System',
    error_message TEXT,
    provenance_summary TEXT,
    quality_decision VARCHAR(64),
    paused_reason TEXT,
    resume_state_json TEXT,
    quality_report_json TEXT,
    provenance_dag_json TEXT
);

-- 10. Agent Tasks Table (DAG and Dependency Tracking)
CREATE TABLE IF NOT EXISTS agent_tasks (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(128) NOT NULL REFERENCES agent_workflows(id) ON DELETE CASCADE,
    task_id VARCHAR(128) NOT NULL UNIQUE,
    source_agent VARCHAR(128) NOT NULL,
    destination_agent VARCHAR(128) NOT NULL,
    task_type VARCHAR(128) NOT NULL,
    input_data_json TEXT,
    evidence_req_json TEXT,
    dependencies_json TEXT,
    priority INTEGER DEFAULT 1,
    status VARCHAR(64) DEFAULT 'PENDING',
    timeout_seconds REAL DEFAULT 30.0,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 11. Agent Results Table (Structured AgentResult Persistence)
CREATE TABLE IF NOT EXISTS agent_results (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(128) NOT NULL REFERENCES agent_workflows(id) ON DELETE CASCADE,
    task_id VARCHAR(128) NOT NULL,
    agent_name VARCHAR(128) NOT NULL,
    agent_id VARCHAR(128),
    status VARCHAR(64) NOT NULL,
    result_data_json TEXT,
    evidence_json TEXT,
    confidence REAL DEFAULT 1.0,
    warnings_json TEXT,
    errors_json TEXT,
    sources_json TEXT,
    next_action TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Workflow Checkpoints Table (HITL Pause / Resume)
CREATE TABLE IF NOT EXISTS workflow_checkpoints (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(128) NOT NULL REFERENCES agent_workflows(id) ON DELETE CASCADE,
    paused_task_id VARCHAR(128),
    paused_reason TEXT,
    state_json TEXT NOT NULL,
    reviewer VARCHAR(128),
    reviewer_role VARCHAR(64),
    reviewer_note TEXT,
    status VARCHAR(64) DEFAULT 'PAUSED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resumed_at TIMESTAMP
);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(128) NOT NULL,
    user_role VARCHAR(64) DEFAULT 'Analyst',
    resource_type VARCHAR(128),
    resource_id VARCHAR(128),
    details_json TEXT,
    ip_address VARCHAR(64) DEFAULT '127.0.0.1',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Revoked Tokens Table (Persistent Blacklist for Server Restarts & Multi-Worker RBAC)
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    user_email VARCHAR(256),
    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Indices for rapid retrieval
CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_field ON extracted_data(field_name, subsidiary, reporting_period);
CREATE INDEX IF NOT EXISTS idx_extracted_doc ON extracted_data(document_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow ON agent_tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_results_workflow ON agent_results(workflow_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_workflow ON workflow_checkpoints(workflow_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_validation_status ON validation_issues(status);
CREATE INDEX IF NOT EXISTS idx_docs_checksum ON documents(checksum);
CREATE INDEX IF NOT EXISTS idx_revoked_token_hash ON revoked_tokens(token_hash);
"""

# Backwards compatibility alias
SCHEMA_SQL = SCHEMA_SQL_SQLITE

def get_schema_sql(backend: str = "sqlite") -> str:
    """Return appropriate schema DDL script based on database backend."""
    if backend.lower() == "postgresql":
        return SCHEMA_SQL_POSTGRES
    return SCHEMA_SQL_SQLITE
