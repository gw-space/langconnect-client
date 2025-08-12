'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Trash2, FileText, Loader2, Archive, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { UploadDocumentModal } from '@/components/modals/upload-document-modal'

import { useTranslation } from '@/hooks/use-translation'

// Custom hooks
import { useCollections } from '@/hooks/useCollections'
import { useDocuments } from '@/hooks/useDocuments'
import { useChunks } from '@/hooks/useChunks'
import { usePagination } from '@/hooks/usePagination'

// Components
import { DocumentsHeader } from '@/components/documents/DocumentsHeader'
import { LoadingSkeleton } from '@/components/documents/LoadingSkeleton'
import { EmptyState } from '@/components/documents/EmptyStates'
import { DocumentsTab } from '@/components/documents/DocumentsTab'
import { ChunksTab } from '@/components/documents/ChunksTab'

// Utils
import { filterDocumentsBySource, filterDocumentGroupsBySource, calculateStats, extractAvailableSources } from '@/utils/documentUtils'
import { exportChunksToExcel } from '@/utils/excelExport'

export default function DocumentsPage() {
  const { t } = useTranslation()
  
  // Custom hooks
  const { collections, selectedCollection, setSelectedCollection, fetchCollections } = useCollections()
  const { documents, documentGroups, loading, refreshing, setRefreshing, fetchDocuments } = useDocuments(selectedCollection)
  const { chunks, chunksLoaded, loadingChunks, loadChunksForCollection, clearChunksCache } = useChunks(selectedCollection)
  
  // Local state
  const [activeTab, setActiveTab] = useState('documents')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [selectedChunks, setSelectedChunks] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [openPopovers, setOpenPopovers] = useState<Set<string>>(new Set())
  const [openSourcePopovers, setOpenSourcePopovers] = useState<Set<string>>(new Set())
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [exportLoading, setExportLoading] = useState(false)

  // Derived state
  const availableSources = useMemo(() => extractAvailableSources(documents), [documents])
  const filteredDocumentGroups = useMemo(() => 
    filterDocumentGroupsBySource(documentGroups, selectedSources), 
    [documentGroups, selectedSources]
  )
  const filteredDocuments = useMemo(() => {
    const docs = activeTab === 'chunks' ? chunks : documents
    return filterDocumentsBySource(docs, selectedSources)
  }, [activeTab, chunks, documents, selectedSources])

  // Get current selected collection object
  const currentCollection = useMemo(() => 
    collections.find(c => c.uuid === selectedCollection) || null, 
    [collections, selectedCollection]
  )

    // Excel export function
  const handleExport = useCallback(async () => {
    if (!selectedCollection || !chunksLoaded) {
      toast.error(t('documents.messages.exportError'))
      return
    }

    if (!chunks || chunks.length === 0) {
      toast.error('내보낼 청크 데이터가 없습니다.')
      return
    }

    setExportLoading(true)
    try {
      const collectionName = currentCollection?.name || 'collection'
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${collectionName}_chunks_${timestamp}.xlsx`
      
      console.log('Starting export with:', chunks.length, 'chunks')
      exportChunksToExcel(chunks, filename)
      
      toast.success(`${chunks.length}개의 청크를 성공적으로 내보냈습니다.`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : '엑셀 내보내기 중 오류가 발생했습니다.')
    } finally {
      setExportLoading(false)
    }
  }, [selectedCollection, chunksLoaded, chunks, currentCollection, t])

  // Pagination
  const itemsPerPage = 10
  const { 
    currentPage, 
    totalPages, 
    paginatedItems: paginatedDocumentGroups, 
    goToPage, 
    goToNextPage, 
    goToPreviousPage
  } = usePagination(filteredDocumentGroups, itemsPerPage)

  const { 
    currentPage: currentChunksPage, 
    totalPages: totalChunksPages, 
    paginatedItems: paginatedChunks, 
    goToPage: goToChunksPage, 
    goToNextPage: goToNextChunksPage, 
    goToPreviousPage: goToPreviousChunksPage 
  } = usePagination(filteredDocuments, itemsPerPage)

  // Stats
  const stats = useMemo(() => calculateStats(documents, chunks, activeTab), [documents, chunks, activeTab])

  // Effects
  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  useEffect(() => {
    if (selectedCollection) {
      fetchDocuments()
      clearChunksCache()
    }
  }, [selectedCollection, fetchDocuments, clearChunksCache])

  useEffect(() => {
    if (activeTab === 'chunks' && selectedCollection && !chunksLoaded.has(selectedCollection)) {
      loadChunksForCollection()
    }
  }, [activeTab, selectedCollection, chunksLoaded, loadChunksForCollection])

  useEffect(() => {
    setSelectedSources(availableSources)
  }, [availableSources])

  // Event handlers
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchDocuments()
    clearChunksCache()
    if (activeTab === 'chunks') {
      loadChunksForCollection()
    }
  }, [fetchDocuments, clearChunksCache, loadChunksForCollection, activeTab, setRefreshing])

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedCollection) return

    const selectedIds = activeTab === 'documents' ? selectedDocuments : selectedChunks
    if (selectedIds.length === 0) return

    try {
      setDeleting(true)
      
      // Documents 탭에서는 file_ids를, Chunks 탭에서는 document_ids를 사용
      const requestBody = activeTab === 'documents' 
        ? { file_ids: selectedIds }
        : { document_ids: selectedIds }

      const response = await fetch(`/api/collections/${selectedCollection}/documents`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const res = await response.json()
      if (!res.success) {
        toast.error(t('common.error'), {
          description: res.message || t('documents.messages.deleteError')
        })
        return
      }

      toast.success(t('documents.messages.deleteSuccess'))
      setSelectedDocuments([])
      setSelectedChunks([])
      handleRefresh()
    } catch (error) {
      console.error('Failed to delete documents:', error)
      toast.error(t('common.error'), {
        description: t('documents.messages.deleteError')
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }, [selectedCollection, activeTab, selectedDocuments, selectedChunks, handleRefresh, t])

  const toggleDocumentSelection = (file_id: string) => {
    setSelectedDocuments(prev => 
      prev.includes(file_id) 
        ? prev.filter(id => id !== file_id)
        : [...prev, file_id]
    )
  }

  const toggleChunkSelection = (chunk_id: string) => {
    setSelectedChunks(prev => 
      prev.includes(chunk_id) 
        ? prev.filter(id => id !== chunk_id)
        : [...prev, chunk_id]
    )
  }

  const togglePopover = (docId: string, isOpen: boolean) => {
    setOpenPopovers(prev => {
      const newSet = new Set(prev)
      if (isOpen) {
        newSet.add(docId)
      } else {
        newSet.delete(docId)
      }
      return newSet
    })
  }

  const toggleSourcePopover = (sourceId: string, isOpen: boolean) => {
    setOpenSourcePopovers(prev => {
      const newSet = new Set(prev)
      if (isOpen) {
        newSet.add(sourceId)
      } else {
        newSet.delete(sourceId)
      }
      return newSet
    })
  }

  const handleSelectAllDocuments = (checked: boolean) => {
    if (checked) {
      const currentPageIds = paginatedDocumentGroups.map(d => d.file_id)
      setSelectedDocuments([...new Set([...selectedDocuments, ...currentPageIds])])
    } else {
      const currentPageIds = paginatedDocumentGroups.map(d => d.file_id)
      setSelectedDocuments(selectedDocuments.filter(id => !currentPageIds.includes(id)))
    }
  }

  const handleSelectAllChunks = (checked: boolean) => {
    if (checked) {
      const currentPageIds = paginatedChunks.map(d => d.id)
      setSelectedChunks([...new Set([...selectedChunks, ...currentPageIds])])
    } else {
      const currentPageIds = paginatedChunks.map(d => d.id)
      setSelectedChunks(selectedChunks.filter(id => !currentPageIds.includes(id)))
    }
  }

  return (
    <div className="min-h-screen p-6 bg-background dark:bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
                <DocumentsHeader
          collections={collections}
          selectedCollection={selectedCollection}
          onCollectionChange={setSelectedCollection}
          onRefresh={handleRefresh}
          onUpload={() => setShowUploadModal(true)}
          onExport={handleExport}
          refreshing={refreshing}
          exportLoading={exportLoading}
        />

        {/* Loading State */}
        {loading && !refreshing && <LoadingSkeleton />}

        {/* Empty State */}
        {!loading && selectedCollection && stats.totalDocuments === 0 && <EmptyState onUpload={() => setShowUploadModal(true)} />}

        {/* Content */}
        {!loading && selectedCollection && stats.totalDocuments > 0 && (
          <>
            {/* Statistics */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('collections.stats.documents')}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.totalDocuments}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('collections.stats.chunks')}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.totalChunks}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Characters</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.totalCharacters.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents and Chunks Tabs */}
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-500" />
                      {t('documents.title')}
                    </CardTitle>
                    <CardDescription>
                      {((activeTab === 'documents' ? selectedDocuments : selectedChunks).length > 0) 
                        ? t('common.selected', { count: (activeTab === 'documents' ? selectedDocuments : selectedChunks).length })
                        : activeTab === 'documents' 
                          ? t('common.total', { count: filteredDocumentGroups.length })
                          : t('common.total', { count: filteredDocuments.length })}
                    </CardDescription>
                  </div>
                  {(selectedDocuments.length > 0 || selectedChunks.length > 0) && (
                    <div className="flex items-center gap-2">
                      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            {t('common.delete')} ({activeTab === 'documents' ? selectedDocuments.length : selectedChunks.length})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('documents.messages.deleteConfirm', { 
                                count: activeTab === 'documents' ? selectedDocuments.length : selectedChunks.length 
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteSelected}
                              disabled={deleting}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {t('common.deleting')}
                                </>
                              ) : (
                                t('common.delete')
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t('documents.tabs.documents')}
                    </TabsTrigger>
                    <TabsTrigger value="chunks" className="flex items-center gap-2">
                      <Archive className="h-4 w-4" />
                      {t('documents.tabs.chunks')}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="documents" className="mt-6">
                    {loading ? (
                      <LoadingSkeleton />
                    ) : filteredDocumentGroups.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No documents found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          No documents match your current filters.
                        </p>
                        <Button onClick={() => setShowUploadModal(true)}>
                          Upload Documents
                        </Button>
                      </div>
                    ) : (
                      <DocumentsTab
                        paginatedDocumentGroups={paginatedDocumentGroups}
                        selectedDocuments={selectedDocuments}
                        onDocumentSelection={toggleDocumentSelection}
                        onSelectAllDocuments={handleSelectAllDocuments}
                        openPopovers={openPopovers}
                        openSourcePopovers={openSourcePopovers}
                        onTogglePopover={togglePopover}
                        onToggleSourcePopover={toggleSourcePopover}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onGoToPage={goToPage}
                        onGoToPreviousPage={goToPreviousPage}
                        onGoToNextPage={goToNextPage}
                        totalCount={filteredDocumentGroups.length}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="chunks" className="mt-6">
                    <ChunksTab
                      loadingChunks={loadingChunks}
                      filteredDocuments={filteredDocuments}
                      paginatedChunks={paginatedChunks}
                      selectedChunks={selectedChunks}
                      onChunkSelection={toggleChunkSelection}
                      onSelectAllChunks={handleSelectAllChunks}
                      openPopovers={openPopovers}
                      openSourcePopovers={openSourcePopovers}
                      onTogglePopover={togglePopover}
                      onToggleSourcePopover={toggleSourcePopover}
                      availableSources={availableSources}
                      selectedSources={selectedSources}
                      onSourceChange={setSelectedSources}
                      currentPage={currentChunksPage}
                      totalPages={totalChunksPages}
                      onGoToPage={goToChunksPage}
                      onGoToPreviousPage={goToPreviousChunksPage}
                      onGoToNextPage={goToNextChunksPage}
                      totalCount={filteredDocuments.length}
                      onUpload={() => setShowUploadModal(true)}
                      selectedCollection={currentCollection}
                      onRefresh={handleRefresh}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        collections={collections}
        onSuccess={handleRefresh}
      />
    </div>
  )
}