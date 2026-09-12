import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Trash2, Layers, Table, Cpu } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { documentService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { DocumentDetailResponse } from '@/types';

export interface DocumentDetailModalProps {
  docId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onDocumentChanged?: () => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
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
      toast.success('Reprocessing Completed', 'Document text stream and vector embeddings refreshed.');
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
  const filteredChunks = data?.chunks.filter((c) =>
    c.content.toLowerCase().includes(chunkSearch.toLowerCase())
  ) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} style={{ color: 'var(--accent-teal)' }} />
          <span className="truncate" style={{ maxWidth: 450 }}>
            {doc ? doc.original_name : 'Document Inspection'}
          </span>
          {doc && (
            <Badge variant={doc.status === 'PROCESSED' ? 'primary' : doc.status === 'FAILED' ? 'error' : 'warning'}>
              {doc.status}
            </Badge>
          )}
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={isDeleting}
                icon={<Trash2 size={12} />}
              >
                Delete Document
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {canUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReprocess}
                loading={isReprocessing}
                icon={<RefreshCw size={12} />}
              >
                Reprocess OCR & Vectors
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading document facts & extraction chunks...
        </div>
      ) : doc ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Document Metadata Bar */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-surface-2)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 12,
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Subsidiary:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{doc.subsidiary}</strong>
              {doc.mine && <span> • Mine: <strong>{doc.mine}</strong></span>}
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Period:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{doc.reporting_period || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Pages:</span>{' '}
              <strong className="text-mono" style={{ color: 'var(--text-primary)' }}>{doc.page_count}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Size:</span>{' '}
              <strong className="text-mono" style={{ color: 'var(--text-primary)' }}>{(doc.file_size / 1024).toFixed(1)} KB</strong>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-hairline)', paddingBottom: 8 }}>
            <Button
              variant={activeTab === 'chunks' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('chunks')}
              icon={<Layers size={12} />}
            >
              Document Chunks ({data?.chunks_count || 0})
            </Button>
            <Button
              variant={activeTab === 'extracted' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('extracted')}
              icon={<Table size={12} />}
            >
              Extracted Facts ({data?.extracted_records_count || 0})
            </Button>
            <Button
              variant={activeTab === 'ocr' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('ocr')}
              icon={<Cpu size={12} />}
            >
              OCR Engine Diagnostics
            </Button>
          </div>

          {/* Tab 1: Extracted Chunks Feed */}
          {activeTab === 'chunks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Filter chunks by content keyword..."
                value={chunkSearch}
                onChange={(e) => setChunkSearch(e.target.value)}
                className="input-text"
                style={{ padding: '6px 10px', fontSize: 12 }}
              />

              <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredChunks.length > 0 ? (
                  filteredChunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-surface-2)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: 'var(--accent-teal)', fontWeight: 600, fontSize: 11 }}>
                          CHUNK #{chunk.chunk_index + 1} • PAGE {chunk.page_number}
                        </span>
                        <span className="text-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {chunk.token_count} Tokens
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {chunk.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No chunks found matching filter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Extracted Numerical Facts */}
          {activeTab === 'extracted' && (
            <div className="table-wrapper" style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Entity</th>
                    <th>Metric</th>
                    <th>Extracted Raw Value</th>
                    <th>Normalized Numeric</th>
                    <th>Unit</th>
                    <th>Page</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.extracted_records && data.extracted_records.length > 0 ? (
                    data.extracted_records.map((rec) => (
                      <tr key={rec.id}>
                        <td>
                          <Badge variant="slate">{rec.entity_name || rec.entity_type}</Badge>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.metric_name}</td>
                        <td className="text-mono">{rec.raw_value}</td>
                        <td className="text-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                          {rec.numeric_value}
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rec.normalized_unit}</td>
                        <td className="text-mono">{rec.page_number}</td>
                        <td className="text-mono">
                          <span style={{ color: rec.confidence_score > 0.9 ? 'var(--accent-primary)' : 'var(--status-warning)' }}>
                            {(rec.confidence_score * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                        No structured facts extracted from this document.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: OCR Engine Diagnostics */}
          {activeTab === 'ocr' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  padding: 12,
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>OCR Engine:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{data?.ocr_info?.engine || 'Tesseract / PyPDF Hybrid'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Overall Quality:</span>{' '}
                  <strong style={{ color: 'var(--accent-primary)' }}>{data?.ocr_info?.quality || 'HIGH_CONFIDENCE'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Confidence Score:</span>{' '}
                  <strong className="text-mono" style={{ color: 'var(--accent-primary)' }}>
                    {((data?.ocr_info?.confidence || 0.95) * 100).toFixed(0)}%
                  </strong>
                </div>
              </div>

              {data?.ocr_info?.page_metrics && data.ocr_info.page_metrics.length > 0 ? (
                <div className="table-wrapper" style={{ maxHeight: 280, overflowY: 'auto' }}>
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>Page</th>
                        <th>Word Count</th>
                        <th>Confidence Score</th>
                        <th>Quality Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ocr_info.page_metrics.map((pm) => (
                        <tr key={pm.page}>
                          <td className="text-mono">Page {pm.page}</td>
                          <td className="text-mono">{pm.word_count}</td>
                          <td className="text-mono">{(pm.confidence_score * 100).toFixed(1)}%</td>
                          <td>
                            <Badge variant={pm.quality === 'EXCELLENT' ? 'primary' : 'teal'}>
                              {pm.quality}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};
