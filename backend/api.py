import PIL.Image

PIL.Image.MAX_IMAGE_PIXELS = None
from fastapi import FastAPI, File, UploadFile, Form, Body
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from typing import List, Optional
import os
import shutil
import uvicorn
import io
from pydantic import BaseModel
from datetime import datetime

# Wir importieren hier die existierende Logik für das Overlay
from core.processor import generate_overlay
from api_jobs import jobs_db, OUTPUT_DIR, background_export_task

DATA_DIR = os.getenv("DATA_DIR", "../data")
OUTPUT_DIR = os.path.join(DATA_DIR, "exports")
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Monkey patch load
import json, os


def _load_jobs():
    if not os.path.exists(OUTPUT_DIR):
        return
    for job_id in os.listdir(OUTPUT_DIR):
        if os.path.isdir(os.path.join(OUTPUT_DIR, job_id)):
            meta_path = os.path.join(OUTPUT_DIR, job_id, "job_meta.json")
            if os.path.exists(meta_path):
                with open(meta_path, "r") as mf:
                    try:
                        jobs_db[job_id] = json.load(mf)
                    except:
                        pass


_load_jobs()


app = FastAPI(title="muSheetFlow API")
app.mount("/exports", StaticFiles(directory=OUTPUT_DIR), name="exports")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProjectCreate(BaseModel):
    name: str


class ProjectSettings(BaseModel):
    rotation: int = 0
    do_split: bool = False
    crop_x: float = 5
    crop_y: float = 5
    crop_w: float = 90
    crop_h: float = 90
    auto_deskew: bool = True
    auto_enhance: bool = True
    jpeg_quality: int = 75
    target_language: str = "Deutsch"
    tab: str = "upload"


def _settings_path(project_name: str) -> str:
    return os.path.join(UPLOAD_DIR, project_name, "settings.json")


@app.get("/projects/{project_name}/settings")
async def get_project_settings(project_name: str):
    project_path = os.path.join(UPLOAD_DIR, project_name)
    if not os.path.exists(project_path):
        return Response(status_code=404)
    path = _settings_path(project_name)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return ProjectSettings().model_dump()


@app.put("/projects/{project_name}/settings")
async def update_project_settings(project_name: str, settings: ProjectSettings):
    project_path = os.path.join(UPLOAD_DIR, project_name)
    if not os.path.exists(project_path):
        return Response(status_code=404)
    path = _settings_path(project_name)
    with open(path, "w") as f:
        json.dump(settings.model_dump(), f, indent=2)
    return settings.model_dump()


@app.post("/projects/")
async def create_project(project: ProjectCreate):
    project_path = os.path.join(UPLOAD_DIR, project.name)
    os.makedirs(project_path, exist_ok=True)
    return {"status": "success", "project_name": project.name, "path": project_path}


