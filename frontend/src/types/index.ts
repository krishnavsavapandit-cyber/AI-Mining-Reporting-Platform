/**
 * TypeScript Domain Models and Type Contracts for SIH26023
 * Coal India Limited / CMPDI AI Multi-Agent Mining Intelligence Platform
 */

// ==========================================
// USER ROLES & RBAC
// ==========================================
export type UserRole = 'ADMIN' | 'OFFICER' | 'ANALYST' | 'VIEWER';

export interface RoleInfo {
  role: UserRole;
  level: number;
  name: string;
  description: string;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleInfo> = {
  ADMIN: {
    role: 'ADMIN',
    level: 4,
    name: 'System Administrator',
    description: 'Full administrative control over settings, document deletion, seeding, and review sign-offs.',
  },
  OFFICER: {
    role: 'OFFICER',
    level: 3,
    name: 'Reviewing Officer / Joint Secretary',
    description: 'Executive review authority for official report approvals, inquiry sign-offs, and discrepancy resolutions.',
  },
  ANALYST: {
    role: 'ANALYST',
    level: 2,
    name: 'Mining Intelligence Analyst',
    description: 'Core operational user: executes multi-agent queries, triggers scans, generates reports, and uploads documents.',
  },
  VIEWER: {
    role: 'VIEWER',
    level: 1,
    name: 'Read-Only Viewer / Auditor',
    description: 'Read-only access to view dashboards, search data, browse documents, inspect reports, and audit logs.',
  },
};

// ==========================================
// 8-AGENT MULTI-AGENT ORCHESTRATION & TELEMETRY
// ==========================================
export type AgentName =
  | 'ManagerAgent'
  | 'DocumentIntelligenceAgent'
  | 'RetrievalAgent'
  | 'MiningIntelligenceAgent'
  | 'ValidationAgent'
  | 'ReportGenerationAgent'
  | 'GovernmentInquiryAgent'
  | 'QualityGovernanceAgent';

export type AgentStatusType = 'IDLE' | 'BUSY' | 'RUNNING' | 'WAITING' | 'PAUSED' | 'FAILED';

export interface Agent {
  name: AgentName;
  status: AgentStatusType;
  description: string;
  capabilities: string[];
  tasks_processed: number;
  errors: number;
}

export interface AgentRegistryResponse {
  status: string;
  count: number;
  agents: Agent[];
  architecture: string;
}

// ==========================================
// WORKFLOWS, TASKS & DAG PROVENANCE
// ==========================================
export type WorkflowStatusType =
  | 'PENDING'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'REQUIRES_HUMAN_REVIEW';

export type QualityGateDecisionType = 'PASS' | 'WARNING' | 'REJECTED' | 'REQUIRES_HUMAN_REVIEW';

export interface QualityReport {
  decision: QualityGateDecisionType;
  checks_passed: string[];
  violations: string[];
  warnings: string[];
  summary: string;
  evaluated_by?: string;
  timestamp?: number;
}

export interface ProvenanceNode {
  id: string;
  type: string;
  label: string;
  agent?: string;
  status?: string;
  timestamp?: number;
  details?: Record<string, unknown>;
}

export interface ProvenanceEdge {
  from_node: string;
  to_node: string;
  edge_type: string;
  label?: string;
}

export interface ProvenanceDAG {
  nodes: ProvenanceNode[];
  edges: ProvenanceEdge[];
}

export interface AgentTask {
  id: number;
  task_id: string;
  workflow_id: string;
  source_agent: string;
  destination_agent: string;
  task_type: string;
  input_data?: Record<string, unknown>;
  evidence_requirements?: string[];
  dependencies: string[];
  status: string;
  retry_count: number;
  timeout_seconds: number;
  started_at?: string;
  completed_at?: string;
}

export interface AgentResult {
  id: number;
  task_id: string;
  workflow_id: string;
  agent_name: string;
  status: string;
  result_data?: Record<string, unknown>;
  evidence?: EvidenceItem[];
  warnings?: string[];
  errors?: string[];
  sources?: string[];
  duration_ms: number;
}

export interface EvidenceItem {
  document_name?: string;
  document_id?: number;
  page_number?: number;
  chunk_index?: number;
  text_excerpt?: string;
  confidence_score?: number;
  retrieval_score?: number;
  agent?: string;
  provenance?: string;
}

export interface WorkflowRecord {
  id: string;
  workflow_type: string;
  initial_prompt: string;
  status: WorkflowStatusType;
  quality_decision?: QualityGateDecisionType;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  paused_task_id?: string;
  paused_reason?: string;
  paused_state_json?: string;
  quality_report_json?: string;
  provenance_dag_json?: string;
  provenance_summary?: string;
}

export interface WorkflowDetailResponse {
  status: string;
  workflow: WorkflowRecord;
  provenance_log: Array<{ agent: string; action: string; timestamp: number; details?: Record<string, unknown> }>;
  provenance_dag: ProvenanceDAG;
  quality_report: QualityReport;
  tasks_count: number;
  tasks: AgentTask[];
  results_count: number;
  results: AgentResult[];
}

// ==========================================
// DOCUMENTS & OCR
// ==========================================
export type DocumentFileType = 'pdf' | 'docx' | 'xlsx' | 'csv' | 'png' | 'jpg' | 'tiff' | 'scanned_pdf';
export type DocumentStatusType = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export interface OCRSummary {
  ocr_performed: boolean;
  status: string;
  engine: string;
  quality: string;
  confidence: number;
  human_review_required: boolean;
  warnings: string[];
  page_metrics?: Array<{
    page: number;
    word_count: number;
    confidence_score: number;
    quality: string;
  }>;
}

export interface DocumentRecord {
  id: number;
  original_name: string;
  file_path: string;
  file_type: DocumentFileType;
  file_size: number;
  page_count: number;
  checksum: string;
  subsidiary: string;
  mine?: string;
  reporting_period?: string;
  status: DocumentStatusType;
  doc_metadata_json?: string;
  uploaded_at: string;
  processed_at?: string;
}

export interface DocumentChunk {
  id: number;
  document_id: number;
  chunk_index: number;
  page_number: number;
  content: string;
  token_count: number;
  created_at: string;
}

export interface ExtractedRecord {
  id: number;
  document_id: number;
  entity_type: string;
  entity_name: string;
  metric_name: string;
  raw_value: string;
  numeric_value: number;
  normalized_unit: string;
  page_number: number;
  confidence_score: number;
  created_at?: string;
}

export interface DocumentDetailResponse {
  status: string;
  document: DocumentRecord;
  chunks_count: number;
  chunks: DocumentChunk[];
  extracted_records_count: number;
  extracted_records: ExtractedRecord[];
  ocr_info: OCRSummary;
}

export interface UploadResultItem {
  filename: string;
  status: 'SUCCESS' | 'FAILED' | 'DUPLICATE';
  checksum?: string;
  is_duplicate?: boolean;
  original_document_id?: number;
  original_filename?: string;
  message?: string;
  error?: string;
  result?: Record<string, unknown>;
}

// ==========================================
// SEARCH & ASSISTANT
// ==========================================
export interface SearchResultItem {
  document_id: number;
  document_name: string;
  subsidiary: string;
  mine: string;
  page_number: number;
  chunk_index: number;
  content: string;
  score: number;
  match_type: 'HYBRID' | 'KEYWORD' | 'VECTOR';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  provider_info?: string;
  evidence?: EvidenceItem[];
  sources?: string[];
  validation_warnings?: string[];
  duration_ms?: number;
  workflow?: Record<string, unknown>;
}

// ==========================================
// REPORTS & PARLIAMENTARY INQUIRIES
// ==========================================
export interface ReportRecord {
  id: number;
  title: string;
  report_type: string;
  reporting_period: string;
  subsidiary: string;
  status: string;
  summary: string;
  file_path: string;
  docx_path?: string;
  content_json?: string;
  human_approved: number;
  approved_by?: string;
  created_at: string;
}

export interface InquiryRecord {
  id: number;
  inquiry_ref: string;
  ministry_body: string;
  question_text: string;
  parsed_intent: string;
  generated_response: string;
  citations_json?: string;
  confidence_score: number;
  status: string;
  human_approved: number;
  approved_by?: string;
  created_at: string;
}

// ==========================================
// VALIDATION & DISCREPANCIES
// ==========================================
export type DiscrepancyLifecycleStatus = 'UNRESOLVED' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface DiscrepancyIssue {
  id: number;
  issue_type?: string;
  field_name?: string;
  metric_name?: string;
  subsidiary?: string;
  mine?: string;
  reporting_period?: string;
  period?: string;
  doc_a_id?: number;
  doc_a_name?: string;
  doc_a_page?: number;
  doc_a_value?: string | number;
  doc_b_id?: number;
  doc_b_name?: string;
  doc_b_page?: number;
  doc_b_value?: string | number;
  variance_percentage?: number;
  variance_pct?: number;
  difference_amount?: number;
  direction?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  status?: DiscrepancyLifecycleStatus | string;
  reviewer?: string;
  reviewer_role?: string;
  reviewer_note?: string;
  resolved_by?: string;
  resolved_note?: string;
  resolved_at?: string;
  updated_at?: string;
  created_at?: string;
}

// ==========================================
// TOPICS & WORD CLOUD
// ==========================================
export interface TopicCluster {
  topic_name: string;
  frequency: number;
  keywords: string[];
  related_documents: string[];
  coherence_score?: number;
}

export interface WordCloudWord {
  text: string;
  size?: number;
  topic?: string;
  count?: number;
  weight?: number;
  raw_term?: string;
  doc_count?: number;
  documents?: string[];
  document_ids?: number[];
  subsidiary?: string;
}

// ==========================================
// ANALYTICS & KPI FRAMEWORK
// ==========================================
export interface AnalyticsSummary {
  total_documents?: number;
  processed_documents?: number;
  failed_documents?: number;
  total_pages?: number;
  extracted_records?: number;
  unresolved_inconsistencies?: number;
  total_conflicts_flagged?: number;
  generated_reports?: number;
  inquiries_processed?: number;
  ai_queries_executed?: number;
  total_production_mt?: number;
  total_obr_mcum?: number;
  total_safety_accidents?: number;
  average_confidence?: number;
  active_workflows?: number;
}

export interface KPIFrameworkItem {
  id?: string;
  kpi_id?: string;
  name?: string;
  kpi_name?: string;
  category?: string;
  definition?: string;
  formula?: string;
  formula_definition?: string;
  target_benchmark?: string;
  benchmark_target?: string;
  measured_result?: number | string | null;
  formatted_result?: string;
  actual_measured?: string;
  sample_size?: string;
  sample_size_source?: string;
  measurement_type?: string;
  status: 'MET' | 'EXCEEDED' | 'PENDING' | 'FAILED' | 'MEASURED' | 'TARGET ONLY' | 'INSUFFICIENT DATA' | string;
  methodology_note?: string;
}

export interface ChartDataset {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }>;
}

