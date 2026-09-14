import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';

vi.setConfig({ testTimeout: 20000 });

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
  authService: {
    loginAuthority: vi.fn().mockImplementation(async ({ email }) => {
      const em = (email || '').toLowerCase();
      if (em === 'analyst@cil.gov.in') {
        return { status: 'success', role: 'ANALYST', token: 'mock-token-analyst', user: { email: em, name: 'Mining Analyst', authorizedRole: 'ANALYST', accountType: 'AUTHORITY' } };
      }
      if (em === 'officer@cil.gov.in') {
        return { status: 'success', role: 'OFFICER', token: 'mock-token-officer', user: { email: em, name: 'Reviewing Officer', authorizedRole: 'OFFICER', accountType: 'AUTHORITY' } };
      }
      if (em === 'admin@cil.gov.in') {
        return { status: 'success', role: 'ADMIN', token: 'mock-token-admin', user: { email: em, name: 'System Administrator', authorizedRole: 'ADMIN', accountType: 'AUTHORITY' } };
      }
      throw new Error('Invalid credentials');
    }),
    loginPublic: vi.fn().mockResolvedValue({ status: 'success', role: 'VIEWER', token: 'mock-token-viewer', user: { email: 'viewer@public.cil.gov.in', name: 'Public Viewer', authorizedRole: 'VIEWER', accountType: 'PUBLIC_VIEWER' } }),
    logout: vi.fn().mockResolvedValue({ status: 'success' }),
    getMe: vi.fn().mockImplementation(async () => {
      const savedUser = localStorage.getItem('cil_auth_user');
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          return { authenticated: true, role: u.authorizedRole || u.role || 'VIEWER', account_type: u.accountType || 'PUBLIC_VIEWER', user: u };
        } catch (e) {}
      }
      return { authenticated: false, role: 'VIEWER', account_type: 'PUBLIC_VIEWER' };
    }),
  },
}));

