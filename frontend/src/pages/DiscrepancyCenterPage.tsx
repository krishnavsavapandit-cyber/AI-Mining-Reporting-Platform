import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  Play,
  Check,
  XCircle,
  Clock,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { validationService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { DiscrepancyIssue, DiscrepancyLifecycleStatus } from '@/types';

export const DiscrepancyCenterPage: React.FC = () => {
  const { role, isViewer } = useAuth();
  const [issues, setIssues] = useState<DiscrepancyIssue[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<DiscrepancyIssue | null>(null);

  // Guided Resolution Form State
  const [selectedGroundTruth, setSelectedGroundTruth] = useState<'A' | 'B' | 'CUSTOM'>('A');
  const [customValue, setCustomValue] = useState<string>('');
  const [resolutionNote, setResolutionNote] = useState('');
  const toast = useToast();

  useEffect(() => {
    loadIssues();
  }, [statusFilter]);

  // When selected issue changes, initialize resolution form with smart defaults
  useEffect(() => {
    if (selectedIssue) {
      if (selectedIssue.adopted_source === 'SOURCE_B') {
        setSelectedGroundTruth('B');
      } else if (selectedIssue.adopted_source === 'CUSTOM') {
        setSelectedGroundTruth('CUSTOM');
        setCustomValue(selectedIssue.resolved_value || '');
      } else {
        setSelectedGroundTruth('A');
      }
      setResolutionNote(selectedIssue.resolved_note || '');
    }
  }, [selectedIssue?.id]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await validationService.getIssues(statusFilter || undefined);
      const fetched = res.issues || [];
      setIssues(fetched);
      if (fetched.length > 0) {
        if (!selectedIssue || !fetched.some((i) => i.id === selectedIssue.id)) {
          setSelectedIssue(fetched[0]);
        }
      } else {
        setSelectedIssue(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading discrepancies';
      toast.error('Discrepancy Load Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    toast.info('Scanning Ingested Data', 'Cross-referencing production records across all subsidiaries...');
    try {
      const res = await validationService.runScan();
      toast.success(
        'Scan Complete',
        `Discrepancy audit completed. Flagged ${res.issues_count || 0} cross-document conflicts.`
      );
      loadIssues();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan failed';
      toast.error('Scan Error', msg);
    } finally {
      setScanning(false);
    }
  };

  const handleApproveResolution = async (issueId: number) => {
    if (!selectedIssue) return;
    setSubmitting(true);

    let chosenVal = String(selectedIssue.doc_a_value ?? '');
    let adoptedSrc = 'SOURCE_A';
    let decisionType = 'ADOPT_SOURCE_A';

    if (selectedGroundTruth === 'B') {
      chosenVal = String(selectedIssue.doc_b_value ?? '');
      adoptedSrc = 'SOURCE_B';
      decisionType = 'ADOPT_SOURCE_B';
    } else if (selectedGroundTruth === 'CUSTOM') {
      if (!customValue.trim()) {
        toast.error('Value Required', 'Please enter a certified override value.');
        setSubmitting(false);
        return;
      }
      chosenVal = customValue.trim();
      adoptedSrc = 'CUSTOM';
      decisionType = 'CERTIFIED_OVERRIDE';
    }

    const note = resolutionNote.trim() || `Certified as legal ground truth (${chosenVal}) by Reviewing Officer (${role}).`;

    try {
      await validationService.resolveIssue(issueId, {
        resolved_by: `Officer (${role})`,
        note,
        adopted_source: adoptedSrc,
        resolved_value: chosenVal,
        decision_type: decisionType,
      });

      toast.success(
        'Discrepancy Certified & Resolved',
        `Conflict #${issueId} resolved. Established "${chosenVal}" as ground truth.`
      );

      // Optimistic update in local state
      setIssues((prev) =>
        prev.map((item) =>
          item.id === issueId
            ? {
                ...item,
                status: 'RESOLVED',
                resolved_by: `Officer (${role})`,
                resolved_note: note,
                adopted_source: adoptedSrc,
                resolved_value: chosenVal,
                decision_type: decisionType,
              }
            : item
        )
      );

      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue((prev) =>
          prev
            ? {
                ...prev,
                status: 'RESOLVED',
                resolved_by: `Officer (${role})`,
                resolved_note: note,
                adopted_source: adoptedSrc,
                resolved_value: chosenVal,
                decision_type: decisionType,
              }
            : null
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to certify resolution';
      toast.error('Resolution Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (issueId: number, newStatus: DiscrepancyLifecycleStatus) => {
    setSubmitting(true);
    try {
      await validationService.updateLifecycle(issueId, {
        status: newStatus,
        reviewer: `Officer (${role})`,
        note: resolutionNote || undefined,
      });
      toast.success('Status Updated', `Discrepancy #${issueId} marked as ${newStatus}.`);

      // Optimistic update
      setIssues((prev) =>
        prev.map((item) =>
          item.id === issueId
            ? { ...item, status: newStatus, resolved_by: `Officer (${role})`, resolved_note: resolutionNote }
            : item
        )
      );

      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue((prev) =>
          prev
            ? { ...prev, status: newStatus, resolved_by: `Officer (${role})`, resolved_note: resolutionNote }
            : null
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error('Update Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Severity & Status distribution calculations
  const totalCount = issues.length;
  const criticalCount = issues.filter((i) => i.severity === 'HIGH' || (i.variance_percentage && i.variance_percentage > 15)).length;
  const mediumCount = issues.filter((i) => i.severity === 'MEDIUM' || (i.variance_percentage && i.variance_percentage <= 15 && i.variance_percentage > 5)).length;
  const openCount = issues.filter((i) => !i.status || i.status === 'OPEN' || i.status === 'UNRESOLVED').length;
  const reviewCount = issues.filter((i) => i.status === 'UNDER_REVIEW').length;
  const resolvedCount = issues.filter((i) => i.status === 'RESOLVED').length;

  const filteredIssues = issues.filter((iss) => {
    if (severityFilter && iss.severity !== severityFilter) return false;
    return true;
  });

  const QUICK_JUSTIFICATIONS = [
    'Audited weighbridge records match Source A figures.',
    'Provisional monthly estimate in Source B superseded by statutory return.',
    'Corrigendum notified by Area General Manager applied.',
    'Variance within acceptable statutory moisture deduction limits.',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          padding: '18px 24px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(217, 164, 65, 0.12)',
              border: '1px solid var(--status-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-warning)',
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Cross-Document Discrepancy & Conflict Registry
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Automated numerical discrepancy detection across monthly reports, annual summaries, and statutory returns.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isViewer && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunScan}
              loading={scanning}
              icon={<Play size={13} />}
            >
              Run Invariant Scan
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadIssues}
            loading={loading}
            icon={<RefreshCw size={13} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Explicit Discrepancy Status Banner */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: issues.length === 0 ? 'rgba(16, 185, 129, 0.08)' : openCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(217, 164, 65, 0.08)',
          border: `1px solid ${issues.length === 0 ? 'var(--accent-primary)' : openCount > 0 ? 'var(--status-error)' : 'var(--status-warning)'}`,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: issues.length === 0 ? 'rgba(16, 185, 129, 0.15)' : openCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(217, 164, 65, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: issues.length === 0 ? 'var(--accent-primary)' : openCount > 0 ? 'var(--status-error)' : 'var(--status-warning)',
            }}
          >
            {issues.length === 0 ? <Check size={20} /> : <ShieldAlert size={20} />}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
              {issues.length === 0
                ? 'NO DISCREPANCIES FOUND'
                : `${issues.length} DISCREPANCIES DETECTED`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {issues.length === 0
                ? 'All statutory mining figures and production invariants across indexed documents are verified consistent.'
                : `${openCount} item(s) pending officer resolution • ${reviewCount} under review • ${resolvedCount} certified.`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {issues.length === 0 ? (
            <Badge variant="primary">ALL INVARIANTS SATISFIED</Badge>
          ) : (
            <>
              {criticalCount > 0 && <Badge variant="error">{criticalCount} CRITICAL</Badge>}
              {openCount > 0 && <Badge variant="warning">{openCount} ACTION REQUIRED</Badge>}
              {resolvedCount > 0 && <Badge variant="primary">{resolvedCount} RESOLVED</Badge>}
            </>
          )}
        </div>
      </div>

      {/* 3. Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL CONFLICTS</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{totalCount}</div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-error)' }}>CRITICAL / HIGH</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-error)', marginTop: 2 }}>{criticalCount}</div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-warning)' }}>MEDIUM SEVERITY</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-warning)', marginTop: 2 }}>{mediumCount}</div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>OPEN / UNRESOLVED</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{openCount}</div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-teal)' }}>UNDER REVIEW</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-teal)', marginTop: 2 }}>{reviewCount}</div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)' }}>RESOLVED</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-primary)', marginTop: 2 }}>{resolvedCount}</div>
        </div>
      </div>

      {issues.length === 0 && !loading ? (
        <div
          style={{
            padding: '32px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 14,
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-emerald)',
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--text-emerald)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              VALIDATION RESULT
            </span>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0 0' }}>
              NO DISCREPANCIES FOUND
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0 0', maxWidth: 560 }}>
              All cross-document figures and mathematical invariants are consistent across evaluated records.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 24,
              padding: '12px 24px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              marginTop: 8,
              fontSize: 12,
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Documents compared: </span>
              <strong style={{ color: 'var(--text-primary)' }}>Verified</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Facts checked: </span>
              <strong style={{ color: 'var(--text-primary)' }}>Consistent</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Human review items: </span>
              <strong style={{ color: 'var(--text-emerald)' }}>0</strong>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1.35fr)', gap: 24, minWidth: 0, width: '100%' }}>
          {/* Left: Discrepancy Queue */}
          <div className="card-level-1" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 className="card-title">Flagged Conflict Queue</h3>
                <span className="card-subtitle">Select any conflict record to open officer adjudication workbench</span>
              </div>

              {/* Status & Severity Filter Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-select"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: 11 }}
                >
                  <option value="">All Statuses</option>
                  <option value="UNRESOLVED">Unresolved</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="input-select"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: 11 }}
                >
                  <option value="">All Severities</option>
                  <option value="HIGH">High Severity</option>
                  <option value="MEDIUM">Medium Severity</option>
                  <option value="LOW">Low Severity</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Conflict ID</th>
                    <th>Field / Metric</th>
                    <th>Subsidiary</th>
                    <th>Variance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((iss) => {
                    const isSelected = selectedIssue?.id === iss.id;
                    const isResolved = iss.status === 'RESOLVED';
                    return (
                      <tr
                        key={iss.id}
                        onClick={() => setSelectedIssue(iss)}
                        style={{
                          backgroundColor: isSelected ? 'rgba(31, 138, 92, 0.08)' : undefined,
                          cursor: 'pointer',
                        }}
                      >
                        <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                          #{iss.id}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <strong style={{ color: 'var(--text-primary)', fontSize: 12 }}>
                              {iss.field_name || 'Production Quantity'}
                            </strong>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {iss.reporting_period || 'May 2025'} • {iss.doc_a_name?.substring(0, 22)}...
                            </span>
                          </div>
                        </td>
                        <td>
                          <Badge variant="slate">{iss.subsidiary || 'ECL'}</Badge>
                        </td>
                        <td>
                          <span
                            className="text-mono"
                            style={{
                              fontWeight: 700,
                              color:
                                (iss.variance_percentage || 0) > 10
                                  ? 'var(--status-error)'
                                  : (iss.variance_percentage || 0) > 0
                                  ? 'var(--status-warning)'
                                  : 'var(--accent-primary)',
                            }}
                          >
                            {iss.variance_percentage ? `${iss.variance_percentage.toFixed(1)}%` : 'VAR'}
                          </span>
                        </td>
                        <td>
                          <Badge
                            variant={
                              isResolved
                                ? 'primary'
                                : iss.status === 'UNDER_REVIEW'
                                ? 'teal'
                                : iss.status === 'DISMISSED'
                                ? 'slate'
                                : 'warning'
                            }
                          >
                            {iss.status || 'UNRESOLVED'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Guided Officer Adjudication Workspace */}
          {selectedIssue ? (
            <div
              className="card-level-1"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                minWidth: 0,
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              {/* Workspace Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-hairline)', paddingBottom: 12, minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="text-mono" style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: 13 }}>
                      CONFLICT #{selectedIssue.id}
                    </span>
                    <Badge variant={selectedIssue.severity === 'HIGH' ? 'error' : 'warning'}>
                      {selectedIssue.severity} SEVERITY
                    </Badge>
                    <Badge variant="teal">{selectedIssue.subsidiary}</Badge>
                    {selectedIssue.status === 'RESOLVED' && (
                      <Badge variant="primary">CERTIFIED RESOLUTION</Badge>
                    )}
                  </div>
                  <h4
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginTop: 4,
                      marginBottom: 0,
                    }}
                  >
                    {selectedIssue.field_name || 'Production Quantity Conflict'}
                  </h4>
                </div>
              </div>

              {/* Resolution Status Banner (if already resolved) */}
              {selectedIssue.status === 'RESOLVED' && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Award size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>
                      CERTIFIED GROUND TRUTH ESTABLISHED
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    Adopted Value: <strong>{selectedIssue.resolved_value || selectedIssue.doc_a_value}</strong> ({selectedIssue.adopted_source || 'SOURCE_A'})
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Resolved by <strong>{selectedIssue.resolved_by || `Officer (${role})`}</strong>: {selectedIssue.resolved_note || 'Audited and verified against statutory baseline.'}
                  </div>
                </div>
              )}

              {/* Step 1: Select Ground Truth Source */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    STEP 1: SELECT GOVERNING GROUND TRUTH
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--status-warning)', fontWeight: 600 }}>
                    Variance: {selectedIssue.variance_percentage ? `${selectedIssue.variance_percentage.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {/* Option A: Source Document A */}
                  <div
                    onClick={() => !isViewer && setSelectedGroundTruth('A')}
                    style={{
                      padding: '12px',
                      backgroundColor: selectedGroundTruth === 'A' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-2)',
                      border: `1.5px solid ${selectedGroundTruth === 'A' ? 'var(--accent-primary)' : 'var(--border-hairline)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: isViewer ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        SOURCE DOC A
                      </span>
                      {selectedGroundTruth === 'A' && <CheckCircle2 size={15} style={{ color: 'var(--accent-primary)' }} />}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                      {selectedIssue.doc_a_name || 'Document A'}
                    </div>
                    <div
                      className="text-mono"
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'var(--accent-primary)',
                        padding: '4px 6px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: 2,
                      }}
                    >
                      {selectedIssue.doc_a_value ?? 'N/A'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Page {selectedIssue.doc_a_page || 1} • Ingested Record
                    </div>
                  </div>

                  {/* Option B: Source Document B */}
                  <div
                    onClick={() => !isViewer && setSelectedGroundTruth('B')}
                    style={{
                      padding: '12px',
                      backgroundColor: selectedGroundTruth === 'B' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-2)',
                      border: `1.5px solid ${selectedGroundTruth === 'B' ? 'var(--accent-primary)' : 'var(--border-hairline)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: isViewer ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        SOURCE DOC B
                      </span>
                      {selectedGroundTruth === 'B' && <CheckCircle2 size={15} style={{ color: 'var(--accent-primary)' }} />}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                      {selectedIssue.doc_b_name || 'Document B'}
                    </div>
                    <div
                      className="text-mono"
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'var(--status-warning)',
                        padding: '4px 6px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: 2,
                      }}
                    >
                      {selectedIssue.doc_b_value ?? 'N/A'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Page {selectedIssue.doc_b_page || 1} • Cross-Reference
                    </div>
                  </div>
                </div>

                {/* Option C: Certified Custom Override */}
                <div
                  onClick={() => !isViewer && setSelectedGroundTruth('CUSTOM')}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: selectedGroundTruth === 'CUSTOM' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-2)',
                    border: `1.5px solid ${selectedGroundTruth === 'CUSTOM' ? 'var(--accent-primary)' : 'var(--border-hairline)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: isViewer ? 'default' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Option 3: Certified Statutory Override Value
                    </span>
                    {selectedGroundTruth === 'CUSTOM' && <CheckCircle2 size={15} style={{ color: 'var(--accent-primary)' }} />}
                  </div>
                  {selectedGroundTruth === 'CUSTOM' && (
                    <div style={{ marginTop: 4 }}>
                      <input
                        type="text"
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        placeholder="Enter certified official value (e.g. 1.35 MT / Corrigendum)..."
                        className="input-text"
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Officer Justification & Quick Chips */}
              {!isViewer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border-hairline)', paddingTop: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    STEP 2: STATUTORY AUDIT REMARKS & JUSTIFICATION
                  </span>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {QUICK_JUSTIFICATIONS.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setResolutionNote(chip)}
                        style={{
                          fontSize: 10,
                          padding: '4px 8px',
                          backgroundColor: 'var(--bg-surface-2)',
                          border: '1px solid var(--border-hairline)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Enter official resolution rationale, board order reference, or audit remarks..."
                    className="input-textarea"
                    style={{ fontSize: 12, minWidth: 0 }}
                  />

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApproveResolution(selectedIssue.id)}
                      loading={submitting}
                      icon={<Check size={14} />}
                    >
                      {selectedGroundTruth === 'A'
                        ? 'Approve & Adopt Source A'
                        : selectedGroundTruth === 'B'
                        ? 'Approve & Adopt Source B'
                        : 'Approve Certified Override'}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedIssue.id, 'UNDER_REVIEW')}
                      loading={submitting}
                      icon={<Clock size={13} />}
                    >
                      Flag Under Review
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedIssue.id, 'DISMISSED')}
                      loading={submitting}
                      icon={<XCircle size={13} />}
                    >
                      Dismiss Conflict
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card-level-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Select a conflict from the queue to inspect side-by-side evidence
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

