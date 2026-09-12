/**
 * Typed API Services Layer for SIH26023
 * Direct mapping to all Flask backend blueprints and endpoints.
 */

import { apiClient } from './apiClient';
import type {
  AgentRegistryResponse,
  WorkflowRecord,
  WorkflowDetailResponse,
  DocumentRecord,
  DocumentDetailResponse,
  OCRSummary,
  UploadResultItem,
  SearchResultItem,
  ChatMessage,
  ReportRecord,
  InquiryRecord,
  DiscrepancyIssue,
  DiscrepancyLifecycleStatus,
  TopicCluster,
  WordCloudWord,
  AnalyticsSummary,
  ChartsData,
  KPIFrameworkItem,
  AuditLogRecord,
  SystemSettings,
  SystemHealth,
} from '@/types';

// ==========================================
// 1. AGENT & WORKFLOW SERVICE
// ==========================================
export const agentService = {
  getAgents: () =>
    apiClient.get<AgentRegistryResponse>('/api/agents/status'),

  getWorkflows: (params?: { limit?: number; status?: string }) =>
    apiClient.get<{ status: string; count: number; workflows: WorkflowRecord[] }>(
      '/api/agents/workflows',
      { params }
    ),

  getWorkflow: (workflowId: string) =>
    apiClient.get<WorkflowDetailResponse>(`/api/agents/workflows/${encodeURIComponent(workflowId)}`),

  getProvenanceDag: (workflowId: string) =>
    apiClient.get<{
      status: string;
      workflow_id: string;
      dag: WorkflowDetailResponse['provenance_dag'];
      quality_decision?: string;
    }>(`/api/agents/workflows/${encodeURIComponent(workflowId)}/provenance-dag`),

  triggerWorkflow: (data: {
    intent: string;
    query?: string;
    subsidiary?: string;
    report_type?: string;
    title?: string;
    reporting_period?: string;
    instructions?: string;
    inquiry_ref?: string;
    ministry_body?: string;
  }) =>
    apiClient.post<{ status: string; result?: Record<string, unknown>; plan?: Record<string, unknown> }>(
      '/api/agents/workflows',
      data
    ),

  pauseWorkflow: (workflowId: string, data: { reason?: string; task_id?: string; state?: Record<string, unknown> }) =>
    apiClient.post<{ status: string; message: string }>(
      `/api/agents/workflows/${encodeURIComponent(workflowId)}/pause`,
      data
    ),

  resumeWorkflow: (
    workflowId: string,
    data: { reviewer: string; reviewer_role?: string; reviewer_note?: string }
  ) =>
    apiClient.post<{ status: string; message: string; state?: Record<string, unknown> }>(
      `/api/agents/workflows/${encodeURIComponent(workflowId)}/resume`,
      data
    ),

  cancelWorkflow: (workflowId: string) =>
    apiClient.post<{ status: string; message: string }>(
      `/api/agents/workflows/${encodeURIComponent(workflowId)}/cancel`
    ),

  runRajmahalDemo: () =>
    apiClient.post<{ status: string; result?: { workflow?: WorkflowRecord; report?: ReportRecord; quality_decision?: string } }>(
      '/api/agents/workflows',
      {
        intent: 'DISCREPANCY_INVESTIGATION',
        query: 'Rajmahal production discrepancy across available monthly reports',
      },
      { timeoutMs: 45000 }
    ),
};

