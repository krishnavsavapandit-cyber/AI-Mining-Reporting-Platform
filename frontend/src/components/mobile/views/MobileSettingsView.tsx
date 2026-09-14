import React, { useState, useEffect } from 'react';
import {
  Database,
  Sparkles,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { settingsService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { SystemHealth } from '@/types';

interface MobileSettingsViewProps {
  onSeeded?: () => void;
}

export const MobileSettingsView: React.FC<MobileSettingsViewProps> = ({ onSeeded }) => {
  const { role, isAdmin } = useAuth();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getHealth();
      setHealth(res);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    toast.info('Seeding Started', 'Preloading synthetic CIL demonstration files...');
    try {
      const res = await settingsService.seedDemoData();
      toast.success(
        'Seeding Complete',
        `Ingested ${res.documents_processed?.length || 0} files & flagged ${res.discrepancies_detected || 0} cross-doc test cases.`
      );
      loadHealth();
      if (onSeeded) onSeeded();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Seeding failed';
      toast.error('Seeding Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-main-viewport">
      {/* System Status Header */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <div>
            <h3 className="mobile-card-title">System Infrastructure & Health</h3>
            <p className="mobile-card-subtitle">Telemetry, DB pool & AI provider status</p>
          </div>
          <button
            type="button"
            onClick={loadHealth}
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

        {/* Health Pills */}
        <div className="mobile-metrics-grid">
          <div className="mobile-metric-pill">
            <span className="mobile-metric-label">
              <Database size={13} style={{ color: '#10B981' }} /> Database
            </span>
            <span className="mobile-metric-value" style={{ fontSize: 14, color: '#10B981' }}>
              {health?.database_connected !== false ? 'ONLINE' : 'OFFLINE'}
            </span>
            <span className="mobile-metric-sub">{health?.database_target || 'SQLite 3.x'}</span>
          </div>

          <div className="mobile-metric-pill">
            <span className="mobile-metric-label">
              <Sparkles size={13} style={{ color: 'var(--accent-teal)' }} /> Active AI Engine
            </span>
            <span className="mobile-metric-value" style={{ fontSize: 13, color: 'var(--accent-teal)' }}>
              {health?.active_ai_info?.provider_name || health?.ai_service?.active_provider || 'Grounded Gemini'}
            </span>
            <span className="mobile-metric-sub">
              {health?.ai_service?.is_connected ? 'Connected' : 'Fallback Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Operations & Seeder */}
      {isAdmin ? (
        <div className="mobile-card">
          <h4 className="mobile-card-title">Demonstration Data Seeder</h4>
          <p className="mobile-card-subtitle">
            Preload canonical mining test files (PDF, DOCX, XLSX, CSV) with known cross-document production variances.
          </p>

          <button
            type="button"
            className="mobile-btn-touch mobile-btn-primary"
            onClick={handleSeed}
            disabled={seeding}
          >
            <Sparkles size={14} className={seeding ? 'animate-spin' : ''} />
            {seeding ? 'Seeding Synthetic Files...' : 'Seed CIL Demo Test Data'}
          </button>
        </div>
      ) : (
        <div className="mobile-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Session Clearance: {role}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            System configuration changes and database seeding require Administrator privileges.
          </p>
        </div>
      )}

      {/* OCR Engine Info */}
      <div className="mobile-card">
        <h4 className="mobile-card-title">Geological OCR Engine</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
          <div><strong>Primary OCR:</strong> Tesseract 5.x Geological Layer</div>
          <div><strong>PDF Engine:</strong> PyMuPDF Direct Vector Extraction</div>
          <div><strong>Language Support:</strong> English (ENG), Hindi (HIN)</div>
          <div><strong>Stratigraphy Extraction:</strong> Tabular Core Logs & Matrix Ingestion</div>
        </div>
      </div>
    </div>
  );
};
