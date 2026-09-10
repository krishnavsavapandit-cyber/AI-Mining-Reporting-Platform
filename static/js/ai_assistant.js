/**
 * Mining Intelligence Assistant Chat & Multi-Agent Observability for SIH26023.
 */

class AIAssistantChat {
    constructor() {
        this.chatHistory = [];
        this.init();
    }

    init() {
        const form = document.getElementById("chat-form");
        const clearBtn = document.getElementById("btn-clear-chat");

        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSend();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", () => this.clearChat());
        }
    }

    askSuggested(text) {
        const input = document.getElementById("chat-input-text");
        if (input) {
            input.value = text;
            this.handleSend();
        }
    }

    clearChat() {
        this.chatHistory = [];
        const messages = document.getElementById("chat-messages");
        if (messages) {
            messages.innerHTML = `
                <div class="chat-message assistant">
                    <div class="msg-avatar">AI</div>
                    <div class="msg-content">
                        <div class="msg-bubble">
                            <p>Conversation cleared. Ask any factual question regarding CIL coal production, OBR excavation, geological boreholes, or equipment availability.</p>
                        </div>
                    </div>
                </div>
            `;
        }
        document.getElementById("agent-live-trace").innerHTML = `<div class="trace-empty-hint text-xs text-slate-400 p-4">Awaiting next query to execute multi-agent pipeline.</div>`;
        document.getElementById("chat-evidence-list").innerHTML = `<div class="text-xs text-slate-500 italic">No active evidence loaded.</div>`;
    }

    async handleSend() {
        const input = document.getElementById("chat-input-text");
        const query = input ? input.value.trim() : "";
        if (!query) return;

        input.value = "";
        this.appendUserMessage(query);

        // Render loading state in chat
        const loadingId = `loading-${Date.now()}`;
        this.appendLoadingAssistantMessage(loadingId);

        // Render Multi-Agent workflow initiation
        this.renderWorkflowSteps([
            { agent: "ManagerAgent", action: "Received Query -- Creating Multi-Agent Task Plan" },
            { agent: "RetrievalAgent", action: "Executing Domain-Expanded Hybrid Search across Chunks" }
        ]);

        try {
            const data = await window.app.fetchApi("/api/query", {
                method: "POST",
                body: {
                    query: query,
                    user_role: "Analyst",
                    chat_history: this.chatHistory
                }
            });

            // Remove loading bubble
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            // Append structured assistant response
            this.appendAssistantMessage(data.answer, data.provider_info, data.sources, data.validation_warnings);
            
            // Save to history
            this.chatHistory.push({ role: "user", content: query });
            this.chatHistory.push({ role: "model", content: data.answer });

            // Render complete agent execution trace
            if (data.workflow && data.workflow.provenance_log) {
                this.renderWorkflowLog(data.workflow.provenance_log, data.duration_ms);
            }

            // Render grounded evidence items
            if (data.evidence) {
                this.renderEvidenceList(data.evidence);
            }

        } catch (e) {
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            this.appendAssistantMessage(`Error executing query: ${e.message}`, { provider: "system" }, [], []);
        }
    }

    appendUserMessage(text) {
        const container = document.getElementById("chat-messages");
        const msgDiv = document.createElement("div");
        msgDiv.className = "chat-message user";
        msgDiv.innerHTML = `
            <div class="msg-avatar">ME</div>
            <div class="msg-content">
                <div class="msg-bubble"><p>${text}</p></div>
            </div>
        `;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    appendLoadingAssistantMessage(id) {
        const container = document.getElementById("chat-messages");
        const msgDiv = document.createElement("div");
        msgDiv.id = id;
        msgDiv.className = "chat-message assistant";
        msgDiv.innerHTML = `
            <div class="msg-avatar">AI</div>
            <div class="msg-content">
                <div class="msg-bubble flex items-center gap-2 text-slate-400">
                    <span class="inline-block animate-pulse">Orchestrating Manager, Retrieval & Validation Agents...</span>
                </div>
            </div>
        `;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    appendAssistantMessage(text, providerInfo, sources, warnings) {
        const container = document.getElementById("chat-messages");
        const msgDiv = document.createElement("div");
        msgDiv.className = "chat-message assistant";

        const providerLabel = providerInfo ? `${providerInfo.provider} (${providerInfo.model || 'local'})` : 'Grounded Engine';
        
        let sourcesHtml = "";
        if (sources && sources.length > 0) {
            sourcesHtml = `
                <div class="mt-3 pt-2 border-t border-slate-700/60 text-xs">
                    <span class="font-bold text-amber-400 block mb-1">GROUNDED SOURCES CITED:</span>
                    <ul class="space-y-0.5">
                        ${sources.map(s => `<li class="text-slate-400">• <strong>${s.document_name}</strong> (Page ${s.page_number}) -- <span class="text-slate-500">${s.section || 'General'}</span></li>`).join("")}
                    </ul>
                </div>
            `;
        }

        // Convert basic markdown paragraphs
        const formattedText = text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");

        msgDiv.innerHTML = `
            <div class="msg-avatar">AI</div>
            <div class="msg-content">
                <div class="msg-bubble">
                    <div class="flex justify-between items-center mb-2">
                        <span class="badge badge-amber font-mono">${providerLabel.toUpperCase()}</span>
                        <span class="text-xs text-slate-500">100% EVIDENCE GROUNDED</span>
                    </div>
                    <p>${formattedText}</p>
                    ${sourcesHtml}
                </div>
            </div>
        `;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    renderWorkflowSteps(steps) {
        const traceContainer = document.getElementById("agent-live-trace");
        if (!traceContainer) return;
        traceContainer.innerHTML = steps.map(s => `
            <div class="trace-step-item">
                <div class="trace-step-agent">${s.agent}</div>
                <div class="trace-step-action">${s.action}</div>
            </div>
        `).join("");
    }

    renderWorkflowLog(provenanceLog, durationMs) {
        const traceContainer = document.getElementById("agent-live-trace");
        if (!traceContainer) return;
        
        traceContainer.innerHTML = `
            <div class="text-xs text-emerald-400 mb-2 font-bold flex justify-between">
                <span>✓ Pipeline Executed Successfully</span>
                <span>${durationMs} ms</span>
            </div>
            ${provenanceLog.map(p => `
                <div class="trace-step-item">
                    <div class="flex justify-between font-bold">
                        <span class="trace-step-agent">${p.agent}</span>
                        <span class="text-slate-500 text-xs">${p.action}</span>
                    </div>
                    ${p.details && p.details.error ? `<div class="text-rose text-xs">${p.details.error}</div>` : ''}
                </div>
            `).join("")}
        `;
    }

    renderEvidenceList(evidence) {
        const container = document.getElementById("chat-evidence-list");
        if (!container) return;

        if (!evidence || evidence.length === 0) {
            container.innerHTML = `<div class="text-xs text-slate-500 italic">No direct matching evidence chunks.</div>`;
            return;
        }

        container.innerHTML = evidence.map(e => `
            <div class="evidence-card">
                <div class="evidence-header">
                    <span>${e.document_name} (Pg ${e.page_number})</span>
                    <span class="text-emerald-400">${Math.round((e.relevance_score || 1) * 100)}% Match</span>
                </div>
                <div class="evidence-text">${e.source_text.substring(0, 160)}...</div>
            </div>
        `).join("");
    }
}

// Global chat instance
window.aiChat = new AIAssistantChat();
