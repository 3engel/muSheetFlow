import PIL.Image

PIL.Image.MAX_IMAGE_PIXELS = None
import cv2
import numpy as np
import fitz  # PyMuPDF
from PIL import Image, ImageDraw
import io
import pytesseract
from core.mapping import standardize_name
import math


def pdf_page_to_image(page, dpi=300):
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    return img


def pdf_page_to_array(page, dpi=300):
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
        pix.height, pix.width, pix.n
    )
    return img[:, :, :3].copy()


def deskew_image(image_pil, manual_angle=0.0, base_rotation=0):
    if base_rotation != 0:
        image_pil = image_pil.rotate(
            base_rotation, expand=True, fillcolor=(255, 255, 255)
        )
    if manual_angle != 0.0:
        image_pil = image_pil.rotate(
            -manual_angle, expand=True, fillcolor=(255, 255, 255)
        )
    return image_pil


def rotate_array(image_arr, angle):
    normalized = angle % 360
    if normalized == 0:
        return image_arr
    if normalized == 90:
        return np.rot90(image_arr, 1).copy()
    if normalized == 180:
        return np.rot90(image_arr, 2).copy()
    if normalized == 270:
        return np.rot90(image_arr, 3).copy()
    return np.array(
        Image.fromarray(image_arr).rotate(
            angle,
            expand=True,
            fillcolor=(255, 255, 255),
        )
    )


def deskew_array(image_arr, manual_angle=0.0, base_rotation=0):
    if base_rotation != 0:
        image_arr = rotate_array(image_arr, base_rotation)
    if manual_angle != 0.0:
        image_arr = rotate_array(image_arr, -manual_angle)
    return image_arr


def split_image_vertically(image_pil):
    w, h = image_pil.size
    mid = w // 2
    left = image_pil.crop((0, 0, mid, h))
    right = image_pil.crop((mid, 0, w, h))
    return [left, right]


def split_array_vertically(image_arr):
    mid = image_arr.shape[1] // 2
    return [image_arr[:, :mid, :], image_arr[:, mid:, :]]


def enhance_contrast_v1(image_pil):
    """Dynamische Graustufen-Optimierung: Notenlinien bleiben scharf mit weichen Kanten, Hintergrund wird weiß."""
    # Konvertiere in L (Graustufen)
    gray = np.array(image_pil.convert("L"))

    # 1. Leichte Weichzeichnung erhält Anti-Aliasing, bevor der Kontrast greift.
    blurred = cv2.GaussianBlur(gray, (0, 0), sigmaX=0.5, sigmaY=0.5)

    # 2. Tonwertspreizung, die sanfter als Percentile ist und Pixelblöcke vermeidet:
    # Weißpunkt festlegen, um Papier perfekt weiß zu machen (spart Dateigröße bei PDF und lässt Kontrast hoch)
    alpha = 1.7  # Kontrastanhebung deutlich erhöht für satteres Schwarz
    beta = (
        -80
    )  # Helligkeit stärker absenken, damit die Noten richtig "knackig" dunkel werden

    adjusted = cv2.convertScaleAbs(blurred, alpha=alpha, beta=beta)

    # 3. Falls CLAHE benötigt würde, wäre es hier, aber eine saubere Kontraststreckung
    # (wie NAPS2 sie macht) ist oft das, was "hohe Qualität" bei Noten bedeutet,
    # ohne künstliche Kompressionsblöcke durch extreme Equalization zu generieren.
    
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    adjusted = clahe.apply(adjusted)

    return Image.fromarray(adjusted)

def enhance_contrast_v2(image_pil):
    # 1. In Graustufen umwandeln
    gray = np.array(image_pil.convert("L"))
    
    # 2. CLAHE ZUERST anwenden
    # Das verstärkt die verblassten Notenlinien, BEVOR wir den globalen Kontrast anheben
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced_gray = clahe.apply(gray)
    
    # 3. Sanfter Blur zur Rauschunterdrückung
    #blurred = cv2.GaussianBlur(gray, (1, 1), 0)
    
    # 4. Dynamische Normalisierung statt fixer Werte
    # Dies dehnt das Histogramm auf den vollen Bereich (0-255) aus
    normalized = cv2.normalize(enhanced_gray, None, 0, 255, cv2.NORM_MINMAX)
    
    # 5. Optional: Ein leichter Gamma-Check
    # Wenn das Bild immer noch zu hell ist, dunkeln wir die Mitteltöne ab
    # (Gamma < 1.0 macht das Bild kräftiger)
    gamma = 0.8
    invGamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** invGamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
    final = cv2.LUT(normalized, table)

    return Image.fromarray(final)

