from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import uuid
import zipfile
import json
import threading

class ExportJobRequest(BaseModel):
    rotation: int = 0
    do_split: bool = False
    crop: dict # x, y, width, height
    target_language: str = "Deutsch"
    auto_deskew: bool = True
    auto_enhance: bool = True
    jpeg_quality: int = 70

class FinalizeJobRequest(BaseModel):
    assignments: Dict[str, str] # temp_filename -> mapped instrument string

jobs_db = {}
DATA_DIR = os.getenv("DATA_DIR", "../data")
OUTPUT_DIR = os.path.join(DATA_DIR, "exports")
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def background_export_task(job_id: str, project_name: str, req: ExportJobRequest):
    try:
        from core.processor import process_pdf_document_pct, pdf_page_to_image, deskew_image, split_image_vertically, extract_instrument_name_ocr, apply_percentage_crop_and_center
        import fitz
        import io
        
        project_path = os.path.join(UPLOAD_DIR, project_name)
        job_dir = os.path.join(OUTPUT_DIR, job_id)
        os.makedirs(job_dir, exist_ok=True)
        
        jobs_db[job_id]["status"] = "processing"
        
        pdf_files = [f for f in os.listdir(project_path) if f.endswith('.pdf')]
        pdf_files.sort()
        results = []
        progress_val = 0
        
        for filename in pdf_files:
            source_path = os.path.join(project_path, filename)
            
            try:
                pdf_document = fitz.open(source_path)
                if pdf_document.page_count == 0:
                    continue
                    
                # Setup OCR from first page
                page = pdf_document.load_page(0)
                img_pil = pdf_page_to_image(page, dpi=150)
                img_pil = deskew_image(img_pil, 0.0, req.rotation)
                
                parts = split_image_vertically(img_pil) if req.do_split else [img_pil]
                
                # Full PDF Processing byte extraction
                # To handle split individually, we will process EACH part into a separate output.
                # Since process_pdf_document_pct works on WHOLE files, we will iterate parts here.
                
                # Since we want to just split the whole document page by page and make discrete files if do_split is true.
                
                # To keep it simple: we process the whole doc with process_pdf_document_pct
                out_bytes = process_pdf_document_pct(
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
                    jpeg_quality=req.jpeg_quality
                )
                
                # Wait, if do_split=True, out_bytes is one big PDF. Let's just output the big PDF with OCR from part 1 for now.
                # Actually, returning to user request, we just save right here.
                
                uid = uuid.uuid4().hex
                temp_filename = f"{uid}.pdf"
                with open(os.path.join(job_dir, temp_filename), "wb") as pf:
                    pf.write(out_bytes)
                
                # Getting OCR
                w, h = parts[0].size
                left = int((req.crop["x"] / 100) * w)
                top = int((req.crop["y"] / 100) * h)
                right = int(((req.crop["x"] + req.crop["width"]) / 100) * w)
                bottom = int(((req.crop["y"] + req.crop["height"]) / 100) * h)
                cropped = parts[0].crop((left, top, right, bottom))
                mapped_info, raw_text = extract_instrument_name_ocr(cropped, target_language=req.target_language)
                
                # Save small preview for frontend
                img_preview = io.BytesIO()
                cropped.save(img_preview, format='JPEG', quality=85)
                with open(os.path.join(job_dir, f"{uid}_thumb.jpg"), "wb") as imf:
                    imf.write(img_preview.getvalue())
                
                results.append({
                    "original_filename": filename,
                    "temp_file": temp_filename,
                    "raw_ocr": raw_text,
                    "instrument": mapped_info["instrument"],
                    "voice": mapped_info["voice"],
                    "key": mapped_info["key"]
                })
                
            except Exception as loop_e:
                print("Error processing file", loop_e)
            
            progress_val += 1
            jobs_db[job_id]["progress"] = progress_val
            jobs_db[job_id]["total"] = len(pdf_files)
            
        with open(os.path.join(job_dir, "results.json"), "w") as f:
            json.dump(results, f)
            
        jobs_db[job_id]["status"] = "awaiting_assignment"
        
    except Exception as e:
        jobs_db[job_id]["status"] = "failed"
        jobs_db[job_id]["error"] = str(e)
