import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Sparkles,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { settingsService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { SystemHealth } from '@/types';

interface SettingsPageProps {
  onSeeded?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onSeeded }) => {
  const { canModifySettings } = useAuth();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form State
  const [preferredProvider, setPreferredProvider] = useState<'gemini' | 'open_model' | 'deterministic'>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openModelEndpoint, setOpenModelEndpoint] = useState('http://localhost:11434/v1/chat/completions');

  const toast = useToast();

  useEffect(() => {
    loadSettingsAndHealth();
  }, []);

  const loadSettingsAndHealth = async () => {
    setLoading(true);
    try {
      const [setRes, healthRes] = await Promise.allSettled([
        settingsService.getSettings(),
        settingsService.getHealth(),
      ]);

      if (setRes.status === 'fulfilled' && setRes.value) {
        if (setRes.value.ai?.preferred_provider) {
          setPreferredProvider(setRes.value.ai.preferred_provider);
        }
      }

      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading settings';
      toast.error('Settings Load Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.updateAIProvider({
        preferred_provider: preferredProvider,
        gemini_api_key: geminiApiKey || undefined,
        open_model_endpoint: openModelEndpoint || undefined,
      });
      toast.success('AI Provider Updated', 'Primary and fallback provider configuration saved.');
      setGeminiApiKey('');
      loadSettingsAndHealth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      toast.error('Save Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    toast.info('Seeding Demo Fixtures', 'Processing synthetic PDF, DOCX, and XLSX demonstration files...');
    try {
      const res = await settingsService.seedDemoData();
      toast.success(
        'Demo Fixtures Ingested',
        `Ingested ${res.documents_processed?.length || 0} demonstration files & flagged ${res.discrepancies_detected || 0} cross-doc test cases.`
      );
      if (onSeeded) onSeeded();
      loadSettingsAndHealth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Seeding failed';
      toast.error('Seed Error', msg);
    } finally {
      setSeeding(false);
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
            <Settings size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              System Configuration & AI Provider Setup
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Manage AI model fallbacks, database connections, and synthetic demonstration datasets.
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadSettingsAndHealth}
          loading={loading}
          icon={<RefreshCw size={13} />}
        >
          Refresh Diagnostics
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
        {/* 1. AI Provider Configuration */}
        <div className="card-level-1">
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">AI Provider & Fallback Engine</h3>
              <p className="card-subtitle">Select primary model with automatic fallback to deterministic grounded engine.</p>
            </div>
            <Badge variant="teal">3-TIER RESILIENCE</Badge>
          </div>

          <form onSubmit={handleSaveAI} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                PRIMARY MODEL PROVIDER
              </label>
              <select
                value={preferredProvider}
                onChange={(e) => setPreferredProvider(e.target.value as any)}
                className="input-select"
                disabled={!canModifySettings}
              >
                <option value="gemini">Google Gemini (Gemini 2.0 Flash / Pro)</option>
                <option value="open_model">Open-Source Local / OpenAI-Compatible (Ollama, vLLM)</option>
                <option value="deterministic">Deterministic Grounded Engine (Local Heuristics — Always Ready)</option>
              </select>
            </div>

            {preferredProvider === 'gemini' && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  GEMINI API KEY (LEAVE BLANK TO KEEP ACTIVE ENV KEY)
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="input-text"
                  disabled={!canModifySettings}
                />
              </div>
            )}

            {preferredProvider === 'open_model' && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  OPEN-MODEL COMPATIBLE REST ENDPOINT
                </label>
                <input
                  type="text"
                  value={openModelEndpoint}
                  onChange={(e) => setOpenModelEndpoint(e.target.value)}
                  placeholder="http://localhost:11434/v1/chat/completions"
                  className="input-text"
                  disabled={!canModifySettings}
                />
              </div>
            )}

            {canModifySettings && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <Button variant="primary" size="sm" type="submit" loading={saving} icon={<Save size={13} />}>
                  Save AI Configuration
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* 2. Database & Platform Telemetry */}
        <div className="card-level-1">
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">Database & Infrastructure Status</h3>
              <p className="card-subtitle">Operational status of backend persistence layer</p>
            </div>
            <Badge variant="primary">LIVE METRICS</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-surface-2)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={16} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Database Engine
                </span>
              </div>
              <span className="text-mono" style={{ fontSize: 12, color: 'var(--accent-teal)' }}>
                {health?.database_target || 'SQLite 3.x (mining_platform.db)'}
              </span>
            </div>

            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-surface-2)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} style={{ color: 'var(--accent-teal)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  OCR Optical Engine
                </span>
              </div>
              <Badge variant={health?.ocr_engine_ready ? 'primary' : 'slate'}>
                {health?.ocr_engine_ready ? 'TESSERACT READY' : 'AUTOMATIC'}
              </Badge>
            </div>

            {/* Quick Demo Seeding Button */}
            {canModifySettings && (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'rgba(217, 164, 65, 0.06)',
                  border: '1px solid rgba(217, 164, 65, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: 6,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--status-warning)', marginBottom: 4 }}>
                  SYNTHETIC TEST DEMO PRELOADER
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Preload sample ECL, BCCL, SECL, and WCL operational files with intentional discrepancies for validation testing.
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSeed}
                  loading={seeding}
                  icon={<Sparkles size={13} style={{ color: 'var(--status-warning)' }} />}
                >
                  Preload Synthetic Demonstration Files
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