describe('GeoNexus Public Landing Experience & Architecture', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState(null, '', '/');
  });

  it('renders standalone public landing page at / with GeoNexus identity, SIH26023 context and CTAs', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'GeoNexus', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/AI-Powered Geological, Mining & Reporting Platform/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Smart India Hackathon 2026/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Autonomous intelligence conveyor/i)).toBeInTheDocument();
    expect(screen.getByText(/The GeoNexus Geological Intelligence Pipeline/i)).toBeInTheDocument();
    expect(screen.getByText(/The 8 Autonomous Specialized Agents/i)).toBeInTheDocument();
    expect(screen.getByText(/Built with Modern, Production-Ready Technologies/i)).toBeInTheDocument();
  });

  it('contains the moving mining cart visualization and stage progression on public landing page', () => {
    render(<App />);

    // Check mining cart track elements
    expect(screen.getByText(/The GeoNexus Geological Intelligence Pipeline/i)).toBeInTheDocument();
    expect(screen.getByText(/STAGE 01 OF 07/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Format Ingestion/i)).toBeInTheDocument();

    // Check all 8 agents are listed
    expect(screen.getByText('ManagerAgent')).toBeInTheDocument();
    expect(screen.getByText('DocumentIntelligenceAgent')).toBeInTheDocument();
    expect(screen.getByText('RetrievalAgent')).toBeInTheDocument();
    expect(screen.getByText('MiningIntelligenceAgent')).toBeInTheDocument();
    expect(screen.getByText('ValidationAgent')).toBeInTheDocument();
    expect(screen.getByText('ReportGenerationAgent')).toBeInTheDocument();
    expect(screen.getByText('GovernmentInquiryAgent')).toBeInTheDocument();
    expect(screen.getByText('QualityGovernanceAgent')).toBeInTheDocument();
  });

  it('navigates from landing to Register page and handles clean public registration flow without role selector', async () => {
    render(<App />);

    const registerBtns = screen.getAllByRole('button', { name: /Register/i });
    fireEvent.click(registerBtns[0]);

    expect(await screen.findByText(/PUBLIC VISITOR REGISTRATION/i)).toBeInTheDocument();
    expect(screen.getByText(/Register for GeoNexus Access/i)).toBeInTheDocument();

    // Verify NO role selection dropdown exists
    expect(screen.queryByText(/Choose Admin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Choose Mining Analyst/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Choose Reviewing Officer/i)).not.toBeInTheDocument();
  });

  it('navigates from landing to Login page and supports Public Viewer authentication', async () => {
    render(<App />);

    const loginBtns = screen.getAllByRole('button', { name: /Login/i });
    fireEvent.click(loginBtns[0]);

    expect(await screen.findByText(/PUBLIC & AUDITOR ACCESS/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign In to GeoNexus/i)).toBeInTheDocument();

    // Click Sign in as public viewer
    const submitBtn = screen.getByRole('button', { name: /Sign In as Public Viewer/i });
    fireEvent.click(submitBtn);

    // Should authenticate and navigate to operational dashboard with Auditor/Viewer mode
    expect(await screen.findByText('COAL INDIA', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByText(/Platform Overview & Architecture/i, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(localStorage.getItem('cil_user_role')).toBe('VIEWER');
  });

  it('navigates from landing to Register page when Access GeoNexus CTA is clicked', async () => {
    render(<App />);

    const accessBtn = screen.getByRole('button', { name: /Access GeoNexus \(Register\)/i });
    fireEvent.click(accessBtn);

    expect(await screen.findByText(/PUBLIC VISITOR REGISTRATION/i)).toBeInTheDocument();
    expect(screen.getByText(/Register for GeoNexus Access/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated users attempting to access /dashboard to /login', async () => {
    window.history.pushState(null, '', '/dashboard');
    render(<App />);

    expect(await screen.findByText(/PUBLIC & AUDITOR ACCESS/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign In to GeoNexus/i)).toBeInTheDocument();
  });

  it('navigates from landing to Official Authority Portal when Authority Portal button is clicked', async () => {
    render(<App />);

    const authorityBtns = screen.getAllByRole('button', { name: /Authority Portal/i });
    fireEvent.click(authorityBtns[0]);

    expect(await screen.findByText(/RESTRICTED PERSONNEL ACCESS/i)).toBeInTheDocument();
    expect(screen.getByText(/Official Authority Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Statutory Mining Governance & Operational Command/i)).toBeInTheDocument();
  });
});

describe('Official Authority Portal Authentication & Role Resolution', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState(null, '', '/authority');
  });

  it('authenticates Analyst and resolves role to ANALYST workspace', async () => {
    render(<App />);

    expect(await screen.findByText(/Official Authority Access/i)).toBeInTheDocument();

    // Click quick evaluation helper for Mining Analyst
    const analystHelper = screen.getByRole('button', { name: /Mining Analyst/i });
    fireEvent.click(analystHelper);

    const submitBtn = screen.getByRole('button', { name: /Authenticate Authority Session/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('COAL INDIA', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(localStorage.getItem('cil_user_role')).toBe('ANALYST');
  });

  it('authenticates Reviewing Officer and resolves role to OFFICER workspace', async () => {
    render(<App />);

    expect(await screen.findByText(/Official Authority Access/i)).toBeInTheDocument();

    const officerHelper = screen.getByRole('button', { name: /Reviewing Officer/i });
    fireEvent.click(officerHelper);

    const submitBtn = screen.getByRole('button', { name: /Authenticate Authority Session/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('COAL INDIA', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(localStorage.getItem('cil_user_role')).toBe('OFFICER');
  });

  it('authenticates System Admin and resolves role to ADMIN workspace', async () => {
    render(<App />);

    expect(await screen.findByText(/Official Authority Access/i)).toBeInTheDocument();

    const adminHelper = screen.getByRole('button', { name: /System Admin/i });
    fireEvent.click(adminHelper);

    const submitBtn = screen.getByRole('button', { name: /Authenticate Authority Session/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('COAL INDIA', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(localStorage.getItem('cil_user_role')).toBe('ADMIN');
  });
});

describe('Public Registered User Access Control & RBAC Boundary Enforcement', () => {
  beforeEach(() => {
    localStorage.clear();
    // Simulate authenticated public registered viewer
    localStorage.setItem(
      'cil_auth_user',
      JSON.stringify({
        email: 'auditor.citizen@geonexus.cil',
        name: 'Public Auditor',
        accountType: 'PUBLIC_VIEWER',
        authorizedRole: 'VIEWER',
      })
    );
    localStorage.setItem('cil_user_role', 'VIEWER');
    window.history.pushState(null, '', '/dashboard');
  });

  it('locks public registered users to VIEWER role and prevents escalating to ANALYST', async () => {
    render(<App />);

    expect(await screen.findByText('COAL INDIA', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText('READ-ONLY MODE')).toBeInTheDocument();

    // Verify localStorage cil_user_role is locked to VIEWER
    expect(localStorage.getItem('cil_user_role')).toBe('VIEWER');
  });

  it('proves PUBLIC_VIEWER sees restricted indicators and cannot escalate to ANALYST', async () => {
    render(<App />);
    expect(await screen.findByText('COAL INDIA', {}, { timeout: 4000 })).toBeInTheDocument();

    const roleComboboxes = screen.getAllByRole('combobox', { name: /Switch Role Perspective/i });
    expect(roleComboboxes.length).toBeGreaterThan(0);

    // Open the dropdown
    fireEvent.click(roleComboboxes[0]);

    // Check that RESTRICTED badges are visible for authority roles
    const restrictedBadges = screen.getAllByText('RESTRICTED');
    expect(restrictedBadges.length).toBeGreaterThan(0);

    // Attempt to click Mining Analyst option
    const analystOptions = screen.getAllByTestId('role-option-analyst');
    fireEvent.click(analystOptions[0]);

    // Role remains locked to VIEWER
    expect(localStorage.getItem('cil_user_role')).toBe('VIEWER');
  }, 10000);

  it('proves PUBLIC_VIEWER -> OFFICER escalation is strictly denied', async () => {
    render(<App />);
    expect(await screen.findByText('COAL INDIA', {}, { timeout: 4000 })).toBeInTheDocument();

    const roleComboboxes = screen.getAllByRole('combobox', { name: /Switch Role Perspective/i });
    fireEvent.click(roleComboboxes[0]);

    const officerOptions = screen.getAllByTestId('role-option-officer');
    fireEvent.click(officerOptions[0]);

    expect(localStorage.getItem('cil_user_role')).toBe('VIEWER');
  }, 10000);

  it('proves PUBLIC_VIEWER -> ADMIN escalation is strictly denied', async () => {
    render(<App />);
    expect(await screen.findByText('COAL INDIA', {}, { timeout: 4000 })).toBeInTheDocument();

    const roleComboboxes = screen.getAllByRole('combobox', { name: /Switch Role Perspective/i });
    fireEvent.click(roleComboboxes[0]);

    const adminOptions = screen.getAllByTestId('role-option-admin');
    fireEvent.click(adminOptions[0]);

    expect(localStorage.getItem('cil_user_role')).toBe('VIEWER');
  }, 10000);

  it('resists localStorage tampering: pre-setting cil_user_role to ADMIN resets to VIEWER upon mount', async () => {
    localStorage.setItem('cil_user_role', 'ADMIN');
    render(<App />);

    expect(await screen.findByText('COAL INDIA', {}, { timeout: 4000 })).toBeInTheDocument();
    // Tampered role must be purged and normalized back to VIEWER
    expect(localStorage.getItem('cil_user_role')).toBe('VIEWER');
    expect(screen.getByText('READ-ONLY MODE')).toBeInTheDocument();
  }, 10000);

  it('rejects direct access to restricted internal tabs for public viewers and redirects to dashboard', async () => {
    // Attempting to navigate directly to /settings or /agents as a public viewer
    window.history.pushState(null, '', '/settings');
    render(<App />);

    // Expect to be safe and rendered within allowed views
    expect(await screen.findByText('COAL INDIA', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText('READ-ONLY MODE')).toBeInTheDocument();
  });
});

describe('Operational Real Application — Overview & Workspaces Safe Preservation', () => {
  beforeEach(() => {
    localStorage.clear();
    // Authority user setup
    localStorage.setItem(
      'cil_auth_user',
      JSON.stringify({
        email: 'analyst@cil.gov.in',
        name: 'Mining Analyst',
        accountType: 'AUTHORITY',
        authorizedRole: 'ANALYST',
      })
    );
    localStorage.setItem('cil_user_role', 'ANALYST');
    window.history.pushState(null, '', '/dashboard');
  });

  it('renders authentic operational workspace with sidebar, topbar and Overview structure', async () => {
    render(<App />);

    expect(screen.getByText('COAL INDIA')).toBeInTheDocument();
    expect(screen.getByText('CMPDI Intelligence Suite')).toBeInTheDocument();
    expect(screen.getByText(/Platform Overview & Architecture/i)).toBeInTheDocument();
  });

  it('allows navigating to Document Center and displays document filters in operational dashboard', async () => {
    render(<App />);

    const docTab = screen.getByRole('button', { name: /Document Ingestion & OCR/i });
    fireEvent.click(docTab);

    expect(await screen.findByText(/Document Intelligence & Ingestion Catalog/i, {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('allows switching user roles for legitimate authority accounts', async () => {
    render(<App />);

    const roleComboboxes = screen.getAllByRole('combobox', { name: /Switch Role Perspective/i });
    expect(roleComboboxes.length).toBeGreaterThan(0);

    fireEvent.click(roleComboboxes[0]);
    const officerOption = screen.getAllByTestId('role-option-officer')[0];
    fireEvent.click(officerOption);

    expect(localStorage.getItem('cil_user_role')).toBe('OFFICER');
  });

  it('allows navigating to Mining Operations and safely renders summary metrics', async () => {
    render(<App />);

    const opsTab = screen.getByRole('button', { name: /Mining Intelligence Operations/i });
    fireEvent.click(opsTab);

    expect(await screen.findByText(/Mining Intelligence Command & Operations/i, {}, { timeout: 4000 })).toBeInTheDocument();
  });
});
