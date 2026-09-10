/**
 * Multi-Agent Observability & Provenance Monitor for SIH26023.
 */

class AgentMonitor {
    constructor() {
        this.init();
    }

    init() {}

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
                <div class="grid-3col gap-4">
                    ${data.agents.map(a => `
                        <div class="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-bold text-white text-sm">${a.name}</span>
                                <span class="badge ${a.status === 'IDLE' ? 'badge-emerald' : 'badge-amber'}">${a.status}</span>
                            </div>
                            <p class="text-xs text-slate-400 mb-3">${a.description}</p>
                            <div class="mb-3">
                                <span class="text-xs font-bold text-slate-500 block mb-1">CAPABILITIES:</span>
                                <div class="flex flex-wrap gap-1">
                                    ${a.capabilities.map(c => `<span class="badge badge-blue text-xs">${c}</span>`).join("")}
                                </div>
                            </div>
                            <div class="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
                                <span>Tasks: <strong>${a.tasks_processed}</strong></span>
                                <span>Errors: <strong>${a.errors}</strong></span>
                            </div>
                        </div>
                    `).join("")}
                </div>
            `;
        } catch (e) {
            console.error("Failed to load agent registry:", e);
        }
    }

    async loadWorkflows() {
        const tbody = document.getElementById("workflows-tbody");
        if (!tbody) return;

        try {
            const data = await window.app.fetchApi("/api/agents/workflows?limit=30");
            if (!data.workflows || data.workflows.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-slate-400">No multi-agent workflows recorded yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.workflows.map(wf => `
                <tr>
                    <td class="font-mono text-xs text-amber-400">${wf.id}</td>
                    <td><span class="badge badge-blue">${wf.workflow_type}</span></td>
                    <td class="text-xs text-slate-300">${wf.initial_prompt ? wf.initial_prompt.substring(0, 80) + '...' : '-'}</td>
                    <td><span class="badge ${wf.status === 'COMPLETED' ? 'badge-emerald' : (wf.status === 'RUNNING' ? 'badge-amber' : 'badge-rose')}">${wf.status}</span></td>
                    <td class="text-xs text-slate-400">${wf.start_time}</td>
                    <td>
                        <button class="btn btn-xs btn-outline" onclick="window.agentMonitor.inspectWorkflow('${wf.id}')">View DAG</button>
                    </td>
                </tr>
            `).join("");
        } catch (e) {
            console.error("Failed to load workflows:", e);
        }
    }

    async inspectWorkflow(workflowId) {
        const modal = document.getElementById("modal-workflow-detail");
        const body = document.getElementById("wf-modal-body");
        const title = document.getElementById("wf-modal-title");

        modal.classList.add("active");
        body.innerHTML = `<div class="p-6 text-center text-slate-400">Loading multi-agent execution provenance graph...</div>`;

        try {
            const data = await window.app.fetchApi(`/api/agents/workflows/${workflowId}`);
            const wf = data.workflow;
            title.innerText = `Workflow DAG: ${wf.workflow_type} [${wf.id}]`;

            const tasksHtml = data.tasks && data.tasks.length > 0 ? `
                <div class="mb-4">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Dispatched Sub-Agent Tasks (${data.tasks_count})</h4>
                    <div class="space-y-2">
                        ${data.tasks.map(t => `
                            <div class="p-3 bg-slate-900 border border-slate-800 rounded text-xs">
                                <div class="flex justify-between font-bold text-white mb-1">
                                    <span>${t.source_agent} → <span class="text-amber-400">${t.destination_agent}</span> (${t.task_type})</span>
                                    <span class="badge badge-emerald">${t.status}</span>
                                </div>
                                <div class="text-slate-400 font-mono text-xs">Task ID: ${t.task_id}</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            ` : `<div class="text-xs text-slate-500 italic">No child tasks.</div>`;

            const provenanceHtml = data.provenance_log && data.provenance_log.length > 0 ? `
                <div>
                    <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Execution Provenance Trail</h4>
                    <div class="space-y-1 max-h-56 overflow-y-auto">
                        ${data.provenance_log.map(p => `
                            <div class="p-2 bg-slate-900/60 rounded text-xs border border-slate-800 flex justify-between">
                                <div><strong class="text-amber-300">[${p.agent}]</strong> <span class="text-slate-300">${p.action}</span></div>
                                <span class="text-slate-500 font-mono">${new Date(p.timestamp * 1000).toLocaleTimeString()}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            ` : `<div class="text-xs text-slate-500 italic">No provenance log.</div>`;

            body.innerHTML = `
                <div class="p-3 bg-slate-900/80 rounded border border-slate-800 mb-4 text-xs">
                    <div><strong>Goal:</strong> ${wf.initial_prompt || '-'}</div>
                    <div class="mt-1"><strong>Status:</strong> <span class="badge ${wf.status === 'COMPLETED' ? 'badge-emerald' : 'badge-rose'}">${wf.status}</span> | <strong>Started:</strong> ${wf.start_time}</div>
                </div>
                ${tasksHtml}
                ${provenanceHtml}
            `;
        } catch (e) {
            body.innerHTML = `<div class="p-4 text-rose">Failed to load workflow DAG: ${e.message}</div>`;
        }
    }
}

// Global agent monitor
window.agentMonitor = new AgentMonitor();
