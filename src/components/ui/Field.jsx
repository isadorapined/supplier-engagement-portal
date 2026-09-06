import { cn } from '@/lib/utils'

// Spec 10.4 — the defining detail of the form treatment. Mint Cream field,
// Deep Teal rule underneath, and nothing on the other three sides. Do not add
// a full border, an outline, or a box shadow here: the contrast between the
// Mint Cream field and the Silver container is what makes the field visible.
// Keyboard focus is still marked, by the :focus-visible rule in index.css.
const control =
  'w-full rounded-none border-0 border-b-2 border-teal bg-mint px-3 py-2 font-body text-sm text-ink placeholder:text-ink/45'

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
        className={cn('mt-0.5 h-4 w-4 shrink-0 accent-[#37663E]', className)}
        {...props}
      />
      <span>{label}</span>
    </label>
  )
}

export function Hint({ children, className }) {
  return <p className={cn('font-body text-xs text-ink', className)}>{children}</p>
}

// The ESRS reference and question id that sit beside a question. Deep Teal,
// small, uppercase, tracked — no chip, no tint.
export function QuestionMeta({ id, esrs, kind }) {
  return (
    <p data-qid={id} className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-teal">
      {id}
      {esrs && esrs !== '—' ? <span className="ml-2 font-normal">ESRS {esrs}</span> : null}
      {kind ? <span className="ml-2 font-normal">· {kind}</span> : null}
    </p>
  )
}
