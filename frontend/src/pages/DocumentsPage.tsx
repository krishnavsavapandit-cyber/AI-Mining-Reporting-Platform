import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  RefreshCw,
  Search,
  Eye,
  Trash2,
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

  const filteredDocs = documents.filter((d) =>
    searchQuery
      ? d.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.subsidiary?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

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
              backgroundColor: 'rgba(45, 156, 168, 0.1)',
              border: '1px solid var(--accent-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-teal)',
            }}
          >
            <FileText size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Document Intelligence & Ingestion Catalog
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Catalog of statutory CIL production reports, geological surveys, and parliamentary inquiries with SHA-256 integrity.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {canUpload && onOpenUpload && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenUpload}
              icon={<Upload size={13} />}
            >
              Upload Ingestion File
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadDocuments}
            loading={loading}
            icon={<RefreshCw size={13} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: '240px' }}>
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name, subsidiary, or reporting period..."
            className="input-text"
            style={{ border: 'none', background: 'transparent', padding: '4px 0' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        </div>
      </div>

      {filteredDocs.length === 0 && !loading ? (
        <EmptyState
          type="documents"
          title="No Documents Ingested"
          description="Upload geological survey files, monthly reports, or parliamentary inquiry DOCX/PDFs to start indexing."
          action={
            canUpload && onOpenUpload ? (
              <Button variant="primary" size="sm" onClick={onOpenUpload} icon={<Upload size={13} />}>
                Upload Document
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="card-level-1" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Doc ID</th>
                  <th>Document Name</th>
                  <th>Subsidiary</th>
                  <th>Format</th>
                  <th>Pages</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onInspectDocument && onInspectDocument(doc.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                      #{doc.id}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <strong style={{ color: 'var(--text-primary)' }}>{doc.original_name}</strong>
                      </div>
                    </td>
                    <td>
                      <Badge variant="slate">{doc.subsidiary || 'CIL'}</Badge>
                    </td>
                    <td>
                      <Badge variant="teal">{doc.file_type?.toUpperCase() || 'PDF'}</Badge>
                    </td>
                    <td className="text-mono" style={{ fontSize: 12 }}>
                      {doc.page_count || 1}
                    </td>
                    <td className="text-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {doc.reporting_period || 'General'}
                    </td>
                    <td>
                      <Badge
                        variant={
                          doc.status === 'PROCESSED'
                            ? 'primary'
                            : doc.status === 'FAILED'
                            ? 'error'
                            : 'warning'
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
                          >
                            Reprocess
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => handleDelete(doc.id, e)}
                            icon={<Trash2 size={12} />}
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
