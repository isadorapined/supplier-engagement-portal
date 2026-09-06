import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Spec 10.5. The variant names are the behaviours, not the colours, so the
// rule is readable at every call site: a button that submits cannot be given
// the navigation colour by accident.
const button = cva(
  'inline-flex items-center justify-center rounded-md font-body font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55',
  {
    variants: {
      variant: {
        // Submits a form. Ends a flow.
        submit: 'bg-teal text-mint hover:bg-[#2d5433]',
        // Navigates, opens, downloads, or resets. Nothing is submitted.
        nav: 'bg-clay text-mint hover:bg-[#9c4a2d]',
        // Steps backwards. Plain Deep Space Blue text, no fill.
        back: 'bg-transparent text-ink hover:bg-ink/5',
      },
      size: {
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
        sm: 'px-3 py-1.5 text-xs',
      },
      block: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'nav', size: 'md', block: false },
  },
)

export function Button({ className, variant, size, block, as: Tag = 'button', ...props }) {
  return (
    <Tag
      className={cn(button({ variant, size, block }), className)}
      {...(Tag === 'button' ? { type: props.type ?? 'button' } : null)}
      {...props}
    />
  )
}
