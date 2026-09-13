"""
Gunicorn configuration for Render Web Service deployment.
Binds dynamically to the port assigned by Render ($PORT) and configures worker lifecycle.
"""

import os

# Port binding: Render assigns a dynamic port in $PORT (default 10000)
port = os.getenv("PORT", "10000")
bind = f"0.0.0.0:{port}"

# Worker processes (Render Free tier has 512MB RAM; 2 sync workers is optimal)
workers = int(os.getenv("WEB_CONCURRENCY", "2"))
worker_class = "sync"

# Request timeout (allow sufficient time for AI LLM queries / OCR processing)
timeout = int(os.getenv("GUNICORN_TIMEOUT", "120"))
keepalive = 5

# Logging to stdout/stderr for Render live log streaming
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info")
