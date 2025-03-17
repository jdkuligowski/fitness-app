#!/usr/bin/env bash

# Optionally install dependencies
pip install --no-cache-dir -r requirements.txt

# Start a minimal HTTP server in the background on port 8000
python -m http.server 8000 &

# Start Celery worker in the background
celery -A fitnessappbuild worker -l info &

# Finally, start Celery Beat in the foreground
celery -A fitnessappbuild beat -l info
