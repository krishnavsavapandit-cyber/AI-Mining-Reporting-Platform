import React, { useState, useEffect } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { auditService } from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import { AuditLogRecord } from '@/types';

export const AuditProvenancePage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [actionFilter, setActionFilter] = useState('');
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
              backgroundColor: 'rgba(31, 138, 92, 0.1)',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <History size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Immutable Platform Audit Trail & Provenance Ledger
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Cryptographically verified audit trail capturing every document upload, report approval, and agent handoff.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

      {logs.length === 0 && !loading ? (
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
                  <th style={{ width: 60 }}>Log ID</th>
                  <th>Timestamp</th>
                  <th>Action Type</th>
                  <th>User Role</th>
                  <th>Resource Target</th>
                  <th>Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                      #{l.id}
                    </td>
                    <td className="text-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {l.timestamp}
                    </td>
                    <td>
                      <Badge variant="primary">{l.action_type}</Badge>
                    </td>
                    <td>
                      <Badge variant="slate">{l.user_role || 'SYSTEM'}</Badge>
                    </td>
                    <td className="text-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {l.resource_type ? `${l.resource_type} #${l.resource_id || ''}` : 'N/A'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
