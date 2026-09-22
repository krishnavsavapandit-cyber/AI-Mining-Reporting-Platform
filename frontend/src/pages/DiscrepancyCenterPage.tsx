import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  Play,
  FileText,
  Check,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
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
  const [selectedIssue, setSelectedIssue] = useState<DiscrepancyIssue | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const toast = useToast();

  useEffect(() => {
    loadIssues();
  }, [statusFilter]);

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

  const handleUpdateStatus = async (issueId: number, newStatus: DiscrepancyLifecycleStatus) => {
    try {
      await validationService.updateLifecycle(issueId, {
        status: newStatus,
        reviewer: `Reviewer (${role})`,
        note: resolutionNote || undefined,
      });
      toast.success('Status Updated', `Discrepancy #${issueId} marked as ${newStatus}.`);
      setResolutionNote('');
      loadIssues();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error('Update Error', msg);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
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
              Automated numerical discrepancy detection across monthly reports, annual summaries, and ministry returns.
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

      {/* Quick Interactive Guide Banner */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={15} style={{ color: 'var(--status-warning)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              HOW DISCREPANCY AUDIT & RECONCILIATION WORKS
            </span>
          </div>
          <Badge variant="warning">3-STEP WORKFLOW</Badge>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-warning)' }}>
              1. Scan & Cross-Match
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Click <strong>"Run Invariant Scan"</strong> to automatically compare figures across documents for the same mine and reporting period.
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)' }}>
              2. Inspect Side-by-Side
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Select any conflict in the queue to inspect <strong>Source Doc A vs Source Doc B</strong> values, page citations, and calculated variance %.
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)' }}>
              3. Officer Reconciliation
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Enter resolution notes and click <strong>Resolve Conflict</strong>, <strong>Flag Under Review</strong>, or <strong>Dismiss</strong> to record in the Audit Trail.
            </div>
          </div>
        </div>
      </div>

      {/* 1. Discrepancy Overview Summary Bar (Summary) */}
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
        <EmptyState
          type="discrepancy"
          title="Zero Discrepancies Found"
          description="All extracted numerical facts across indexed documents satisfy schema and mathematical invariants."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: 24, minWidth: 0, width: '100%' }}>
          {/* Left: Discrepancy Queue & Table (Analysis) */}
          <div className="card-level-1" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 className="card-title">Flagged Conflict Queue</h3>
                <span className="card-subtitle">Select any conflict record to open side-by-side investigation</span>
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
                    <th>Period</th>
                    <th>Variance</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((iss) => {
                    const isSelected = selectedIssue?.id === iss.id;
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
                          <strong style={{ color: 'var(--text-primary)', fontSize: 12 }}>
                            {iss.field_name || 'Production Quantity'}
                          </strong>
                        </td>
                        <td>
                          <Badge variant="slate">{iss.subsidiary || 'ECL'}</Badge>
                        </td>
                        <td className="text-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {iss.reporting_period || 'May 2025'}
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
                              iss.severity === 'HIGH'
                                ? 'error'
                                : iss.severity === 'MEDIUM'
                                ? 'warning'
                                : 'slate'
                            }
                          >
                            {iss.severity || 'MEDIUM'}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            variant={
                              iss.status === 'RESOLVED'
                                ? 'primary'
                                : iss.status === 'UNDER_REVIEW'
                                ? 'teal'
                                : iss.status === 'DISMISSED'
                                ? 'slate'
                                : 'warning'
                            }
                          >
                            {iss.status || 'OPEN'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Side-by-Side Comparison Workspace (Detail & Action) */}
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
                  </div>
                  <h4
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginTop: 4,
                      marginBottom: 0,
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {selectedIssue.field_name || 'Production Conflict Investigation'}
                  </h4>
                </div>
              </div>

              {/* Side-by-Side 3-Box Comparison Matrix */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, width: '100%' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  CROSS-DOCUMENT EVIDENCE COMPARISON
                </span>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                    minWidth: 0,
                    width: '100%',
                  }}
                >
                  {/* Source A Card */}
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      minWidth: 0,
                      maxWidth: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <FileText size={13} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        SOURCE DOCUMENT A
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        minWidth: 0,
                      }}
                    >
                      {selectedIssue.doc_a_name || 'Document A'}
                    </div>
                    <div
                      className="text-mono"
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: 'var(--accent-teal)',
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        minWidth: 0,
                      }}
                    >
                      {selectedIssue.doc_a_value ?? 'N/A'}
                    </div>
                  </div>

                  {/* Source B Card */}
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      minWidth: 0,
                      maxWidth: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <FileText size={13} style={{ color: 'var(--status-warning)', flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        SOURCE DOCUMENT B
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        minWidth: 0,
                      }}
                    >
                      {selectedIssue.doc_b_name || 'Document B'}
                    </div>
                    <div
                      className="text-mono"
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: 'var(--status-warning)',
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        minWidth: 0,
                      }}
                    >
                      {selectedIssue.doc_b_value ?? 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Normalized Recommendation */}
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    minWidth: 0,
                    maxWidth: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={13} style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                        GROUND-TRUTH RESOLUTION
                      </span>
                    </div>
                    <span className="text-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)' }}>
                      Variance: {selectedIssue.variance_percentage ? `${selectedIssue.variance_percentage.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {selectedIssue.resolved_note ||
                      'Source A matches official audited statutory return; Source B reflects provisional field log.'}
                  </div>
                </div>
              </div>

              {/* Resolution Actions (Action) */}
              {!isViewer && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    borderTop: '1px solid var(--border-hairline)',
                    paddingTop: 12,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Record Resolution Decision
                  </span>

                  <textarea
                    rows={2}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Enter resolution notes, justification, or officer audit remarks..."
                    className="input-textarea"
                    style={{ fontSize: 12, minWidth: 0 }}
                  />

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedIssue.id, 'RESOLVED')}
                      icon={<Check size={13} />}
                    >
                      Resolve Conflict
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedIssue.id, 'UNDER_REVIEW')}
                      icon={<Clock size={13} />}
                    >
                      Flag Under Review
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedIssue.id, 'DISMISSED')}
                      icon={<XCircle size={13} />}
                    >
                      Dismiss
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
