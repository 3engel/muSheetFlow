import base64
import io
import os
import re
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

import fitz

from core.processor import extract_instrument_name_ocr, pdf_page_to_image


def _format_group_name(instrument: str, voice: str, key: str) -> str:
    parts = [instrument or "Unknown"]
    if voice:
        parts.append(str(voice))
    if key:
        parts.append(str(key))
    return " ".join(parts)


def _make_thumbnail_b64(image_pil, max_width: int = 480, quality: int = 75) -> str:
    img = image_pil
    if img.mode != "RGB":
        img = img.convert("RGB")
    w, h = img.size
    if w > max_width:
        ratio = max_width / float(w)
        img = img.resize((max_width, int(h * ratio)))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def _analyze_page(args):
    pdf_path, page_idx, target_language, want_thumbnails = args
    doc = fitz.open(pdf_path)
    try:
        page = doc.load_page(page_idx)
        # 150 DPI is plenty for header OCR and keeps the call fast.
        img = pdf_page_to_image(page, dpi=150)
        mapped, raw_text = extract_instrument_name_ocr(
            img, target_language=target_language
        )
        thumb = _make_thumbnail_b64(img) if want_thumbnails else None
        return {
            "page": page_idx,
            "raw_ocr": raw_text,
            "instrument": mapped.get("instrument", "Unknown_Instrument"),
            "voice": mapped.get("voice", ""),
            "key": mapped.get("key", ""),
            "thumbnail": thumb,
        }
    finally:
        doc.close()


def analyze_pdf_voices(
    pdf_path: str,
    target_language: str = "Deutsch",
    include_thumbnails: bool = True,
) -> dict:
    """
    OCR each page's header, then group consecutive pages with the same
    (instrument, voice, key) tuple. Pages that yield Unknown_Instrument
    do NOT merge with neighbours so title/blank pages stay separate.
    """
    doc = fitz.open(pdf_path)
    page_count = doc.page_count
    doc.close()

    if page_count == 0:
        return {"groups": [], "page_count": 0}

    tasks = [
        (pdf_path, i, target_language, include_thumbnails) for i in range(page_count)
    ]
    with ThreadPoolExecutor(max_workers=4) as pool:
        per_page = list(pool.map(_analyze_page, tasks))

    groups: list[dict] = []
    for entry in per_page:
        is_unknown = entry["instrument"] == "Unknown_Instrument"
        key_tuple = (entry["instrument"], entry["voice"], entry["key"])

        merge_into_previous = (
            not is_unknown
            and groups
            and not groups[-1]["_is_unknown"]
            and groups[-1]["_key"] == key_tuple
        )

        if merge_into_previous:
            g = groups[-1]
            g["pages"].append(entry["page"])
            g["raw_ocr"].append(entry["raw_ocr"])
            if entry["thumbnail"]:
                g["thumbnails"].append(entry["thumbnail"])
        else:
            groups.append(
                {
                    "name": _format_group_name(
                        entry["instrument"] if not is_unknown else "Unknown",
                        entry["voice"],
                        entry["key"],
                    ),
                    "instrument": entry["instrument"],
                    "voice": entry["voice"],
                    "key": entry["key"],
                    "pages": [entry["page"]],
                    "raw_ocr": [entry["raw_ocr"]],
                    "thumbnails": [entry["thumbnail"]] if entry["thumbnail"] else [],
                    "_key": key_tuple,
                    "_is_unknown": is_unknown,
                }
            )

    for g in groups:
        g.pop("_key", None)
        g.pop("_is_unknown", None)

    return {"groups": groups, "page_count": page_count}


_SAFE_NAME_RE = re.compile(r"[^\w\-. ]+", re.UNICODE)


def _sanitize_filename(name: str, max_length: int = 120) -> str:
    cleaned = _SAFE_NAME_RE.sub("_", name).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    if not cleaned:
        cleaned = "Voice"
    return cleaned[:max_length]


def _unique_filename(directory: str, candidate: str) -> str:
    if not os.path.exists(os.path.join(directory, candidate)):
        return candidate
    stem, ext = os.path.splitext(candidate)
    n = 2
    while True:
        attempt = f"{stem} ({n}){ext}"
        if not os.path.exists(os.path.join(directory, attempt)):
            return attempt
        n += 1


def split_pdf_by_groups(
    pdf_path: str,
    groups: list[dict],
    output_dir: str,
    base_filename: str,
) -> list[str]:
    """
    Write one PDF per group into output_dir. Groups may select arbitrary
    (non-contiguous) page indices. Returns the list of created filenames.
    """
    stem, _ = os.path.splitext(base_filename)
    created: list[str] = []
    src = fitz.open(pdf_path)
    try:
        for g in groups:
            pages = g.get("pages") or []
            if not pages:
                continue

            out = fitz.open()
            try:
                for p in pages:
                    if 0 <= p < src.page_count:
                        out.insert_pdf(src, from_page=p, to_page=p)

                safe_name = _sanitize_filename(g.get("name") or "Voice")
                target = _unique_filename(output_dir, f"{stem}_{safe_name}.pdf")
                out.save(os.path.join(output_dir, target))
                created.append(target)
            finally:
                out.close()
    finally:
        src.close()
    return created
