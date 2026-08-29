import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export function PublicLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  // Applicant, payment and print pages provide their own main landmark.
  const hasOwnMain = pathname === '/apply' || pathname.startsWith('/apply/') || pathname === '/find-application' || pathname.startsWith('/payment/') || pathname.startsWith('/application/')
  return (
    <div className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)]">
      <SiteHeader />
      {hasOwnMain ? <div className="route-enter" key={pathname}>{children}</div> : <main className="route-enter" key={pathname}>{children}</main>}
      <SiteFooter />
    </div>
  )
}

export function PageFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`shell py-14 md:py-20 ${className}`}>{children}</div>
}

export function PageIntro({ eyebrow, title, intro, children }: { eyebrow?: ReactNode; title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-8 border-b border-[var(--hairline)] pb-10 md:flex-row md:items-end md:justify-between md:gap-12 md:pb-12">
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow mb-4 text-[var(--stone)]">{eyebrow}</p>}
        <h1 className="display text-balance text-[clamp(2.8rem,6vw,4.65rem)] leading-[.98] text-[var(--ink)]">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-[17px] leading-7 text-[var(--stone)] text-pretty">{intro}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-7 text-[12px] text-[var(--stone)]">
      <ol className="flex flex-wrap items-center gap-2">
        <li><Link className="focus-ring rounded-lg hover:text-[var(--ink)]" to="/">Home</Link></li>
        {items.map((item, index) => (
          <li className="flex items-center gap-2" key={`${item.label}-${index}`}>
            <span aria-hidden="true">/</span>
            {item.to ? <Link className="focus-ring rounded-lg hover:text-[var(--ink)]" to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function SplitRule({ children }: { children: ReactNode }) {
  return <div className="grid gap-8 border-b border-[var(--hairline)] py-8 md:grid-cols-[minmax(180px,.7fr)_minmax(0,1.3fr)] md:gap-12">{children}</div>
}
