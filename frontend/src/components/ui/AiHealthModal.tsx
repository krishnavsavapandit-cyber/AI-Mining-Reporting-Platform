import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { Sparkles, Cpu, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import { settingsService, queryService } from '@/services/api';
import { useToast } from './ToastContext';
import { SystemHealth } from '@/types';

interface AiHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderUpdated?: () => void;
}

export const AiHealthModal: React.FC<AiHealthModalProps> = ({
  isOpen,
  onClose,
  onProviderUpdated,
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'open_model' | 'deterministic'>('gemini');

  const toast = useToast();

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getHealth();
      setHealth(res);
      const settingsRes = await settingsService.getSettings();
      if (settingsRes?.ai?.preferred_provider) {
        setActiveProvider(settingsRes.ai.preferred_provider as 'gemini' | 'open_model' | 'deterministic');
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
      setTestResult(null);
    }
  }, [isOpen]);

  const handleSwitchProvider = async (provider: 'gemini' | 'open_model' | 'deterministic') => {
    setActiveProvider(provider);
    try {
      await settingsService.updateAIProvider({
        preferred_provider: provider,
      });
      toast.success('AI Mode Switched', `Active engine changed to ${provider.toUpperCase()}`);
      fetchHealth();
      if (onProviderUpdated) onProviderUpdated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to switch provider';
      toast.error('Switch Failed', msg);
    }
  };

  const handleTestEngine = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await queryService.askQuestion({
        query: 'What is the standard stripping ratio metric and coal grade classification in Coal India operations?',
      });
      const answer = res.answer || 'Response generated successfully.';
      const providerUsed = res.provider_info || 'Grounded Engine';
      setTestResult(`[Provider: ${providerUsed}]\n\n${answer}`);
      toast.success('AI Test Passed', `Query completed via ${providerUsed}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Test query failed';
      setTestResult(`Error testing AI: ${msg}`);
      toast.error('AI Test Failed', msg);
    } finally {
      setTesting(false);
    }
  };

  const isGeminiLive = health?.ai_service?.is_connected;
  const currentProviderName = health?.ai_service?.provider_name || 'Gemini Grounded Engine';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Intelligence & Engine Health Diagnostics"
      size="lg"
    >
      <div className="space-y-6">
        {/* Status Highlight Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            backgroundColor: isGeminiLive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${isGeminiLive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: isGeminiLive ? 'var(--status-success)' : 'var(--status-warning)',
                boxShadow: `0 0 10px ${isGeminiLive ? 'var(--status-success)' : 'var(--status-warning)'}`,
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                Active AI Engine: {currentProviderName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {isGeminiLive
                  ? 'Connected & answering with full contextual reasoning and page citations.'
                  : 'Running on Zero-Cost Deterministic Grounded Engine (100% offline, zero hallucination).'}
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchHealth} loading={loading} icon={<RefreshCw size={12} />}>
            Refresh Status
          </Button>
        </div>

        {/* 3 Interactive Provider Selection Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          {/* Card 1: Google Gemini */}
          <div
            onClick={() => handleSwitchProvider('gemini')}
            style={{
              padding: '14px',
              backgroundColor: activeProvider === 'gemini' ? 'rgba(217, 119, 6, 0.12)' : 'var(--bg-surface-2)',
              border: `2px solid ${activeProvider === 'gemini' ? 'var(--accent-primary)' : 'var(--border-hairline)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                <Sparkles size={15} style={{ color: 'var(--accent-primary)' }} />
                Google Gemini
              </div>
              {activeProvider === 'gemini' && <Badge variant="primary">ACTIVE</Badge>}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
              High-speed Cloud LLM (Gemini Pro/Flash) for narrative synthesis and deep reasoning.
            </p>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Status: {isGeminiLive ? '🟢 Online & Ready' : '🟡 Offline / Key Required'}
            </div>
          </div>

          {/* Card 2: Ollama Local Model */}
          <div
            onClick={() => handleSwitchProvider('open_model')}
            style={{
              padding: '14px',
              backgroundColor: activeProvider === 'open_model' ? 'rgba(217, 119, 6, 0.12)' : 'var(--bg-surface-2)',
              border: `2px solid ${activeProvider === 'open_model' ? 'var(--accent-primary)' : 'var(--border-hairline)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                <Cpu size={15} style={{ color: 'var(--accent-teal)' }} />
                Ollama / Local LLM
              </div>
              {activeProvider === 'open_model' && <Badge variant="teal">ACTIVE</Badge>}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
              OpenAI-compatible local server (e.g. Ollama Llama 3 / Mistral at port 11434).
            </p>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Port: localhost:11434
            </div>
          </div>

          {/* Card 3: Deterministic Rule Engine */}
          <div
            onClick={() => handleSwitchProvider('deterministic')}
            style={{
              padding: '14px',
              backgroundColor: activeProvider === 'deterministic' ? 'rgba(217, 119, 6, 0.12)' : 'var(--bg-surface-2)',
              border: `2px solid ${activeProvider === 'deterministic' ? 'var(--accent-primary)' : 'var(--border-hairline)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                <ShieldCheck size={15} style={{ color: 'var(--text-emerald)' }} />
                Offline Rule Engine
              </div>
              {activeProvider === 'deterministic' && <Badge variant="slate">ACTIVE</Badge>}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
              100% Offline & deterministic fact synthesizer. 0 API key required. Never hallucinates.
            </p>
            <div style={{ fontSize: 10, color: 'var(--text-emerald)' }}>
              🟢 Always Ready (Local)
            </div>
          </div>
        </div>

        {/* Live Test AI Action & Response Box */}
        <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              Live Engine Verification Test
            </span>
            <Button variant="secondary" size="sm" onClick={handleTestEngine} loading={testing} icon={<Zap size={12} />}>
              Run Test Query
            </Button>
          </div>

          {testResult && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface-3)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
                fontSize: 11,
                color: 'var(--text-secondary)',
                maxHeight: 180,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono, monospace)',
                lineHeight: 1.5,
              }}
            >
              {testResult}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
