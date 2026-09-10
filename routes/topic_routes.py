"""
Topic Discovery & Word Cloud REST Routes for SIH26023.
Provides topic clusters, keyword frequencies, and word cloud canvas data.
"""

import logging
from flask import Blueprint, request, jsonify
from services.topic_service import topic_service

logger = logging.getLogger(__name__)
topic_bp = Blueprint("topics", __name__, url_prefix="/api/topics")

@topic_bp.route("", methods=["GET"])
def get_topics():
    """Discover topic clusters from all indexed documents."""
    try:
        topics = topic_service.discover_topics()
        return jsonify({
            "status": "success",
            "count": len(topics),
            "topics": topics
        }), 200
    except Exception as e:
        logger.error(f"Failed to discover topics: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@topic_bp.route("/wordcloud", methods=["GET"])
def get_word_cloud():
    """Retrieve word cloud frequencies with optional filters."""
    subsidiary = request.args.get("subsidiary")
    period = request.args.get("period")
    doc_type = request.args.get("doc_type")

    try:
        cloud_data = topic_service.get_word_cloud_data(
            subsidiary=subsidiary,
            period=period,
            doc_type=doc_type
        )
        return jsonify({
            "status": "success",
            "count": len(cloud_data),
            "words": cloud_data
        }), 200
    except Exception as e:
        logger.error(f"Failed to fetch word cloud: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
