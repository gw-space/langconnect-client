'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Document } from '@/types/document'
import { Collection } from '@/types/collection'
import { useTranslation } from '@/hooks/use-translation'
import { FilterControls } from './FilterControls'
import { Archive } from 'lucide-react'
import { toast } from 'sonner'

interface ChunksTabProps {
  loadingChunks: boolean
  filteredDocuments: Document[]
  paginatedChunks: Document[]
  selectedChunks: string[]
  onChunkSelection: (chunk_id: string) => void
  onSelectAllChunks: (checked: boolean) => void
  openPopovers: Set<string>
  openSourcePopovers: Set<string>
  onTogglePopover: (docId: string, isOpen: boolean) => void
  onToggleSourcePopover: (sourceId: string, isOpen: boolean) => void
  availableSources: string[]
  selectedSources: string[]
  onSourceChange: (sources: string[]) => void
  currentPage: number
  totalPages: number
  onGoToPage: (page: number) => void
  onGoToPreviousPage: () => void
  onGoToNextPage: () => void
  totalCount: number
  onUpload: () => void
  selectedCollection: Collection | null
  onRefresh: () => void
}

export const ChunksTab = ({
  loadingChunks,
  filteredDocuments,
  paginatedChunks,
  selectedChunks,
  onChunkSelection,
  onSelectAllChunks,
  openPopovers,
  openSourcePopovers,
  onTogglePopover,
  onToggleSourcePopover,
  availableSources,
  selectedSources,
  onSourceChange,
  currentPage,
  totalPages,
  onGoToPage,
  onGoToPreviousPage,
  onGoToNextPage,
  totalCount,
  onUpload,
  selectedCollection,
  onRefresh
}: ChunksTabProps) => {
  const { t } = useTranslation()
  const [updatingVerified, setUpdatingVerified] = useState<string | null>(null)
  const [updatingVulnerable, setUpdatingVulnerable] = useState<string | null>(null)

  // Check if collection has verify_checkbox enabled
  const hasVerifyCheckbox = selectedCollection?.metadata?.verify_checkbox === true

  // Calculate verified and vulnerable chunks count
  const verifiedChunksCount = hasVerifyCheckbox 
    ? filteredDocuments.filter(doc => doc.metadata?.verified === true).length 
    : 0
  const vulnerableChunksCount = hasVerifyCheckbox 
    ? filteredDocuments.filter(doc => doc.metadata?.vulnerable === true).length 
    : 0

  // Helper function to format feasibility score with color coding
  const formatFeasibilityScore = (feasibility: any) => {
    if (feasibility === undefined || feasibility === null) {
      return { text: 'N/A', color: 'text-gray-500 dark:text-gray-400' }
    }
    
    let score: number
    if (typeof feasibility === 'number') {
      score = feasibility
    } else {
      const parsed = parseFloat(feasibility)
      if (isNaN(parsed)) {
        return { text: feasibility.toString(), color: 'text-gray-500 dark:text-gray-400' }
      }
      score = parsed
    }
    
    // Color coding based on score (with dark mode support)
    if (score >= 8) {
      return { text: score.toString(), color: 'text-red-600 dark:text-red-400 font-semibold' }
    } else if (score >= 6) {
      return { text: score.toString(), color: 'text-orange-600 dark:text-orange-400 font-medium' }
    } else if (score >= 4) {
      return { text: score.toString(), color: 'text-yellow-600 dark:text-yellow-400' }
    } else if (score >= 2) {
      return { text: score.toString(), color: 'text-blue-600 dark:text-blue-400' }
    } else {
      return { text: score.toString(), color: 'text-green-600 dark:text-green-400' }
    }
  }

  const handleVerifiedChange = async (documentId: string, verified: boolean) => {
    if (!selectedCollection) return

    setUpdatingVerified(documentId)
    try {
      const response = await fetch(`/api/collections/${selectedCollection.uuid}/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verified }),
      })

      const result = await response.json()
      if (!result.success) {
        toast.error('Failed to update verification status')
        return
      }

      toast.success('Verification status updated')
      onRefresh() // Refresh to get updated data
    } catch (error) {
      console.error('Failed to update verification status:', error)
      toast.error('Failed to update verification status')
    } finally {
      setUpdatingVerified(null)
    }
  }

  const handleVulnerableChange = async (documentId: string, vulnerable: boolean) => {
    if (!selectedCollection) return

    setUpdatingVulnerable(documentId)
    try {
      // vulnerable 필드는 완전히 별도 엔드포인트 사용
      const response = await fetch(`/api/collections/${selectedCollection.uuid}/documents/${documentId}/vulnerable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vulnerable }),
      })

      const result = await response.json()
      if (!result.success) {
        toast.error('Failed to update vulnerable status')
        return
      }

      toast.success('Vulnerable status updated')
      onRefresh() // Refresh to get updated data
    } catch (error) {
      console.error('Failed to update vulnerable status:', error)
      toast.error('Failed to update vulnerable status')
    } finally {
      setUpdatingVulnerable(null)
    }
  }

  if (loadingChunks) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading chunks...</p>
        </div>
      </div>
    )
  }

  if (filteredDocuments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Archive className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No chunks found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          No chunks match your current filters.
        </p>
        <Button onClick={onUpload}>
          Upload Documents
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Verification Statistics */}
      {hasVerifyCheckbox && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                Verified:
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                {verifiedChunksCount} of {totalCount} chunks
              </span>
              <span className="text-blue-500 dark:text-blue-300">
                ({Math.round((verifiedChunksCount / totalCount) * 100)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <span className="text-red-800 dark:text-red-200 font-medium">
                Vulnerable:
              </span>
              <span className="text-red-600 dark:text-red-400">
                {vulnerableChunksCount} of {totalCount} chunks
              </span>
              <span className="text-red-500 dark:text-red-300">
                ({Math.round((vulnerableChunksCount / totalCount) * 100)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      <FilterControls 
        availableSources={availableSources}
        selectedSources={selectedSources}
        onSourceChange={onSourceChange}
      />
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="w-8 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={paginatedChunks.length > 0 && paginatedChunks.every(d => selectedChunks.includes(d.id))}
                  onChange={(e) => onSelectAllChunks(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('documents.columns.source')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('documents.columns.content')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('documents.columns.characters')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('documents.columns.timestamp')}
              </th>
              {hasVerifyCheckbox && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('documents.columns.severity')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('documents.columns.score')}
                  </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('documents.columns.verified')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vulnerable
                    </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedChunks.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedChunks.includes(doc.id)}
                    onChange={() => onChunkSelection(doc.id)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </td>

                <td className="px-4 py-4">
                  <Dialog open={openSourcePopovers.has(doc.id)} onOpenChange={(open) => onToggleSourcePopover(doc.id, open)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-left">
                        <span className="text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                          {doc.metadata?.source || 'N/A'}
                        </span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[500px] max-w-[90vw]">
                      <DialogHeader>
                        <DialogTitle>Source Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Source:</span>
                          <span className="text-gray-900 dark:text-gray-100">{doc.metadata?.source || 'N/A'}</span>
                        </div>
                        <div className="text-sm flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">File ID:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono">{doc.metadata?.file_id || 'N/A'}</span>
                        </div>
                        <div className="text-sm flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Characters:</span>
                          <span className="text-gray-900 dark:text-gray-100">{doc.content.length.toLocaleString()}</span>
                        </div>
                        <div className="text-sm flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Timestamp:</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {doc.metadata?.timestamp || doc.metadata?.['created_at'] ? 
                              new Date(doc.metadata.timestamp || doc.metadata['created_at']).toLocaleString() : 
                              'N/A'}
                          </span>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
                <td className="px-4 py-4">
                  <Dialog open={openPopovers.has(doc.id)} onOpenChange={(open) => onTogglePopover(doc.id, open)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-left max-w-md">
                        <span className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                          {doc.content}
                        </span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[800px] max-w-[90vw] max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Chunk Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">ID:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono">{doc.id}</span>
                        </div>
                        <div className="text-sm flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Source:</span>
                          <span className="text-gray-900 dark:text-gray-100">{doc.metadata?.source || 'N/A'}</span>
                        </div>
                        <div className="text-sm flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">File ID:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono">{doc.metadata?.file_id || 'N/A'}</span>
                        </div>
                        <div className="text-sm flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Characters:</span>
                          <span className="text-gray-900 dark:text-gray-100">{doc.content.length.toLocaleString()}</span>
                        </div>
                        <div className="text-sm flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Timestamp:</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {doc.metadata?.timestamp || doc.metadata?.['created_at'] ? 
                              new Date(doc.metadata.timestamp || doc.metadata['created_at']).toLocaleString() : 
                              'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <Tabs defaultValue="content" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="content">Content</TabsTrigger>
                          <TabsTrigger value="metadata">Metadata</TabsTrigger>
                        </TabsList>
                        <TabsContent value="content" className="mt-4">
                          <ScrollArea className="h-[400px] max-h-[60vh]">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-7 font-normal">
                                {doc.content}
                              </div>
                            </div>
                          </ScrollArea>
                        </TabsContent>
                        <TabsContent value="metadata" className="mt-4">
                          <ScrollArea className="h-[400px] max-h-[60vh]">
                            {doc.metadata && Object.keys(doc.metadata).length > 0 ? (
                              <div className="space-y-2">
                                {Object.entries(doc.metadata).map(([key, value]) => (
                                  <div key={key} className="text-sm flex justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                                    <span className="text-gray-900 dark:text-gray-100 font-mono break-all">
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                No metadata available
                              </div>
                            )}
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {doc.content.length.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {doc.metadata?.timestamp || doc.metadata?.['created_at'] ? 
                      new Date(doc.metadata.timestamp || doc.metadata['created_at']).toLocaleString() : 
                      'N/A'}
                  </span>
                </td>
                {hasVerifyCheckbox && (
                  <>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {doc.metadata?.['severity'] || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {(() => {
                        // Try to find attack_feasibility or similar fields
                        // Note: 'attack_feasibility' is the correct spelling, 'attack_feasivility' is a typo used in prompts
                        const feasibilityValue = doc.metadata?.['attack_feasibility'] || // Correct spelling
                                               doc.metadata?.['attack_feasivility'] || // Typo version (for backward compatibility)
                                               doc.metadata?.['feasibility'] ||
                                               doc.metadata?.['score']
                        
                        const formatted = formatFeasibilityScore(feasibilityValue)
                        return (
                          <span className={`text-sm ${formatted.color}`}>
                            {formatted.text}
                          </span>
                        )
                      })()}
                    </td>
                                            <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            {updatingVerified === doc.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                            ) : (
                              <input
                                type="checkbox"
                                checked={doc.metadata?.verified === true}
                                onChange={(e) => handleVerifiedChange(doc.id, e.target.checked)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                                title="Mark as verified"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            {updatingVulnerable === doc.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <input
                                type="checkbox"
                                checked={doc.metadata?.vulnerable === true}
                                onChange={(e) => handleVulnerableChange(doc.id, e.target.checked)}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                                title="Mark as vulnerable"
                              />
                            )}
                          </div>
                        </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} / {totalPages} ({t('common.total', { count: totalCount })})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToPreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = idx + 1
                } else if (currentPage <= 3) {
                  pageNum = idx + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + idx
                } else {
                  pageNum = currentPage - 2 + idx
                }
                
                if (pageNum < 1 || pageNum > totalPages) return null
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onGoToPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
} 