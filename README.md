# muSheetFlow

A full-stack application for processing and organizing music sheet documents. It helps musicians and orchestras upload PDF sheet music, extract instrument information via OCR, apply transformations, and export standardized results.

## Features

- **Project-based PDF management** — Upload and organize sheet music into projects
- **OCR instrument extraction** — Automatically detect instrument names from sheet headers (English, German, Italian)
- **Page transformations** — Rotation, splitting (left/right pages), cropping, deskewing, and contrast enhancement
- **Instrument mapping** — Standardize multilingual instrument names with key and voice detection
- **Overlay generation** — Visual comparison of multiple score versions
- **Export pipeline** — Generate enhanced PDFs with searchable text layers
- **Job tracking** — Background processing with real-time progress monitoring

## Tech Stack

| Layer          | Technologies                                                        |
| -------------- | ------------------------------------------------------------------- |
| **Frontend**   | React, TypeScript, TanStack Router & Query, Tailwind CSS, Shadcn UI |
| **Backend**    | FastAPI, PyMuPDF, Tesseract OCR, OpenCV, Pillow                     |
| **Infra**      | Docker Compose                                                      |

## Getting Started

### Prerequisites

- Docker & Docker Compose **or**
- Python 3.x + Node.js 18+ + Tesseract OCR (`apt install tesseract-ocr tesseract-ocr-deu tesseract-ocr-ita`)

### Run with Docker Compose

```bash
docker-compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000

### Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn api:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Or start both at once:

```bash
cd frontend && npm run start-all
```

## Project Structure

```
muSheetFlow/
├── docker-compose.yml
├── backend/
│   ├── api.py                  # Project & file endpoints
│   ├── api_jobs.py             # Job processing endpoints
│   ├── core/
│   │   ├── processor.py        # PDF/image transformation pipeline
│   │   └── mapping.py          # Instrument name standardization
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── routes/             # File-based routing (TanStack Router)
│   │   ├── components/         # UI components
│   │   └── lib/                # API client, types, queries
│   └── package.json
└── data/
    ├── instrument_mapping.json # Customizable instrument mappings
    ├── uploads/                # Uploaded PDFs (by project)
    └── exports/                # Processed job results
```

## API Overview

### Projects

| Method   | Endpoint                              | Description                   |
| -------- | ------------------------------------- | ----------------------------- |
| `POST`   | `/projects/`                          | Create a project              |
| `POST`   | `/projects/{name}/upload`             | Upload PDF files              |
| `GET`    | `/projects/{name}/files`              | List project files            |
| `DELETE` | `/projects/{name}/files`              | Delete files                  |
| `GET`    | `/projects/{name}/overlay`            | Generate document overlay     |
| `GET`    | `/projects/{name}/batch_preview`      | Preview processing results    |

### Jobs

| Method   | Endpoint                  | Description                        |
| -------- | ------------------------- | ---------------------------------- |
| `POST`   | `/jobs/start`             | Start a background export job      |
| `GET`    | `/jobs`                   | List all jobs                      |
| `GET`    | `/jobs/{id}`              | Get job details and progress       |
| `GET`    | `/jobs/{id}/results`      | Get results with instrument names  |
| `POST`   | `/jobs/{id}/finalize`     | Finalize and save assigned PDFs    |
| `DELETE` | `/jobs/{id}`              | Delete a job                       |

### Mapping

| Method | Endpoint   | Description                  |
| ------ | ---------- | ---------------------------- |
| `GET`  | `/mapping` | Get instrument name mappings |
| `POST` | `/mapping` | Update instrument mappings   |

## Processing Pipeline

1. **PDF → Image** — Convert pages at 300 DPI
2. **Rotate & Deskew** — Apply rotation and auto-straighten via Hough line detection
3. **Split** — Optionally divide pages for two-page spreads
4. **Crop** — Percentage-based crop with A4 canvas normalization
5. **Enhance** — Dynamic contrast optimization
6. **OCR** — Extract instrument name from the top section of each page
7. **Reconstruct** — Embed images into PDF with searchable text layer
