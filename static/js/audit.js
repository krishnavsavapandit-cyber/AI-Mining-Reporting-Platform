/**
 * Audit Logging & Compliance Controller for SIH26023.
 */

class AuditManager {
    constructor() {
        this.init();
    }

    init() {
        const filter = document.getElementById("audit-action-filter");
        if (filter) filter.addEventListener("change", () => this.loadLogs());
    }

    async loadLogs() {
        const tbody = document.getElementById("audit-tbody");
        if (!tbody) return;

        const action = document.getElementById("audit-action-filter")?.value || "";

        try {
            const data = await window.app.fetchApi(`/api/audit?action=${encodeURIComponent(action)}&limit=50`);
            if (!data.logs || data.logs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-slate-400">No audit logs found.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.logs.map(log => {
                let detailsText = log.details_json || "";
                if (detailsText.length > 90) detailsText = detailsText.substring(0, 85) + "...";

                return `
                    <tr>
                        <td class="text-xs text-slate-400 font-mono">${log.timestamp}</td>
                        <td><span class="badge badge-amber font-mono">${log.action_type}</span></td>
                        <td>${log.user_role || 'Analyst'}</td>
                        <td class="text-xs text-slate-300">${log.resource_type || '-'}${log.resource_id ? ` (#${log.resource_id})` : ''}</td>
                        <td class="text-xs text-slate-400 font-mono">${detailsText}</td>
                        <td class="text-xs text-slate-500 font-mono">${log.ip_address || '127.0.0.1'}</td>
                    </tr>
                `;
            }).join("");
        } catch (e) {
            console.error("Failed to load audit logs:", e);
        }
    }
}

// Global audit manager
window.auditManager = new AuditManager();
