"""
Analytics & KPI Dashboard REST Routes for SIH26023.
Exposes real database metrics and Chart.js datasets.
"""

import logging
from flask import Blueprint, jsonify
from services.analytics_service import analytics_service

logger = logging.getLogger(__name__)
analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

@analytics_bp.route("/summary", methods=["GET"])
def get_summary():
    """Get high-level dashboard counters."""
    try:
        data = analytics_service.get_dashboard_summary()
        return jsonify({
            "status": "success",
            "summary": data
        }), 200
    except Exception as e:
        logger.error(f"Failed to fetch summary: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@analytics_bp.route("/charts", methods=["GET"])
def get_charts():
    """Get structured data for Chart.js charts."""
    try:
        charts_data = analytics_service.get_charts_data()
        return jsonify({
            "status": "success",
            "charts": charts_data
        }), 200
    except Exception as e:
        logger.error(f"Failed to fetch charts data: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@analytics_bp.route("/kpi-framework", methods=["GET"])
def get_kpi_framework():
    """Get formal KPI measurement methodology & benchmark metrics."""
    try:
        data = analytics_service.get_kpi_framework()
        return jsonify({
            "status": "success",
            "kpi_framework": data
        }), 200
    except Exception as e:
        logger.error(f"Failed to fetch KPI framework: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
