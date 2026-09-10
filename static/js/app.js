/**
 * Core Application Controller for SIH26023 Mining Platform.
 * Manages routing, navigation, modals, notifications, and global state.
 */

class AppController {
    constructor() {
        this.activeTab = "dashboard";
        window.currentUserRole = localStorage.getItem("cil_user_role") || "ANALYST";
        this.init();
    }

    init() {
        this.bindNavigation();
        this.bindGlobalModals();
        this.bindSeedButton();
        this.bindRoleSelector();
        this.loadInitialSettings();
        
        // Handle hash navigation
        window.addEventListener("hashchange", () => {
            const hash = window.location.hash.replace("#", "") || "dashboard";
            this.switchTab(hash);
        });

        const initialHash = window.location.hash.replace("#", "") || "dashboard";
        this.switchTab(initialHash);
    }

    bindRoleSelector() {
        const selector = document.getElementById("user-role-selector");
        const avatar = document.getElementById("current-user-avatar");
        if (selector) {
            selector.value = window.currentUserRole;
            const updateAvatar = (role) => {
                if (avatar) {
                    const initials = { ADMIN: "AD", OFFICER: "RO", ANALYST: "MA", VIEWER: "VI" };
                    avatar.innerText = initials[role] || "AO";
                }
            };
            updateAvatar(window.currentUserRole);

            selector.addEventListener("change", (e) => {
                window.currentUserRole = e.target.value;
                localStorage.setItem("cil_user_role", window.currentUserRole);
                updateAvatar(window.currentUserRole);
                this.showToast(`Switched active session role to: ${window.currentUserRole}`, "info");
            });
        }
    }

    bindNavigation() {
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", (e) => {
                const tab = link.getAttribute("data-tab");
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        
        // Update nav links
        document.querySelectorAll(".nav-link").forEach(l => {
            if (l.getAttribute("data-tab") === tabId) {
                l.classList.add("active");
            } else {
                l.classList.remove("active");
            }
        });

        // Update tab panes
        document.querySelectorAll(".tab-pane").forEach(p => {
            p.classList.remove("active");
        });
        
        const targetPane = document.getElementById(`tab-${tabId}`);
        if (targetPane) {
            targetPane.classList.add("active");
        }

        // Update title and subtitles
        this.updateHeaderTitle(tabId);

        // Trigger tab-specific refresh
        this.triggerTabRefresh(tabId);
    }

    updateHeaderTitle(tabId) {
        const titleEl = document.getElementById("page-title");
        const subEl = document.getElementById("page-subtitle");
        
        const titles = {
            "dashboard": ["Executive Dashboard", "Central Mine Planning and Design Institute (CMPDI) Intelligence Suite"],
            "documents": ["Document Center", "Multi-Format Ingestion, OCR & Extraction Repository"],
            "search": ["Semantic Search Engine", "Hybrid Keyword + Vector Cosine Retrieval across CIL Archives"],
            "assistant": ["Mining Intelligence Assistant", "Evidence-Grounded Conversational RAG with Multi-Agent Orchestration"],
            "reports": ["Automated Report Generator", "Executive Summaries, Tabular Figures & Multi-Format PDF/DOCX Exports"],
            "inquiries": ["Parliamentary & Ministry Inquiries", "Evidence-Backed Draft Answers with Mandatory Verification Badges"],
            "validation": ["Cross-Document Validation Matrix", "Numerical Inconsistency & Discrepancy Detection Engine"],
            "topics": ["Topics & Word Cloud", "Unsupervised Mining Topic Discovery & Term Frequency Canvas"],
            "analytics": ["Mining Analytics Dashboard", "Empirical Coal Production, Target vs Actual & Safety KPIs"],
            "agents": ["Multi-Agent Observability", "Registry Health, Task Stream & Provenance Execution Graphs"],
            "audit": ["Compliance Audit Trail", "System Activity, Security & Governance Event Logs"],
            "settings": ["Platform Settings & AI Engine", "AI Provider Selection, Model Fallbacks & Data Seeder"],
            "help": ["Help & Training Center", "Operational Manual, Grounding Protocols, Semantic Tags & HITL Guidelines"]
        };

        if (titles[tabId]) {
            titleEl.innerText = titles[tabId][0];
            subEl.innerText = titles[tabId][1];
        }
    }

