/**
 * Analytics Dashboard & Charts Controller for SIH26023.
 */

class AnalyticsDashboard {
    constructor() {
        this.trendChart = null;
        this.compChart = null;
        this.safetyChart = null;
        this.severityChart = null;
    }

    async loadCharts() {
        try {
            const data = await window.app.fetchApi("/api/analytics/charts");
            const c = data.charts;

            this.renderTrendChart(c.production_trend);
            this.renderTargetActualChart(c.target_vs_actual);
            this.renderSafetyChart(c.safety_kpis);
            this.renderSeverityChart(c.validation_severity);
        } catch (e) {
            console.error("Failed to load analytics charts:", e);
        }
    }

    renderTrendChart(trendData) {
        const ctx = document.getElementById("chart-production-trend");
        if (!ctx) return;
        if (this.trendChart) this.trendChart.destroy();

        this.trendChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: trendData.labels.length ? trendData.labels : ["No Period Data"],
                datasets: [{
                    label: "Coal Production (Million Tonnes)",
                    data: trendData.data.length ? trendData.data : [0],
                    borderColor: "#38bdf8",
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: "#38bdf8"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
                    y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
                }
            }
        });
    }

    renderTargetActualChart(targetData) {
        const ctx = document.getElementById("chart-target-actual");
        if (!ctx) return;
        if (this.compChart) this.compChart.destroy();

        this.compChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: targetData.labels.length ? targetData.labels : ["No Target Data"],
                datasets: [
                    {
                        label: "Target Production (MT)",
                        data: targetData.targets.length ? targetData.targets : [0],
                        backgroundColor: "rgba(148, 163, 184, 0.5)",
                        borderColor: "#94a3b8",
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: "Actual Extracted (MT)",
                        data: targetData.actuals.length ? targetData.actuals : [0],
                        backgroundColor: "rgba(245, 158, 11, 0.8)",
                        borderColor: "#f59e0b",
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top", labels: { color: "#f1f5f9", font: { size: 11 } } } },
                scales: {
                    x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
                    y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } }
                }
            }
        });
    }

    renderSafetyChart(safetyData) {
        const ctx = document.getElementById("chart-safety-kpi");
        if (!ctx) return;
        if (this.safetyChart) this.safetyChart.destroy();

        this.safetyChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: safetyData.labels.length ? safetyData.labels : ["No Safety Data"],
                datasets: [
                    {
                        label: "Fatal Accidents",
                        data: safetyData.fatal.length ? safetyData.fatal : [0],
                        backgroundColor: "rgba(239, 68, 68, 0.8)",
                        borderColor: "#ef4444",
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: "Serious Injuries",
                        data: safetyData.serious.length ? safetyData.serious : [0],
                        backgroundColor: "rgba(245, 158, 11, 0.7)",
                        borderColor: "#f59e0b",
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top", labels: { color: "#f1f5f9", font: { size: 11 } } } },
                scales: {
                    x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
                    y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8", precision: 0 } }
                }
            }
        });
    }

    renderSeverityChart(severityData) {
        const ctx = document.getElementById("chart-val-severity");
        if (!ctx) return;
        if (this.severityChart) this.severityChart.destroy();

        const labels = Object.keys(severityData).length ? Object.keys(severityData) : ["No Discrepancies"];
        const data = Object.values(severityData).length ? Object.values(severityData) : [1];

        this.severityChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        "rgba(239, 68, 68, 0.8)",  // High
                        "rgba(245, 158, 11, 0.8)", // Medium
                        "rgba(59, 130, 246, 0.8)"  // Low
                    ],
                    borderColor: "#0f1a33",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "right", labels: { color: "#f1f5f9", font: { size: 11 } } } }
            }
        });
    }

    async loadKpiFramework() {
        const container = document.getElementById("kpi-framework-table-body");
        if (!container) return;

        try {
            const data = await window.app.fetchApi("/api/analytics/kpi-framework");
            const kpis = data.kpi_framework ? data.kpi_framework.kpis : [];

            if (!kpis.length) {
                container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-slate-500">No KPI framework data loaded.</td></tr>`;
                return;
            }

            container.innerHTML = kpis.map(k => {
                const isMeasured = k.status === "MEASURED";
                const typeBadge = {
                    "REAL-WORLD": "badge-emerald",
                    "CONTROLLED TEST": "badge-blue",
                    "SYNTHETIC EVALUATION": "badge-purple",
                    "NOT YET MEASURED": "badge-amber"
                }[k.measurement_type] || "badge-blue";

                const statusBadge = {
                    "MEASURED": "badge-emerald",
                    "TARGET ONLY": "badge-amber",
                    "INSUFFICIENT DATA": "badge-rose"
                }[k.status] || "badge-blue";

                return `
                    <tr class="border-b border-slate-800/60 hover:bg-slate-800/30">
                        <td class="px-3 py-2.5">
                            <span class="font-mono text-xs text-amber-400 font-bold">${k.kpi_id}</span>
                            <div class="text-xs text-white font-medium mt-0.5">${k.name}</div>
                        </td>
                        <td class="px-3 py-2.5">
                            <div class="font-mono text-xs text-sky-400">${k.formula}</div>
                            <div class="text-2xs text-slate-400 mt-0.5">${k.definition || ''}</div>
                        </td>
                        <td class="px-3 py-2.5 font-mono text-xs text-slate-300">
                            <div>${k.target_benchmark}</div>
                            <div class="text-3xs text-slate-500 mt-0.5">${k.target_type || ''}</div>
                        </td>
                        <td class="px-3 py-2.5 font-mono text-xs ${isMeasured ? 'font-bold text-emerald-400' : 'text-amber-400 italic'}">
                            ${k.formatted_result || k.measured_result || 'Not yet measured.'}
                        </td>
                        <td class="px-3 py-2.5 text-xs text-slate-400">
                            <div class="text-slate-300 font-medium">${k.sample_size}</div>
                            <div class="text-3xs text-slate-500 mt-0.5">${k.data_source || ''}</div>
                        </td>
                        <td class="px-3 py-2.5 text-xs">
                            <span class="badge ${typeBadge} text-2xs">${k.measurement_type}</span>
                        </td>
                        <td class="px-3 py-2.5 text-xs">
                            <span class="badge ${statusBadge} text-2xs">${k.status}</span>
                        </td>
                    </tr>
                `;
            }).join("");
        } catch (e) {
            console.error("Failed to load KPI framework:", e);
        }
    }
}

// Global analytics instance
window.analyticsDashboard = new AnalyticsDashboard();
