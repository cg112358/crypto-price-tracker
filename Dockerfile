# Simple Dockerfile for the Crypto Price Tracker
FROM python:3.11-slim

# Set workdir
WORKDIR /app

# System deps (optional: for openpyxl's lxml fast-paths, but not strictly needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy project
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -r dev-requirements.txt

# Default command shows help
CMD ["python", "crypto_price_tracker.py", "--help"]
