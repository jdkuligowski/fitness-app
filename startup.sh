#!/usr/bin/env bash

# Start a minimal HTTP server in the background
python -m http.server 8000 &

# Start Celery in the foreground
celery -A fitnessappbuild worker -l info
