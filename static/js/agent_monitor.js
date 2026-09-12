/**
 * Multi-Agent Observability, DAG Inspection & Governance Monitor for SIH26023.
 * Renders live status for all 8 agents, interactive DAG task visualizations,
 * retry/timeout tracking, Quality Gate decisions, and Human-in-the-Loop controls.
 */

class AgentMonitor {
    constructor() {
        this.init();
    }

    init() {
        // Auto-attach any demo runner buttons if present
        const demoBtn = document.getElementById("btn-run-rajmahal-demo");
        if (demoBtn) {
            demoBtn.addEventListener("click", () => this.runRajmahalDemo());
        }
    }

    loadAgentsAndWorkflows() {
        this.loadAgentRegistry();
        this.loadWorkflows();
    }

    async loadAgentRegistry() {
        const container = document.getElementById("agent-registry-grid");
        if (!container) return;

        try {
            const data = await window.app.fetchApi("/api/agents/status");
            if (!data.agents || data.agents.length === 0) {
                container.innerHTML = `<div class="text-xs text-slate-500 py-3">No agents registered.</div>`;
                return;
            }

            container.innerHTML = `
                <div class="grid-4col gap-4">
                    ${data.agents.map((a, idx) => `
                        <div class="p-4 bg-slate-900/90 border border-slate-800 rounded-lg shadow-sm hover:border-slate-700 transition-all">
                            <div class="flex justify-between items-center mb-2">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-xs font-mono font-bold text-amber-400">#${idx + 1}</span>
                                    <span class="font-bold text-white text-sm">${a.name}</span>
                                </div>
                                <span class="badge ${a.status === 'IDLE' ? 'badge-emerald' : (a.status === 'BUSY' ? 'badge-amber' : 'badge-rose')}">${a.status}</span>
                            </div>
                            <p class="text-xs text-slate-400 mb-3 line-clamp-2">${a.description}</p>
                            <div class="mb-3">
                                <span class="text-xs font-bold text-slate-500 block mb-1">CORE CAPABILITIES:</span>
                                <div class="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                                    ${a.capabilities.slice(0, 4).map(c => `<span class="badge badge-blue text-xs">${c}</span>`).join("")}
                                    ${a.capabilities.length > 4 ? `<span class="text-xs text-slate-500 font-mono">+${a.capabilities.length - 4} more</span>` : ''}
                                </div>
                            </div>
                            <div class="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                                <span>Tasks: <strong class="text-white">${a.tasks_processed}</strong></span>
                                <span>Errors: <strong class="${a.errors > 0 ? 'text-rose' : 'text-emerald-400'}">${a.errors}</strong></span>
                            </div>
                        </div>
                    `).join("")}
                </div>
            `;
        } catch (e) {
            console.error("Failed to load agent registry:", e);
            if (container) container.innerHTML = `<div class="p-4 text-rose text-xs">Error loading agent registry: ${e.message}</div>`;
        }
    }

