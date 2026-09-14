import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { validationService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { DiscrepancyIssue, DiscrepancyLifecycleStatus } from '@/types';

export const DiscrepancyCenterPage: React.FC = () => {
  const { role, isViewer, canApprove } = useAuth();
  const [issues, setIssues] = useState<DiscrepancyIssue[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
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
      setIssues(res.issues || []);
      if (res.issues && res.issues.length > 0 && !selectedIssue) {
        setSelectedIssue(res.issues[0]);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
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
              backgroundColor: 'rgba(217, 164, 65, 0.1)',
              border: '1px solid var(--status-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-warning)',
            }}
          >
            <ShieldAlert size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Cross-Document Discrepancy Resolution Matrix
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Automated numerical discrepancy detection across monthly reports, annual summaries, and ministry questions.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
          >
            <option value="">All Statuses</option>
            <option value="UNRESOLVED">Unresolved Conflicts</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

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

      {issues.length === 0 && !loading ? (
        <EmptyState
          type="discrepancy"
          title="Zero Discrepancies Found"
          description="All extracted numerical facts across indexed documents satisfy schema and mathematical invariants."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: 24, minWidth: 0, width: '100%' }}>
          {/* Left: Discrepancy Table */}
          <div className="card-level-1" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%' }}>
            <div className="card-header-clean">
              <div>
                <h3 className="card-title">Flagged Numerical Discrepancies</h3>
                <span className="card-subtitle">Select any conflict to inspect side-by-side evidence</span>
              </div>
              <Badge variant="warning">{issues.length} CONFLICTS</Badge>
            </div>

            <div className="table-wrapper">
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
                  {issues.map((iss) => {
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
                        <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                          #{iss.id}
                        </td>
                        <td style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{iss.field_name || iss.metric_name}</strong>
                        </td>
                        <td>
                          <Badge variant="slate">{iss.subsidiary || 'CIL'}</Badge>
                        </td>
                        <td className="text-mono" style={{ fontSize: 12 }}>
                          {iss.reporting_period || iss.period || 'General'}
                        </td>
                        <td className="text-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--status-warning)' }}>
                          {iss.variance_percentage ? `${iss.variance_percentage}%` : 'N/A'}
                        </td>
                        <td>
                          <Badge
                            variant={
                              iss.severity === 'CRITICAL' || iss.severity === 'HIGH'
                                ? 'error'
                                : 'warning'
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

          {/* Right: Side-by-Side Evidence Comparison Inspector */}
          {selectedIssue && (
            <div className="card-level-1" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0, maxWidth: '100%' }}>
              <div className="card-header-clean" style={{ minWidth: 0, gap: 10 }}>
                <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                  <h3 className="card-title" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>Side-by-Side Evidence Comparison</h3>
                  <span className="card-subtitle" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    Discrepancy #{selectedIssue.id} • {selectedIssue.field_name || selectedIssue.metric_name || 'Variance'}
                  </span>
                </div>
                <Badge variant="warning">{selectedIssue.status || 'UNRESOLVED'}</Badge>
              </div>

              {/* Source A vs Source B Comparison Boxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, width: '100%' }}>
                {/* Doc A */}
                <div
                  style={{
                    padding: '14px',
                    backgroundColor: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-sm)',
                    minWidth: 0,
                    maxWidth: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      SOURCE A (PRIMARY INGESTION)
                    </span>
                    <span className="text-mono" style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                      Page {selectedIssue.doc_a_page || 1}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 8,
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      lineHeight: 1.4,
                    }}
                  >
                    {selectedIssue.doc_a_name}
                  </div>
                  <div
                    className="text-mono"
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      padding: '6px 10px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 4,
                      display: 'block',
                      border: '1px solid var(--border-hairline)',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      lineHeight: 1.4,
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {selectedIssue.doc_a_value ?? 'N/A'}
                  </div>
                </div>

                {/* Doc B */}
                <div
                  style={{
                    padding: '14px',
                    backgroundColor: 'var(--bg-surface-2)',
                    border: '1px solid rgba(217, 164, 65, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    minWidth: 0,
                    maxWidth: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-warning)', textTransform: 'uppercase' }}>
                      SOURCE B (CROSS-CHECK RECORD)
                    </span>
                    <span className="text-mono" style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                      Page {selectedIssue.doc_b_page || 1}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 8,
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      lineHeight: 1.4,
                    }}
                  >
                    {selectedIssue.doc_b_name}
                  </div>
                  <div
                    className="text-mono"
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--status-warning)',
                      padding: '6px 10px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 4,
                      display: 'block',
                      border: '1px solid rgba(217, 164, 65, 0.3)',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      lineHeight: 1.4,
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {selectedIssue.doc_b_value ?? 'N/A'}
                  </div>
                </div>
              </div>

              {/* Variance Calculation */}
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  minWidth: 0,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>Calculated Variance:</span>
                <span className="text-mono" style={{ fontWeight: 700, color: 'var(--status-warning)', fontSize: 14 }}>
                  {selectedIssue.variance_percentage}% delta
                </span>
              </div>

              {/* Officer / Admin Lifecycle Sign-Off Controls */}
              {canApprove && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <textarea
                    rows={2}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Enter audit review note or rationale..."
                    className="input-textarea"
                    style={{ fontSize: 12 }}
                  />

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedIssue.id, 'UNDER_REVIEW')}
                    >
                      Mark Under Review
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedIssue.id, 'RESOLVED')}
                      icon={<CheckCircle2 size={13} />}
                    >
                      Resolve & Accept Doc A
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
