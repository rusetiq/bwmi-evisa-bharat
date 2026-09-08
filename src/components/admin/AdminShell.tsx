import type { ReactNode } from 'react'
import { ClipboardCheck, ExternalLink } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from '../ui/cn'
import { ADMIN_IDENTITY } from './adminUtils'

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100dvh-78px)] bg-[var(--canvas)] text-[var(--ink)]">
      <header className="border-b border-white/15 bg-[var(--espresso)] text-white">
        <div className="shell">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-5 py-5">
            <Link className="focus-ring inline-flex min-w-0 items-center gap-3 rounded-lg" to="/admin" aria-label="Review desk home">
              <span className="flex size-10 items-center justify-center border border-white/35" aria-hidden="true">
                <ClipboardCheck size={20} strokeWidth={1.35} />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block text-[14px] font-medium">Indian e-Visa</span>
                <span className="mt-1 block text-[12px] text-white/65">Review desk · prototype</span>
              </span>
            </Link>

            <div className="flex items-center gap-4 text-right">
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium">{ADMIN_IDENTITY.name}</p>
                <p className="mt-1 text-[11px] text-white/60">{ADMIN_IDENTITY.email}</p>
              </div>
              <span className="size-2 rounded-full bg-[var(--orange)]" title="Demo session active" aria-label="Demo session active" />
            </div>
          </div>

          <nav aria-label="Review desk navigation" className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-1 border-t border-white/15 py-3">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => cn('focus-ring rounded-lg py-1 text-[13px] text-white/65 hover:text-white', isActive && 'text-white underline decoration-[var(--cobblestone)] underline-offset-8')}
            >
              Overview
            </NavLink>
            <NavLink
              to="/admin/applications"
              className={({ isActive }) => cn('focus-ring rounded-lg py-1 text-[13px] text-white/65 hover:text-white', isActive && 'text-white underline decoration-[var(--cobblestone)] underline-offset-8')}
            >
              Applications
            </NavLink>
            <Link className="focus-ring ml-auto inline-flex items-center gap-1 rounded-lg py-1 text-[13px] text-white/65 hover:text-white" to="/demo">
              Demo references <ExternalLink size={13} aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="shell py-8 sm:py-12">{children}</main>

      <footer className="border-t border-[var(--hairline)] bg-[var(--linen)]">
        <div className="shell flex flex-col gap-2 py-5 text-[12px] leading-5 text-stone sm:flex-row sm:items-center sm:justify-between">
          <span>Demo review environment · fictional records only</span>
          <span>Independent redesign prototype. Not an official Government of India service.</span>
        </div>
      </footer>
    </div>
  )
}

export function AdminPageHeader({ eyebrow = 'Review desk', title, intro, actions }: { eyebrow?: string; title: string; intro?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 border-b border-[var(--hairline)] pb-8 md:flex-row md:items-end md:justify-between md:gap-10">
      <div className="max-w-3xl">

        <h1 className="display mt-3 text-balance text-[clamp(2.5rem,5vw,4.25rem)] leading-[.98]">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-[15px] leading-7 text-stone text-pretty">{intro}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}

export function AdminSection({ title, eyebrow, children, className }: { title: string; eyebrow?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('border-t border-[var(--hairline)] pt-5', className)} aria-labelledby={`admin-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>

      <h2 id={`admin-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="display mt-2 break-words text-3xl leading-tight">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function AdminStatCard({ label, value, detail, to }: { label: string; value: number | string; detail: string; to?: string }) {
  const content = (
    <div className={cn('card h-full p-5 transition-colors', to && 'hover:bg-[var(--linen)]')}>
      <p className="text-sm font-medium normal-case tracking-normal text-stone">{label}</p>
      <p className="mt-4 font-mono text-3xl tabular-nums tracking-tight">{value}</p>
      <p className="mt-2 text-[13px] leading-5 text-stone">{detail}</p>
    </div>
  )
  return to ? <Link className="focus-ring block rounded-lg" to={to} aria-label={`${label}: ${value}. View applications.`}>{content}</Link> : content
}
