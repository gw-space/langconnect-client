import { Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FilterControlsProps {
  availableSources: string[]
  selectedSources: string[]
  onSourceChange: (sources: string[]) => void
}

export const FilterControls = ({
  availableSources,
  selectedSources,
  onSourceChange
}: FilterControlsProps) => {
  if (availableSources.length <= 1) return null

  return (
    <div className="mb-4 flex items-center gap-2">
      <Filter className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-600 dark:text-gray-400">Source Filter:</span>
      <Select 
        value={selectedSources.length === availableSources.length ? 'all' : selectedSources[0] || ''}
        onValueChange={(value) => {
          if (value === 'all') {
            onSourceChange(availableSources)
          } else {
            onSourceChange([value])
          }
        }}
      >
        <SelectTrigger className="w-64">
          <SelectValue>
            {selectedSources.length === availableSources.length 
              ? 'All Sources' 
              : selectedSources.length === 1 
                ? selectedSources[0] 
                : `${selectedSources.length} sources selected`}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {availableSources.map((source) => (
            <SelectItem key={source} value={source}>
              {source}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 