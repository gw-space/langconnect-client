export interface Document {
  id: string
  content: string
  metadata: {
    source?: string
    file_id?: string
    timestamp?: string
    verified?: boolean
    [key: string]: any
  }
}

export interface DocumentGroup {
  source: string
  file_id: string
  chunk_count: number
  total_chars: number
  created_at: string
  chunks: Document[]
  timestamp?: string
}