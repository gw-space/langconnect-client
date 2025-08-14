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
    if (!selectedCollection) return

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
        for (let i = 1; i < 30; i++) { // 30배치로 늘려서 90,000개까지
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
      toast.error('Chunks 로딩 실패')
    } finally {
      setLoadingChunks(false)
    }
  }, [selectedCollection, t])

  const clearChunksCache = useCallback(() => {
    setChunks([])
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