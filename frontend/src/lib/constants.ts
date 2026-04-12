export const KEYS = ["", "Bb", "Eb", "F", "C"];
export const VOICES = ["", "1", "2", "3", "4", "5"];

export const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
] as const;

export const OUTPUT_FORMATS = [
  { label: "export.a4Portrait", value: "A4 Portrait" },
  { label: "export.a4Landscape", value: "A4 Landscape" },
  { label: "export.asCropped", value: "As Cropped" },
] as const;