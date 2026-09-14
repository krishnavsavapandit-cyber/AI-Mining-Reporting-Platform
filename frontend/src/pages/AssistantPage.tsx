import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { queryService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { ChatMessage } from '@/types';

export const AssistantPage: React.FC = () => {
  const { role } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Welcome to the CIL / CMPDI Grounded Mining Intelligence Assistant. I provide evidence-backed answers strictly verified against cataloged statutory mining documents with evidence-grounded response gating. How can I assist you with production figures, geological surveys, or parliamentary questions?',
      timestamp: new Date().toLocaleTimeString(),
      provider_info: 'Deterministic Grounded Engine',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [subsidiary, setSubsidiary] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const queryToSend = (customPrompt || inputQuery).trim();
    if (!queryToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputQuery('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await queryService.askQuestion({
        query: queryToSend,
        user_role: role,
        subsidiary: subsidiary || undefined,
        chat_history: historyPayload,
      });

      const aiMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString(),
        provider_info: res.provider_info,
        evidence: res.evidence,
        sources: res.sources,
        validation_warnings: res.validation_warnings,
        duration_ms: res.duration_ms,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query assistant';
      toast.error('Query Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const suggestionPrompts = [
    'What was the total coal production shortfall in ECL Rajmahal in May 2025?',
    'Summarize the DGMS safety compliance standards for open-cast mines.',
    'List all cross-document discrepancies detected in CCL annual returns.',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
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
              backgroundColor: 'rgba(31, 138, 92, 0.12)',
              border: '1px solid var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Bot size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Mining Intelligence Grounded Assistant
            </h2>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Evidence-grounded RAG with mandatory citation pointers to source document chunks.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={subsidiary}
            onChange={(e) => setSubsidiary(e.target.value)}
            className="input-select"
            style={{ width: 'auto', padding: '4px 10px', fontSize: 11 }}
          >
            <option value="">All Subsidiaries</option>
            <option value="ECL">ECL (Eastern)</option>
            <option value="BCCL">BCCL (Bharat Coking)</option>
            <option value="CCL">CCL (Central)</option>
            <option value="WCL">WCL (Western)</option>
            <option value="SECL">SECL (South Eastern)</option>
            <option value="MCL">MCL (Mahanadi)</option>
            <option value="NCL">NCL (Northern)</option>
            <option value="CMPDI">CMPDI</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setMessages([
                {
                  id: 'welcome',
                  role: 'assistant',
                  content: 'Chat session reset. How can I assist you with CIL mining intelligence?',
                  timestamp: new Date().toLocaleTimeString(),
                },
              ])
            }
            icon={<RefreshCw size={12} />}
          >
            Reset Chat
          </Button>
        </div>
      </div>

      {/* Messages Stream (Ask -> Answer -> Evidence -> Grounding -> Actions) */}
      <div
        className="card-level-1"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '20px',
        }}
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                gap: 6,
                maxWidth: '100%',
              }}
            >
              {/* Message Meta Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                {isUser ? <User size={12} /> : <Bot size={12} style={{ color: 'var(--accent-primary)' }} />}
                <span style={{ fontWeight: 600 }}>{isUser ? `You (${role})` : 'Mining Assistant'}</span>
                <span>•</span>
                <span className="text-mono">{m.timestamp}</span>
                {m.provider_info && (
                  <Badge variant="teal" style={{ fontSize: 9, padding: '1px 5px' }}>
                    {m.provider_info}
                  </Badge>
                )}
                {m.duration_ms && (
                  <span className="text-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    ({(m.duration_ms / 1000).toFixed(2)}s)
                  </span>
                )}
              </div>

              {/* Message Content Container */}
              <div
                style={{
                  maxWidth: isUser ? '75%' : '85%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isUser ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-2)',
                  border: `1px solid ${isUser ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-hairline-alt)'}`,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.content}
              </div>

              {/* Grounded Evidence Excerpts (Progressive Disclosure) */}
              {m.evidence && m.evidence.length > 0 && (
                <div
                  style={{
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={13} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.04em' }}>
                      GROUNDED CITATION SOURCES ({m.evidence.length})
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                    {m.evidence.map((ev, evIdx) => (
                      <div
                        key={evIdx}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-hairline)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 11,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: 11 }}>
                            {ev.document_name}
                          </strong>
                          <span className="text-mono" style={{ color: 'var(--accent-teal)', fontSize: 10 }}>
                            Page {ev.page_number}
                          </span>
                        </div>
                        <div
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          "{ev.text_excerpt || `Chunk #${ev.chunk_index || 0} retrieved passage`}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-primary)', fontSize: 12 }}>
            <Sparkles size={14} className="animate-spin" />
            <span>Retrieving verified document evidence & synthesizing answer...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-Up Prompt Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          SUGGESTED PROMPTS:
        </span>
        {suggestionPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(undefined, p)}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form Console */}
      <div className="card-level-1" style={{ padding: '12px' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about geological surveys, coal output, or parliamentary questions..."
            className="input-text"
            style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}
            disabled={loading}
          />

          <Button
            variant="primary"
            size="md"
            type="submit"
            loading={loading}
            icon={<Send size={14} />}
          >
            Ask Assistant
          </Button>
        </form>
      </div>
    </div>
  );
};
