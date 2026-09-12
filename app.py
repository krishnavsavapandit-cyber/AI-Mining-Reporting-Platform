"""
SIH26023 -- AI-Powered Geological, Mining and Reporting Platform for CMPDI / Coal India Limited.
Main Flask Application Server.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add root directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from flask import Flask, render_template, send_from_directory, jsonify
from config.settings import SECRET_KEY, MAX_CONTENT_LENGTH, DATABASE_PATH
from database.db import init_db
from routes import (
    document_bp, search_bp, query_bp, report_bp, topic_bp,
    analytics_bp, inquiry_bp, validation_bp, audit_bp, agent_bp, settings_bp
)

def create_app() -> Flask:
    """Application factory for SIH26023 CIL Mining Platform."""
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config["SECRET_KEY"] = SECRET_KEY
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

    # Initialize SQLite database schema
    init_db()

    # Register API Blueprints
    app.register_blueprint(document_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(query_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(topic_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(inquiry_bp)
    app.register_blueprint(validation_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(settings_bp)

    frontend_dist = BASE_DIR / "frontend" / "dist"

    @app.route("/")
    def index():
        """Serve modern React SPA if built, otherwise legacy Jinja template."""
        if (frontend_dist / "index.html").exists():
            return send_from_directory(str(frontend_dist), "index.html")
        return render_template("index.html")

    @app.route("/assets/<path:filename>")
    def frontend_assets(filename):
        """Serve built React assets."""
        assets_dir = frontend_dist / "assets"
        if assets_dir.exists():
            return send_from_directory(str(assets_dir), filename)
        return jsonify({"status": "error", "message": "Asset not found"}), 404

    @app.route("/legacy")
    def legacy_index():
        """Render legacy Jinja interface."""
        return render_template("index.html")

    @app.route("/favicon.ico")
    def favicon():
        """Handle favicon requests gracefully."""
        return ('', 204)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"status": "error", "message": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"status": "error", "message": "Internal server error"}), 500

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Starting SIH26023 CIL Multi-Agent Platform on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
