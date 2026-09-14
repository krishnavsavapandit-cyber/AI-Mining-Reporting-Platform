import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Trash2, X, Search } from 'lucide-react';
import { documentService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { DocumentDetailResponse } from '@/types';

export interface MobileDocumentDetailModalProps {
  docId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onDocumentChanged?: () => void;
}

export const MobileDocumentDetailModal: React.FC<MobileDocumentDetailModalProps> = ({
  docId,
  isOpen,
  onClose,
  onDocumentChanged,
}) => {
  const [data, setData] = useState<DocumentDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chunks' | 'extracted' | 'ocr'>('chunks');
  const [chunkSearch, setChunkSearch] = useState('');
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { canDelete, canUpload } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (isOpen && docId) {
      loadDetails(docId);
    } else {
      setData(null);
    }
  }, [isOpen, docId]);

  const loadDetails = async (id: number) => {
    setLoading(true);
    try {
      const res = await documentService.getDocument(id);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch document';
      toast.error('Document Load Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async () => {
    if (!docId) return;
    setIsReprocessing(true);
    try {
      await documentService.reprocessDocument(docId);
      toast.success('Reprocessing Completed', 'Document text and vector embeddings refreshed.');
      loadDetails(docId);
      if (onDocumentChanged) onDocumentChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reprocess error';
      toast.error('Reprocessing Failed', msg);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!docId || !data) return;
    if (!window.confirm(`Are you sure you want to permanently delete '${data.document.original_name}'?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await documentService.deleteDocument(docId);
      toast.success('Document Deleted', 'Document, chunks, and extracted facts removed.');
      if (onDocumentChanged) onDocumentChanged();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete error';
      toast.error('Delete Failed', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const doc = data?.document;
  const filteredChunks =
    data?.chunks.filter((c) =>
      c.content.toLowerCase().includes(chunkSearch.toLowerCase())
    ) || [];

  return (
    <div className="mobile-modal-overlay" onClick={onClose}>
      <div className="mobile-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mobile-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(20, 184, 166, 0.15)',
                color: 'var(--accent-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText size={18} />
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
                {doc?.original_name || 'Loading Document...'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {doc?.subsidiary} • {doc?.page_count} Pages • {doc?.file_type?.toUpperCase()}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="mobile-modal-body">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading document data and chunk provenance...
            </div>
          ) : doc ? (
            <>
              {/* Metadata Cards */}
              <div className="mobile-metrics-grid">
                <div className="mobile-metric-pill">
                  <span className="mobile-metric-label">OCR Status</span>
                  <span className="mobile-metric-value" style={{ fontSize: 13, color: '#10B981' }}>
                    {data?.ocr_info?.ocr_performed ? 'Tesseract Complete' : 'PyMuPDF Direct'}
                  </span>
                  <span className="mobile-metric-sub">{data?.ocr_info?.quality || 'High Quality'}</span>
                </div>
                <div className="mobile-metric-pill">
                  <span className="mobile-metric-label">Provenance SHA-256</span>
                  <span
                    className="mobile-metric-value text-mono"
                    style={{ fontSize: 10, wordBreak: 'break-all' }}
                  >
                    {doc.checksum?.slice(0, 12)}...
                  </span>
                  <span className="mobile-metric-sub">Verified Ingestion</span>
                </div>
              </div>

              {/* Touch Tabs */}
              <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border-hairline)', paddingBottom: 6 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('chunks')}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: activeTab === 'chunks' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: activeTab === 'chunks' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Chunks ({data?.chunks.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('extracted')}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: activeTab === 'extracted' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: activeTab === 'extracted' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Facts ({data?.extracted_records.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ocr')}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: activeTab === 'ocr' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: activeTab === 'ocr' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Raw OCR / Info
                </button>
              </div>

              {/* Tab 1: Chunks */}
              {activeTab === 'chunks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={14}
                      style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      className="mobile-input"
                      placeholder="Search within extracted chunks..."
                      value={chunkSearch}
                      onChange={(e) => setChunkSearch(e.target.value)}
                      style={{ paddingLeft: 30, height: 38, fontSize: 12 }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                    {filteredChunks.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                        No chunks match search.
                      </div>
                    ) : (
                      filteredChunks.map((chunk) => (
                        <div
                          key={chunk.id}
                          style={{
                            padding: '10px 12px',
                            backgroundColor: 'var(--bg-surface-2)',
                            border: '1px solid var(--border-hairline)',
                            borderRadius: 6,
                            fontSize: 12,
                            lineHeight: 1.4,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-teal)' }}>
                              Chunk #{chunk.chunk_index} • Page {chunk.page_number}
                            </span>
                            <span className="text-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                              {chunk.token_count || chunk.content.length} chars
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>{chunk.content}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Extracted Facts */}
              {activeTab === 'extracted' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {data?.extracted_records.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      No structured entities extracted yet.
                    </div>
                  ) : (
                    data?.extracted_records.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: 'var(--bg-surface-2)',
                          border: '1px solid var(--border-hairline)',
                          borderRadius: 6,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.entity_type}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {item.metric_name || item.entity_name}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>
                            {item.raw_value || item.numeric_value} {item.normalized_unit || ''}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Page {item.page_number}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: OCR & Provenance */}
              {activeTab === 'ocr' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    style={{
                      padding: 12,
                      backgroundColor: 'var(--bg-surface-2)',
                      borderRadius: 6,
                      border: '1px solid var(--border-hairline)',
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div><strong>File Size:</strong> {((doc.file_size || 0) / 1024).toFixed(1)} KB</div>
                    <div><strong>Ingestion Time:</strong> {doc.uploaded_at}</div>
                    <div><strong>OCR Engine:</strong> {data?.ocr_info?.engine || 'PyMuPDF + Tesseract 5.x'}</div>
                    <div style={{ wordBreak: 'break-all', marginTop: 4 }}>
                      <strong>Full SHA-256:</strong> <span className="text-mono" style={{ fontSize: 10 }}>{doc.checksum}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {canUpload && (
                  <button
                    type="button"
                    className="mobile-btn-touch mobile-btn-secondary"
                    onClick={handleReprocess}
                    disabled={isReprocessing}
                    style={{ flex: 1 }}
                  >
                    <RefreshCw size={14} className={isReprocessing ? 'animate-spin' : ''} />
                    {isReprocessing ? 'Reprocessing...' : 'Reprocess'}
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    className="mobile-btn-touch mobile-btn-outline"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    style={{ flex: 1, color: 'var(--status-error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    <Trash2 size={14} />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
