import { Button } from './ui/button'
import { Plus } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  onAdd?: () => void
  addLabel?: string
}

export function SectionHeader({ title, onAdd, addLabel = 'Add' }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2 mt-2">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</h3>
      {onAdd && (
        <Button variant="ghost" size="sm" onClick={onAdd} className="h-6 gap-1 text-xs text-primary hover:text-primary">
          <Plus size={12} /> {addLabel}
        </Button>
      )}
    </div>
  )
}
