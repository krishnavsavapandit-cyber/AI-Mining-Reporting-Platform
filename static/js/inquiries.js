/**
 * Parliamentary & Ministry Inquiry Controller for SIH26023.
 */

class InquiryManager {
    constructor() {
        this.init();
    }

    init() {
        const genBtn = document.getElementById("btn-generate-inquiry");
        const sampleBtn = document.getElementById("btn-load-sample-inquiry");

        if (genBtn) genBtn.addEventListener("click", () => this.generateInquiryDraft());
        if (sampleBtn) sampleBtn.addEventListener("click", () => this.loadSampleQuestion());
    }

    loadSampleQuestion() {
        document.getElementById("inq-ref-input").value = "Lok Sabha Starred Question No. 142";
        document.getElementById("inq-body-input").value = "Ministry of Coal / Lok Sabha Secretariat";
        document.getElementById("inq-question-text").value = 
            "Will the Minister of COAL be pleased to state:\n" +
            "(a) The subsidiary-wise details of coal production targets versus actual achievements in ECL, BCCL, and SECL during May 2025;\n" +
            "(b) Whether any discrepancies were detected in reported production figures between mine pithead and annual dispatch summaries;\n" +
            "(c) The number of fatal and serious safety accidents recorded across CIL operational mines in the stated period; and\n" +
            "(d) The concrete remedial steps taken by the government to enhance HEMM availability and enforce DGMS safety standards?";
    }

    async generateInquiryDraft() {
        const ref = document.getElementById("inq-ref-input").value.trim() || "PARLIAMENTARY-REF-2026";
        const body = document.getElementById("inq-body-input").value.trim();
        const text = document.getElementById("inq-question-text").value.trim();

        if (!text) {
            window.app.showToast("Please enter the inquiry question text.", "error");
            return;
        }

        const displayContainer = document.getElementById("inquiry-draft-display");
        displayContainer.innerHTML = `<div class="p-6 bg-slate-900 rounded-lg border border-slate-800 text-center text-slate-400">Coordinating Manager Agent, Retrieval Agent, and Validation Agent to draft inquiry response...</div>`;

        window.app.showToast("Synthesizing evidence-grounded parliamentary draft response...", "info");

        try {
            const data = await window.app.fetchApi("/api/inquiries/generate", {
                method: "POST",
                body: {
                    inquiry_ref: ref,
                    ministry_body: body,
                    question_text: text
                }
            });

            window.app.showToast("Draft generated. Requires human verification.", "success");
            this.renderActiveDraft(data.inquiry);
            this.loadInquiries();
        } catch (e) {
            displayContainer.innerHTML = `<div class="p-4 text-rose">Error drafting inquiry response: ${e.message}</div>`;
        }
    }

    renderActiveDraft(inquiry) {
        const container = document.getElementById("inquiry-draft-display");
        if (!container) return;

        let warningsHtml = "";
        if (inquiry.validation_warnings && inquiry.validation_warnings.length > 0) {
            warningsHtml = `
                <div class="p-3 my-3 bg-amber-950/40 border border-amber-600/50 rounded text-amber-200 text-xs">
                    <strong>⚠ Validation Agent Flagged Potential Discrepancy:</strong>
                    <ul class="list-disc ml-5 mt-1">
                        ${inquiry.validation_warnings.map(w => `<li>${w}</li>`).join("")}
                    </ul>
                </div>
            `;
        }

        // Convert basic markdown paragraphs
        const formattedAnswer = inquiry.draft_response.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");

        container.innerHTML = `
            <div class="panel border-amber-500/40">
                <div class="panel-header flex justify-between items-center bg-amber-950/20 p-3 -m-5 mb-4 rounded-t-lg border-b border-amber-500/30">
                    <div class="flex items-center gap-2">
                        <span class="badge badge-amber font-bold">DRAFT -- REQUIRES HUMAN VERIFICATION</span>
                        <span class="text-xs text-white font-mono">${inquiry.inquiry_ref}</span>
                    </div>
                    ${!inquiry.human_approved ? `
                        <button class="btn btn-xs btn-primary" onclick="window.inquiryManager.approveInquiry(${inquiry.inquiry_id})">
                            <span>Officially Sign-off Draft</span>
                        </button>
                    ` : `<span class="badge badge-emerald">Signed-off by Authority</span>`}
                </div>
                ${warningsHtml}
                <div class="inquiry-body text-slate-200 text-sm leading-relaxed p-2">
                    ${formattedAnswer}
                </div>
            </div>
        `;
    }

    async loadInquiries() {
        const tbody = document.getElementById("inquiries-tbody");
        if (!tbody) return;

        try {
            const data = await window.app.fetchApi("/api/inquiries");
            if (!data.inquiries || data.inquiries.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-slate-400">No recorded inquiry drafts.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.inquiries.map(inq => `
                <tr>
                    <td class="font-bold font-mono text-white">${inq.inquiry_ref || 'REF'}</td>
                    <td>${inq.question_text ? inq.question_text.substring(0, 80) + '...' : ''}</td>
                    <td><span class="badge ${inq.human_approved ? 'badge-emerald' : 'badge-amber'}">${inq.status}</span></td>
                    <td>${inq.human_approved ? `Approved (${inq.approved_by || 'Officer'})` : '<span class="text-amber-400">Pending Review</span>'}</td>
                    <td class="text-xs text-slate-400">${inq.created_at}</td>
                    <td>
                        <button class="btn btn-xs btn-outline" onclick="window.inquiryManager.viewInquiry(${inq.id})">Inspect</button>
                    </td>
                </tr>
            `).join("");
        } catch (e) {
            console.error("Failed to load inquiries:", e);
        }
    }

    async viewInquiry(inquiryId) {
        try {
            const data = await window.app.fetchApi(`/api/inquiries/${inquiryId}`);
            if (data.inquiry) {
                this.renderActiveDraft({
                    inquiry_id: data.inquiry.id,
                    inquiry_ref: data.inquiry.inquiry_ref,
                    draft_response: data.inquiry.draft_response,
                    human_approved: data.inquiry.human_approved,
                    validation_warnings: data.inquiry.validation_notes ? data.inquiry.validation_notes.split("\n") : []
                });
                window.location.hash = "#inquiries";
            }
        } catch (e) {
            window.app.showToast(`Failed to view inquiry: ${e.message}`, "error");
        }
    }

    async approveInquiry(inquiryId) {
        try {
            await window.app.fetchApi(`/api/inquiries/${inquiryId}/approve`, {
                method: "POST",
                body: { approved_by: "Joint Secretary (Coal) / Competent Authority" }
            });
            window.app.showToast("Inquiry draft officially signed off and ready for parliamentary tabling.", "success");
            this.loadInquiries();
            this.viewInquiry(inquiryId);
        } catch (e) {
            window.app.showToast(`Approval failed: ${e.message}`, "error");
        }
    }
}

// Global inquiry manager
window.inquiryManager = new InquiryManager();