    triggerTabRefresh(tabId) {
        if (tabId === "dashboard" && window.dashboard) window.dashboard.loadSummary();
        if (tabId === "documents" && window.docManager) window.docManager.loadDocuments();
        if (tabId === "reports" && window.reportManager) window.reportManager.loadReports();
        if (tabId === "inquiries" && window.inquiryManager) window.inquiryManager.loadInquiries();
        if (tabId === "validation" && window.validationManager) window.validationManager.loadIssues();
        if (tabId === "topics" && window.topicManager) window.topicManager.loadTopicsAndCloud();
        if (tabId === "analytics" && window.analyticsDashboard) {
            window.analyticsDashboard.loadCharts();
            window.analyticsDashboard.loadKpiFramework();
        }
        if (tabId === "agents" && window.agentMonitor) window.agentMonitor.loadAgentsAndWorkflows();
        if (tabId === "audit" && window.auditManager) window.auditManager.loadLogs();
    }

    bindGlobalModals() {
        // Close modal handlers
        document.querySelectorAll("[data-close-modal]").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".modal").forEach(m => m.classList.remove("active"));
            });
        });

        // Trigger upload modal
        const uploadTrigger = document.getElementById("btn-upload-modal-trigger");
        if (uploadTrigger) {
            uploadTrigger.addEventListener("click", () => {
                document.getElementById("modal-upload").classList.add("active");
            });
        }
    }

    bindSeedButton() {
        const seedBtn = document.getElementById("btn-quick-seed");
        const settingsSeedBtn = document.getElementById("btn-settings-seed");

        const handleSeed = async () => {
            this.showToast("Seeding synthetic demonstration documents through Manager Agent...", "info");
            try {
                const res = await this.fetchApi("/api/settings/seed", { method: "POST" });
                if (res.status === "success") {
                    this.showToast(res.message, "success");
                    this.triggerTabRefresh(this.activeTab);
                    if (window.dashboard) window.dashboard.loadSummary();
                } else {
                    this.showToast(res.message || "Failed to seed demo data", "error");
                }
            } catch (e) {
                this.showToast(`Seeding error: ${e.message}`, "error");
            }
        };

        if (seedBtn) seedBtn.addEventListener("click", handleSeed);
        if (settingsSeedBtn) settingsSeedBtn.addEventListener("click", handleSeed);
    }

    async loadInitialSettings() {
        try {
            const data = await this.fetchApi("/api/settings");
            if (data && data.ai) {
                const activeName = data.ai.preferred_provider === "gemini" && data.ai.providers.gemini.configured
                    ? data.ai.providers.gemini.name
                    : (data.ai.fallback_provider === "open_model" && data.ai.providers.open_model.configured
                        ? data.ai.providers.open_model.name
                        : "Deterministic Grounded Engine");
                
                const nameEl = document.getElementById("provider-display-name");
                if (nameEl) nameEl.innerText = activeName;
            }
        } catch (e) {
            console.warn("Failed to load initial AI provider status", e);
        }
    }

    async fetchApi(url, options = {}) {
        const defaultHeaders = { 
            "Content-Type": "application/json",
            "X-User-Role": window.currentUserRole || "ANALYST"
        };
        if (options.body && options.body instanceof FormData) {
            delete defaultHeaders["Content-Type"];
        } else if (options.body && typeof options.body === "object") {
            options.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    showToast(message, type = "info") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(20px)";
            setTimeout(() => toast.remove(), 250);
        }, 4000);
    }
}

// Instantiate global app controller
window.app = new AppController();