    async loadWorkflows() {
        const tbody = document.getElementById("workflows-tbody");
        if (!tbody) return;

        try {
            const data = await window.app.fetchApi("/api/agents/workflows?limit=30");
            if (!data.workflows || data.workflows.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-slate-400">No multi-agent workflows recorded yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.workflows.map(wf => {
                let statusBadge = "badge-amber";
                if (wf.status === "COMPLETED") statusBadge = "badge-emerald";
                else if (wf.status === "FAILED" || wf.status === "REJECTED") statusBadge = "badge-rose";
                else if (wf.status === "PAUSED" || wf.status === "REQUIRES_HUMAN_REVIEW") statusBadge = "badge-amber";

                let qualityBadge = "";
                if (wf.quality_decision) {
                    const qCls = wf.quality_decision === "PASS" ? "badge-emerald" : (wf.quality_decision === "WARNING" ? "badge-amber" : "badge-rose");
                    qualityBadge = `<span class="badge ${qCls}">${wf.quality_decision}</span>`;
                } else {
                    qualityBadge = `<span class="text-slate-500 text-xs">-</span>`;
                }

                return `
                    <tr>
                        <td class="font-mono text-xs text-amber-400">${wf.id}</td>
                        <td><span class="badge badge-blue">${wf.workflow_type}</span></td>
                        <td class="text-xs text-slate-300 max-w-xs truncate">${wf.initial_prompt ? wf.initial_prompt.substring(0, 75) + '...' : '-'}</td>
                        <td><span class="badge ${statusBadge}">${wf.status}</span></td>
                        <td>${qualityBadge}</td>
                        <td class="text-xs text-slate-400">${wf.start_time}</td>
                        <td>
                            <div class="flex gap-1.5">
                                <button class="btn btn-xs btn-outline" onclick="window.agentMonitor.inspectWorkflow('${wf.id}')">Inspect DAG</button>
                                ${wf.status === 'PAUSED' || wf.status === 'REQUIRES_HUMAN_REVIEW' ? `
                                    <button class="btn btn-xs btn-primary" onclick="window.agentMonitor.openResumeDialog('${wf.id}')">Resume</button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        } catch (e) {
            console.error("Failed to load workflows:", e);
        }
    }

    async inspectWorkflow(workflowId) {
        const modal = document.getElementById("modal-workflow-detail");
        const body = document.getElementById("wf-modal-body");
        const title = document.getElementById("wf-modal-title");

        modal.classList.add("active");
        body.innerHTML = `<div class="p-8 text-center text-slate-400"><div class="loading-spinner mb-2"></div>Loading 8-agent execution provenance DAG...</div>`;

        try {
            const data = await window.app.fetchApi(`/api/agents/workflows/${workflowId}`);
            const wf = data.workflow;
            title.innerText = `8-Agent Workflow DAG: ${wf.workflow_type} [${wf.id}]`;

            // 1. Quality Gate Decision Banner
            let qualityGateHtml = "";
            if (data.quality_report && data.quality_report.decision) {
                const dec = data.quality_report.decision;
                const bannerCls = dec === "PASS" ? "bg-emerald-950/30 border-emerald-800 text-emerald-300" : (dec === "WARNING" ? "bg-amber-950/30 border-amber-800 text-amber-300" : "bg-rose-950/30 border-rose-800 text-rose-300");
                qualityGateHtml = `
                    <div class="p-4 rounded-lg border mb-4 ${bannerCls}">
                        <div class="flex justify-between items-center mb-2">
                            <div class="font-bold flex items-center gap-2">
                                <span class="badge ${dec === 'PASS' ? 'badge-emerald' : (dec === 'WARNING' ? 'badge-amber' : 'badge-rose')}">QUALITY GATE: ${dec}</span>
                                <span>Agent 8 (QualityGovernanceAgent) Release Evaluation</span>
                            </div>
                            <span class="text-xs font-mono">${data.quality_report.summary || ''}</span>
                        </div>
                        <div class="grid-2col gap-3 text-xs mt-2 pt-2 border-t border-slate-800/60">
                            <div>
                                <span class="font-bold block text-slate-400 mb-1">CHECKS PASSED:</span>
                                <ul class="list-disc list-inside space-y-0.5 text-slate-300">
                                    ${(data.quality_report.checks_passed || []).map(c => `<li>${c}</li>`).join("")}
                                </ul>
                            </div>
                            <div>
                                <span class="font-bold block text-slate-400 mb-1">VIOLATIONS / ADVISORIES:</span>
                                <ul class="list-disc list-inside space-y-0.5 text-slate-300">
                                    ${(data.quality_report.violations || []).map(v => `<li class="text-rose">${v}</li>`).join("")}
                                    ${(data.quality_report.warnings || []).map(w => `<li class="text-amber-300">${w}</li>`).join("")}
                                    ${(!data.quality_report.violations?.length && !data.quality_report.warnings?.length) ? '<li class="text-emerald-400">Zero violations flagged.</li>' : ''}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            }

            // 2. Interactive Task DAG Pipeline
            const tasksHtml = data.tasks && data.tasks.length > 0 ? `
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400">Orchestrated Task Dependency Graph (${data.tasks_count} Tasks)</h4>
                        <span class="text-xs text-slate-500 font-mono">Dependency-Aware Parallel Branches</span>
                    </div>
                    <div class="space-y-2">
                        ${data.tasks.map((t, idx) => {
                            const isParallel = t.dependencies && t.dependencies.length === 0 && idx > 0;
                            return `
                                <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                                    <div class="flex justify-between items-center font-bold text-white mb-1">
                                        <div class="flex items-center gap-2">
                                            <span class="font-mono text-amber-400">${t.task_id}</span>
                                            <span class="text-slate-400">&bull;</span>
                                            <span>${t.source_agent} &rarr; <span class="text-amber-300">${t.destination_agent}</span></span>
                                            <span class="badge badge-blue font-mono">${t.task_type}</span>
                                            ${isParallel ? '<span class="badge badge-purple">PARALLEL BRANCH</span>' : ''}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            ${t.retry_count > 0 ? `<span class="badge badge-amber">Retries: ${t.retry_count}</span>` : ''}
                                            <span class="badge ${t.status === 'COMPLETED' || t.status === 'SUCCESS' ? 'badge-emerald' : (t.status === 'RUNNING' ? 'badge-amber' : 'badge-rose')}">${t.status}</span>
                                        </div>
                                    </div>
                                    <div class="flex justify-between text-slate-400 text-xs mt-2 pt-1 border-t border-slate-800/60 font-mono">
                                        <span>Dependencies: ${t.dependencies?.length ? t.dependencies.join(", ") : 'None (Independent)'}</span>
                                        <span>Timeout: ${t.timeout_seconds || 30}s</span>
                                    </div>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>
            ` : `<div class="text-xs text-slate-500 italic">No sub-tasks.</div>`;

            // 3. Provenance Trail Log
            const provenanceHtml = data.provenance_log && data.provenance_log.length > 0 ? `
                <div>
                    <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Immutable Provenance & Action Audit Trail</h4>
                    <div class="space-y-1 max-h-56 overflow-y-auto bg-slate-950 p-2 rounded border border-slate-800">
                        ${data.provenance_log.map(p => `
                            <div class="p-1.5 bg-slate-900/60 rounded text-xs border border-slate-800/80 flex justify-between">
                                <div><strong class="text-amber-300">[${p.agent}]</strong> <span class="text-slate-300">${p.action}</span></div>
                                <span class="text-slate-500 font-mono">${new Date(p.timestamp * 1000).toLocaleTimeString()}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            ` : `<div class="text-xs text-slate-500 italic">No provenance log.</div>`;

            body.innerHTML = `
                <div class="p-3 bg-slate-900/80 rounded border border-slate-800 mb-4 text-xs">
                    <div class="flex justify-between items-center">
                        <div><strong>Goal:</strong> <span class="text-white">${wf.initial_prompt || '-'}</span></div>
                        <div><strong>Started:</strong> <span class="text-slate-300 font-mono">${wf.start_time}</span></div>
                    </div>
                </div>
                ${qualityGateHtml}
                ${tasksHtml}
                ${provenanceHtml}
            `;
        } catch (e) {
            body.innerHTML = `<div class="p-6 text-rose text-center">Failed to load workflow DAG: ${e.message}</div>`;
        }
    }

    openResumeDialog(workflowId) {
        const reviewer = prompt("Enter Reviewing Officer Name:", "Dr. S. K. Verma (Chief Geologist)");
        if (!reviewer) return;
        const note = prompt("Enter Sign-off / Verification Note:", "Cross-document discrepancy inspected against borehole logs. Approved.");
        if (!note) return;

        this.resumeWorkflow(workflowId, reviewer, note);
    }

    async resumeWorkflow(workflowId, reviewer, note) {
        try {
            const data = await window.app.fetchApi(`/api/agents/workflows/${workflowId}/resume`, {
                method: "POST",
                body: { reviewer: reviewer, reviewer_note: note }
            });
            alert(data.message || "Workflow resumed successfully.");
            this.loadWorkflows();
        } catch (e) {
            alert(`Error resuming workflow: ${e.message}`);
        }
    }

    async runRajmahalDemo() {
        const traceContainer = document.getElementById("agent-live-trace");
        if (traceContainer) {
            traceContainer.innerHTML = `<div class="p-4 text-amber-300 text-xs font-mono animate-pulse">Executing 8-Agent Rajmahal Discrepancy Multi-Agent Workflow...</div>`;
        }

        try {
            const data = await window.app.fetchApi("/api/agents/workflows", {
                method: "POST",
                body: {
                    intent: "DISCREPANCY_INVESTIGATION",
                    query: "Rajmahal production discrepancy across available monthly reports"
                }
            });

            this.loadWorkflows();
            if (data.result && data.result.workflow) {
                this.inspectWorkflow(data.result.workflow.workflow_id);
            }
        } catch (e) {
            alert(`Demo failed: ${e.message}`);
        }
    }
}

// Global agent monitor instance
window.agentMonitor = new AgentMonitor();
