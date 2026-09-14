import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  RefreshCw,
  Search,
  Eye,
  Plus,
} from 'lucide-react';
import { documentService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { DocumentRecord } from '@/types';

interface MobileDocumentsViewProps {
  onOpenUpload?: () => void;
  onInspectDocument: (id: number) => void;
  refreshTrigger?: number;
}

const SUBSIDIARIES = ['ALL', 'ECL', 'BCCL', 'CCL', 'WCL', 'SECL', 'NCL', 'MCL', 'CMPDI'];

export const MobileDocumentsView: React.FC<MobileDocumentsViewProps> = ({
  onOpenUpload,
  onInspectDocument,
  refreshTrigger = 0,
}) => {
  const { canUpload } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [subsidiaryFilter, setSubsidiaryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadDocuments();
  }, [subsidiaryFilter, refreshTrigger]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentService.getDocuments({
        subsidiary: subsidiaryFilter === 'ALL' ? undefined : subsidiaryFilter,
        search: searchQuery || undefined,
      });
      setDocuments(res.documents || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading documents';
      toast.error('Document Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter((d) =>
    searchQuery
      ? d.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.subsidiary?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="mobile-main-viewport">
      {/* Search & Actions Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="mobile-input"
              placeholder="Search reports by name or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>

          <button
            type="button"
            onClick={loadDocuments}
            disabled={loading}
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label="Refresh Documents"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Subsidiary Filter Horizontal Scroll Chips */}
        <div className="mobile-horizontal-scroll">
          {SUBSIDIARIES.map((sub) => {
            const isSelected = subsidiaryFilter === sub;
            return (
              <button
                key={sub}
                type="button"
                className="mobile-scroll-item"
                onClick={() => setSubsidiaryFilter(sub)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                  backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-2)',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Upload Trigger for Analysts */}
      {canUpload && onOpenUpload && (
        <button
          type="button"
          className="mobile-btn-touch mobile-btn-primary"
          onClick={onOpenUpload}
        >
          <Plus size={16} /> Upload Ingestion Report
        </button>
      )}

      {/* Document Count Info */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Showing {filteredDocs.length} Documents</span>
        <span>Filter: {subsidiaryFilter}</span>
      </div>

      {/* Document List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Loading document repository...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="mobile-card" style={{ textAlign: 'center', padding: 32 }}>
          <FileText size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            No Documents Found
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 12px 0' }}>
            Try adjusting your search query or subsidiary filter.
          </p>
          {canUpload && onOpenUpload && (
            <button
              type="button"
              className="mobile-btn-touch mobile-btn-secondary"
              onClick={onOpenUpload}
              style={{ width: 'auto', margin: '0 auto', padding: '0 16px', height: 36, fontSize: 12 }}
            >
              <Upload size={13} /> Upload First File
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="mobile-card"
              onClick={() => onInspectDocument(doc.id)}
              style={{ cursor: 'pointer', gap: 8 }}
            >
              {/* Header with Title & Badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      backgroundColor: 'rgba(20, 184, 166, 0.15)',
                      color: 'var(--accent-teal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {doc.original_name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      ID #{doc.id} • {doc.uploaded_at?.split('T')[0] || doc.uploaded_at}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor:
                      doc.status === 'PROCESSED'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : doc.status === 'FAILED'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                    color:
                      doc.status === 'PROCESSED'
                        ? '#10B981'
                        : doc.status === 'FAILED'
                        ? '#EF4444'
                        : '#F59E0B',
                    flexShrink: 0,
                  }}
                >
                  {doc.status}
                </span>
              </div>

              {/* Badges & Meta Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {doc.subsidiary}
                </span>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {doc.page_count} Pages
                </span>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {doc.file_type.toUpperCase()}
                </span>
              </div>

              {/* Tap to inspect hint */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Eye size={12} /> Inspect Chunks & Provenance
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
