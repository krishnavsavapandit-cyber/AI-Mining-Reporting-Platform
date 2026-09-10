"""
Search Engine REST Routes for SIH26023.
Exposes hybrid keyword and semantic vector search over all indexed document chunks.
"""

import logging
from flask import Blueprint, request, jsonify
from services.retrieval_service import retrieval_service
from agents.retrieval_agent import RetrievalAgent

logger = logging.getLogger(__name__)
search_bp = Blueprint("search", __name__, url_prefix="/api/search")

@search_bp.route("", methods=["GET", "POST"])
def search():
    """Perform hybrid search over indexed document chunks."""
    if request.method == "POST":
        data = request.get_json() or {}
        query = data.get("query", "")
        top_k = int(data.get("top_k", 10))
        subsidiary = data.get("subsidiary")
        doc_id = data.get("document_id")
    else:
        query = request.args.get("q", "")
        top_k = int(request.args.get("top_k", 10))
        subsidiary = request.args.get("subsidiary")
        doc_id = request.args.get("document_id")
        if doc_id:
            try:
                doc_id = int(doc_id)
            except ValueError:
                doc_id = None

    if not query.strip():
        return jsonify({"status": "error", "message": "Search query cannot be empty"}), 400

    try:
        evidence_items = retrieval_service.hybrid_search(
            query=query,
            top_k=top_k,
            filter_subsidiary=subsidiary,
            filter_doc_id=doc_id
        )

        return jsonify({
            "status": "success",
            "query": query,
            "expanded_query": retrieval_service.expand_query(query),
            "count": len(evidence_items),
            "results": [e.to_dict() for e in evidence_items]
        }), 200
    except Exception as e:
        logger.error(f"Search API error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
