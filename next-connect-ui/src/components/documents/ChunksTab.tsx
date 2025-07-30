'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Document } from '@/types/document'
import { useTranslation } from '@/hooks/use-translation'
import { FilterControls } from './FilterControls'
import { Archive } from 'lucide-react'

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
  onUpload
}: ChunksTabProps) => {
  const { t } = useTranslation()

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
                {t('documents.columns.fileId')}
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
                  <Popover open={openSourcePopovers.has(doc.id)} onOpenChange={(open) => onToggleSourcePopover(doc.id, open)}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-left">
                        <span className="text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                          {doc.metadata?.source || 'N/A'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Source Details</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{doc.metadata?.source || 'N/A'}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <div><strong>File ID:</strong> {doc.metadata?.file_id || 'N/A'}</div>
                          <div><strong>Characters:</strong> {doc.content.length.toLocaleString()}</div>
                          <div><strong>Timestamp:</strong> {doc.metadata?.timestamp || doc.metadata?.created_at ? 
                            new Date(doc.metadata.timestamp || doc.metadata.created_at).toLocaleString() : 
                            'N/A'}</div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                    {doc.metadata?.file_id || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <Popover open={openPopovers.has(doc.id)} onOpenChange={(open) => onTogglePopover(doc.id, open)}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-left max-w-md">
                        <span className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                          {doc.content}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[600px] max-w-[90vw]">
                      <div className="p-4">
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Chunk Details</h4>
                        <div className="space-y-3 text-base mb-4">
                          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="font-medium text-gray-700 dark:text-gray-300">ID:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">{doc.id}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Source:</span>
                            <span className="text-gray-900 dark:text-gray-100">{doc.metadata?.source || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="font-medium text-gray-700 dark:text-gray-300">File ID:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">{doc.metadata?.file_id || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Characters:</span>
                            <span className="text-gray-900 dark:text-gray-100">{doc.content.length.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Timestamp:</span>
                            <span className="text-gray-900 dark:text-gray-100 text-sm">
                              {doc.metadata?.timestamp || doc.metadata?.created_at ? 
                                new Date(doc.metadata.timestamp || doc.metadata.created_at).toLocaleString() : 
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
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <div className="space-y-3 text-base">
                                    {Object.entries(doc.metadata).map(([key, value]) => (
                                      <div key={key} className="py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">{key}</div>
                                        <div className="text-gray-900 dark:text-gray-100 break-words font-mono text-sm bg-white dark:bg-gray-900 p-2 rounded border">
                                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                                  No metadata available
                                </div>
                              )}
                            </ScrollArea>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </PopoverContent>
                  </Popover>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {doc.content.length.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs text-gray-500 dark:text-gray-300">
                    {doc.metadata?.timestamp || doc.metadata?.created_at ? 
                      new Date(doc.metadata.timestamp || doc.metadata.created_at).toLocaleString() : 
                      'N/A'}
                  </div>
                </td>
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