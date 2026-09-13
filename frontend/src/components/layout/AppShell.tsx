import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationTab } from './Sidebar';
import { TopBar } from './TopBar';
import { GeoNexusLanding } from '@/components/landing/GeoNexusLanding';
import { DashboardPage } from '@/pages/DashboardPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { SemanticSearchPage } from '@/pages/SemanticSearchPage';
import { AssistantPage } from '@/pages/AssistantPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { GovernmentInquiryPage } from '@/pages/GovernmentInquiryPage';
import { DiscrepancyCenterPage } from '@/pages/DiscrepancyCenterPage';
import { TopicsPage } from '@/pages/TopicsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { AgentMonitorPage } from '@/pages/AgentMonitorPage';
import { AuditProvenancePage } from '@/pages/AuditProvenancePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { HelpTrainingPage } from '@/pages/HelpTrainingPage';

import { UploadModal } from '@/components/modals/UploadModal';
import { DocumentDetailModal } from '@/components/modals/DocumentDetailModal';
import { WorkflowDAGModal } from '@/components/modals/WorkflowDAGModal';
import { ReportModal } from '@/components/modals/ReportModal';

import { analyticsService, settingsService } from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [conflictsCount, setConflictsCount] = useState(0);
  const [aiProviderName, setAiProviderName] = useState('Gemini Grounded Engine');
  const [aiProviderOnline, setAiProviderOnline] = useState(true);
  const [dbConnected, setDbConnected] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Global Modals State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [inspectDocId, setInspectDocId] = useState<number | null>(null);
  const [inspectWorkflowId, setInspectWorkflowId] = useState<string | null>(null);
  const [inspectReportId, setInspectReportId] = useState<number | null>(null);

  const toast = useToast();

  const refreshGlobalTelemetry = async () => {
    try {
      const [sumRes, healthRes] = await Promise.allSettled([
        analyticsService.getSummary(),
        settingsService.getHealth(),
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.summary) {
        setDocCount(sumRes.value.summary.total_documents || 0);
        setConflictsCount(
          sumRes.value.summary.total_conflicts_flagged ?? sumRes.value.summary.unresolved_inconsistencies ?? 0
        );
      }

      if (healthRes.status === 'fulfilled' && healthRes.value) {
        setDbConnected(healthRes.value.database_connected !== false);
        setAiProviderName(healthRes.value.ai_service?.provider_name || 'Gemini Grounded Engine');
        setAiProviderOnline(healthRes.value.ai_service?.is_connected !== false);
      }
    } catch {
      // Telemetry error handled silently
    }
  };

  useEffect(() => {
    refreshGlobalTelemetry();
  }, [refreshTrigger]);

  const handleQuickSeed = async () => {
    setIsSeeding(true);
    toast.info('Seed Started', 'Preloading synthetic CIL demonstration files...');
    try {
      const res = await settingsService.seedDemoData();
      toast.success(
        'Seeding Complete',
        `Ingested ${res.documents_processed?.length || 0} demonstration files & flagged ${res.discrepancies_detected || 0} cross-doc test cases.`
      );
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Seeding failed';
      toast.error('Seeding Error', msg);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        docCount={docCount}
        conflictsCount={conflictsCount}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        aiProviderName={aiProviderName}
        aiProviderOnline={aiProviderOnline}
      />

      {/* Main Content Area */}
      <div className="app-main">
        {/* TopBar */}
        <TopBar
          activeTab={activeTab}
          onOpenUpload={() => setUploadModalOpen(true)}
          onQuickSeed={handleQuickSeed}
          isSeeding={isSeeding}
          dbConnected={dbConnected}
        />

        {/* Workspace Pages */}
        <main className={`app-workspace ${activeTab === 'overview' ? 'landing-mode' : ''}`} id="main-content">
          {activeTab === 'overview' && (
            <GeoNexusLanding
              onEnterWorkspace={(target = 'dashboard') => setActiveTab(target)}
              docCount={docCount}
              conflictsCount={conflictsCount}
              aiProviderName={aiProviderName}
              aiProviderOnline={aiProviderOnline}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setActiveTab}
              onInspectDocument={(id) => setInspectDocId(id)}
              onInspectWorkflow={(id) => setInspectWorkflowId(id)}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsPage
              onOpenUpload={() => setUploadModalOpen(true)}
              onInspectDocument={(id) => setInspectDocId(id)}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'search' && (
            <SemanticSearchPage onInspectDocument={(id) => setInspectDocId(id)} />
          )}

          {activeTab === 'assistant' && <AssistantPage />}

          {activeTab === 'reports' && (
            <ReportsPage onInspectReport={(id) => setInspectReportId(id)} />
          )}

          {activeTab === 'inquiries' && <GovernmentInquiryPage />}

          {activeTab === 'validation' && <DiscrepancyCenterPage />}

          {activeTab === 'topics' && <TopicsPage />}

          {activeTab === 'analytics' && <AnalyticsPage />}

          {activeTab === 'agents' && (
            <AgentMonitorPage onInspectWorkflow={(id) => setInspectWorkflowId(id)} />
          )}

          {activeTab === 'audit' && <AuditProvenancePage />}

          {activeTab === 'settings' && (
            <SettingsPage onSeeded={() => setRefreshTrigger((prev) => prev + 1)} />
          )}

          {activeTab === 'help' && <HelpTrainingPage />}
        </main>
      </div>

      {/* Global Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <DocumentDetailModal
        docId={inspectDocId}
        isOpen={inspectDocId !== null}
        onClose={() => setInspectDocId(null)}
        onDocumentChanged={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <WorkflowDAGModal
        workflowId={inspectWorkflowId}
        isOpen={inspectWorkflowId !== null}
        onClose={() => setInspectWorkflowId(null)}
        onWorkflowUpdated={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <ReportModal
        reportId={inspectReportId}
        isOpen={inspectReportId !== null}
        onClose={() => setInspectReportId(null)}
        onReportApproved={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
};

export default AppShell;
