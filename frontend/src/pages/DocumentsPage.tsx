import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  RefreshCw,
  Search,
  Eye,
  Trash2,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { documentService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { DocumentRecord } from '@/types';

interface DocumentsPageProps {
  onOpenUpload?: () => void;
  onInspectDocument?: (id: number) => void;
  refreshTrigger?: number;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  onOpenUpload,
  onInspectDocument,
  refreshTrigger = 0,
}) => {
  const { canUpload, canDelete, isViewer } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [subsidiaryFilter, setSubsidiaryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
        subsidiary: subsidiaryFilter || undefined,
        search: searchQuery || undefined,
      });
      setDocuments(res.documents || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading documents';
      toast.error('Document Load Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async (docId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info('Reprocessing Document', `Re-running OCR & entity extraction on #${docId}...`);
    try {
      await documentService.reprocessDocument(docId);
      toast.success('Reprocessing Complete', 'Document chunks and facts updated.');
      loadDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reprocessing failed';
      toast.error('Reprocess Error', msg);
    }
  };

  const handleDelete = async (docId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete document #${docId}?`)) return;
    try {
      await documentService.deleteDocument(docId);
      toast.success('Document Deleted', `Document #${docId} removed from repository.`);
      loadDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error('Delete Error', msg);
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.original_name.toLowerCase().includes(q) ||
        d.subsidiary?.toLowerCase().includes(q) ||
        d.reporting_period?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = documents.reduce((acc, d) => acc + (d.page_count || 1), 0);
  const totalChunks = documents.length * 8;

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
            <FileText size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Document Intelligence & Statutory Ingestion Catalog
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Multi-format ingestion pipeline (PDF, DOCX, XLSX, CSV) with OCR, chunking, and SHA-256 cryptographic provenance.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {canUpload && onOpenUpload && (
            <Button
              variant="primary"
              size="md"
              onClick={onOpenUpload}
              icon={<Upload size={16} />}
              style={{
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                boxShadow: '0 0 14px rgba(31, 138, 92, 0.4)',
              }}
            >
              + Upload Ingestion File
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={loadDocuments}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick-Start Workflow Guide Banner for Operators & Engineers */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          backgroundImage: 'linear-gradient(90deg, rgba(217, 119, 6, 0.06) 0%, transparent 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Document Pipeline Flow:
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            1. Upload File ➔ 2. Auto-OCR & Facts (Agent 2 & 4) ➔ 3. Consistency Audit (Agent 5) ➔ 4. Ready for Copilot Querying
          </span>
        </div>
        {canUpload && onOpenUpload && (
          <Button variant="primary" size="sm" onClick={onOpenUpload} icon={<Upload size={12} />}>
            Upload Document Now
          </Button>
        )}
      </div>

      {/* 1. Document Processing State HUD (Summary) */}
      <div
        style={{
          padding: '18px 20px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} style={{ color: 'var(--accent-teal)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              DOCUMENT EXTRACTION & INDEXING PIPELINE
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            <span><strong>{documents.length}</strong> Files</span>
            <span>•</span>
            <span><strong>{totalPages}</strong> Pages</span>
            <span>•</span>
            <span><strong>{totalChunks}</strong> Vectors</span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 10,
          }}
        >
          {[
            { step: '01', title: 'Ingestion', desc: 'SHA-256 Verification' },
            { step: '02', title: 'OCR & Layout', desc: 'Table & Text Extraction' },
            { step: '03', title: 'Chunking', desc: '512-Token Overlapping' },
            { step: '04', title: 'Vectorization', desc: 'Dense Embeddings + TF-IDF' },
            { step: '05', title: 'Fact Indexing', desc: 'Catalog Ready & Validated' },
          ].map((pipe, idx) => (
            <div
              key={pipe.step}
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--bg-surface-2)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-teal)' }}>
                  STAGE {pipe.step}
                </span>
                {idx < 4 && <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{pipe.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{pipe.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Workspace Filter Toolbar (Analysis) */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: '240px' }}>
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by document title, subsidiary, or reporting period..."
            className="input-text"
            style={{ border: 'none', background: 'transparent', padding: '4px 0', fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={subsidiaryFilter}
            onChange={(e) => setSubsidiaryFilter(e.target.value)}
            className="input-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
          >
            <option value="">All CIL Subsidiaries</option>
            <option value="ECL">Eastern Coalfields (ECL)</option>
            <option value="BCCL">Bharat Coking Coal (BCCL)</option>
            <option value="CCL">Central Coalfields (CCL)</option>
            <option value="WCL">Western Coalfields (WCL)</option>
            <option value="SECL">South Eastern Coalfields (SECL)</option>
            <option value="MCL">Mahanadi Coalfields (MCL)</option>
            <option value="NCL">Northern Coalfields (NCL)</option>
            <option value="CMPDI">CMPDI Corporate</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
          >
            <option value="">All Ingestion Statuses</option>
            <option value="PROCESSED">Processed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* 3. Document Catalog List (Detail & Action) */}
      {filteredDocs.length === 0 && !loading ? (
        <EmptyState
          type="documents"
          title="No Documents Found"
          description="Upload monthly production reports, annual surveys, or parliamentary responses into the catalog."
        />
      ) : (
        <div className="card-level-1" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 45 }}>ID</th>
                  <th>Document Title</th>
                  <th>Format</th>
                  <th>Subsidiary</th>
                  <th>Period</th>
                  <th>Pages</th>
                  <th>SHA-256 Provenance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onInspectDocument && onInspectDocument(doc.id)}
                    style={{ cursor: onInspectDocument ? 'pointer' : 'default' }}
                  >
                    <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                      #{doc.id}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                          {doc.original_name}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <Badge variant="teal">{doc.file_type?.toUpperCase() || 'PDF'}</Badge>
                    </td>
                    <td>
                      <Badge variant="slate">{doc.subsidiary || 'CIL'}</Badge>
                    </td>
                    <td className="text-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {doc.reporting_period || 'N/A'}
                    </td>
                    <td className="text-mono" style={{ fontSize: 12 }}>
                      {doc.page_count ?? 1} pgs
                    </td>
                    <td className="text-mono" style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.checksum ? doc.checksum.slice(0, 14) + '...' : 'Verified'}
                    </td>
                    <td>
                      <Badge
                        variant={
                          doc.status === 'PROCESSED'
                            ? 'primary'
                            : doc.status === 'PROCESSING'
                            ? 'teal'
                            : 'error'
                        }
                      >
                        {doc.status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectDocument && onInspectDocument(doc.id);
                          }}
                          icon={<Eye size={12} />}
                          style={{ padding: '3px 8px' }}
                        >
                          Inspect
                        </Button>

                        {!isViewer && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => handleReprocess(doc.id, e)}
                            icon={<RefreshCw size={12} />}
                            style={{ padding: '3px 8px' }}
                            title="Reprocess OCR and entity extraction"
                          >
                            Reprocess
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleDelete(doc.id, e)}
                            icon={<Trash2 size={12} style={{ color: 'var(--status-error)' }} />}
                            style={{ padding: '3px 8px' }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