export interface ChartsData {
  subsidiary_production?: {
    labels?: string[];
    data?: number[];
    datasets?: Array<{ label: string; data: number[] }>;
  };
  production_trend?: {
    labels?: string[];
    data?: number[];
    datasets?: Array<{ label: string; data: number[] }>;
  };
  target_vs_actual?: {
    labels?: string[];
    targets?: number[];
    actuals?: number[];
    datasets?: Array<{ label: string; data: number[] }>;
  };
  safety_kpis?: {
    labels?: string[];
    fatal?: number[];
    serious?: number[];
    datasets?: Array<{ label: string; data: number[] }>;
  };
  safety_kpi?: any;
  validation_severity?: Record<string, number>;
  discrepancy_severity?: any;
}

// ==========================================
// AUDIT LOGS
// ==========================================
export interface AuditLogRecord {
  id: number;
  timestamp: string;
  action_type: string;
  user_role: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown> | string;
  ip_address?: string;
}

// ==========================================
// SYSTEM SETTINGS & HEALTH
// ==========================================
export interface AIProviderInfo {
  preferred_provider: 'gemini' | 'open_model' | 'deterministic';
  active_provider: string;
  provider_name: string;
  is_connected: boolean;
  fallback_active: boolean;
  status_message: string;
  latency_ms?: number;
}

export interface DatabaseInfo {
  backend: string;
  display_target: string;
  connected: boolean;
  pool_size?: number;
  database_size_bytes?: number;
}

export interface SystemSettings {
  system: {
    name: string;
    version: string;
    organization: string;
    ocr_available: boolean;
    database: string;
    database_info: DatabaseInfo;
    subsidiaries: string[];
    topics: string[];
  };
  ai: AIProviderInfo;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: string;
  database_connected: boolean;
  database_target: string;
  ocr_engine_ready: boolean;
  ai_service: AIProviderInfo;
}
