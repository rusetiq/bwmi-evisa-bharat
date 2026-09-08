import type { ReactNode } from 'react'
import { cn } from './cn'

export type BadgeTone = 'neutral' | 'action' | 'success' | 'danger' | 'orange'

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return <span className={cn('status', tone === 'action' && 'status-action', tone === 'success' && 'status-success', tone === 'danger' && 'status-danger', tone === 'orange' && 'border-[#d9691a] bg-[#fff7f0] text-[#8c3d00]', className)}>{children}</span>
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-sm normal-case tracking-normal text-[var(--stone)]', className)}>{children}</p>
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('text-sm normal-case tracking-normal text-[var(--stone)]', className)}>{children}</span>
}
