import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from './cn'

export function EmptyState({ title, children, action, className }: { title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('border border-[var(--hairline)] bg-[var(--paper)] px-6 py-10 text-center', className)}>
      <Inbox aria-hidden="true" className="mx-auto mb-4 text-[var(--stone)]" size={24} strokeWidth={1.4} />
      <h2 className="display text-2xl text-[var(--ink)]">{title}</h2>
      {children && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--stone)] text-pretty">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
