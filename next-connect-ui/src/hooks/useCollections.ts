import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Collection } from '@/types/collection'
import { useTranslation } from './use-translation'

export const useCollections = () => {
  const { t } = useTranslation()
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('')

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/collections')
      const res = await response.json()
      if (!res.success) {
        toast.error(t('common.error'), {
          description: t('collections.messages.fetchError')
        })
        setCollections([])
        return
      }
      
      const collectionsData: Collection[] = res.data
      setCollections(collectionsData)
      
      if (collectionsData.length > 0 && !selectedCollection) {
        setSelectedCollection(collectionsData[0].uuid)
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error)
      toast.error(t('common.error'), {
        description: t('collections.messages.fetchError')
      })
    }
  }, [t, selectedCollection])

  return {
    collections,
    selectedCollection,
    setSelectedCollection,
    fetchCollections
  }
} 