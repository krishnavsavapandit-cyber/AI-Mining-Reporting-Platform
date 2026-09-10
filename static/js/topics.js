/**
 * Topics & Interactive Collision-Free Word Cloud Controller for SIH26023.
 * Implements Archimedean spiral collision-avoidance layout, DPR-aware canvas rendering,
 * coordinate hit-testing, hover tooltips, and bidirectional topic cluster linking.
 */

class TopicManager {
    constructor() {
        this.placedWords = [];
        this.hoveredWord = null;
        this.selectedWord = null;
        this.activeSubsidiary = "";
        this.rawWordData = [];
        this.resizeTimeout = null;
        this.colors = ["#f59e0b", "#fbbf24", "#38bdf8", "#34d399", "#94a3b8"];
        this.init();
    }

    init() {
        const subFilter = document.getElementById("wc-sub-filter");
        if (subFilter) {
            subFilter.addEventListener("change", (e) => {
                this.activeSubsidiary = e.target.value;
                this.loadTopicsAndCloud();
            });
        }

        const clearBtn = document.getElementById("btn-clear-inspector");
        if (clearBtn) {
            clearBtn.addEventListener("click", () => this.clearSelection());
        }

        this.bindCanvasEvents();
        this.bindResizeObserver();
    }

    bindCanvasEvents() {
        const canvas = document.getElementById("word-cloud-canvas");
        if (!canvas) return;

        canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        canvas.addEventListener("mouseleave", () => this.handleMouseLeave());
        canvas.addEventListener("click", (e) => this.handleCanvasClick(e));
    }

