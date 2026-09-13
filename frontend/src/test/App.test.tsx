import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';

// Mock API calls
vi.mock('@/services/api', () => ({
  analyticsService: {
    getSummary: vi.fn().mockResolvedValue({
      summary: {
        total_documents: 14,
        total_pages: 82,
        total_production_mt: 12.45,
        total_obr_mcum: 28.6,
        total_safety_accidents: 1,
        total_conflicts_flagged: 2,
        average_confidence: 0.94,
        active_workflows: 3,
      },
    }),
    getCharts: vi.fn().mockResolvedValue({
      charts: {
        subsidiary_production: {
          labels: ['ECL', 'BCCL', 'SECL'],
          data: [1.32, 2.85, 4.12],
        },
        production_trend: {
          labels: ['May 2025'],
          data: [2.6],
        },
        target_vs_actual: {
          labels: ['ECL', 'BCCL'],
          targets: [1.4, 2.0],
          actuals: [1.32, 1.85],
        },
        safety_kpis: {
          labels: [],
          fatal: [],
          serious: [],
        },
        validation_severity: {
          HIGH: 1,
        },
      },
    }),
    getKPIFramework: vi.fn().mockResolvedValue({ kpi_framework: [] }),
  },
  agentService: {
    getAgents: vi.fn().mockResolvedValue({
      status: 'success',
      count: 8,
      agents: [
        {
          name: 'ManagerAgent',
          status: 'IDLE',
          description: 'Orchestrator',
          capabilities: ['DAG_PLANNING'],
          tasks_processed: 42,
          errors: 0,
        },
        {
          name: 'DocumentIntelligenceAgent',
          status: 'IDLE',
          description: 'Document processor',
          capabilities: ['OCR'],
          tasks_processed: 14,
          errors: 0,
        },
      ],
    }),
    getWorkflows: vi.fn().mockResolvedValue({
      status: 'success',
      count: 1,
      workflows: [
        {
          id: 'wf_demo_01',
          workflow_type: 'DISCREPANCY_INVESTIGATION',
          initial_prompt: 'Rajmahal production discrepancy',
          status: 'COMPLETED',
          quality_decision: 'PASS',
          start_time: '2026-09-12 07:00:00',
        },
      ],
    }),
  },
  documentService: {
    getDocuments: vi.fn().mockResolvedValue({
      status: 'success',
      count: 1,
      documents: [
        {
          id: 1,
          original_name: 'ECL_Rajmahal_May_2025.pdf',
          file_type: 'pdf',
          file_size: 1048576,
          page_count: 8,
          checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          subsidiary: 'ECL',
          mine: 'Rajmahal',
          status: 'PROCESSED',
          uploaded_at: '2026-09-12 06:00:00',
        },
      ],
    }),
  },
  validationService: {
    getIssues: vi.fn().mockResolvedValue({
      status: 'success',
      count: 1,
      issues: [
        {
          id: 1,
          subsidiary: 'ECL',
          mine: 'Rajmahal',
          metric_name: 'Production',
          period: 'May 2025',
          doc_a_id: 1,
          doc_a_name: 'Monthly Review.pdf',
          doc_a_value: 1.32,
          doc_b_id: 2,
          doc_b_name: 'Annual Summary.pdf',
          doc_b_value: 1.28,
          variance_pct: 3.08,
          severity: 'HIGH',
          status: 'UNRESOLVED',
          created_at: '2026-09-12 06:30:00',
        },
      ],
    }),
  },
  settingsService: {
    getSettings: vi.fn().mockResolvedValue({
      system: {
        name: 'SIH26023',
        version: '1.0.0-PROTOTYPE',
        organization: 'CIL / CMPDI',
        ocr_available: true,
        database: 'sqlite:///database.db',
        database_info: { backend: 'sqlite', display_target: 'database.db', connected: true },
        subsidiaries: ['ECL', 'BCCL'],
        topics: ['Production', 'Geology'],
      },
      ai: {
        preferred_provider: 'gemini',
        active_provider: 'gemini',
        provider_name: 'Google Gemini API',
        is_connected: true,
        fallback_active: false,
        status_message: 'Online',
      },
    }),
    getHealth: vi.fn().mockResolvedValue({
      status: 'healthy',
      database: 'sqlite',
      database_connected: true,
      database_target: 'database/mining_platform.db',
      ocr_engine_ready: true,
      ai_service: {
        preferred_provider: 'gemini',
        active_provider: 'gemini',
        provider_name: 'Google Gemini API',
        is_connected: true,
        fallback_active: false,
        status_message: 'Connected',
      },
    }),
  },
}));

describe('CIL Mining Intelligence Platform — Shell & Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders application shell and navigation items with CIL branding and defaults to Overview', async () => {
    render(<App />);

    expect(screen.getByText('COAL INDIA')).toBeInTheDocument();
    expect(screen.getByText('CMPDI Intelligence Suite')).toBeInTheDocument();
    expect(screen.getByText(/Platform Overview & Architecture/i)).toBeInTheDocument();
  });

  it('allows navigating to Document Center and displays document filters', async () => {
    render(<App />);

    const docTab = screen.getByRole('button', { name: /Document Ingestion & OCR/i });
    fireEvent.click(docTab);

    expect(await screen.findByText(/Document Intelligence & Ingestion Catalog/i)).toBeInTheDocument();
  });

  it('allows switching user roles via RBAC role selector', async () => {
    render(<App />);

    const roleSelects = screen.getAllByRole('combobox', { name: /Switch Role/i });
    expect(roleSelects.length).toBeGreaterThan(0);

    fireEvent.change(roleSelects[0], { target: { value: 'OFFICER' } });
    expect(localStorage.getItem('cil_user_role')).toBe('OFFICER');
  });

  it('allows navigating to Mining Operations and safely renders summary metrics', async () => {
    render(<App />);

    const opsTab = screen.getByRole('button', { name: /Mining Intelligence Operations/i });
    fireEvent.click(opsTab);

    expect(await screen.findByText(/Mining Intelligence Command & Operations/i, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText(/Total Coal Production/i)).toBeInTheDocument();
  });
});


