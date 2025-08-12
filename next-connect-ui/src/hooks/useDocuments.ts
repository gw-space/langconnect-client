import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Document, DocumentGroup } from '@/types/document'
import { useTranslation } from './use-translation'

export const useDocuments = (selectedCollection: string) => {
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDocuments = useCallback(async () => {
    if (!selectedCollection) return

    try {
      setLoading(true)
      // Fetch all documents using pagination
      let allDocuments: Document[] = []
      let offset = 0
      const limit = 3000

      while (true) {
        const response = await fetch(
          `/api/collections/${selectedCollection}/documents?limit=${limit}&offset=${offset}`
        )
        const res = await response.json()
        if (!res.success) {
          toast.error(t('common.error'), {
            description: t('documents.messages.fetchError')
          })
          break
        }
        const docs = res.data
        if (!docs || docs.length === 0) break
        allDocuments = allDocuments.concat(docs)
        if (docs.length < limit) break
        offset += limit
      }

      setDocuments(allDocuments)

      // Group documents by source/file_id for the documents tab
      const sourceGroups: { [key: string]: DocumentGroup } = {}
      allDocuments.forEach(doc => {
        const metadata = doc.metadata || {}
        const file_id = metadata.file_id || 'N/A'
        const source = metadata.source || 'N/A'
        
        if (!sourceGroups[file_id]) {
          sourceGroups[file_id] = {
            source,
            file_id,
            chunks: [],
            timestamp: metadata.timestamp || metadata['created_at'] || metadata['date'] || 'N/A',
            total_chars: 0,
            chunk_count: 0,
            created_at: metadata['created_at'] || metadata.timestamp || metadata['date'] || new Date().toISOString()
          }
        }
        const group = sourceGroups[file_id]
        if (group) {
          group.chunks.push(doc)
          group.total_chars += doc.content.length
          group.chunk_count += 1
        }
      })

      const groups = Object.values(sourceGroups)
      setDocumentGroups(groups)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      toast.error(t('common.error'), {
        description: t('documents.messages.fetchError')
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedCollection, t])

  return {
    documents,
    documentGroups,
    loading,
    refreshing,
    setRefreshing,
    fetchDocuments
  }
} 