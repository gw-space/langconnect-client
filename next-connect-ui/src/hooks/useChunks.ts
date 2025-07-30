import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Document } from '@/types/document'
import { useTranslation } from './use-translation'

export const useChunks = (selectedCollection: string) => {
  const { t } = useTranslation()
  const [chunks, setChunks] = useState<Document[]>([])
  const [chunksLoaded, setChunksLoaded] = useState<Set<string>>(new Set())
  const [loadingChunks, setLoadingChunks] = useState(false)

  const loadChunksForCollection = useCallback(async () => {
    if (!selectedCollection || chunksLoaded.has(selectedCollection)) return

    try {
      setLoadingChunks(true)
      
      const fetchBatch = async (batchOffset: number) => {
        const response = await fetch(
          `/api/collections/${selectedCollection}/documents?limit=3000&offset=${batchOffset}`
        )
        const res = await response.json()
        if (!res.success) {
          throw new Error(res.message || 'Failed to fetch chunks')
        }
        return res.data || []
      }

      // Fetch all chunks in parallel batches
      const batchSize = 3000
      const batches = []
      let offset = 0
      
      // First, get one batch to determine total count
      const firstBatch = await fetchBatch(0)
      if (firstBatch.length === 0) {
        setChunks([])
        setChunksLoaded(prev => new Set(prev).add(selectedCollection))
        return
      }

      batches.push(firstBatch)
      
      // If there are more chunks, fetch them in parallel
      if (firstBatch.length === batchSize) {
        const remainingBatches = []
        for (let i = 1; i < 10; i++) { // Limit to 10 batches to avoid too many requests
          remainingBatches.push(fetchBatch(i * batchSize))
        }
        
        const results = await Promise.all(remainingBatches)
        results.forEach(batch => {
          if (batch.length > 0) {
            batches.push(batch)
          }
        })
      }

      const allChunks = batches.flat()
      setChunks(allChunks)
      setChunksLoaded(prev => new Set(prev).add(selectedCollection))
    } catch (error) {
      console.error('Failed to load chunks:', error)
      toast.error(t('common.error'), {
        description: t('documents.messages.fetchError')
      })
    } finally {
      setLoadingChunks(false)
    }
  }, [selectedCollection, chunksLoaded, t])

  const clearChunksCache = useCallback(() => {
    setChunksLoaded(prev => {
      const newSet = new Set(prev)
      newSet.delete(selectedCollection)
      return newSet
    })
  }, [selectedCollection])

  return {
    chunks,
    chunksLoaded,
    loadingChunks,
    loadChunksForCollection,
    clearChunksCache
  }
} 