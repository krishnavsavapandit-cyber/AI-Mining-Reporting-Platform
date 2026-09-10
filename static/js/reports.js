/**
 * Report Generator Controller for SIH26023 Mining Platform.
 */

class ReportManager {
    constructor() {
        this.init();
    }

    init() {
        const generateBtn = document.getElementById("btn-generate-report");
        const refreshBtn = document.getElementById("btn-refresh-reports");

        if (generateBtn) generateBtn.addEventListener("click", () => this.generateReport());
        if (refreshBtn) refreshBtn.addEventListener("click", () => this.loadReports());
    }

    async generateReport() {
        const type = document.getElementById("rep-type-select").value;
        const sub = document.getElementById("rep-sub-select").value;
        const period = document.getElementById("rep-period-input").value.trim();
        const inst = document.getElementById("rep-custom-inst").value.trim();

        const title = `CIL Executive ${type}${sub ? ` (${sub})` : ''}${period ? ` -- ${period}` : ''}`;

        window.app.showToast("Initiating Report Generation Agent workflow...", "info");

        try {
            const data = await window.app.fetchApi("/api/reports/generate", {
                method: "POST",
                body: {
                    report_type: type,
                    title: title,
                    subsidiary: sub,
                    reporting_period: period,
                    instructions: inst
                }
            });

            window.app.showToast("Report compiled and exported successfully!", "success");
            this.loadReports();

            // Open modal preview
            if (data.report) {
                this.previewReport(data.report.report_id);
            }
        } catch (e) {
            window.app.showToast(`Report generation failed: ${e.message}`, "error");
        }
    }

    async loadReports() {
        const tbody = document.getElementById("reports-tbody");
        if (!tbody) return;

        try {
            const data = await window.app.fetchApi("/api/reports");
            if (!data.reports || data.reports.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-slate-400">No reports generated yet. Select criteria above to compile.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.reports.map(r => `
                <tr>
                    <td class="font-bold text-white">${r.title}</td>
                    <td>${r.report_type}</td>
                    <td>${r.subsidiary || 'Consolidated CIL'}</td>
                    <td>${r.reporting_period || 'All Periods'}</td>
                    <td>
                        <span class="badge ${r.human_approved ? 'badge-emerald' : 'badge-amber'}">
                            ${r.human_approved ? 'OFFICIALLY APPROVED' : 'DRAFT REVIEW REQ'}
                        </span>
                    </td>
                    <td class="text-xs text-slate-400">${r.created_at}</td>
                    <td>
                        <div class="flex gap-2">
                            <button class="btn btn-xs btn-primary" onclick="window.reportManager.previewReport(${r.id})">View</button>
                        </div>
                    </td>
                </tr>
            `).join("");
        } catch (e) {
            console.error("Failed to load reports:", e);
        }
    }

    async previewReport(reportId) {
        const modal = document.getElementById("modal-report-viewer");
        const body = document.getElementById("report-modal-body");
        const title = document.getElementById("report-modal-title");
        const pdfBtn = document.getElementById("rep-modal-pdf-btn");
        const docxBtn = document.getElementById("rep-modal-docx-btn");
        const footer = document.getElementById("report-modal-footer");

        modal.classList.add("active");
        body.innerHTML = `<div class="p-6 text-center text-slate-400">Loading formatted report...</div>`;

        try {
            const data = await window.app.fetchApi(`/api/reports/${reportId}`);
            const r = data.report;
            title.innerText = r.title;

            if (pdfBtn && data.pdf_url) pdfBtn.href = data.pdf_url;
            if (docxBtn && data.docx_url) docxBtn.href = data.docx_url;

            body.innerHTML = r.html_content || `<div class="p-4">${r.summary}</div>`;

            // Render Approval Button in Modal Footer
            footer.innerHTML = `
                <div class="text-xs text-slate-400">Status: <strong>${r.human_approved ? `Approved by ${r.approved_by}` : 'Pending Executive Approval'}</strong></div>
                ${!r.human_approved ? `
                    <button class="btn btn-sm btn-primary" onclick="window.reportManager.approveReport(${r.id})">
                        <span>Sign-off & Officially Approve Report</span>
                    </button>
                ` : `<span class="badge badge-emerald">Verified Document</span>`}
            `;
        } catch (e) {
            body.innerHTML = `<div class="p-4 text-rose">Failed to load report: ${e.message}</div>`;
        }
    }

    async approveReport(reportId) {
        try {
            await window.app.fetchApi(`/api/reports/${reportId}/approve`, {
                method: "POST",
                body: { approved_by: "General Manager (Production) / Coal India" }
            });
            window.app.showToast("Report officially approved and archived.", "success");
            this.previewReport(reportId);
            this.loadReports();
        } catch (e) {
            window.app.showToast(`Approval failed: ${e.message}`, "error");
        }
    }
}

// Global report manager
window.reportManager = new ReportManager();