def enhance_contrast_v3(image_pil):
    img = np.array(image_pil.convert("L"))

    # 1. Build luminance histogram
    counts = np.bincount(img.ravel(), minlength=256).astype(np.int64)
    total = int(counts.sum())

    d_counts = counts / total

    padded = np.concatenate(([0, 0], d_counts, [0, 0]))
    peaks = []
    for i in range(256):
        pi = i + 2  # index in padded array
        if d_counts[i] > padded[pi - 1] and d_counts[i] > padded[pi - 2] and \
           d_counts[i] > padded[pi + 1] and d_counts[i] > padded[pi + 2]:
            p = {"value": i, "height": d_counts[i],
                 "left_bottom": d_counts[i], "right_bottom": d_counts[i],
                 "left": i, "right": i, "mass": d_counts[i]}
            # Extend left
            for j in range(i - 1, -1, -1):
                if d_counts[j] < p["left_bottom"] or (j > 0 and d_counts[j - 1] < p["left_bottom"]):
                    p["left_bottom"] = min(p["left_bottom"], d_counts[j])
                    p["left"] = j
                    p["mass"] += d_counts[j]
                else:
                    break
            # Extend right
            for j in range(i + 1, 256):
                if d_counts[j] < p["right_bottom"] or (j < 255 and d_counts[j + 1] < p["right_bottom"]):
                    p["right_bottom"] = min(p["right_bottom"], d_counts[j])
                    p["right"] = j
                    p["mass"] += d_counts[j]
                else:
                    break
            peaks.append(p)

    if not peaks:
        return image_pil
       
    def magnitude(h):
        return math.log10(1e4 * h + 1)

    def white_score(p):
        v_score = (p["value"] / 255.0) ** 3
        m_score = math.log10(100 * p["mass"]) if p["mass"] > 0.1 else 10 * p["mass"]
        return v_score * m_score

    def black_score(p):
        v_score = (1 - p["value"] / 255.0) ** 3
        h_score = magnitude(p["height"]) - magnitude(min(p["left_bottom"], p["right_bottom"]))
        return v_score * h_score

    white_peak = max(peaks, key=white_score)
    black_peak = max(peaks, key=black_score)

    if white_peak["value"] <= black_peak["value"]:
        return image_pil

    PERCENTILE = 0.2

    white_total = int(counts[white_peak["left"]:white_peak["right"] + 1].sum())
    white_cumul = 0
    white_point = white_peak["right"]
    for i in range(white_peak["left"], white_peak["right"]):
        white_cumul += counts[i]
        if white_cumul >= PERCENTILE * white_total:
            white_point = i
            break

    black_total = int(counts[:black_peak["right"] + 1].sum())
    black_cumul = 0
    black_point = black_peak["left"]
    for i in range(black_peak["right"], black_peak["left"], -1):
        black_cumul += counts[i]
        if black_cumul >= PERCENTILE * black_total:
            black_point = i
            break

    if white_point <= black_point:
        return image_pil

    GAMMA = 2.2
    MULTIPLIER = 16
    MAX_LUM = 255 * MULTIPLIER

    i_to_l = np.array([int(round(((x / 255.0) ** (1 / GAMMA)) * MAX_LUM)) for x in range(256)], dtype=np.int32)
    l_to_i = np.array([int(round(((x / MAX_LUM) ** GAMMA) * 255)) for x in range(MAX_LUM + 1)], dtype=np.uint8)

    black_l = int(i_to_l[black_point])
    white_l = int(i_to_l[white_point])
    denom = white_l - black_l
    if denom <= 0:
        return image_pil

    lut = np.zeros(256, dtype=np.uint8)
    for v in range(256):
        clamped = max(black_point, min(v, white_point))
        lum = int(i_to_l[clamped])
        stretched = (lum - black_l) * MAX_LUM // denom
        stretched = max(0, min(stretched, MAX_LUM))
        lut[v] = l_to_i[stretched]

    result = lut[img]
    return Image.fromarray(result)

