import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { validationService } from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import { DiscrepancyIssue } from '@/types';

interface MobileValidationViewProps {
  onInspectDiscrepancy: (issue: DiscrepancyIssue) => void;
}

export const MobileValidationView: React.FC<MobileValidationViewProps> = ({ onInspectDiscrepancy }) => {
  const [issues, setIssues] = useState<DiscrepancyIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'UNRESOLVED' | 'RESOLVED' | 'ALL'>('UNRESOLVED');
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  useEffect(() => {
    loadIssues();
  }, [statusFilter]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await validationService.getIssues(statusFilter === 'ALL' ? undefined : statusFilter);
      setIssues(res.issues || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch issues';
      toast.error('Discrepancy Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const filtered = issues.filter(
    (i) =>
      i.field_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.doc_a_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.doc_b_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.issue_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mobile-main-viewport">
      {/* Header Metrics */}
      <div className="mobile-metrics-grid">
        <div className="mobile-metric-pill">
          <span className="mobile-metric-label">
            <ShieldAlert size={13} style={{ color: '#EF4444' }} /> Flagged Conflicts
          </span>
          <span className="mobile-metric-value" style={{ color: issues.length > 0 ? '#EF4444' : '#10B981' }}>
            {issues.length}
          </span>
          <span className="mobile-metric-sub">{statusFilter} state</span>
        </div>

        <div className="mobile-metric-pill">
          <span className="mobile-metric-label">
            <AlertTriangle size={13} style={{ color: '#F59E0B' }} /> Variance Gate
          </span>
          <span className="mobile-metric-value text-mono">±2.5%</span>
          <span className="mobile-metric-sub">Auto-flag threshold</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="mobile-input"
              placeholder="Search conflicts by parameter or document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>

          <button
            type="button"
            onClick={loadIssues}
            disabled={loading}
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="mobile-horizontal-scroll">
          {(['UNRESOLVED', 'RESOLVED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              type="button"
              className="mobile-scroll-item"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                border: statusFilter === st ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                backgroundColor: statusFilter === st ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-2)',
                color: statusFilter === st ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {st === 'UNRESOLVED' ? 'Active Conflicts' : st === 'RESOLVED' ? 'Resolved' : 'All Issues'}
            </button>
          ))}
        </div>
      </div>

      {/* Discrepancies List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Auditing mathematical discrepancies...
        </div>
      ) : filtered.length === 0 ? (
        <div className="mobile-card" style={{ textAlign: 'center', padding: 32 }}>
          <CheckCircle2 size={32} style={{ color: '#10B981', margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Zero Conflicts
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            No discrepancy issues detected matching the current filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((iss) => (
            <div
              key={iss.id}
              className="mobile-card"
              onClick={() => onInspectDiscrepancy(iss)}
              style={{ cursor: 'pointer', gap: 8, borderColor: iss.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.3)' : undefined }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle
                    size={15}
                    style={{ color: iss.severity === 'HIGH' ? 'var(--status-error)' : 'var(--status-warning)' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {iss.field_name || iss.metric_name || 'Production Variance'}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor:
                      iss.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: iss.severity === 'HIGH' ? '#EF4444' : '#F59E0B',
                  }}
                >
                  {iss.variance_percentage ? `${iss.variance_percentage}% VARIANCE` : iss.severity}
                </span>
              </div>

              {/* Side by side comparison pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div
                  style={{
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-surface-2)',
                    borderRadius: 4,
                    border: '1px solid var(--border-hairline)',
                  }}
                >
                  <div style={{ fontSize: 9, color: 'var(--accent-teal)', fontWeight: 700 }}>
                    {iss.doc_a_name?.slice(0, 18)}...
                  </div>
                  <div className="text-mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {iss.doc_a_value ?? 'N/A'}
                  </div>
                </div>

                <div
                  style={{
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-surface-2)',
                    borderRadius: 4,
                    border: '1px solid var(--border-hairline)',
                  }}
                >
                  <div style={{ fontSize: 9, color: '#F472B6', fontWeight: 700 }}>
                    {iss.doc_b_name?.slice(0, 18)}...
                  </div>
                  <div className="text-mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--status-error)' }}>
                    {iss.doc_b_value ?? 'N/A'}
                  </div>
                </div>
              </div>

              {/* Resolution hint */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  Status: {iss.status}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Eye size={12} /> Inspect Resolution
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
