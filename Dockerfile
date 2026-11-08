# --- Frontend build ---
FROM node:22-alpine AS frontend-build

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# --- Backend base (also used by docker-compose.yml for development) ---
FROM python:3.10-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-deu \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV DATA_DIR=/app/data
EXPOSE 8000

# --- Production image: API + frontend in one container ---
FROM backend AS runner

COPY backend/ .
COPY --from=frontend-build /frontend/dist ./static

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
