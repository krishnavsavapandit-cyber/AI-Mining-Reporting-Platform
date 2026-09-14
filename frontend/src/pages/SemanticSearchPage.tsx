import React, { useState } from 'react';
import {
  Search,
  FileText,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { searchService } from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import { SearchResultItem } from '@/types';

interface SemanticSearchPageProps {
  onInspectDocument?: (id: number) => void;
}

export const SemanticSearchPage: React.FC<SemanticSearchPageProps> = ({ onInspectDocument }) => {
  const [query, setQuery] = useState('');
  const [subsidiary, setSubsidiary] = useState('');
  const [topK] = useState(8);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await searchService.search(query, subsidiary || undefined, topK);
      setResults(res.results || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Search failed';
      toast.error('Search Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    'Rajmahal coal production shortfall May 2025',
    'Jharia coalfield geological reserves and seam ash %',
    'Korba shovel and dumper HEMM availability Q1',
    'Environmental PM10 water quality audit WCL Nagpur',
  ];

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
              backgroundColor: 'rgba(45, 156, 168, 0.12)',
              border: '1px solid var(--accent-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-teal)',
            }}
          >
            <Search size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Hybrid Semantic & Dense Vector Search Engine
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Sublinear TF-IDF keyword matching fused with dense cosine vector embeddings via Reciprocal Rank Fusion (RRF).
            </span>
          </div>
        </div>

        <Badge variant="teal">RECIPROCAL RANK FUSION (RRF)</Badge>
      </div>

      {/* 1. Investigation Chain Visualizer (Summary) */}
      <div
        style={{
          padding: '14px 18px',
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
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          PROVENANCE INVESTIGATION CHAIN:
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>1. Query Vector</span>
          <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-teal)' }}>2. Hybrid RRF Retrieval</span>
          <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)' }}>3. Verified Evidence Chunk</span>
          <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>4. Source Document Inspection</span>
        </div>
      </div>

      {/* 2. Search Console (Analysis) */}
      <div className="card-level-1">
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search geological reserves, coal production metrics, OBR targets, or DGMS safety audits..."
                className="input-text"
                style={{ padding: '10px 14px', fontSize: 13, width: '100%' }}
              />
            </div>

            <select
              value={subsidiary}
              onChange={(e) => setSubsidiary(e.target.value)}
              className="input-select"
              style={{ width: 'auto', padding: '10px 14px', fontSize: 12 }}
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

            <Button variant="primary" size="md" type="submit" loading={loading} icon={<Search size={14} />}>
              Search Evidence Catalog
            </Button>
          </div>

          {/* Quick Query Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>QUICK INVESTIGATION PROMPTS:</span>
            {quickQueries.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setQuery(q);
                  setSearched(true);
                  searchService.search(q, subsidiary || undefined, topK).then((res) => {
                    setResults(res.results || []);
                  });
                }}
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 3. Results & Evidence Stream (Detail & Action) */}
      {!searched ? (
        <EmptyState
          type="search"
          title="Search the Mining Knowledge Repository"
          description="Enter geological terms, coal production metrics, or drill-hole coordinates to retrieve verified document chunks with exact page provenance."
        />
      ) : results.length === 0 && !loading ? (
        <EmptyState
          type="search"
          title="Zero Matching Passages Found"
          description="Try broadening your query keywords or clearing the subsidiary filter."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Retrieved <strong style={{ color: 'var(--text-primary)' }}>{results.length}</strong> verified evidence passages
            </span>
            <Badge variant="teal">HYBRID RELEVANCE RANKED</Badge>
          </div>

          {results.map((res, idx) => (
            <div
              key={`${res.document_id}-${res.chunk_index}-${idx}`}
              className="card-level-1"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* Evidence Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--accent-teal)',
                      padding: '2px 6px',
                      backgroundColor: 'var(--bg-surface-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-hairline)',
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <FileText size={15} style={{ color: 'var(--accent-primary)' }} />
                  <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                    {res.document_name}
                  </strong>
                  <Badge variant="slate">{res.subsidiary || 'CIL'}</Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="text-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Page {res.page_number} • Chunk #{res.chunk_index}
                  </span>
                  <Badge variant="primary">{(res.score * 100).toFixed(1)}% RELEVANCE</Badge>

                  {onInspectDocument && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onInspectDocument(res.document_id)}
                      icon={<ExternalLink size={11} />}
                      style={{ padding: '2px 8px', fontSize: 11 }}
                    >
                      Inspect Source
                    </Button>
                  )}
                </div>
              </div>

              {/* Evidence Passage Content */}
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  backgroundColor: 'var(--bg-surface-2)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hairline)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {res.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