    bindResizeObserver() {
        const container = document.getElementById("word-cloud-container");
        if (!container) return;

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    if (document.getElementById("tab-topics")?.classList.contains("active")) {
                        this.renderWordCloudCanvas();
                    }
                }, 120);
            });
            ro.observe(container);
        } else {
            window.addEventListener("resize", () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    if (document.getElementById("tab-topics")?.classList.contains("active")) {
                        this.renderWordCloudCanvas();
                    }
                }, 150);
            });
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
            const url = this.activeSubsidiary 
                ? `/api/topics?subsidiary=${encodeURIComponent(this.activeSubsidiary)}`
                : `/api/topics`;

            const data = await window.app.fetchApi(url);
            if (!data.topics || data.topics.length === 0) {
                container.innerHTML = `
                    <div class="p-6 text-center text-slate-400 bg-slate-900/40 rounded-lg border border-slate-800 text-xs">
                        No topic clusters discovered for the selected filter.<br>
                        <span class="text-slate-500">Upload or seed documents to initiate topic discovery.</span>
                    </div>
                `;
                return;
            }

            container.innerHTML = data.topics.map(t => `
                <div class="topic-cluster-card" data-topic-name="${t.topic_name}">
                    <div class="flex justify-between items-center mb-1">
                        <span class="topic-title">${t.topic_name}</span>
                        <span class="badge badge-amber">${t.frequency} Chunks</span>
                    </div>
                    <div class="topic-tags">
                        ${t.keywords.map(kw => `<span class="topic-tag" data-tag="${kw.toLowerCase()}">${kw}</span>`).join("")}
                    </div>
                    ${t.related_documents && t.related_documents.length > 0 ? `
                        <div class="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                            <strong class="text-slate-300">Sources:</strong> ${t.related_documents.slice(0, 4).join(", ")}${t.related_documents.length > 4 ? ` (+${t.related_documents.length - 4} more)` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join("");
        } catch (e) {
            console.error("Failed to load topics:", e);
            container.innerHTML = `<div class="text-xs text-rose py-3 text-center">Failed to load topic clusters.</div>`;
        }
    }

    async loadWordCloud() {
        const canvas = document.getElementById("word-cloud-canvas");
        if (!canvas) return;

        try {
            const url = this.activeSubsidiary 
                ? `/api/topics/wordcloud?subsidiary=${encodeURIComponent(this.activeSubsidiary)}`
                : `/api/topics/wordcloud`;

            const data = await window.app.fetchApi(url);
            this.rawWordData = data.words || [];
            this.renderWordCloudCanvas();
        } catch (e) {
            console.error("Failed to fetch word cloud:", e);
            this.rawWordData = [];
            this.renderWordCloudCanvas();
        }
    }

    renderWordCloudCanvas() {
        const canvas = document.getElementById("word-cloud-canvas");
        const container = document.getElementById("word-cloud-container");
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(container.clientWidth - 24, 320);
        const height = 360;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.resetTransform?.();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        if (!this.rawWordData || this.rawWordData.length === 0) {
            this.placedWords = [];
            ctx.fillStyle = "#64748b";
            ctx.font = "500 13px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Not enough document terms available to generate word cloud.", width / 2, height / 2 - 10);
            ctx.font = "400 11px Inter, sans-serif";
            ctx.fillStyle = "#475569";
            ctx.fillText("Upload or seed documents to calculate term frequencies.", width / 2, height / 2 + 12);
            return;
        }

        // Layout algorithm: Collision-aware Archimedean spiral
        this.placedWords = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const wordPadding = 5;

        // Sort items by weight descending
        const sorted = [...this.rawWordData].sort((a, b) => (b.weight || 0) - (a.weight || 0));

        sorted.forEach((item, idx) => {
            const fontSize = Math.max(12, Math.min(item.size || 14, 30));
            ctx.font = `700 ${fontSize}px 'Outfit', -apple-system, sans-serif`;
            
            const metrics = ctx.measureText(item.text);
            const textWidth = metrics.width;
            const textHeight = fontSize * 1.15;
            const boxWidth = textWidth + wordPadding * 2;
            const boxHeight = textHeight + wordPadding * 2;

            const color = this.colors[idx % this.colors.length];

            // Archimedean spiral search
            let placed = false;
            let theta = 0;
            const dTheta = 0.22;
            const b = 1.7; // Spiral growth rate
            const maxAttempts = 400;

            for (let step = 0; step < maxAttempts; step++) {
                theta = step * dTheta;
                const r = b * theta;
                // Elliptical ratio matching canvas aspect
                const x = centerX + r * Math.cos(theta) * 1.25 - boxWidth / 2;
                const y = centerY + r * Math.sin(theta) * 0.75 - boxHeight / 2;

                // Check canvas viewport boundaries with margin
                if (x < 6 || x + boxWidth > width - 6 || y < 6 || y + boxHeight > height - 6) {
                    continue;
                }

                const candidateBox = {
                    x,
                    y,
                    width: boxWidth,
                    height: boxHeight
                };

                // Check collision with already placed boxes
                let collides = false;
                for (const existing of this.placedWords) {
                    if (this.checkOverlap(candidateBox, existing.box)) {
                        collides = true;
                        break;
                    }
                }

                if (!collides) {
                    this.placedWords.push({
                        text: item.text,
                        raw_term: item.raw_term || item.text.toLowerCase(),
                        weight: item.weight,
                        fontSize: fontSize,
                        color: color,
                        topic: item.topic || "Mining Operations & Performance",
                        documents: item.documents || [],
                        document_ids: item.document_ids || [],
                        box: candidateBox,
                        textX: x + wordPadding,
                        textY: y + wordPadding + fontSize * 0.85
                    });
                    placed = true;
                    break;
                }
            }
        });

        // Draw all placed words
        this.drawWords(ctx);
    }

    checkOverlap(box1, box2) {
        return !(
            box1.x + box1.width <= box2.x ||
            box1.x >= box2.x + box2.width ||
            box1.y + box1.height <= box2.y ||
            box1.y >= box2.y + box2.height
        );
    }

    drawWords(ctx) {
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        for (const w of this.placedWords) {
            const isHovered = this.hoveredWord && this.hoveredWord.text === w.text;
            const isSelected = this.selectedWord && this.selectedWord.text === w.text;

            if (isSelected) {
                // Draw selection halo
                ctx.fillStyle = "rgba(245, 158, 11, 0.16)";
                ctx.strokeStyle = "#f59e0b";
                ctx.lineWidth = 1.5;
                this.roundRect(ctx, w.box.x, w.box.y, w.box.width, w.box.height, 4);
                ctx.fill();
                ctx.stroke();
            } else if (isHovered) {
                // Draw subtle hover halo
                ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
                ctx.lineWidth = 1;
                this.roundRect(ctx, w.box.x, w.box.y, w.box.width, w.box.height, 4);
                ctx.fill();
                ctx.stroke();
            }

            ctx.font = `700 ${w.fontSize}px 'Outfit', -apple-system, sans-serif`;
            ctx.fillStyle = isSelected ? "#f59e0b" : (isHovered ? "#ffffff" : w.color);
            ctx.fillText(w.text, w.textX, w.textY);
        }
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    getCanvasPointerCoords(e) {
        const canvas = document.getElementById("word-cloud-canvas");
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        // Scale factors
        const scaleX = (parseFloat(canvas.style.width) || canvas.width) / rect.width;
        const scaleY = (parseFloat(canvas.style.height) || canvas.height) / rect.height;

        return {
            x: clientX * scaleX,
            y: clientY * scaleY
        };
    }

    findWordAt(x, y) {
        for (let i = this.placedWords.length - 1; i >= 0; i--) {
            const w = this.placedWords[i];
            if (
                x >= w.box.x &&
                x <= w.box.x + w.box.width &&
                y >= w.box.y &&
                y <= w.box.y + w.box.height
            ) {
                return w;
            }
        }
        return null;
    }

    handleMouseMove(e) {
        const coords = this.getCanvasPointerCoords(e);
        const hit = this.findWordAt(coords.x, coords.y);
        const canvas = document.getElementById("word-cloud-canvas");
        const tooltip = document.getElementById("word-cloud-tooltip");

        if (hit !== this.hoveredWord) {
            this.hoveredWord = hit;
            if (canvas) {
                canvas.style.cursor = hit ? "pointer" : "default";
            }
            // Re-render canvas
            const ctx = canvas?.getContext("2d");
            if (ctx) {
                const width = parseFloat(canvas.style.width) || canvas.width;
                const height = parseFloat(canvas.style.height) || canvas.height;
                ctx.clearRect(0, 0, width, height);
                this.drawWords(ctx);
            }
        }

        if (hit && tooltip) {
            tooltip.style.display = "block";
            tooltip.style.left = `${e.offsetX}px`;
            tooltip.style.top = `${e.offsetY - 8}px`;
            tooltip.innerHTML = `<strong>${hit.text}</strong> &bull; ${hit.weight} Occurrences`;
        } else if (tooltip) {
            tooltip.style.display = "none";
        }
    }

    handleMouseLeave() {
        if (this.hoveredWord) {
            this.hoveredWord = null;
            const canvas = document.getElementById("word-cloud-canvas");
            if (canvas) canvas.style.cursor = "default";
            const ctx = canvas?.getContext("2d");
            if (ctx) {
                const width = parseFloat(canvas.style.width) || canvas.width;
                const height = parseFloat(canvas.style.height) || canvas.height;
                ctx.clearRect(0, 0, width, height);
                this.drawWords(ctx);
            }
        }
        const tooltip = document.getElementById("word-cloud-tooltip");
        if (tooltip) tooltip.style.display = "none";
    }

    handleCanvasClick(e) {
        const coords = this.getCanvasPointerCoords(e);
        const hit = this.findWordAt(coords.x, coords.y);

        if (hit) {
            this.selectWord(hit);
        } else {
            this.clearSelection();
        }
    }

    selectWord(word) {
        this.selectedWord = word;

        // Redraw canvas with active highlight
        const canvas = document.getElementById("word-cloud-canvas");
        const ctx = canvas?.getContext("2d");
        if (ctx) {
            const width = parseFloat(canvas.style.width) || canvas.width;
            const height = parseFloat(canvas.style.height) || canvas.height;
            ctx.clearRect(0, 0, width, height);
            this.drawWords(ctx);
        }

        // Populate inspector card
        const inspector = document.getElementById("word-cloud-inspector");
        const termName = document.getElementById("inspector-term-name");
        const termBadge = document.getElementById("inspector-term-badge");
        const topicName = document.getElementById("inspector-topic-name");
        const docsList = document.getElementById("inspector-docs-list");

        if (inspector && termName && termBadge && topicName && docsList) {
            inspector.style.display = "block";
            inspector.classList.add("active");
            termName.innerText = word.text;
            termBadge.innerText = `${word.weight} OCCURRENCES`;
            topicName.innerText = word.topic;

            if (word.documents && word.documents.length > 0) {
                docsList.innerHTML = `
                    <ul class="space-y-1">
                        ${word.documents.map(d => `
                            <li class="flex items-center gap-1">
                                <span class="text-amber-400">&bull;</span>
                                <span class="font-medium">${d}</span>
                            </li>
                        `).join("")}
                    </ul>
                `;
            } else {
                docsList.innerHTML = `<span class="text-slate-500 italic">No source document metadata available.</span>`;
            }
        }

        // Highlight matching topic cluster card
        this.highlightTopicCluster(word.topic, word.raw_term);
    }

    clearSelection() {
        this.selectedWord = null;

        const canvas = document.getElementById("word-cloud-canvas");
        const ctx = canvas?.getContext("2d");
        if (ctx) {
            const width = parseFloat(canvas.style.width) || canvas.width;
            const height = parseFloat(canvas.style.height) || canvas.height;
            ctx.clearRect(0, 0, width, height);
            this.drawWords(ctx);
        }

        const inspector = document.getElementById("word-cloud-inspector");
        if (inspector) {
            inspector.style.display = "none";
            inspector.classList.remove("active");
        }

        // Remove highlight from cards
        document.querySelectorAll(".topic-cluster-card").forEach(card => {
            card.classList.remove("highlighted");
        });
        document.querySelectorAll(".topic-tag").forEach(tag => {
            tag.classList.remove("active");
        });
    }

    highlightTopicCluster(topicName, rawTerm) {
        let matchedCard = null;

        document.querySelectorAll(".topic-cluster-card").forEach(card => {
            const cardTopic = card.getAttribute("data-topic-name");
            if (cardTopic === topicName) {
                card.classList.add("highlighted");
                matchedCard = card;
            } else {
                card.classList.remove("highlighted");
            }
        });

        // Highlight matching tags
        document.querySelectorAll(".topic-tag").forEach(tag => {
            const tagTerm = tag.getAttribute("data-tag");
            if (tagTerm === rawTerm) {
                tag.classList.add("active");
            } else {
                tag.classList.remove("active");
            }
        });

        // Smooth scroll matching card into view
        if (matchedCard) {
            matchedCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }
}

// Global topic manager instance
window.topicManager = new TopicManager();