// ==========================================
// 2. DOCUMENT MANAGEMENT SERVICE
// ==========================================
export const documentService = {
  getDocuments: (params?: { subsidiary?: string; status?: string; search?: string }) =>
    apiClient.get<{ status: string; count: number; documents: DocumentRecord[] }>(
      '/api/documents',
      { params }
    ),

  getDocument: (docId: number) =>
    apiClient.get<DocumentDetailResponse>(`/api/documents/${docId}`),

  getOCRStatus: (docId: number) =>
    apiClient.get<{
      status: string;
      document_id: number;
      original_name: string;
      file_type: string;
      ocr_status: OCRSummary;
    }>(`/api/documents/${docId}/ocr-status`),

  uploadDocuments: (formData: FormData, force: boolean = false) =>
    apiClient.post<{
      status: string;
      processed_count: number;
      results: UploadResultItem[];
    }>('/api/documents/upload', formData, {
      params: { force: force ? 'true' : 'false' },
      timeoutMs: 60000,
    }),

  reprocessDocument: (docId: number) =>
    apiClient.post<{ status: string; message: string; workflow?: Record<string, unknown> }>(
      `/api/documents/${docId}/reprocess`,
      {},
      { timeoutMs: 60000 }
    ),

  deleteDocument: (docId: number) =>
    apiClient.delete<{ status: string; message: string }>(`/api/documents/${docId}`),
};

// ==========================================
// 3. SEMANTIC & KEYWORD SEARCH SERVICE
// ==========================================
export const searchService = {
  search: (query: string, subsidiary?: string, topK: number = 10) =>
    apiClient.get<{
      status: string;
      query: string;
      subsidiary_filter?: string;
      count: number;
      results: SearchResultItem[];
    }>('/api/search', {
      params: { q: query, subsidiary: subsidiary || undefined, top_k: topK },
    }),
};

// ==========================================
// 4. MINING INTELLIGENCE ASSISTANT (RAG)
// ==========================================
export const queryService = {
  askQuestion: (data: {
    query: string;
    user_role?: string;
    subsidiary?: string;
    chat_history?: Array<{ role: string; content: string }>;
  }) =>
    apiClient.post<{
      status: string;
      answer: string;
      provider_info?: string;
      evidence?: ChatMessage['evidence'];
      sources?: string[];
      validation_warnings?: string[];
      duration_ms?: number;
      workflow?: Record<string, unknown>;
    }>('/api/query', data, { timeoutMs: 45000 }),

  getQueryHistory: () =>
    apiClient.get<{ status: string; count: number; queries: Array<Record<string, unknown>> }>(
      '/api/query/history'
    ),
};

// ==========================================
// 5. AUTOMATED REPORTS SERVICE
// ==========================================
export const reportService = {
  generateReport: (data: {
    report_type: string;
    title?: string;
    subsidiary?: string;
    reporting_period?: string;
    instructions?: string;
  }) =>
    apiClient.post<{
      status: string;
      message: string;
      report: ReportRecord;
      workflow: Record<string, unknown>;
    }>('/api/reports/generate', data, { timeoutMs: 60000 }),

  getReports: () =>
    apiClient.get<{ status: string; count: number; reports: ReportRecord[] }>('/api/reports'),

  getReport: (reportId: number) =>
    apiClient.get<{
      status: string;
      report: ReportRecord;
      content: Record<string, unknown>;
      pdf_url?: string | null;
      docx_url?: string | null;
    }>(`/api/reports/${reportId}`),

  approveReport: (reportId: number, data?: { approved_by?: string }) =>
    apiClient.post<{ status: string; message: string }>(
      `/api/reports/${reportId}/approve`,
      data || {}
    ),

  getDownloadUrl: (filename: string) => `/api/reports/download/${encodeURIComponent(filename)}`,
};

// ==========================================
// 6. PARLIAMENTARY INQUIRY SERVICE
// ==========================================
export const inquiryService = {
  generateInquiry: (data: {
    question_text: string;
    inquiry_ref?: string;
    ministry_body?: string;
  }) =>
    apiClient.post<{
      status: string;
      message: string;
      inquiry: InquiryRecord;
      workflow: Record<string, unknown>;
    }>('/api/inquiries/generate', data, { timeoutMs: 45000 }),

  getInquiries: () =>
    apiClient.get<{ status: string; count: number; inquiries: InquiryRecord[] }>('/api/inquiries'),

  getInquiry: (inquiryId: number) =>
    apiClient.get<{ status: string; inquiry: InquiryRecord }>(`/api/inquiries/${inquiryId}`),

  approveInquiry: (inquiryId: number, data?: { approved_by?: string }) =>
    apiClient.post<{ status: string; message: string }>(
      `/api/inquiries/${inquiryId}/approve`,
      data || {}
    ),
};