@app.post("/projects/{project_name}/upload")
async def upload_files(project_name: str, files: List[UploadFile] = File(...)):
    project_path = os.path.join(UPLOAD_DIR, project_name)
    if not os.path.exists(project_path):
        return {"error": "Project not found"}

    saved_files = []
    for file in files:
        file_path = os.path.join(project_path, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_files.append(file.filename)

    return {"status": "success", "saved_files": saved_files}


@app.get("/projects/{project_name}/files")
async def list_files(project_name: str):
    project_path = os.path.join(UPLOAD_DIR, project_name)
    if not os.path.exists(project_path):
        return {"error": "Project not found"}

    files = []
    for f in os.listdir(project_path):
        if not f.endswith(".pdf"):
            continue

        file_path = os.path.join(project_path, f)
        files.append(
            {
                "filename": f,
                "size": os.path.getsize(file_path),
                "created_at": datetime.fromtimestamp(
                    os.path.getctime(file_path)
                ).isoformat(),
            }
        )

    files.sort(key=lambda x: x["filename"])
    return files


@app.delete("/projects/{project_name}/files")
async def delete_files(project_name: str, files: List[str] = Body(...)):
    project_path = os.path.join(UPLOAD_DIR, project_name)
    if not os.path.exists(project_path):
        return {"error": "Project not found"}

    deleted_files = []
    for file in files:
        file_path = os.path.join(project_path, file)
        if os.path.exists(file_path):
            os.remove(file_path)
            deleted_files.append(file)

    return {"status": "success", "deleted_files": deleted_files}


@app.get("/projects/{project_name}/overlay")
async def get_overlay(
    project_name: str,
    base_rotation: int = 0,
    do_split: bool = False,
    single_file: bool = False,
):
    project_path = os.path.join(UPLOAD_DIR, project_name)
    if not os.path.exists(project_path):
        return Response(status_code=404)

    pdf_files = [f for f in os.listdir(project_path) if f.endswith(".pdf")]
    pdf_files.sort()

    if single_file and pdf_files:
        pdf_files = [pdf_files[0]]

    abs_paths = [os.path.join(project_path, f) for f in pdf_files]
    overlay_img = generate_overlay(
        abs_paths, base_rotation=base_rotation, do_split=do_split
    )

    if overlay_img is None:
        return Response(status_code=400, content="Could not generate overlay")

    img_byte_arr = io.BytesIO()
    # Speichere als JPEG für schnellere Übertragung im Browser
    if overlay_img.mode in ("RGBA", "P"):
        overlay_img = overlay_img.convert("RGB")
    overlay_img.save(img_byte_arr, format="JPEG", quality=80)

    return Response(content=img_byte_arr.getvalue(), media_type="image/jpeg")


class CropConfig(BaseModel):
    unit: str
    x: float
    y: float
    width: float
    height: float


class BatchPreviewRequest(BaseModel):
    rotation: int = 0
    do_split: bool = False
    crop: CropConfig
    target_language: str = "English"


# We need fitz and some processor functions, so import them
import fitz
from core.processor import (
    pdf_page_to_image,
    deskew_image,
    split_image_vertically,
    extract_instrument_name_ocr,
)


@app.post("/projects/{project_name}/batch_preview")
async def batch_preview(project_name: str, req: BatchPreviewRequest):
    project_path = os.path.join(UPLOAD_DIR, project_name)
    if not os.path.exists(project_path):
        return {"error": "Project not found"}

    pdf_files = [f for f in os.listdir(project_path) if f.endswith(".pdf")]
    results = []

    for filename in sorted(pdf_files):
        pdf_path = os.path.join(project_path, filename)
        try:
            pdf_document = fitz.open(pdf_path)
            if pdf_document.page_count > 0:
                page = pdf_document.load_page(0)
                img_pil = pdf_page_to_image(
                    page, dpi=150
                )  # use 150 dpi for faster preview OCR
                img_pil = deskew_image(img_pil, 0.0, req.rotation)

                parts = split_image_vertically(img_pil) if req.do_split else [img_pil]

                for idx, part in enumerate(parts):
                    w, h = part.size
                    # Apply percentage crop
                    left = int((req.crop.x / 100) * w)
                    top = int((req.crop.y / 100) * h)
                    right = int(((req.crop.x + req.crop.width) / 100) * w)
                    bottom = int(((req.crop.y + req.crop.height) / 100) * h)

                    cropped = part.crop((left, top, right, bottom))
                    mapped_name, raw_text = extract_instrument_name_ocr(
                        cropped, target_language=req.target_language
                    )

                    # Store result
                    res_filename = (
                        filename if not req.do_split else f"{filename} (Part {idx+1})"
                    )
                    results.append(
                        {
                            "filename": res_filename,
                            "raw_ocr": raw_text,
                            "mapped_instrument": mapped_name,
                        }
                    )
            pdf_document.close()
        except Exception as e:
            results.append({"filename": filename, "error": str(e)})

    return {"results": results}


# --- JOBS API ---
from fastapi import BackgroundTasks
from fastapi.responses import FileResponse
from api_jobs import ExportJobRequest, background_export_task, jobs_db, OUTPUT_DIR
import uuid


def _save_job_meta(job_id: str):
    import json
    import os
    from api_jobs import OUTPUT_DIR, jobs_db

    job_dir = os.path.join(OUTPUT_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    meta_path = os.path.join(job_dir, "job_meta.json")
    with open(meta_path, "w") as mf:
        json.dump(jobs_db.get(job_id, {}), mf, indent=2)


@app.post("/projects/{project_name}/export")
async def start_export(
    project_name: str, req: ExportJobRequest, background_tasks: BackgroundTasks
):
    job_id = str(uuid.uuid4())
    jobs_db[job_id] = {
        "id": job_id,
        "project": project_name,
        "status": "pending",
        "progress": 0,
        "total": 0,
        "target_language": req.target_language,
    }
    _save_job_meta(job_id)
    background_tasks.add_task(background_export_task, job_id, project_name, req)
    return {"job_id": job_id}


from fastapi import Request
from fastapi.responses import StreamingResponse
import asyncio


@app.get("/jobs/stream")
async def jobs_stream(request: Request):
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            try:
                # convert dict values to list
                jobs_list = list(jobs_db.values())
                import json

                yield f"data: {json.dumps(jobs_list)}\n\n"
            except Exception:
                pass
            await asyncio.sleep(1.0)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/jobs")
async def list_jobs():
    return list(jobs_db.values())


@app.put("/jobs")
async def refresh_jobs():
    _load_jobs()
    return {"status": "success", "message": "Jobs refreshed from disk"}


@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in jobs_db:
        return Response(status_code=404)
    return jobs_db[job_id]


@app.get("/jobs/{job_id}/download")
async def download_job(job_id: str):
    if job_id not in jobs_db:
        return Response(status_code=404)
    job = jobs_db[job_id]
    if job["status"] != "completed":
        return {"error": "Job not completed"}

    zip_path = os.path.join(OUTPUT_DIR, job["result_file"])
    return FileResponse(
        zip_path, media_type="application/zip", filename=job["result_file"]
    )


# -- MAPPING API --
from core.mapping import load_mapping, save_mapping
from typing import Any


@app.get("/mapping")
async def get_mapping():
    return load_mapping()


@app.post("/mapping")
async def update_mapping(mapping: list[Any]):
    save_mapping(mapping)
    return {"status": "success"}


# -- CROP PREVIEW API --
import io


@app.get("/projects/{project_name}/preview_crop")
async def preview_crop(
    project_name: str,
    filename: str,
    rotation: int = 0,
    do_split: bool = False,
    cx: float = 0,
    cy: float = 0,
    cw: float = 0,
    ch: float = 0,
):
    project_path = os.path.join(UPLOAD_DIR, project_name)
    pdf_path = os.path.join(project_path, filename)
    if not os.path.exists(pdf_path):
        return Response(status_code=404)

    try:
        pdf_document = fitz.open(pdf_path)
        if pdf_document.page_count == 0:
            return Response(status_code=400)

        page = pdf_document.load_page(0)
        img_pil = pdf_page_to_image(page, dpi=100)  # Fast render for small thumbnail
        img_pil = deskew_image(img_pil, 0.0, rotation)

        parts = split_image_vertically(img_pil) if do_split else [img_pil]
        part = parts[0]

        w, h = part.size
        left = int((cx / 100) * w)
        top = int((cy / 100) * h)
        right = int(((cx + cw) / 100) * w)
        bottom = int(((cy + ch) / 100) * h)

        left = max(0, min(left, w - 1))
        right = max(left + 1, min(right, w))
        top = max(0, min(top, h - 1))
        bottom = max(top + 1, min(bottom, h))

        cropped = part.crop((left, top, right, bottom))
        img_byte_arr = io.BytesIO()
        cropped.save(img_byte_arr, format="JPEG", quality=85)
        pdf_document.close()

        return Response(content=img_byte_arr.getvalue(), media_type="image/jpeg")
    except Exception as e:
        return Response(status_code=500, content=str(e))


@app.delete("/projects/{project_name}")
async def delete_project(project_name: str):
    import shutil

    project_path = os.path.join(UPLOAD_DIR, project_name)
    if os.path.exists(project_path):
        shutil.rmtree(project_path)
        return {"status": "success", "message": f"Project {project_name} deleted"}
    return Response(status_code=404)


@app.get("/projects")
async def list_projects():
    if not os.path.exists(UPLOAD_DIR):
        return []

    projects = []
    for d in os.listdir(UPLOAD_DIR):
        d_path = os.path.join(UPLOAD_DIR, d)
        if os.path.isdir(d_path):
            file_count = len([f for f in os.listdir(d_path) if f.endswith(".pdf")])
            projects.append({"name": d, "file_count": file_count})
    projects.sort(key=lambda x: x["name"])
    return projects


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)


@app.post("/jobs/{job_id}/language")
async def update_job_language(job_id: str, payload: dict = Body(...)):
    # payload: {"language": "English"}
    lang = payload.get("language", "Deutsch")
    from api_jobs import OUTPUT_DIR, jobs_db
    import os, json

    if job_id not in jobs_db:
        return Response(status_code=404)

    jobs_db[job_id]["target_language"] = lang
    _save_job_meta(job_id)

    # re-map existing results!
    res_path = os.path.join(OUTPUT_DIR, job_id, "results.json")
    if os.path.exists(res_path):
        with open(res_path, "r") as mf:
            try:
                results = json.load(mf)
                from core.mapping import standardize_name

                # Only remap if we have raw_ocr
                for r in results:
                    if r.get("raw_ocr"):
                        info = standardize_name(r["raw_ocr"], target_language=lang)
                        r["instrument"] = info["instrument"]
                        r["voice"] = info["voice"]
                        r["key"] = info["key"]

                with open(res_path, "w") as out_mf:
                    json.dump(results, out_mf, indent=2)
            except Exception as e:
                print("Failed to map", e)
    return {"status": "success", "language": lang}


@app.post("/jobs/{job_id}/results")
async def save_job_results(job_id: str, payload: list = Body(...)):
    from api_jobs import OUTPUT_DIR, jobs_db
    import os, json

    if job_id not in jobs_db:
        return Response(status_code=404)
    res_path = os.path.join(OUTPUT_DIR, job_id, "results.json")
    with open(res_path, "w") as f:
        json.dump(payload, f, indent=2)
    return {"status": "success"}


@app.get("/jobs/{job_id}/results")
async def get_job_results(job_id: str):
    from api_jobs import OUTPUT_DIR, jobs_db
    import os, json

    if job_id not in jobs_db:
        return Response(status_code=404)

    res_path = os.path.join(OUTPUT_DIR, job_id, "results.json")
    if os.path.exists(res_path):
        with open(res_path, "r") as f:
            return json.load(f)
    return []


@app.post("/jobs/{job_id}/finalize")
async def finalize_job(job_id: str, payload: dict):
    # payload is {"assignments": {"file.pdf": "Trumpet 1 Bb"}}
    from api_jobs import OUTPUT_DIR, jobs_db
    import os, zipfile, shutil

    if job_id not in jobs_db:
        return Response(status_code=404)

    job_dir = os.path.join(OUTPUT_DIR, job_id)
    project_name = jobs_db[job_id]["project"]

    zip_path = os.path.join(OUTPUT_DIR, f"{project_name}_export_{job_id[:8]}.zip")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for temp_file, instr in payload.get("assignments", {}).items():
            src_pdf = os.path.join(job_dir, temp_file)
            if os.path.exists(src_pdf):
                safe_instrument = "".join(
                    [c for c in instr if c.isalpha() or c.isdigit() or c == " "]
                ).rstrip()
                if not safe_instrument:
                    safe_instrument = "Unknown"
                target_filename = f"{project_name} - {safe_instrument}.pdf"
                zipf.write(src_pdf, target_filename)

    jobs_db[job_id]["status"] = "completed"
    jobs_db[job_id]["result_file"] = f"{project_name}_export_{job_id[:8]}.zip"
    _save_job_meta(job_id)

    return {"status": "success", "file": jobs_db[job_id]["result_file"]}


@app.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    if job_id in jobs_db:
        del jobs_db[job_id]

    job_dir = os.path.join(OUTPUT_DIR, job_id)
    if os.path.exists(job_dir):
        shutil.rmtree(job_dir)

    # try to delete zip
    for f in os.listdir(OUTPUT_DIR):
        if f.endswith(f"{job_id[:8]}.zip"):
            try:
                os.remove(os.path.join(OUTPUT_DIR, f))
            except:
                pass

    return {"status": "success"}
