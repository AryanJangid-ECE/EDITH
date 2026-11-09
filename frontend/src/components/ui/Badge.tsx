import { cn } from '@/lib/cn'

type BadgeProps = {
  children: React.ReactNode
  tone?: 'neutral' | 'simulated' | 'real' | 'success' | 'warn' | 'risk'
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  const tones = {
    neutral: 'border-line bg-surface text-muted',
    simulated: 'border-[#9B8CFF]/60 bg-[#9B8CFF]/10 text-[#D9D2FF]',
    real: 'border-[#3DDC97]/60 bg-[#3DDC97]/10 text-[#D9FDEB]',
    success: 'border-trusted/60 bg-trusted/10 text-trusted',
    warn: 'border-watch/60 bg-watch/10 text-watch',
    risk: 'border-risk/60 bg-risk/10 text-risk',
  }

  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[0.18em] uppercase', tones[tone])}>{children}</span>
}
