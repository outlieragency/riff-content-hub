import { cn } from '@/lib/utils'
import {
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'

const baseInputClass =
  'w-full bg-card border border-border rounded-[8px] px-3 py-2 text-base text-foreground placeholder:text-text-muted outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors disabled:bg-background disabled:text-muted-foreground'

export function FieldRow({
  label,
  hint,
  error,
  children,
  required,
  className,
}: {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
  required?: boolean
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(baseInputClass, props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(baseInputClass, 'resize-y min-h-[72px] py-2', props.className)}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(baseInputClass, 'pr-8 cursor-pointer appearance-none bg-no-repeat bg-[length:14px_14px] bg-[right_10px_center]', props.className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
      }}
    />
  )
}
