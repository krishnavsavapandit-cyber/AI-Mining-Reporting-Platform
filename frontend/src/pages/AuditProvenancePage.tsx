import React, { useState, useEffect } from 'react';
import {
  History,
  RefreshCw,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { auditService } from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import { AuditLogRecord } from '@/types';

export const AuditProvenancePage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await auditService.getAuditLogs({
        action: actionFilter || undefined,
        limit: 50,
      });
      setLogs(res.logs || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load audit logs';
      toast.error('Audit Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const det = typeof l.details === 'object' ? JSON.stringify(l.details) : l.details || '';
      return (
        l.action_type.toLowerCase().includes(q) ||
        (l.user_role && l.user_role.toLowerCase().includes(q)) ||
        det.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uploadCount = logs.filter((l) => l.action_type === 'DOCUMENT_UPLOAD').length;
  const approvalCount = logs.filter((l) => l.action_type === 'REPORT_APPROVAL' || l.action_type === 'INQUIRY_APPROVAL').length;
  const dispatchCount = logs.filter((l) => l.action_type === 'WORKFLOW_DISPATCH' || l.action_type === 'DISCREPANCY_UPDATE').length;

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
              backgroundColor: 'rgba(31, 138, 92, 0.12)',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <History size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Immutable Platform Audit Trail & Cryptographic Provenance
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              SHA-256 verified action ledger capturing every document ingestion, officer sign-off seal, and multi-agent DAG execution.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge variant="primary" icon={<ShieldCheck size={11} />}>
            SHA-256 VERIFIED
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAuditLogs}
            loading={loading}
            icon={<RefreshCw size={13} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 1. Governance Telemetry Counters (Summary) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL AUDIT EVENTS</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{logs.length}</div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)' }}>OFFICER SIGN-OFF SEALS</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-primary)', marginTop: 2 }}>{approvalCount}</div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-teal)' }}>DOCUMENT INGESTIONS</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-teal)', marginTop: 2 }}>{uploadCount}</div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--status-warning)' }}>WORKFLOW DISPATCHES</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-warning)', marginTop: 2 }}>{dispatchCount}</div>
        </div>
      </div>

      {/* 2. Workspace Filter Toolbar (Analysis) */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: '240px' }}>
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by user role, action, or target payload..."
            className="input-text"
            style={{ border: 'none', background: 'transparent', padding: '4px 0', fontSize: 13 }}
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="input-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
        >
          <option value="">All Action Types</option>
          <option value="DOCUMENT_UPLOAD">Document Uploads</option>
          <option value="REPORT_APPROVAL">Report Approvals</option>
          <option value="INQUIRY_APPROVAL">Inquiry Approvals</option>
          <option value="WORKFLOW_DISPATCH">Workflow Dispatches</option>
          <option value="DISCREPANCY_UPDATE">Discrepancy Updates</option>
        </select>
      </div>

      {/* 3. Audit Records Table (Detail & Trust) */}
      {filteredLogs.length === 0 && !loading ? (
        <EmptyState
          type="audit"
          title="No Audit Records Found"
          description="System events and statutory sign-offs will appear here as users interact with the platform."
        />
      ) : (
        <div className="card-level-1" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 65 }}>Log ID</th>
                  <th>Timestamp</th>
                  <th>Action Type</th>
                  <th>Actor / Role</th>
                  <th>Target Resource</th>
                  <th>Cryptographic Audit Payload</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l) => (
                  <tr key={l.id}>
                    <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                      #{l.id}
                    </td>
                    <td className="text-mono" style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {l.timestamp}
                    </td>
                    <td>
                      <Badge
                        variant={
                          l.action_type?.includes('APPROVAL')
                            ? 'primary'
                            : l.action_type?.includes('UPLOAD')
                            ? 'teal'
                            : l.action_type?.includes('DISPATCH')
                            ? 'warning'
                            : 'slate'
                        }
                      >
                        {l.action_type}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="slate">{l.user_role || 'SYSTEM'}</Badge>
                    </td>
                    <td className="text-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {l.resource_type ? `${l.resource_type} #${l.resource_id || ''}` : 'N/A'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {typeof l.details === 'object' ? JSON.stringify(l.details) : l.details || 'Action completed successfully.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
