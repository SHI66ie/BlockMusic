FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy GenLayer contracts
COPY *.py ./

# Copy any additional scripts (optional)
# COPY scripts/ ./scripts/

# Create a non-root user
RUN useradd -m -u 1000 genlayer && \
    chown -R genlayer:genlayer /app

USER genlayer

# Expose port if needed for API
EXPOSE 8000

# Default command - can be overridden
CMD ["python", "-m", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
