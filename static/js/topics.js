/**
 * Topics & Word Cloud Canvas Controller for SIH26023.
 */

class TopicManager {
    constructor() {
        this.init();
    }

    init() {
        const subFilter = document.getElementById("wc-sub-filter");
        if (subFilter) {
            subFilter.addEventListener("change", () => this.loadWordCloud());
        }
    }

    loadTopicsAndCloud() {
        this.loadTopics();
        this.loadWordCloud();
    }

    async loadTopics() {
        const container = document.getElementById("topic-clusters-list");
        if (!container) return;

        try {
            const data = await window.app.fetchApi("/api/topics");
            if (!data.topics || data.topics.length === 0) {
                container.innerHTML = `<div class="text-xs text-slate-500 py-3 text-center">No topic clusters discovered. Upload or seed documents.</div>`;
                return;
            }

            container.innerHTML = data.topics.map(t => `
                <div class="topic-cluster-card">
                    <div class="flex justify-between items-center">
                        <span class="topic-title">${t.topic_name}</span>
                        <span class="badge badge-amber">${t.frequency} Excerpts</span>
                    </div>
                    <div class="topic-tags">
                        ${t.keywords.map(kw => `<span class="topic-tag">${kw}</span>`).join("")}
                    </div>
                    ${t.related_documents && t.related_documents.length > 0 ? `
                        <div class="text-xs text-slate-400 mt-2">
                            <strong>Source Documents:</strong> ${t.related_documents.join(", ")}
                        </div>
                    ` : ''}
                </div>
            `).join("");
        } catch (e) {
            console.error("Failed to load topics:", e);
        }
    }

    async loadWordCloud() {
        const canvas = document.getElementById("word-cloud-canvas");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const sub = document.getElementById("wc-sub-filter")?.value || "";

        try {
            const data = await window.app.fetchApi(`/api/topics/wordcloud?subsidiary=${encodeURIComponent(sub)}`);
            const words = data.words || [];

            if (words.length === 0) {
                ctx.fillStyle = "#64748b";
                ctx.font = "13px Inter, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("No word frequency data available for selected filter.", canvas.width / 2, canvas.height / 2);
                return;
            }

            // Word placement layout algorithm
            const colors = ["#f59e0b", "#fbbf24", "#38bdf8", "#34d399", "#f472b6", "#a78bfa", "#94a3b8", "#e2e8f0"];
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const placedBoxes = [];
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            words.forEach((item, idx) => {
                const fontSize = Math.max(11, Math.min(item.size || 16, 36));
                ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
                const textWidth = ctx.measureText(item.text).width;
                const textHeight = fontSize * 1.1;

                // Spiral placement
                let angle = idx * 0.75;
                let radius = 10 + (idx * 4);
                let x = centerX + Math.cos(angle) * radius;
                let y = centerY + Math.sin(angle) * (radius * 0.6);

                // Keep inside canvas bounds
                x = Math.max(textWidth / 2 + 10, Math.min(canvas.width - textWidth / 2 - 10, x));
                y = Math.max(textHeight / 2 + 10, Math.min(canvas.height - textHeight / 2 - 10, y));

                ctx.fillStyle = colors[idx % colors.length];
                ctx.fillText(item.text, x, y);
            });
        } catch (e) {
            console.error("Failed to render word cloud:", e);
        }
    }
}

// Global topic manager
window.topicManager = new TopicManager();
