/**
 * Dashboard Overview Controller for SIH26023 Mining Platform.
 */

class DashboardController {
    constructor() {
        this.chartInstance = null;
        this.init();
    }

    init() {
        this.loadSummary();
    }

    async loadSummary() {
        try {
            const data = await window.app.fetchApi("/api/analytics/summary");
            if (data && data.summary) {
                const s = data.summary;
                document.getElementById("kpi-total-docs").innerText = s.total_documents;
                document.getElementById("kpi-pages-sub").innerText = `${s.total_pages} pages | ${s.extracted_records} records`;
                document.getElementById("kpi-production-mt").innerText = s.total_production_mt.toFixed(2);
                document.getElementById("kpi-obr-mcum").innerHTML = `${s.total_obr_mcum.toFixed(2)} <span class="unit-text">M.Cum</span>`;
                document.getElementById("kpi-conflicts-count").innerText = s.unresolved_inconsistencies;

                const navDocCount = document.getElementById("nav-doc-count");
                if (navDocCount) navDocCount.innerText = s.total_documents;

                const navValCount = document.getElementById("nav-val-count");
                if (navValCount) navValCount.innerText = s.unresolved_inconsistencies;
            }

            this.loadSubsidiaryChart();
            this.loadRecentWorkflows();
            this.loadRecentDiscrepancies();
            this.loadRecentDocuments();
        } catch (e) {
            console.error("Failed to load dashboard summary:", e);
        }
    }

    async loadSubsidiaryChart() {
        try {
            const data = await window.app.fetchApi("/api/analytics/charts");
            const chartData = data.charts.subsidiary_production;
            const ctx = document.getElementById("chart-subsidiary-prod");
            if (!ctx) return;

            if (this.chartInstance) {
                this.chartInstance.destroy();
            }

            this.chartInstance = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: chartData.labels.length ? chartData.labels : ["No Data"],
                    datasets: [{
                        label: "Coal Production (Million Tonnes)",
                        data: chartData.data.length ? chartData.data : [0],
                        backgroundColor: "rgba(245, 158, 11, 0.7)",
                        borderColor: "#f59e0b",
                        borderWidth: 1.5,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
                        y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
                    }
                }
            });
        } catch (e) {
            console.error("Failed to load subsidiary chart:", e);
        }
    }

    async loadRecentWorkflows() {
        const container = document.getElementById("dashboard-workflow-list");
        if (!container) return;

        try {
            const data = await window.app.fetchApi("/api/agents/workflows?limit=5");
            if (!data.workflows || data.workflows.length === 0) {
                container.innerHTML = `<div class="text-xs text-slate-500 py-3 text-center">No agent workflows logged yet.</div>`;
                return;
            }

            container.innerHTML = data.workflows.map(wf => `
                <div class="trace-step-item mb-2">
                    <div class="flex justify-between items-center">
                        <span class="trace-step-agent">${wf.workflow_type}</span>
                        <span class="badge ${wf.status === 'COMPLETED' ? 'badge-emerald' : (wf.status === 'RUNNING' ? 'badge-amber' : 'badge-rose')}">${wf.status}</span>
                    </div>
                    <div class="text-xs text-slate-300 mt-1">${wf.initial_prompt ? wf.initial_prompt.substring(0, 75) + '...' : wf.id}</div>
                </div>
            `).join("");
        } catch (e) {
            console.error("Failed to load workflows:", e);
        }
    }

    async loadRecentDiscrepancies() {
        const container = document.getElementById("dashboard-discrepancies-list");
        if (!container) return;

        try {
            const data = await window.app.fetchApi("/api/validation/issues?status=UNRESOLVED");
            if (!data.issues || data.issues.length === 0) {
                container.innerHTML = `<div class="text-xs text-emerald-400 py-3 flex items-center gap-2">✓ All cross-document figures are currently consistent.</div>`;
                return;
            }

            container.innerHTML = data.issues.slice(0, 3).map(iss => `
                <div class="p-2 mb-2 bg-slate-900 border border-amber-500/30 rounded text-xs">
                    <div class="flex justify-between font-bold text-amber-400">
                        <span>${iss.field_name} (${iss.subsidiary})</span>
                        <span class="badge badge-rose">Variance: ${iss.variance_percentage}%</span>
                    </div>
                    <div class="text-slate-300 mt-1">
                        ${iss.doc_a_name} (Pg ${iss.doc_a_page}): <strong>${iss.doc_a_value}</strong> vs ${iss.doc_b_name} (Pg ${iss.doc_b_page}): <strong>${iss.doc_b_value}</strong>
                    </div>
                </div>
            `).join("");
        } catch (e) {
            console.error("Failed to load discrepancies:", e);
        }
    }

    async loadRecentDocuments() {
        const container = document.getElementById("dashboard-recent-docs");
        if (!container) return;

        try {
            const data = await window.app.fetchApi("/api/documents");
            if (!data.documents || data.documents.length === 0) {
                container.innerHTML = `<div class="text-xs text-slate-500 py-3 text-center">No documents in repository.</div>`;
                return;
            }

            container.innerHTML = `
                <table class="data-table">
                    <thead><tr><th>Document</th><th>Subsidiary</th><th>Status</th></tr></thead>
                    <tbody>
                        ${data.documents.slice(0, 4).map(d => `
                            <tr>
                                <td class="font-medium">${d.original_name}</td>
                                <td>${d.subsidiary || 'N/A'}</td>
                                <td><span class="badge ${d.status === 'PROCESSED' ? 'badge-emerald' : 'badge-rose'}">${d.status}</span></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        } catch (e) {
            console.error("Failed to load recent docs:", e);
        }
    }
}

// Global dashboard controller
window.dashboard = new DashboardController();
