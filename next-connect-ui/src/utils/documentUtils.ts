import { Document, DocumentGroup } from '@/types/document'

export const groupDocumentsBySource = (documents: Document[]): DocumentGroup[] => {
  const sourceGroups: { [key: string]: DocumentGroup } = {}
  
  documents.forEach(doc => {
    const metadata = doc.metadata || {}
    const file_id = metadata.file_id || 'N/A'
    const source = metadata.source || 'N/A'
    
    if (!sourceGroups[file_id]) {
      sourceGroups[file_id] = {
        source,
        file_id,
        chunks: [],
        timestamp: metadata.timestamp || 'N/A',
        total_chars: 0,
        chunk_count: 0,
        created_at: metadata['created_at'] || metadata.timestamp || new Date().toISOString()
      }
    }
    const group = sourceGroups[file_id]
    if (group) {
      group.chunks.push(doc)
      group.total_chars += doc.content.length
      group.chunk_count += 1
    }
  })

  return Object.values(sourceGroups)
}

export const filterDocumentsBySource = (documents: Document[], sources: string[]): Document[] => {
  if (sources.length === 0) return documents
  
  return documents.filter(doc => {
    const metadata = doc.metadata || {}
    const source = metadata.source || 'N/A'
    return sources.includes(source)
  })
}

export const filterDocumentGroupsBySource = (documentGroups: DocumentGroup[], sources: string[]): DocumentGroup[] => {
  if (sources.length === 0) return documentGroups
  
  return documentGroups.filter(group => sources.includes(group.source))
}

export const calculateStats = (documents: Document[], chunks: Document[], activeTab: string, documentGroups?: DocumentGroup[]) => {
  if (activeTab === 'chunks') {
    return {
      totalDocuments: documentGroups ? documentGroups.length : documents.length,
      totalChunks: chunks.length,
      totalCharacters: chunks.reduce((sum, doc) => sum + doc.content.length, 0)
    }
  } else {
    // documents 탭에서는 documentGroups를 사용
    return {
      totalDocuments: documentGroups ? documentGroups.length : documents.length,
      totalChunks: chunks.length, // chunks 탭의 총 개수
      totalCharacters: documents.reduce((sum, doc) => sum + doc.content.length, 0)
    }
  }
}

export const extractAvailableSources = (documents: Document[]): string[] => {
  const sources = new Set<string>()
  documents.forEach(doc => {
    const metadata = doc.metadata || {}
    const source = metadata.source || 'N/A'
    sources.add(source)
  })
  return Array.from(sources)
}