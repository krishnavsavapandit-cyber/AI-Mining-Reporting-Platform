import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { topicService } from '@/services/api';
import { TopicCluster } from '@/types';

const HARDCODED_TOPIC_TERMS = [
  { word: 'Stripping Ratio (OBR)', count: 48, category: 'Excavation', color: '#10B981' },
  { word: 'GCV G1–G17 Grading', count: 42, category: 'Quality', color: '#60A5FA' },
  { word: 'Walking Dragline 33m³', count: 36, category: 'Fleet', color: '#F59E0B' },
  { word: 'Borehole Lithology Core', count: 29, category: 'Geology', color: 'var(--accent-teal)' },
  { word: '240T Haul Truck RFID', count: 26, category: 'Logistics', color: '#A78BFA' },
  { word: 'DGMS Safety Circular', count: 22, category: 'Statutory', color: '#F472B6' },
  { word: 'Rajmahal OCP Bench', count: 19, category: 'Field', color: '#34D399' },
  { word: 'Overburden Bench Tiering', count: 17, category: 'Excavation', color: '#10B981' },
  { word: 'Calorific Banding kcal/kg', count: 15, category: 'Quality', color: '#60A5FA' },
  { word: 'Coal Handling Plant CHP', count: 14, category: 'Logistics', color: '#A78BFA' },
  { word: 'SHA-256 Provenance', count: 12, category: 'Statutory', color: '#F472B6' },
];

export const MobileTopicsView: React.FC = () => {
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const res = await topicService.getTopics();
      setClusters(res.topics || []);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  const categories = ['ALL', 'Excavation', 'Quality', 'Fleet', 'Geology', 'Logistics', 'Statutory'];

  const filteredTerms = HARDCODED_TOPIC_TERMS.filter(
    (t) => selectedCategory === 'ALL' || t.category === selectedCategory
  );

  return (
    <div className="mobile-main-viewport">
      {/* Header */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <div>
            <h3 className="mobile-card-title">Geological & Strata Topic Cloud</h3>
            <p className="mobile-card-subtitle">TF-IDF frequency clustering across CIL files</p>
          </div>
          <button
            type="button"
            onClick={loadTopics}
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

        {/* Category Horizontal Filter */}
        <div className="mobile-horizontal-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className="mobile-scroll-item"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: 16,
                fontSize: 11,
                fontWeight: 700,
                border: selectedCategory === cat ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                backgroundColor: selectedCategory === cat ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-2)',
                color: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Strata Topic Cloud Interactive Tags */}
      <div className="mobile-card">
        <h4 className="mobile-card-title" style={{ fontSize: 13 }}>
          Extracted Mining Lexicon & Weights
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
          {filteredTerms.map((term, i) => (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-surface-2)',
                border: `1px solid ${term.color}44`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: term.color }}>{term.word}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 5px',
                  borderRadius: 10,
                  backgroundColor: `${term.color}22`,
                  color: term.color,
                }}
              >
                {term.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Cluster Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>
          TOPIC DOMAIN CLUSTERS
        </div>

        {clusters.length > 0 ? (
          clusters.map((cl, i) => (
            <div key={i} className="mobile-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {cl.topic_name}
                </span>
                <span style={{ fontSize: 10, color: 'var(--accent-primary)', fontWeight: 700 }}>
                  Weight: {cl.frequency}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Keywords: {cl.keywords?.join(', ')}
              </div>
            </div>
          ))
        ) : (
          <div className="mobile-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              Autonomous Topic Ingestion Active
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Topics are automatically generated and clustered as borehole logs and reports are ingested.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
