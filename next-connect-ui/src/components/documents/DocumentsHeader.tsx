import { FileText, RefreshCw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collection } from '@/types/collection'
import { useTranslation } from '@/hooks/use-translation'

interface DocumentsHeaderProps {
  collections: Collection[]
  selectedCollection: string
  onCollectionChange: (collectionId: string) => void
  onRefresh: () => void
  onUpload: () => void
  refreshing: boolean
}

export const DocumentsHeader = ({
  collections,
  selectedCollection,
  onCollectionChange,
  onRefresh,
  onUpload,
  refreshing
}: DocumentsHeaderProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
          <FileText className="h-8 w-8 text-green-500" />
          {t('documents.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">{t('documents.description')}</p>
      </div>
      <div className="flex items-center gap-3">
        <Select value={selectedCollection} onValueChange={onCollectionChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder={t('documents.selectCollection')} />
          </SelectTrigger>
          <SelectContent>
            {collections.map((collection) => (
              <SelectItem key={collection.uuid} value={collection.uuid}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={onRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
        <Button 
          onClick={onUpload}
          disabled={!selectedCollection}
          size="sm"
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Upload className="w-4 h-4 mr-2" />
          {t('documents.uploadDocument')}
        </Button>
      </div>
    </div>
  )
} 