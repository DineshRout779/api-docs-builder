import { ReactNode } from 'react'
import { Label } from './ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label?: string
  children: ReactNode
  className?: string
  hint?: string
}

export function FormField({ label, children, className, hint }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center gap-2">
          <Label>{label}</Label>
          {hint && <span className="text-xs text-muted-foreground/60 normal-case tracking-normal">{hint}</span>}
        </div>
      )}
      {children}
    </div>
  )
}
