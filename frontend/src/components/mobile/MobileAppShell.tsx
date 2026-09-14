import React, { useState, useEffect } from 'react';
import { NavigationTab } from '@/components/layout/Sidebar';
import { MobileTopBar } from '@/components/mobile/MobileTopBar';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { MobileNavDrawer } from '@/components/mobile/MobileNavDrawer';

// Views
import { MobileDashboardView } from '@/components/mobile/views/MobileDashboardView';
import { MobileDocumentsView } from '@/components/mobile/views/MobileDocumentsView';
import { MobileReportsView } from '@/components/mobile/views/MobileReportsView';
import { MobileInquiriesView } from '@/components/mobile/views/MobileInquiriesView';
import { MobileValidationView } from '@/components/mobile/views/MobileValidationView';
import { MobileSearchView } from '@/components/mobile/views/MobileSearchView';
import { MobileAssistantView } from '@/components/mobile/views/MobileAssistantView';
import { MobileTopicsView } from '@/components/mobile/views/MobileTopicsView';
import { MobileAnalyticsView } from '@/components/mobile/views/MobileAnalyticsView';
import { MobileAgentsView } from '@/components/mobile/views/MobileAgentsView';
import { MobileAuditView } from '@/components/mobile/views/MobileAuditView';
import { MobileSettingsView } from '@/components/mobile/views/MobileSettingsView';
import { MobileHelpView } from '@/components/mobile/views/MobileHelpView';
import { MobileOverviewView } from '@/components/mobile/views/MobileOverviewView';

// Modals
import { MobileDocumentDetailModal } from '@/components/mobile/MobileDocumentDetailModal';
import { MobileReportDetailModal } from '@/components/mobile/MobileReportDetailModal';
import { MobileInquiryDetailModal } from '@/components/mobile/MobileInquiryDetailModal';
import { MobileDiscrepancyDetailModal } from '@/components/mobile/MobileDiscrepancyDetailModal';
import { MobileWorkflowDAGModal } from '@/components/mobile/MobileWorkflowDAGModal';
import { UploadModal } from '@/components/modals/UploadModal';

import { analyticsService, settingsService } from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { DiscrepancyIssue, InquiryRecord } from '@/types';

