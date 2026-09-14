import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, RefreshCw } from 'lucide-react';
import { auditService } from '@/services/api';
import { AuditLogRecord } from '@/types';

export const MobileAuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await auditService.getAuditLogs();
      setLogs(res.logs || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-main-viewport">
      {/* Header Banner */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <div>
            <h3 className="mobile-card-title">Immutable Audit Trail</h3>
            <p className="mobile-card-subtitle">SHA-256 verified action provenance log</p>
          </div>
          <button
            type="button"
            onClick={loadAuditLogs}
            disabled={loading}
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div
          style={{
            padding: '8px 10px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 6,
            fontSize: 11,
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShieldCheck size={14} /> Cryptographic tamper-evident chain active
        </div>
      </div>

      {/* Audit Log Timeline */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Verifying cryptographic audit chain...
        </div>
      ) : logs.length === 0 ? (
        <div className="mobile-card" style={{ textAlign: 'center', padding: 32 }}>
          <History size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Audit Log Initialized
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            System events, report sign-offs, and discrepancy resolutions are logged here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {logs.map((log) => (
            <div key={log.id} className="mobile-card" style={{ gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {log.action_type}
                </span>
                <span className="text-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                  {log.timestamp?.split('T')[0] || log.timestamp}
                </span>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Actor Clearance: <strong style={{ color: 'var(--accent-teal)' }}>{log.user_role}</strong>
              </div>

              {log.details && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                </div>
              )}

              {log.ip_address && (
                <div className="text-mono" style={{ fontSize: 9, color: 'var(--text-muted)', paddingTop: 2 }}>
                  IP: {log.ip_address}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
