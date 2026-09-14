import React, { useState } from 'react';
import { Search, FileText, Sparkles } from 'lucide-react';
import { searchService } from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import { SearchResultItem } from '@/types';

interface MobileSearchViewProps {
  onInspectDocument: (id: number) => void;
}

const SUGGESTED_QUERIES = [
  'Rajmahal Coal Production 2024',
  'Stripping Ratio OBR Overburden',
  'GCV Grade Banding G1 to G17',
  'DGMS Opencast Safety Compliance',
  'Borehole Lithology Stratigraphy',
  '240T Haul Truck Weighbridge RFID',
];

export const MobileSearchView: React.FC<MobileSearchViewProps> = ({ onInspectDocument }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const toast = useToast();

  const handleSearch = async (queryToSearch?: string) => {
    const q = queryToSearch !== undefined ? queryToSearch : query;
    if (!q.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchService.search(q, undefined, 8);
      setResults(res.results || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Search error';
      toast.error('Search Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggested: string) => {
    setQuery(suggested);
    handleSearch(suggested);
  };

  return (
    <div className="mobile-main-viewport">
      {/* Search Input Box */}
      <div className="mobile-card" style={{ gap: 10 }}>
        <h3 className="mobile-card-title">Hybrid Semantic & Vector Search</h3>
        <p className="mobile-card-subtitle">Reciprocal Rank Fusion (RRF) over CIL documents</p>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="mobile-input"
              placeholder="Search strata, equipment, production..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ paddingLeft: 34 }}
            />
          </div>

          <button
            type="button"
            className="mobile-btn-touch mobile-btn-primary"
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            style={{ width: 'auto', padding: '0 16px' }}
          >
            {loading ? <Sparkles size={14} className="animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Query Suggestion Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>
            SUGGESTED QUERIES
          </div>
          <div className="mobile-horizontal-scroll">
            {SUGGESTED_QUERIES.map((sq, i) => (
              <button
                key={i}
                type="button"
                className="mobile-scroll-item"
                onClick={() => handleSuggestionClick(sq)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 16,
                  fontSize: 11,
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Stream */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Fusing lexical TF-IDF + cosine embeddings...
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="mobile-card" style={{ textAlign: 'center', padding: 32 }}>
          <Search size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            No Matches Found
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Try broader terms or verify indexed document catalog.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map((item, idx) => (
            <div
              key={idx}
              className="mobile-card"
              onClick={() => item.document_id && onInspectDocument(item.document_id)}
              style={{ cursor: 'pointer', gap: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={14} style={{ color: 'var(--accent-teal)' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.document_name || 'Verified Record'}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                  }}
                >
                  {(item.score * 100).toFixed(0)}% MATCH
                </span>
              </div>

              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Page {item.page_number || 1} • {item.subsidiary || 'CIL Command'}
              </div>

              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
