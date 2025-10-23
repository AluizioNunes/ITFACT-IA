FROM python:3.11.10-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
 && apt-get update && apt-get install -y curl \
 && rm -rf /var/lib/apt/lists/*
COPY main.py ./
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://localhost:8000/health || exit 1
ENV AUTO_RELOAD=false
CMD ["sh", "-c", "if [ \"$AUTO_RELOAD\" = \"true\" ]; then exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload; else exec uvicorn main:app --host 0.0.0.0 --port 8000; fi"]