export const MobileAppShell: React.FC = () => {
  const { isViewer } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [conflictsCount, setConflictsCount] = useState(0);
  const [dbConnected, setDbConnected] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Global Modals State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [inspectDocId, setInspectDocId] = useState<number | null>(null);
  const [inspectWorkflowId, setInspectWorkflowId] = useState<string | null>(null);
  const [inspectReportId, setInspectReportId] = useState<number | null>(null);
  const [inspectInquiry, setInspectInquiry] = useState<InquiryRecord | null>(null);
  const [inspectDiscrepancy, setInspectDiscrepancy] = useState<DiscrepancyIssue | null>(null);

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
          sumRes.value.summary.total_conflicts_flagged ??
            sumRes.value.summary.unresolved_inconsistencies ??
            0
        );
      }

      if (healthRes.status === 'fulfilled' && healthRes.value) {
        setDbConnected(healthRes.value.database_connected !== false);
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
    toast.info('Seed Started', 'Preloading demonstration files...');
    try {
      const res = await settingsService.seedDemoData();
      toast.success(
        'Seeding Complete',
        `Ingested ${res.documents_processed?.length || 0} files & flagged ${res.discrepancies_detected || 0} test cases.`
      );
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Seeding failed';
      toast.error('Seeding Error', msg);
    } finally {
      setIsSeeding(false);
    }
  };

  // Route security guard: Redirect VIEWER away from restricted internal tabs
  const VIEWER_ALLOWED_TABS: NavigationTab[] = [
    'overview',
    'dashboard',
    'reports',
    'documents',
    'analytics',
    'audit',
    'help',
  ];

  useEffect(() => {
    if (isViewer && !VIEWER_ALLOWED_TABS.includes(activeTab)) {
      setActiveTab('dashboard');
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/dashboard');
      }
    }
  }, [activeTab, isViewer]);

  const handleSelectTab = (tab?: NavigationTab) => {
    const targetTab = tab || 'dashboard';
    if (isViewer && !VIEWER_ALLOWED_TABS.includes(targetTab)) {
      toast.error('Access Restricted', `Tab '${targetTab}' requires internal clearance.`);
      setActiveTab('dashboard');
      return;
    }
    setActiveTab(targetTab);
    if (typeof window !== 'undefined') {
      const path = targetTab === 'overview' || targetTab === 'dashboard' ? '/dashboard' : `/${targetTab}`;
      window.history.pushState(null, '', path);
    }
  };

  return (
    <div className="mobile-app-root">
      {/* 1. Mobile TopBar */}
      <MobileTopBar
        activeTab={activeTab}
        onOpenMenu={() => setMobileDrawerOpen(true)}
        onOpenUpload={() => setUploadModalOpen(true)}
        onQuickSeed={handleQuickSeed}
        isSeeding={isSeeding}
        dbConnected={dbConnected}
        docCount={docCount}
        conflictsCount={conflictsCount}
      />

      {/* 2. Main Mobile Viewport */}
      <main id="mobile-main-content">
        {activeTab === 'overview' && (
          <MobileOverviewView
            onEnterWorkspace={handleSelectTab}
            docCount={docCount}
            conflictsCount={conflictsCount}
          />
        )}

        {activeTab === 'dashboard' && (
          <MobileDashboardView
            onNavigate={handleSelectTab}
            onInspectDocument={(id) => setInspectDocId(id)}
            onInspectWorkflow={(id) => setInspectWorkflowId(id)}
            onInspectReport={(id) => setInspectReportId(id)}
          />
        )}

        {activeTab === 'documents' && (
          <MobileDocumentsView
            onOpenUpload={() => setUploadModalOpen(true)}
            onInspectDocument={(id) => setInspectDocId(id)}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'search' && (
          <MobileSearchView onInspectDocument={(id) => setInspectDocId(id)} />
        )}

        {activeTab === 'assistant' && <MobileAssistantView />}

        {activeTab === 'reports' && (
          <MobileReportsView onInspectReport={(id) => setInspectReportId(id)} />
        )}

        {activeTab === 'inquiries' && (
          <MobileInquiriesView onInspectInquiry={(inq) => setInspectInquiry(inq)} />
        )}

        {activeTab === 'validation' && (
          <MobileValidationView onInspectDiscrepancy={(iss) => setInspectDiscrepancy(iss)} />
        )}

        {activeTab === 'topics' && <MobileTopicsView />}

        {activeTab === 'analytics' && <MobileAnalyticsView />}

        {activeTab === 'agents' && (
          <MobileAgentsView onInspectWorkflow={(id) => setInspectWorkflowId(id)} />
        )}

        {activeTab === 'audit' && <MobileAuditView />}

        {activeTab === 'settings' && (
          <MobileSettingsView onSeeded={() => setRefreshTrigger((prev) => prev + 1)} />
        )}

        {activeTab === 'help' && <MobileHelpView />}
      </main>

      {/* 3. Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenMore={() => setMobileDrawerOpen(true)}
        docCount={docCount}
        conflictsCount={conflictsCount}
      />

      {/* 4. Mobile Categorized Navigation Drawer */}
      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        docCount={docCount}
        conflictsCount={conflictsCount}
        onOpenUpload={() => setUploadModalOpen(true)}
        onQuickSeed={handleQuickSeed}
        isSeeding={isSeeding}
      />

      {/* 5. Mobile Detail Modals / Sheets */}
      <MobileDocumentDetailModal
        docId={inspectDocId}
        isOpen={inspectDocId !== null}
        onClose={() => setInspectDocId(null)}
        onDocumentChanged={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <MobileWorkflowDAGModal
        workflowId={inspectWorkflowId}
        isOpen={inspectWorkflowId !== null}
        onClose={() => setInspectWorkflowId(null)}
        onWorkflowUpdated={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <MobileReportDetailModal
        reportId={inspectReportId}
        isOpen={inspectReportId !== null}
        onClose={() => setInspectReportId(null)}
        onReportApproved={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <MobileInquiryDetailModal
        inquiry={inspectInquiry}
        isOpen={inspectInquiry !== null}
        onClose={() => setInspectInquiry(null)}
        onInquiryApproved={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <MobileDiscrepancyDetailModal
        issue={inspectDiscrepancy}
        isOpen={inspectDiscrepancy !== null}
        onClose={() => setInspectDiscrepancy(null)}
        onIssueResolved={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
};
