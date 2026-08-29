import type { ReactNode } from 'react'
import { Info, TriangleAlert, CheckCircle2 } from 'lucide-react'
import { cn } from './cn'

const icons = { info: Info, warning: TriangleAlert, success: CheckCircle2 }

export function Notice({ children, title, tone = 'info', className }: { children: ReactNode; title?: ReactNode; tone?: keyof typeof icons; className?: string }) {
  const Icon = icons[tone]
  return (
    <aside className={cn('flex gap-3 rounded-2xl border border-[var(--hairline)] bg-[var(--linen)] px-5 py-4 text-[14px] leading-6 text-[var(--ink)]', tone === 'warning' && 'border-[#e4b9a9] bg-[#fbf1ed]', tone === 'success' && 'border-[var(--cobblestone)] bg-[var(--linen)]', className)} role="note">
      <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--orange)]" size={18} strokeWidth={1.6} />
      <div className="text-pretty">
        {title && <p className="mb-1 font-medium">{title}</p>}
        <div>{children}</div>
      </div>
    </aside>
  )
}
