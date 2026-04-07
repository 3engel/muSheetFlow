export type Job = {
  id: string
  project: string
  status: string
  progress: number
  total: number
  target_language: "Deutsch" | "English"
  error?: string
  result_file?: string
}

export type Mapping = {
  Term: string
  Deutsch: string
  English: string
}

export interface JobResult {
  original_filename: string
  temp_file: string
  raw_ocr: string
  instrument: string
  voice: string
  key: string
}

export type Project = {
  name: string
  file_count: number
}


export type FileInfo = {
  filename: string
  size: number
  created_at: string
}

export type ProjectSettings = {
  rotation: number
  do_split: boolean
  crop_x: number
  crop_y: number
  crop_w: number
  crop_h: number
  auto_deskew: boolean
  auto_enhance: boolean
  jpeg_quality: number
  target_language: string
  tab: string
}