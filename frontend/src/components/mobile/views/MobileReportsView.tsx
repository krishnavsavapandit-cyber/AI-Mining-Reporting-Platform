import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { reportService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { ReportRecord } from '@/types';

interface MobileReportsViewProps {
  onInspectReport: (id: number) => void;
}

export const MobileReportsView: React.FC<MobileReportsViewProps> = ({ onInspectReport }) => {
  const { isOfficerOrAbove, isAnalystOrAbove, roleInfo } = useAuth();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [subsidiary, setSubsidiary] = useState('ECL');
  const [reportType, setReportType] = useState('MONTHLY_OPERATIONAL');
  const toast = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await reportService.getReports();
      setReports(res.reports || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch reports';
      toast.error('Reports Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title Required', 'Please provide a title for the executive report.');
      return;
    }
    setGenerating(true);
    toast.info('Synthesizing Report', 'Compiling multi-source facts and applying DGMS checks...');
    try {
      const res = await reportService.generateReport({
        title,
        subsidiary,
        report_type: reportType,
        reporting_period: 'FY 2024-25 Q3',
      });
      toast.success('Report Created', `Draft report #${res.report.id} generated.`);
      setShowGenerateForm(false);
      setTitle('');
      loadReports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Report generation failed';
      toast.error('Generation Error', msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (reportId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await reportService.approveReport(reportId, {
        approved_by: `${roleInfo.name} (${roleInfo.role})`,
      });
      toast.success('Report Approved', 'Official sign-off applied.');
      loadReports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      toast.error('Approval Error', msg);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subsidiary.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'SEALED') return matchesSearch && r.human_approved;
    if (filterType === 'DRAFT') return matchesSearch && !r.human_approved;
    return matchesSearch;
  });

  return (
    <div className="mobile-main-viewport">
      {/* Header & Controls */}
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
              placeholder="Search reports by title or subsidiary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>

          <button
            type="button"
            onClick={loadReports}
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
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="mobile-horizontal-scroll">
          {['ALL', 'DRAFT', 'SEALED'].map((f) => (
            <button
              key={f}
              type="button"
              className="mobile-scroll-item"
              onClick={() => setFilterType(f)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                border: filterType === f ? '1px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                backgroundColor: filterType === f ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-2)',
                color: filterType === f ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {f === 'ALL' ? 'All Reports' : f === 'DRAFT' ? 'Pending Sign-Off' : 'Officially Sealed'}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Report Button for Analysts/Officers */}
      {isAnalystOrAbove && (
        <button
          type="button"
          className="mobile-btn-touch mobile-btn-primary"
          onClick={() => setShowGenerateForm((prev) => !prev)}
        >
          <Plus size={16} /> {showGenerateForm ? 'Cancel Generation' : 'Generate New Statutory Report'}
        </button>
      )}

      {/* New Report Form Drawer */}
      {showGenerateForm && (
        <form
          onSubmit={handleCreateReport}
          className="mobile-card"
          style={{ border: '1px solid var(--accent-primary)' }}
        >
          <h4 className="mobile-card-title">Generate Statutory Report</h4>
          <input
            type="text"
            className="mobile-input"
            placeholder="Report Title (e.g., ECL Rajmahal Q3 Production Review)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select
              className="mobile-input"
              value={subsidiary}
              onChange={(e) => setSubsidiary(e.target.value)}
            >
              <option value="ECL">ECL</option>
              <option value="BCCL">BCCL</option>
              <option value="CCL">CCL</option>
              <option value="SECL">SECL</option>
              <option value="NCL">NCL</option>
              <option value="WCL">WCL</option>
              <option value="MCL">MCL</option>
            </select>

            <select
              className="mobile-input"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="MONTHLY_OPERATIONAL">Monthly Operational</option>
              <option value="DGMS_STATUTORY">DGMS Compliance</option>
              <option value="PARLIAMENTARY_STARRED">Parliamentary Brief</option>
              <option value="STRIPPING_RATIO_AUDIT">Stripping Ratio Audit</option>
            </select>
          </div>

          <button
            type="submit"
            className="mobile-btn-touch mobile-btn-primary"
            disabled={generating}
          >
            {generating ? 'Synthesizing...' : 'Compile & Draft Report'}
          </button>
        </form>
      )}

      {/* Reports List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Loading official report archive...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="mobile-card" style={{ textAlign: 'center', padding: 32 }}>
          <FileCheck size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            No Reports Found
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            No reports match the current filter criteria.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredReports.map((rep) => (
            <div
              key={rep.id}
              className="mobile-card"
              onClick={() => onInspectReport(rep.id)}
              style={{ cursor: 'pointer', gap: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      backgroundColor: rep.human_approved
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                      color: rep.human_approved ? '#10B981' : '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileCheck size={16} />
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
                      {rep.title}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {rep.subsidiary} • {rep.reporting_period}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: rep.human_approved
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                    color: rep.human_approved ? '#10B981' : '#F59E0B',
                    flexShrink: 0,
                  }}
                >
                  {rep.human_approved ? 'SEALED' : 'DRAFT'}
                </span>
              </div>

              {/* Summary Snippet */}
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                {rep.summary ? rep.summary.slice(0, 110) + '...' : 'Executive statutory synthesis ready.'}
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {rep.approved_by ? `Sealed By: ${rep.approved_by}` : 'Pending Officer Seal'}
                </span>

                {!rep.human_approved && isOfficerOrAbove ? (
                  <button
                    type="button"
                    className="mobile-btn-touch mobile-btn-primary"
                    onClick={(e) => handleApprove(rep.id, e)}
                    style={{ height: 30, padding: '0 10px', fontSize: 10, width: 'auto' }}
                  >
                    <CheckCircle2 size={12} /> Sign-Off
                  </button>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Eye size={12} /> View Report
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
