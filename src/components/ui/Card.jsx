import { cn } from '@/lib/utils'

// Three tones, one per surface rule in Section 10:
//   silver — every form container and panel (10.4), on a Mint Cream page
//   dark   — the six choice cards (10.3), on a Mint Cream section
//   mint   — Key Resources only, which keeps its v2.0 light treatment
const TONES = {
  silver: 'bg-silver',
  dark: 'bg-ink',
  mint: 'bg-mint border border-ink/10',
}

export function Card({ className, tone = 'silver', ...props }) {
  return <div className={cn('rounded-lg p-6 sm:p-7', TONES[tone], className)} {...props} />
}
