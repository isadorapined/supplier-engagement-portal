import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex items-center justify-center rounded-md font-body font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55',
  {
    variants: {
      variant: {
        // Burnt Clay carries every primary action.
        primary: 'bg-clay text-mint hover:bg-[#9c4a2d]',
        // Deep Teal is the secondary.
        secondary: 'bg-teal text-mint hover:bg-[#2d5433]',
        outline: 'border border-ink/25 bg-transparent text-ink hover:bg-ink/5',
        ghost: 'bg-transparent text-ink hover:bg-ink/5',
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
    defaultVariants: { variant: 'primary', size: 'md', block: false },
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