// ==========================================
// 7. VALIDATION & DISCREPANCY CENTER
// ==========================================
export const validationService = {
  getIssues: (status?: DiscrepancyLifecycleStatus | string) =>
    apiClient.get<{ status: string; count: number; issues: DiscrepancyIssue[] }>(
      '/api/validation/issues',
      { params: { status: status || undefined } }
    ),

  runScan: () =>
    apiClient.post<{
      status: string;
      message: string;
      issues_count: number;
      issues: DiscrepancyIssue[];
    }>('/api/validation/scan', {}, { timeoutMs: 30000 }),

  updateLifecycle: (
    issueId: number,
    data: {
      status: DiscrepancyLifecycleStatus;
      reviewer?: string;
      note?: string;
    }
  ) =>
    apiClient.post<{ status: string; message: string }>(
      `/api/validation/issues/${issueId}/lifecycle`,
      data
    ),

  resolveIssue: (issueId: number, data?: { resolved_by?: string; note?: string }) =>
    apiClient.post<{ status: string; message: string }>(
      `/api/validation/issues/${issueId}/resolve`,
      data || {}
    ),
};

// ==========================================
// 8. TOPICS & WORD CLOUD SERVICE
// ==========================================
export const topicService = {
  getTopics: (params?: { subsidiary?: string; period?: string; doc_type?: string }) =>
    apiClient.get<{ status: string; count: number; topics: TopicCluster[] }>('/api/topics', {
      params,
    }),

  getWordCloud: (params?: { subsidiary?: string; period?: string; doc_type?: string }) =>
    apiClient.get<{ status: string; count: number; words: WordCloudWord[] }>(
      '/api/topics/wordcloud',
      { params }
    ),
};

// ==========================================
// 9. ANALYTICS & KPI FRAMEWORK SERVICE
// ==========================================
export const analyticsService = {
  getSummary: () =>
    apiClient.get<{ status: string; summary: AnalyticsSummary }>('/api/analytics/summary'),

  getCharts: () =>
    apiClient.get<{ status: string; charts: ChartsData }>('/api/analytics/charts'),

  getKPIFramework: () =>
    apiClient.get<{ status: string; kpi_framework: KPIFrameworkItem[] }>(
      '/api/analytics/kpi-framework'
    ),
};

// ==========================================
// 10. AUDIT LOGGING SERVICE
// ==========================================
export const auditService = {
  getAuditLogs: (params?: { action?: string; limit?: number; offset?: number }) =>
    apiClient.get<{
      status: string;
      total: number;
      count: number;
      logs: AuditLogRecord[];
    }>('/api/audit', { params }),
};

// ==========================================
// 11. SETTINGS & SYSTEM HEALTH SERVICE
// ==========================================
export const settingsService = {
  getSettings: () =>
    apiClient.get<SystemSettings>('/api/settings'),

  updateAIProvider: (data: {
    preferred_provider?: 'gemini' | 'open_model' | 'deterministic';
    gemini_api_key?: string;
    open_model_endpoint?: string;
  }) =>
    apiClient.post<{ status: string; message: string; active_info: SystemSettings['ai'] }>(
      '/api/settings/provider',
      data
    ),

  seedDemoData: () =>
    apiClient.post<{
      status: string;
      message: string;
      documents_processed: Array<{ filename: string; status: string; extracted_count: number }>;
      discrepancies_detected: number;
    }>('/api/settings/seed', {}, { timeoutMs: 90000 }),

  getHealth: () =>
    apiClient.get<SystemHealth>('/api/health'),
};
