import { FileText, Archive, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'

interface EmptyStateProps {
  onUpload: () => void
}

export const EmptyState = ({ onUpload }: EmptyStateProps) => {
  const { t } = useTranslation()

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-gray-200/50 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-green-50 dark:bg-green-900/20 p-8 mb-6">
          <FileText className="h-16 w-16 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('documents.title')}</h3>
        <p className="text-gray-500 dark:text-gray-300 text-center mb-8 max-w-md">
          {t('documents.noDocumentsDescription')}
        </p>
        <Button 
          onClick={onUpload}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Upload className="w-5 h-5 mr-2" />
          {t('documents.uploadDocument')}
        </Button>
      </div>
    </div>
  )
}

export const EmptyDocumentsState = ({ onUpload }: EmptyStateProps) => {
  const { t } = useTranslation()

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-gray-200/50 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 p-8 mb-6">
          <FileText className="h-16 w-16 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('documents.title')}</h3>
        <p className="text-gray-500 dark:text-gray-300 text-center mb-8 max-w-md">
          {t('documents.noDocumentsDescription')}
        </p>
        <Button 
          onClick={onUpload}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Upload className="w-5 h-5 mr-2" />
          {t('documents.uploadDocument')}
        </Button>
      </div>
    </div>
  )
}

export const EmptyChunksState = ({ onUpload }: EmptyStateProps) => {
  const { t } = useTranslation()

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-gray-200/50 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-purple-50 dark:bg-purple-900/20 p-8 mb-6">
          <Archive className="h-16 w-16 text-purple-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('collections.stats.chunks')}</h3>
        <p className="text-gray-500 dark:text-gray-300 text-center mb-8 max-w-md">
          {t('documents.noDocumentsDescription')}
        </p>
        <Button 
          onClick={onUpload}
          className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Upload className="w-5 h-5 mr-2" />
          {t('documents.uploadDocument')}
        </Button>
      </div>
    </div>
  )
} 