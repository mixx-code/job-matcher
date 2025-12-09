// types/job.ts
export interface JobIndo {
  id: number | string
  jobs_url: string | null
  img_url: string | null
  title_jobs: string | null
  perusahaan: string | null
  jenis_pekerjaan: string | null
  lokasi: string | null
  gaji: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiResponse {
  success: boolean
  count: number
  data: JobIndo[]
  filters?: {
    lokasi: string
    jenis: string
    search: string
  }
}

export interface ApiError {
  success: boolean
  error: string
  message: string
}