def auto_deskew_cropped(image_pil):
    """Auto-deskew after cropping based on horizontal stave lines."""
    img_cv = np.array(image_pil.convert("L"))
    edges = cv2.Canny(img_cv, 50, 150, apertureSize=3)
    (h, w) = img_cv.shape[:2]
    min_len = int(w * 0.2)
    lines = cv2.HoughLinesP(
        edges, 1, np.pi / 180, threshold=100, minLineLength=min_len, maxLineGap=20
    )

    angles = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            if -10 <= angle <= 10:
                angles.append(angle)

    best_angle = 0.0
    if len(angles) > 0:
        best_angle = float(np.median(angles))

    if abs(best_angle) < 0.1:
        return image_pil

    # Rotate using PIL on RGB for better anti-aliasing before binarization
    return image_pil.rotate(
        -best_angle, expand=True, resample=Image.BICUBIC, fillcolor=(255, 255, 255)
    )


def extract_instrument_name_ocr(image_pil, target_language="English"):
    """Crops the top 15% of the first page to OCR the instrument name."""
    w, h = image_pil.size
    top_region = image_pil.crop((0, 0, w, int(h * 0.15)))

    # Skalierung für schnellere OCR: Überschriften brauchen meist keine volle 300DPI Auflösung
    if top_region.width > 1200:
        ratio = 1200.0 / top_region.width
        top_region = top_region.resize(
            (1200, int(top_region.height * ratio)), Image.Resampling.BILINEAR
        )

    cv_img = np.array(top_region.convert("L"))
    _, thresh = cv2.threshold(cv_img, 150, 255, cv2.THRESH_BINARY)
    # psm 4: Assume a single column of text of variable sizes (oder 6 für uniform block).
    # Das ist extrem viel schneller als der standard (psm 3), der das ganze Bild analysiert.
    text = pytesseract.image_to_string(thresh, lang="eng+deu+ita", config="--psm 4")

    cleaned_text = " ".join(text.split())
    return standardize_name(cleaned_text, target_language=target_language), cleaned_text


def generate_overlay(
    pdf_paths, base_rotation=0, manual_angle=0.0, do_split=False, dpi=75
):
    def grow_overlay_canvas(blended, height, width):
        if blended is None:
            return np.full((height, width, 3), 255, dtype=np.uint8)
        if height <= blended.shape[0] and width <= blended.shape[1]:
            return blended

        grown = np.full(
            (max(height, blended.shape[0]), max(width, blended.shape[1]), 3),
            255,
            dtype=np.uint8,
        )
        grown[: blended.shape[0], : blended.shape[1]] = blended
        return grown

    def blend_overlay(blended, image_arr):
        h, w = image_arr.shape[:2]
        blended = grow_overlay_canvas(blended, h, w)
        blended[:h, :w] = np.minimum(blended[:h, :w], image_arr[:, :, :3])
        return blended

    def generate_overlay_chunk(chunk_paths):
        blended = None

        for path in chunk_paths:
            pdf_document = None
            try:
                pdf_document = fitz.open(path)
                for page_num in range(pdf_document.page_count):
                    page = pdf_document.load_page(page_num)
                    image_arr = pdf_page_to_array(page, dpi=dpi)
                    image_arr = deskew_array(image_arr, manual_angle, base_rotation)

                    parts = (
                        split_array_vertically(image_arr) if do_split else [image_arr]
                    )
                    for part in parts:
                        blended = blend_overlay(blended, part)
            except Exception as exc:
                print(f"Overlay generation failed for {path}: {exc}")
            finally:
                if pdf_document is not None:
                    pdf_document.close()

        return blended

    blended = None
    chunk_size = 8

    for chunk_start in range(0, len(pdf_paths), chunk_size):
        chunk_overlay = generate_overlay_chunk(
            pdf_paths[chunk_start : chunk_start + chunk_size]
        )
        if chunk_overlay is not None:
            blended = blend_overlay(blended, chunk_overlay)

    return None if blended is None else Image.fromarray(blended)

