"""Production entrypoint: serves the API under /api and the built frontend (SPA)."""

import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from api import app as api_app

STATIC_DIR = os.path.realpath(os.getenv("STATIC_DIR", "static"))

app = FastAPI(title="muSheetFlow", docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", api_app)


@app.get("/{path:path}", include_in_schema=False)
async def spa(path: str):
    # Serve real files from the build output, fall back to index.html for client-side routes
    file_path = os.path.realpath(os.path.join(STATIC_DIR, path))
    if file_path.startswith(STATIC_DIR + os.sep) and os.path.isfile(file_path):
        return FileResponse(file_path)
    index = os.path.join(STATIC_DIR, "index.html")
    if not os.path.isfile(index):
        raise HTTPException(status_code=404)
    return FileResponse(index)
