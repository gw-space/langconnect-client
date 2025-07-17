export interface Document {
  id: string
  content: string
  metadata: {
    source?: string
    file_id?: string
    timestamp?: string
    [key: string]: any
  }
}

export interface DocumentGroup {
  source: string
  file_id: string
  chunk_count: number
  total_chars: number
  created_at: string
  // For backward compatibility with existing UI code
  chunks?: Document[]
  timestamp?: string
}