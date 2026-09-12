import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertTriangle, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { documentService } from '@/services/api';
import { useToast } from '@/components/ui/ToastContext';
import { UploadResultItem } from '@/types';

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [forceUpload, setForceUpload] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResultItem[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setUploadResults(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
      setUploadResults(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.warning('No files selected', 'Please choose at least one mining document to upload.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const data = await documentService.uploadDocuments(formData, forceUpload);
      setUploadResults(data.results || []);

      const duplicates = data.results.filter((r) => r.status === 'DUPLICATE');
      const successes = data.results.filter((r) => r.status === 'SUCCESS');
      const failures = data.results.filter((r) => r.status === 'FAILED');

      if (successes.length > 0) {
        toast.success(
          'Documents Processed',
          `Successfully processed ${successes.length} document${successes.length > 1 ? 's' : ''}.`
        );
      }
      if (duplicates.length > 0) {
        toast.warning(
          'Duplicate Fingerprint Detected',
          `${duplicates.length} file(s) matched existing SHA-256 checksums in the database.`
        );
      }
      if (failures.length > 0) {
        toast.error('Processing Failed', `${failures.length} file(s) failed during ingestion.`);
      }

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error('Upload Error', msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setUploadResults(null);
    setForceUpload(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UploadCloud size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>Ingest & Extract Mining Documents</span>
        </div>
      }
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={forceUpload}
              onChange={(e) => setForceUpload(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            <span>Bypass SHA-256 duplicate rejection (Force Re-ingest)</span>
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isUploading}>
              Close
            </Button>
            {uploadResults ? (
              <Button variant="primary" size="sm" onClick={handleReset}>
                Upload More
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartUpload}
                loading={isUploading}
                disabled={selectedFiles.length === 0}
              >
                Start Ingestion ({selectedFiles.length})
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Drop Zone Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '1px dashed var(--border-hairline-alt)',
            borderRadius: 'var(--radius-md)',
            padding: '32px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface-2)',
            cursor: 'pointer',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.tiff"
            style={{ display: 'none' }}
          />
          <UploadCloud size={32} style={{ color: 'var(--accent-primary)', marginBottom: 8 }} />
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
            Click or drag & drop mining files to ingest
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Supports PDF, Scanned OCR, DOCX, XLSX, and CSV formats with SHA-256 fingerprinting.
          </div>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && !uploadResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Files Queued for Processing ({selectedFiles.length}):
            </span>
            <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <File size={14} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-primary)' }} className="truncate">
                      {file.name}
                    </span>
                    <span className="text-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    icon={<Trash2 size={12} />}
                    style={{ padding: '2px 6px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Results Outcome */}
        {uploadResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Ingestion Outcomes:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {uploadResults.map((res, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {res.status === 'SUCCESS' && <CheckCircle2 size={14} style={{ color: 'var(--accent-primary)' }} />}
                    {res.status === 'DUPLICATE' && <AlertTriangle size={14} style={{ color: 'var(--status-warning)' }} />}
                    {res.status === 'FAILED' && <XCircle size={14} style={{ color: 'var(--status-error)' }} />}
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{res.filename}</span>
                  </div>
                  <Badge
                    variant={
                      res.status === 'SUCCESS'
                        ? 'primary'
                        : res.status === 'DUPLICATE'
                        ? 'warning'
                        : 'error'
                    }
                  >
                    {res.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
