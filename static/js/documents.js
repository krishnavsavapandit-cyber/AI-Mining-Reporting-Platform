/**
 * Document Center Controller for SIH26023 Mining Platform.
 * Manages uploads, dropzone drag-and-drop, table filters, and detail inspection.
 */

class DocumentManager {
    constructor() {
        this.selectedFiles = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.bindDropzone();
    }

    bindEvents() {
        const refreshBtn = document.getElementById("btn-doc-refresh");
        if (refreshBtn) refreshBtn.addEventListener("click", () => this.loadDocuments());

        const subFilter = document.getElementById("doc-subsidiary-filter");
        if (subFilter) subFilter.addEventListener("change", () => this.loadDocuments());

        const statusFilter = document.getElementById("doc-status-filter");
        if (statusFilter) statusFilter.addEventListener("change", () => this.loadDocuments());

        const searchInput = document.getElementById("doc-search-input");
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener("input", () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => this.loadDocuments(), 300);
            });
        }

        const uploadOpenBtn = document.getElementById("btn-doc-upload-open");
        if (uploadOpenBtn) {
            uploadOpenBtn.addEventListener("click", () => {
                document.getElementById("modal-upload").classList.add("active");
            });
        }
    }

    bindDropzone() {
        const dropzone = document.getElementById("upload-dropzone");
        const fileInput = document.getElementById("file-input-hidden");
        const startUploadBtn = document.getElementById("btn-start-upload");

        if (!dropzone || !fileInput) return;

        dropzone.addEventListener("click", () => fileInput.click());

        dropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        });

        dropzone.addEventListener("dragleave", () => {
            dropzone.classList.remove("dragover");
        });

        dropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            if (e.dataTransfer.files.length) {
                this.handleFilesSelected(e.dataTransfer.files);
            }
        });

        fileInput.addEventListener("change", (e) => {
            if (e.target.files.length) {
                this.handleFilesSelected(e.target.files);
            }
        });

        if (startUploadBtn) {
            startUploadBtn.addEventListener("click", () => this.executeUpload());
        }
    }

    handleFilesSelected(files) {
        this.selectedFiles = Array.from(files);
        const listContainer = document.getElementById("selected-files-list");
        if (!listContainer) return;

        listContainer.innerHTML = this.selectedFiles.map((f, i) => `
            <div class="flex justify-between items-center p-2 mb-1 bg-slate-900 rounded text-xs border border-slate-800">
                <span class="font-medium text-slate-200">${f.name}</span>
                <span class="text-slate-400">(${(f.size / 1024).toFixed(1)} KB)</span>
            </div>
        `).join("");
    }

    async executeUpload() {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            window.app.showToast("Please select at least one file to upload.", "error");
            return;
        }

        const progressBar = document.getElementById("upload-progress");
        const progressFill = progressBar.querySelector(".progress-fill");
        progressBar.style.display = "block";
        progressFill.style.width = "40%";

        const formData = new FormData();
        this.selectedFiles.forEach(f => formData.append("files", f));

        try {
            window.app.showToast("Uploading and initiating DocumentIntelligenceAgent workflow...", "info");
            const res = await window.app.fetchApi("/api/documents/upload", {
                method: "POST",
                body: formData
            });

            progressFill.style.width = "100%";
            setTimeout(() => {
                progressBar.style.display = "none";
                document.getElementById("modal-upload").classList.remove("active");
                this.selectedFiles = [];
                document.getElementById("selected-files-list").innerHTML = "";
            }, 500);

            window.app.showToast(`Processed ${res.processed_count} documents successfully!`, "success");
            this.loadDocuments();
            if (window.dashboard) window.dashboard.loadSummary();
        } catch (e) {
            progressBar.style.display = "none";
            window.app.showToast(`Upload failed: ${e.message}`, "error");
        }
    }

    async loadDocuments() {
        const tbody = document.getElementById("documents-tbody");
        if (!tbody) return;

        const sub = document.getElementById("doc-subsidiary-filter")?.value || "";
        const status = document.getElementById("doc-status-filter")?.value || "";
        const search = document.getElementById("doc-search-input")?.value || "";

        try {
            const url = `/api/documents?subsidiary=${encodeURIComponent(sub)}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;
            const data = await window.app.fetchApi(url);

            if (!data.documents || data.documents.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-slate-400">No documents found matching the filter criteria.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.documents.map(d => `
                <tr>
                    <td class="font-bold text-white">${d.original_name}</td>
                    <td>${d.subsidiary || 'CIL'} ${d.mine ? `<span class="text-xs text-slate-400 block">${d.mine}</span>` : ''}</td>
                    <td>${d.reporting_period || 'N/A'}</td>
                    <td><span class="badge badge-blue">${(d.file_type || 'PDF').toUpperCase()}</span></td>
                    <td>${d.page_count}</td>
                    <td><span class="badge ${d.status === 'PROCESSED' ? 'badge-emerald' : 'badge-rose'}">${d.status}</span></td>
                    <td class="text-xs text-slate-400">${d.created_at}</td>
                    <td>
                        <div class="flex gap-2">
                            <button class="btn btn-xs btn-outline" onclick="window.docManager.inspectDocument(${d.id})">Inspect</button>
                            <button class="btn btn-xs btn-secondary" onclick="window.docManager.reprocessDocument(${d.id})">Reprocess</button>
                            <button class="btn btn-xs btn-outline text-rose" onclick="window.docManager.deleteDocument(${d.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join("");
        } catch (e) {
            console.error("Failed to load documents:", e);
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-rose">Error loading documents: ${e.message}</td></tr>`;
        }
    }

    async inspectDocument(docId) {
        const modal = document.getElementById("modal-doc-detail");
        const titleEl = document.getElementById("doc-detail-title");
        const bodyEl = document.getElementById("doc-detail-body");

        modal.classList.add("active");
        bodyEl.innerHTML = `<div class="loading-spinner p-6 text-center text-slate-400">Loading document provenance and extracted facts...</div>`;

        try {
            const data = await window.app.fetchApi(`/api/documents/${docId}`);
            const d = data.document;
            titleEl.innerText = `Document Inspection: ${d.original_name}`;

            const ocrBadgeHtml = data.ocr_info && data.ocr_info.ocr_performed ? `
                <div class="p-2.5 bg-slate-900 border border-amber-600/30 rounded-lg mb-4 text-xs">
                    <div class="flex items-center justify-between">
                        <span class="font-bold text-amber-300">OCR Engine: ${data.ocr_info.primary_engine || 'Tesseract'}</span>
                        <span class="badge ${data.ocr_info.overall_quality === 'HIGH' ? 'badge-emerald' : (data.ocr_info.overall_quality === 'LOW' ? 'badge-amber' : 'badge-blue')}">Quality: ${data.ocr_info.overall_quality}</span>
                    </div>
                    <div class="text-slate-400 mt-1 flex gap-4">
                        <span>Pages Processed: ${data.ocr_info.pages_ocr_processed} / ${d.page_count}</span>
                        <span>Confidence: ${(data.ocr_info.average_confidence * 100).toFixed(0)}%</span>
                        ${data.ocr_info.human_review_required ? '<span class="text-amber-400 font-bold">⚠ Low-Confidence Pages Flagged</span>' : '<span class="text-emerald-400">✓ Verified Text Extraction</span>'}
                    </div>
                </div>
            ` : '';

            const recordsHtml = data.extracted_records && data.extracted_records.length > 0 ? `
                <div class="mb-4">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Extracted Structured Facts (${data.extracted_records_count})</h4>
                    <table class="data-table">
                        <thead><tr><th>Field</th><th>Extracted Value</th><th>Unit</th><th>Page</th><th>Source Excerpt</th></tr></thead>
                        <tbody>
                            ${data.extracted_records.map(r => `
                                <tr>
                                    <td class="font-bold">${r.field_name}</td>
                                    <td class="text-amber-400 font-medium">${r.raw_value}</td>
                                    <td>${r.unit || '-'}</td>
                                    <td>${r.page_number}</td>
                                    <td class="text-xs text-slate-400 font-mono">${r.source_excerpt || ''}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            ` : `<div class="text-xs text-slate-500 mb-4 italic">No structured tabular facts extracted.</div>`;

            const chunksHtml = data.chunks && data.chunks.length > 0 ? `
                <div>
                    <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Searchable Text Chunks (${data.chunks_count})</h4>
                    <div class="space-y-2 max-h-72 overflow-y-auto">
                        ${data.chunks.map(c => `
                            <div class="p-3 bg-slate-900 border border-slate-800 rounded text-xs">
                                <div class="flex justify-between font-bold text-slate-300 mb-1">
                                    <span>Chunk #${c.chunk_index} — Page ${c.page_number} ${c.ocr_engine ? `<span class="text-amber-400 font-mono text-xs ml-1">[OCR: ${c.ocr_engine}]</span>` : ''}</span>
                                    <span class="text-slate-500">${c.section_title}</span>
                                </div>
                                <p class="text-slate-400 leading-relaxed">${c.content}</p>
                            </div>
                        `).join("")}
                    </div>
                </div>
            ` : `<div class="text-xs text-slate-500 italic">No text chunks available.</div>`;

            bodyEl.innerHTML = `
                <div class="p-3 bg-slate-900/60 rounded border border-slate-800 mb-4 flex justify-between text-xs">
                    <div><strong>Subsidiary:</strong> ${d.subsidiary || 'CIL'}</div>
                    <div><strong>Mine:</strong> ${d.mine || 'N/A'}</div>
                    <div><strong>Reporting Period:</strong> ${d.reporting_period || 'N/A'}</div>
                    <div><strong>Pages:</strong> ${d.page_count}</div>
                    <div><strong>Status:</strong> <span class="badge ${d.status === 'PROCESSED' ? 'badge-emerald' : 'badge-rose'}">${d.status}</span></div>
                </div>
                ${ocrBadgeHtml}
                ${recordsHtml}
                ${chunksHtml}
            `;
        } catch (e) {
            bodyEl.innerHTML = `<div class="p-4 text-rose">Failed to load details: ${e.message}</div>`;
        }
    }

    async reprocessDocument(docId) {
        window.app.showToast(`Reprocessing document #${docId} via DocumentIntelligenceAgent...`, "info");
        try {
            await window.app.fetchApi(`/api/documents/${docId}/reprocess`, { method: "POST" });
            window.app.showToast("Document reprocessed and reindexed successfully!", "success");
            this.loadDocuments();
            if (window.dashboard) window.dashboard.loadSummary();
        } catch (e) {
            window.app.showToast(`Reprocessing failed: ${e.message}`, "error");
        }
    }

    async deleteDocument(docId) {
        if (!confirm("Are you sure you want to delete this document and all associated extracted records?")) return;

        try {
            await window.app.fetchApi(`/api/documents/${docId}`, { method: "DELETE" });
            window.app.showToast("Document deleted successfully", "success");
            this.loadDocuments();
            if (window.dashboard) window.dashboard.loadSummary();
        } catch (e) {
            window.app.showToast(`Delete failed: ${e.message}`, "error");
        }
    }
}

// Global document manager
window.docManager = new DocumentManager();
