/**
 * Semantic & Hybrid Search Controller for SIH26023.
 */

class SearchManager {
    constructor() {
        this.init();
    }

    init() {
        const searchBtn = document.getElementById("btn-execute-search");
        const searchInput = document.getElementById("main-search-input");

        if (searchBtn) searchBtn.addEventListener("click", () => this.executeSearch());
        if (searchInput) {
            searchInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") this.executeSearch();
            });
        }
    }

    async executeSearch() {
        const input = document.getElementById("main-search-input");
        const query = input ? input.value.trim() : "";
        if (!query) {
            window.app.showToast("Please enter a search query", "error");
            return;
        }

        const subRadio = document.querySelector('input[name="search_sub"]:checked');
        const subsidiary = subRadio ? subRadio.value : "";

        const container = document.getElementById("search-results-container");
        container.innerHTML = `<div class="text-center py-8 text-slate-400">Executing hybrid semantic vector and keyword retrieval...</div>`;

        try {
            const data = await window.app.fetchApi("/api/search", {
                method: "POST",
                body: { query: query, top_k: 12, subsidiary: subsidiary }
            });

            if (!data.results || data.results.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h4>No matching evidence found</h4>
                        <p>No document chunks matched your query '${query}'. Try broader terms or check that documents are processed.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="mb-4 flex justify-between items-center text-xs text-slate-400">
                    <div>Found <strong>${data.count}</strong> relevant document excerpts | Expanded query: <em>"${data.expanded_query}"</em></div>
                </div>
                <div class="space-y-3">
                    ${data.results.map(r => `
                        <div class="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="font-bold text-white">${r.document_name}</span>
                                    <span class="badge badge-amber">Page ${r.page_number}</span>
                                    <span class="text-xs text-slate-400 font-mono">${r.section_title}</span>
                                </div>
                                <span class="badge badge-emerald">Relevance: ${Math.round(r.relevance_score * 100)}%</span>
                            </div>
                            <p class="text-slate-300 text-sm leading-relaxed">${r.source_text}</p>
                            ${r.metadata && r.metadata.subsidiary ? `
                                <div class="mt-2 text-xs text-slate-500">Subsidiary: ${r.metadata.subsidiary} ${r.metadata.reporting_period ? `| Period: ${r.metadata.reporting_period}` : ''}</div>
                            ` : ''}
                        </div>
                    `).join("")}
                </div>
            `;
        } catch (e) {
            container.innerHTML = `<div class="p-4 text-rose text-center">Search error: ${e.message}</div>`;
        }
    }
}

// Global search manager
window.searchManager = new SearchManager();