def apply_percentage_crop_and_center(
    image_pil,
    x_pct,
    y_pct,
    w_pct,
    h_pct,
    margin_mm=0,
    dpi=300,
    is_preview=False,
    auto_fix_deskew=False,
    enhance=False,
):
    w, h = image_pil.size

    left = int((x_pct / 100.0) * w)
    top = int((y_pct / 100.0) * h)
    right = int(((x_pct + w_pct) / 100.0) * w)
    bottom = int(((y_pct + h_pct) / 100.0) * h)

    # Safeties
    left = max(0, min(left, w - 1))
    right = max(left + 1, min(right, w))
    top = max(0, min(top, h - 1))
    bottom = max(top + 1, min(bottom, h))

    cropped = image_pil.crop((left, top, right, bottom))

    if auto_fix_deskew and not is_preview:
        cropped = auto_deskew_cropped(cropped)

    a4_w = int((210 / 25.4) * dpi)
    a4_h = int((297 / 25.4) * dpi)
    margin_px = int((margin_mm / 25.4) * dpi)

    cw, ch = cropped.size

    scale_w = (a4_w - 2 * margin_px) / float(cw)
    scale_h = (a4_h - 2 * margin_px) / float(ch)
    scale = min(scale_w, scale_h)

    new_w = int(cw * scale)
    new_h = int(ch * scale)

    if new_w > 0 and new_h > 0:
        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    else:
        resized = cropped

    final_canvas = Image.new("RGB", (a4_w, a4_h), (255, 255, 255))
    paste_x = (a4_w - new_w) // 2
    paste_y = (a4_h - new_h) // 2
    final_canvas.paste(resized, (paste_x, paste_y))

    if enhance and not is_preview:
        final_canvas = enhance_contrast_v3(final_canvas)

    return final_canvas


def process_pdf_document_pct(
    pdf_path,
    base_rotation=0,
    manual_angle=0.0,
    do_split=False,
    crop_x=0.0,
    crop_y=0.0,
    crop_w=100.0,
    crop_h=100.0,
    auto_deskew_after=True,
    auto_contrast=True,
    create_searchable=True,
    target_language="English",
    jpeg_quality=70,
):
    pdf_document = fitz.open(pdf_path)
    output_pdf = fitz.open()

    for page_num in range(pdf_document.page_count):
        page = pdf_document.load_page(page_num)
        img_pil = pdf_page_to_image(page, dpi=300)
        img_pil = deskew_image(img_pil, manual_angle, base_rotation)

        parts = split_image_vertically(img_pil) if do_split else [img_pil]

        for idx, part in enumerate(parts):
            final_img = apply_percentage_crop_and_center(
                part,
                crop_x,
                crop_y,
                crop_w,
                crop_h,
                margin_mm=0,
                dpi=300,
                is_preview=False,
                auto_fix_deskew=auto_deskew_after,
                enhance=auto_contrast,
            )

            img_byte_arr = io.BytesIO()
            if final_img.mode == "1":
                final_img.save(img_byte_arr, format="PNG")
            else:
                final_img.save(img_byte_arr, format="JPEG", quality=jpeg_quality)

            # Image Rect for A4 dimensions (standardized to 72 DPI internally by PyMuPDF)
            rect = fitz.Rect(
                0, 0, final_img.width * 72 / 300, final_img.height * 72 / 300
            )
            page_pdf = output_pdf.new_page(width=rect.width, height=rect.height)
            page_pdf.insert_image(rect, stream=img_byte_arr.getvalue())

            if create_searchable:
                try:
                    pdf_bytes = pytesseract.image_to_pdf_or_hocr(
                        final_img.convert("RGB"),
                        extension="pdf",
                        lang="eng+deu+ita",
                        config="-c textonly_pdf=1",
                    )
                    text_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                    page_pdf.show_pdf_page(rect, text_doc, 0)
                    text_doc.close()
                except Exception as e:
                    print(f"OCR Error auf Seite {page_num}: {e}")

    out_bytes = output_pdf.tobytes()
    pdf_document.close()
    output_pdf.close()
    return out_bytes
