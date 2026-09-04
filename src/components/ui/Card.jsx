import { cn } from '@/lib/utils'

export function Card({ className, tone = 'mint', ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-ink/10 p-6 sm:p-7',
        tone === 'mint' ? 'bg-mint' : 'bg-silver',
        className,
      )}
      {...props}
    />
  )
}
