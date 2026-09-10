/**
 * Validation & Cross-Document Discrepancy Controller for SIH26023.
 */

class ValidationManager {
    constructor() {
        this.init();
    }

    init() {
        const scanBtn = document.getElementById("btn-run-validation-scan");
        if (scanBtn) scanBtn.addEventListener("click", () => this.runScan());
    }

    async runScan() {
        window.app.showToast("Executing Validation Agent cross-document scan...", "info");
        try {
            const data = await window.app.fetchApi("/api/validation/scan", { method: "POST" });
            window.app.showToast(data.message, "success");
            this.loadIssues();
            if (window.dashboard) window.dashboard.loadSummary();
        } catch (e) {
            window.app.showToast(`Validation scan failed: ${e.message}`, "error");
        }
    }

    async loadIssues() {
        const container = document.getElementById("validation-issues-list");
        if (!container) return;

        try {
            const data = await window.app.fetchApi("/api/validation/issues");
            if (!data.issues || data.issues.length === 0) {
                container.innerHTML = `
                    <div class="empty-state text-center py-8">
                        <svg width="48" height="48" class="text-emerald-400 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <h4 class="text-white font-bold mt-2">Zero Inconsistencies Detected</h4>
                        <p class="text-xs text-slate-400">All cross-document figures, production outputs, and OBR values are internally consistent across current records.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = data.issues.map(iss => `
                <div class="p-4 mb-3 bg-slate-900 border ${iss.severity === 'HIGH' ? 'border-rose-500/50' : 'border-amber-500/50'} rounded-lg">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-2">
                            <span class="badge ${iss.severity === 'HIGH' ? 'badge-rose' : 'badge-amber'}">${iss.severity} SEVERITY</span>
                            <span class="font-bold text-white">${iss.field_name}</span>
                            <span class="text-xs text-slate-400">(${iss.subsidiary} — ${iss.reporting_period || 'Period'})</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-rose-400">Variance: ${iss.variance_percentage}%</span>
                            <span class="badge ${iss.status === 'RESOLVED' ? 'badge-emerald' : 'badge-amber'}">${iss.status}</span>
                        </div>
                    </div>

                    <div class="grid-2col gap-3 my-2 text-xs">
                        <div class="p-3 bg-slate-800/80 rounded border border-slate-700">
                            <div class="font-bold text-amber-400 mb-1">Source Document A</div>
                            <div class="text-white font-medium">${iss.doc_a_name} (Page ${iss.doc_a_page})</div>
                            <div class="mt-2 text-slate-300">Extracted Figure: <strong class="text-white">${iss.doc_a_value}</strong></div>
                        </div>

                        <div class="p-3 bg-slate-800/80 rounded border border-slate-700">
                            <div class="font-bold text-blue-400 mb-1">Source Document B</div>
                            <div class="text-white font-medium">${iss.doc_b_name} (Page ${iss.doc_b_page})</div>
                            <div class="mt-2 text-slate-300">Extracted Figure: <strong class="text-white">${iss.doc_b_value}</strong></div>
                        </div>
                    </div>

                    ${iss.status !== 'RESOLVED' ? `
                        <div class="flex justify-end mt-3">
                            <button class="btn btn-xs btn-outline" onclick="window.validationManager.resolveIssue(${iss.id})">
                                Mark as Acknowledged / Resolved
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join("");
        } catch (e) {
            container.innerHTML = `<div class="p-4 text-rose">Failed to load validation issues: ${e.message}</div>`;
        }
    }

    async resolveIssue(issueId) {
        try {
            await window.app.fetchApi(`/api/validation/issues/${issueId}/resolve`, {
                method: "POST",
                body: { resolved_by: "Mining Verification Officer" }
            });
            window.app.showToast("Validation issue marked as resolved", "success");
            this.loadIssues();
            if (window.dashboard) window.dashboard.loadSummary();
        } catch (e) {
            window.app.showToast(`Failed to resolve issue: ${e.message}`, "error");
        }
    }
}

// Global validation manager
window.validationManager = new ValidationManager();
