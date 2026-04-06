import os
import json
import re

DATA_DIR = os.getenv("DATA_DIR", "../data")
MAPPING_FILE = os.path.join(DATA_DIR, "instrument_mapping.json")

DEFAULT_MAPPING = [
    {"Term": "cymbals, becken", "English": "Cymbals", "Deutsch": "Becken"},
    {"Term": "glockenspiel, chimes", "English": "Chimes", "Deutsch": "Glockenspiel"},
    {
        "Term": "double Bass, kontrabass",
        "English": "Double Bass",
        "Deutsch": "Kontrabass",
    },
    {
        "Term": "alto clarinet, altklarinette",
        "English": "Alto Clarinet",
        "Deutsch": "Altklarinette",
    },
    {"Term": "flöte, flauto, flute", "English": "Flute", "Deutsch": "Flöte"},
    {"Term": "piccolo, pikkolo", "English": "Piccolo", "Deutsch": "Piccolo"},
    {
        "Term": "klarinette, clarinetto, clarinet",
        "English": "Clarinet",
        "Deutsch": "Klarinette",
    },
    {
        "Term": "bass klarinette, bass clarinet",
        "English": "Bass Clarinet",
        "Deutsch": "Bassklarinette",
    },
    {
        "Term": "altsaxophon, sax alto, alto sax, alto saxophone",
        "English": "Alto Saxophone",
        "Deutsch": "Altsaxophon",
    },
    {
        "Term": "tenorsaxophon, tenor sax, tenor saxophon, tenor saxophone",
        "English": "Tenor Saxophone",
        "Deutsch": "Tenorsaxophon",
    },
    {
        "Term": "baritonsaxophon, baritone sax, bariton saxophon, baritone saxophone, baritone saxophon",
        "English": "Baritone Saxophone",
        "Deutsch": "Baritonsaxophon",
    },
    {"Term": "trompete, tromba, trumpet", "English": "Trumpet", "Deutsch": "Trompete"},
    {"Term": "kornett, cornet", "English": "Cornet", "Deutsch": "Kornett"},
    {
        "Term": "flügelhorn, flicorno, flugelhorn, fluegelhorn, fluegel horn, flügel horn, flugel horn",
        "English": "Flugelhorn",
        "Deutsch": "Flügelhorn",
    },
    {"Term": "horn, corno", "English": "Horn", "Deutsch": "Horn"},
    {"Term": "posaune, trombone", "English": "Trombone", "Deutsch": "Posaune"},
    {"Term": "tenorhorn", "English": "Tenorhorn", "Deutsch": "Tenorhorn"},
    {"Term": "bariton, baritone", "English": "Baritone", "Deutsch": "Bariton"},
    {"Term": "euphonium", "English": "Euphonium", "Deutsch": "Euphonium"},
    {"Term": "tuba, bass", "English": "Tuba", "Deutsch": "Tuba"},
    {
        "Term": "schlagzeug, drum set, drums",
        "English": "Drum Set",
        "Deutsch": "Schlagzeug",
    },
    {
        "Term": "percussion, perkussion",
        "English": "Percussion",
        "Deutsch": "Percussion",
    },
    {"Term": "pauken, timpani", "English": "Timpani", "Deutsch": "Pauken"},
    {"Term": "mallets, stabspiele", "English": "Mallets", "Deutsch": "Mallets"},
    {"Term": "guitar, guitarre", "English": "Guitar", "Deutsch": "Gitarre"},
    {"Term": "e-bass, electric bass", "English": "Electric Bass", "Deutsch": "E-Bass"},
    {"Term": "piano, klavier", "English": "Piano", "Deutsch": "Klavier"},
    {"Term": "oboe", "English": "Oboe", "Deutsch": "Oboe"},
    {"Term": "bassoon, fagott", "English": "Bassoon", "Deutsch": "Fagott"},
]


def load_mapping():
    if os.path.exists(MAPPING_FILE):
        try:
            with open(MAPPING_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return DEFAULT_MAPPING.copy()
    return DEFAULT_MAPPING.copy()


def save_mapping(mapping):
    with open(MAPPING_FILE, "w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=4, ensure_ascii=False)


def standardize_name(filename, target_language="English"):
    """
    Versucht, Instrument, Stimme und Tonlage aus einem Text (Dateiname oder OCR-Text) zu erkennen und
    gibt einen standardisierten Namen zurück. Ein sehr simples Beispiel.
    """
    mapping = load_mapping()
    lower_name = str(filename).lower()

    import re

    # --- Typische OCR Fehlerkorrekturen ---
    # Großes 'B' wird oft als '3' oder '8' erkannt (z.B. "3b Tuba" statt "Bb Tuba")
    lower_name = re.sub(r"\b3\s*b\b", "bb", lower_name)
    # C wird oft als Euro-Zeichen (€) erkannt
    lower_name = lower_name.replace("€", "c")

    lower_name = lower_name.replace("cc", "c")

    lower_name = lower_name.replace(">", "b")

    lower_name = lower_name.replace("ey", "eb")

    recognized_instrument = "Unknown_Instrument"
    instrument_match_span = None

    # Expandiere kommagetrennte Keys für die Suche
    search_terms = []
    for entry in mapping:
        combined_keys = entry.get("Term", "")
        targets = {
            "English": entry.get("English", ""),
            "Deutsch": entry.get("Deutsch", ""),
        }
        # Split by comma and clean up whitespace
        individual_keys = [k.strip() for k in combined_keys.split(",")]
        for single_key in individual_keys:
            if single_key:
                search_terms.append((single_key, targets))

    # Sortiere Suchbegriffe nach Länge absteigend, die präzisesten (längsten) zuerst matchen
    search_terms.sort(key=lambda x: len(x[0]), reverse=True)

    for term, targets in search_terms:
        # Einfaches prüfen, ob der Name des Instruments als wort oder wort-teil vorkommt
        # Regex \b kombiniert mit simplem 'in', weil Umlaute Regex-Wordboundry brechen können
        match = re.search(r"(?i)\b" + re.escape(term) + r"\b", lower_name)
        if match:
            instrument_match_span = match.span()
            val = targets.get(target_language, targets.get("English", term))
            recognized_instrument = val
            break

    # Stimme (1, 2, 3...) - restrict search window to be near the instrument name
    voice = ""
    search_window = lower_name
    if instrument_match_span:
        start, end = instrument_match_span
        # Nur einen Bereich von ~30 Zeichen vor und nach dem Instrumentennamen betrachten,
        # um zu verhindern, dass Seitenzahlen am Ende des Dokuments als Stimme erkannt werden.
        search_window = lower_name[max(0, start - 15) : min(len(lower_name), end + 15)]

    voice_match = re.search(r"\b([1-4]|i{1,3}|iv)\b", search_window)
    if voice_match:
        v = voice_match.group(1)
        if v == "i":
            voice = "1"
        elif v == "ii":
            voice = "2"
        elif v == "iii":
            voice = "3"
        elif v == "iv":
            voice = "4"
        else:
            voice = v

    # Tonlage (Bb, Eb, F, C...)
    key_found = ""
    key_match = re.search(r"\b(in |)(b|bb|eb|es|f|c)\b", lower_name)
    if key_match:
        found_val = key_match.group(2)
        if found_val == "es":
            found_val = "eb"
        key_found = found_val.title()

    return {"instrument": recognized_instrument, "voice": voice, "key": key_found}
