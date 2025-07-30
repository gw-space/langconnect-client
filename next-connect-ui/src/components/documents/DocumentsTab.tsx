'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentGroup } from '@/types/document'
import { useTranslation } from '@/hooks/use-translation'

interface DocumentsTabProps {
  paginatedDocumentGroups: DocumentGroup[]
  selectedDocuments: string[]
  onDocumentSelection: (file_id: string) => void
  onSelectAllDocuments: (checked: boolean) => void
  openPopovers: Set<string>
  openSourcePopovers: Set<string>
  onTogglePopover: (docId: string, isOpen: boolean) => void
  onToggleSourcePopover: (sourceId: string, isOpen: boolean) => void
  currentPage: number
  totalPages: number
  onGoToPage: (page: number) => void
  onGoToPreviousPage: () => void
  onGoToNextPage: () => void
  totalCount: number
}

export const DocumentsTab = ({
  paginatedDocumentGroups,
  selectedDocuments,
  onDocumentSelection,
  onSelectAllDocuments,
  openPopovers,
  openSourcePopovers,
  onTogglePopover,
  onToggleSourcePopover,
  currentPage,
  totalPages,
  onGoToPage,
  onGoToPreviousPage,
  onGoToNextPage,
  totalCount
}: DocumentsTabProps) => {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="w-8 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={paginatedDocumentGroups.length > 0 && paginatedDocumentGroups.every(d => selectedDocuments.includes(d.file_id))}
                onChange={(e) => onSelectAllDocuments(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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
              {t('documents.columns.chunks')}
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
          {paginatedDocumentGroups.map((group) => (
            <tr key={group.file_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedDocuments.includes(group.file_id)}
                  onChange={() => onDocumentSelection(group.file_id)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <Popover open={openSourcePopovers.has(group.file_id)} onOpenChange={(open) => onToggleSourcePopover(group.file_id, open)}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-left">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                          {group.source}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Source Details</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{group.source}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <div><strong>File ID:</strong> {group.file_id}</div>
                          <div><strong>Chunks:</strong> {group.chunks?.length || 0}</div>
                          <div><strong>Characters:</strong> {group.total_chars.toLocaleString()}</div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {group.file_id}
                </span>
              </td>
              <td className="px-4 py-4">
                <Popover open={openPopovers.has(group.file_id)} onOpenChange={(open) => onTogglePopover(group.file_id, open)}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-left max-w-md">
                      <span className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                        {group.chunks && group.chunks.length > 0 
                          ? group.chunks[0].content 
                          : 'No content available'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] max-w-[90vw]">
                    <div className="p-4">
                      <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Document Details</h4>
                      <div className="space-y-3 text-base mb-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Source:</span>
                          <span className="text-gray-900 dark:text-gray-100">{group.source}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="font-medium text-gray-700 dark:text-gray-300">File ID:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">{group.file_id}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Chunks:</span>
                          <span className="text-gray-900 dark:text-gray-100">{group.chunks?.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Characters:</span>
                          <span className="text-gray-900 dark:text-gray-100">{group.total_chars.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Timestamp:</span>
                          <span className="text-gray-900 dark:text-gray-100 text-sm">
                            {group.timestamp && group.timestamp !== 'N/A' ? new Date(group.timestamp).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <Tabs defaultValue="chunks" className="w-full">
                        <TabsList className="grid w-full grid-cols-1">
                          <TabsTrigger value="chunks">Chunks Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="chunks" className="mt-4">
                          <ScrollArea className="h-[400px] max-h-[60vh]">
                            <div className="space-y-4">
                              {group.chunks?.slice(0, 3).map((chunk, index) => (
                                <div key={chunk.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">Chunk {index + 1}</div>
                                  <div className="text-base text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-6 line-clamp-4">
                                    {chunk.content}
                                  </div>
                                </div>
                              )) || []}
                              {group.chunks && group.chunks.length > 3 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                                  ... and {group.chunks.length - 3} more chunks
                                </div>
                              )}
                              {(!group.chunks || group.chunks.length === 0) && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                                  No chunks available
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </PopoverContent>
                </Popover>
              </td>
              <td className="px-4 py-4">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {group.chunks?.length || 0}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {group.total_chars.toLocaleString()}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="text-xs text-gray-500 dark:text-gray-300">
                  {group.timestamp && group.timestamp !== 'N/A' ? new Date(group.timestamp).toLocaleString() : 'N/A'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
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
    </div>
  )
} 