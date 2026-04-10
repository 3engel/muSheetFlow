from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import uuid
import zipfile
import json
import threading
from concurrent.futures import ThreadPoolExecutor

class ExportJobRequest(BaseModel):
    rotation: int = 0
    do_split: bool = False
    crop: dict # x, y, width, height
    target_language: str = "Deutsch"
    auto_deskew: bool = True
    auto_enhance: bool = True
    remove_white_pages: bool = False
    jpeg_quality: int = 70
    output_format: str = "A4 Portrait"

class FinalizeJobRequest(BaseModel):
    assignments: Dict[str, str] # temp_filename -> mapped instrument string

jobs_db = {}
DATA_DIR = os.getenv("DATA_DIR", "../data")
OUTPUT_DIR = os.path.join(DATA_DIR, "exports")
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(OUTPUT_DIR, exist_ok=True)

_MAX_WORKERS = min(os.cpu_count() or 1, 4)


def _process_single_file(filename, project_path, job_dir, req):
    """Process a single PDF file: render, crop, enhance, OCR, save."""
    from core.processor import process_pdf_document_pct, extract_instrument_name_ocr
    import io

    source_path = os.path.join(project_path, filename)

    out_bytes, first_page_cropped = process_pdf_document_pct(
        source_path,
        base_rotation=req.rotation,
        do_split=req.do_split,
        crop_x=req.crop["x"],
        crop_y=req.crop["y"],
        crop_w=req.crop["width"],
        crop_h=req.crop["height"],
        target_language=req.target_language,
        auto_deskew_after=req.auto_deskew,
        auto_contrast=req.auto_enhance,
        remove_white_pages=req.remove_white_pages,
        jpeg_quality=req.jpeg_quality,
        output_format=req.output_format,
    )

    uid = uuid.uuid4().hex
    temp_filename = f"{uid}.pdf"
    with open(os.path.join(job_dir, temp_filename), "wb") as pf:
        pf.write(out_bytes)

    raw_text = ""
    mapped_info = {"instrument": "Unknown", "voice": "", "key": ""}

    if first_page_cropped is not None:
        mapped_info, raw_text = extract_instrument_name_ocr(
            first_page_cropped, target_language=req.target_language
        )
        img_preview = io.BytesIO()
        first_page_cropped.save(img_preview, format="JPEG", quality=85)
        with open(os.path.join(job_dir, f"{uid}_thumb.jpg"), "wb") as imf:
            imf.write(img_preview.getvalue())

    return {
        "original_filename": filename,
        "temp_file": temp_filename,
        "raw_ocr": raw_text,
        "instrument": mapped_info["instrument"],
        "voice": mapped_info["voice"],
        "key": mapped_info["key"],
    }


def background_export_task(job_id: str, project_name: str, req: ExportJobRequest):
    try:
        project_path = os.path.join(UPLOAD_DIR, project_name)
        job_dir = os.path.join(OUTPUT_DIR, job_id)
        os.makedirs(job_dir, exist_ok=True)

        jobs_db[job_id]["status"] = "processing"

        pdf_files = [f for f in os.listdir(project_path) if f.endswith(".pdf")]
        pdf_files.sort()
        jobs_db[job_id]["total"] = len(pdf_files)
        jobs_db[job_id]["progress"] = 0

        results = []
        progress_lock = threading.Lock()

        def _on_done(future):
            with progress_lock:
                jobs_db[job_id]["progress"] = jobs_db[job_id].get("progress", 0) + 1

        futures = []
        with ThreadPoolExecutor(max_workers=_MAX_WORKERS) as pool:
            for filename in pdf_files:
                f = pool.submit(
                    _process_single_file, filename, project_path, job_dir, req
                )
                f.add_done_callback(_on_done)
                futures.append((filename, f))

            # Collect results in original filename order
            for filename, f in futures:
                try:
                    result = f.result()
                    results.append(result)
                except Exception as e:
                    print(f"Error processing file {filename}: {e}")

        with open(os.path.join(job_dir, "results.json"), "w") as f:
            json.dump(results, f)

        jobs_db[job_id]["status"] = "awaiting_assignment"

    except Exception as e:
        jobs_db[job_id]["status"] = "failed"
        jobs_db[job_id]["error"] = str(e)
