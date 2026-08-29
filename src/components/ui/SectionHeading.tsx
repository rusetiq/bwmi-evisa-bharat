import type { ReactNode } from 'react'
import { cn } from './cn'

export function SectionHeading({ eyebrow, title, intro, align = 'left', className }: { eyebrow?: ReactNode; title: ReactNode; intro?: ReactNode; align?: 'left' | 'center'; className?: string }) {
  return (
    <div className={cn(align === 'center' && 'mx-auto max-w-2xl text-center', className)}>
      {eyebrow && <p className="eyebrow mb-3 text-[var(--stone)]">{eyebrow}</p>}
      <h1 className="display text-balance text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.05] text-[var(--ink)]">{title}</h1>
      {intro && <p className="mt-5 max-w-2xl text-[17px] leading-7 text-[var(--stone)] text-pretty">{intro}</p>}
    </div>
  )
}

export function SectionTitle({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return <h2 className={cn('display text-balance text-[clamp(1.85rem,3vw,2.35rem)] leading-[1.15] text-[var(--ink)]', className)} id={id}>{children}</h2>
}
