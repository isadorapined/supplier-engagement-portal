import { cn } from '@/lib/utils'

const control =
  'w-full rounded-md border border-ink/25 bg-mint px-3 py-2 font-body text-sm text-ink placeholder:text-ink/40 focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay'

export function Label({ className, required, children, ...props }) {
  return (
    <label className={cn('block font-body text-sm font-medium text-ink', className)} {...props}>
      {children}
      {required ? <span className="ml-1 text-clay">(required)</span> : null}
    </label>
  )
}

export function Input({ className, ...props }) {
  return <input className={cn(control, className)} {...props} />
}

export function Textarea({ className, rows = 4, ...props }) {
  return <textarea rows={rows} className={cn(control, 'resize-y', className)} {...props} />
}

export function Select({ className, options = [], placeholder = 'Select an answer', ...props }) {
  return (
    <select className={cn(control, 'pr-8', className)} {...props}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

export function Checkbox({ className, label, ...props }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 font-body text-sm text-ink">
      <input
        type="checkbox"
        className={cn('mt-0.5 h-4 w-4 shrink-0 accent-[#B35634]', className)}
        {...props}
      />
      <span>{label}</span>
    </label>
  )
}

export function Hint({ children, className }) {
  return <p className={cn('font-body text-xs text-ink/60', className)}>{children}</p>
}
