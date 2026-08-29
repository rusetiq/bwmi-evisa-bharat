import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from './cn'

export function AccordionItem({ title, children, open = false, className }: { title: ReactNode; children: ReactNode; open?: boolean; className?: string }) {
  return (
    <details className={cn('group border-t border-[var(--hairline)] py-5 last:border-b', className)} open={open}>
      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 text-left text-[16px] font-medium marker:hidden [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown aria-hidden="true" className="shrink-0 text-[var(--stone)] transition-transform group-open:rotate-180" size={18} strokeWidth={1.5} />
      </summary>
      <div className="pt-3 text-[15px] leading-7 text-[var(--stone)] text-pretty">{children}</div>
    </details>
  )
}
