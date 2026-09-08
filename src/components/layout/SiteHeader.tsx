import { useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Landmark, Menu, X, ArrowUpRight, FlaskConical } from 'lucide-react'
import { cn } from '../ui/cn'
import { ButtonLink } from '../ui/Button'

const primaryLinks = [
  { to: '/', label: 'e-Visa', end: true },
  { to: '/visa-types', label: 'Visa types' },
  { to: '/requirements', label: 'Requirements' },
  { to: '/entry-points', label: 'Entry points' },
  { to: '/help', label: 'Help' },
  { to: '/demo', label: 'Demo' },
]

function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <Link className="navbar-brand focus-ring inline-flex items-center gap-3 rounded-lg" to="/" onClick={onClick} aria-label="Indian e-Visa home">
      <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--ink)] text-[var(--canvas)]" aria-hidden="true">
        <Landmark size={20} strokeWidth={1.25} />
      </span>
      <span className="leading-tight">
        <span className="block text-[14px] font-medium">Government of India</span>
        <span className="mt-1 block text-[12px] text-[var(--stone)]">Indian e-Visa · redesign</span>
      </span>
    </Link>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  return (
    <header className={cn('site-navbar top-0 z-40 border-b border-[var(--hairline)] bg-[color:rgba(248,248,246,.96)] text-[var(--ink)] backdrop-blur-md', open ? 'relative xl:sticky' : 'sticky')} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        setOpen(false)
        toggleRef.current?.focus()
      }
    }}>
      <div className="shell">
        <div className="flex min-h-[76px] items-center justify-between gap-5">
          <Wordmark onClick={() => setOpen(false)} />

          <nav aria-label="Primary navigation" className="primary-navbar hidden items-center gap-4 xl:flex">
            {primaryLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn('navbar-link focus-ring rounded-lg px-3 py-2 text-[14px] text-[var(--stone)] hover:text-[var(--ink)]', isActive && 'is-active text-[var(--ink)]')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="navbar-actions hidden items-center gap-4 xl:flex">
            <Link className="focus-ring rounded-lg text-[14px] text-[var(--graphite)] hover:text-[var(--ink)]" to="/find-application">Find application</Link>
            <ButtonLink className="min-h-10 px-4" to="/apply" trailingIcon={<ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.5} />}>Apply for e-Visa</ButtonLink>
          </div>

          <button
            ref={toggleRef}
            aria-controls="mobile-navigation"
            aria-expanded={open}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            className="navbar-toggle focus-ring inline-flex size-11 items-center justify-center rounded-lg border border-[var(--hairline)] bg-white xl:hidden"
            type="button"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" size={20} strokeWidth={1.5} /> : <Menu aria-hidden="true" size={20} strokeWidth={1.5} />}
          </button>
        </div>

        {open && (
          <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-navbar border-t border-[var(--hairline)] py-4 xl:hidden">
            <div className="grid gap-1">
              {primaryLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => cn('focus-ring rounded-lg px-3 py-3 text-[15px] text-[var(--graphite)] hover:bg-white', isActive && 'bg-[var(--linen)] text-[var(--ink)]')}
                >
                  {item.label}
                </NavLink>
              ))}
              <Link className="focus-ring rounded-lg px-3 py-3 text-[15px] text-[var(--graphite)] hover:bg-white" to="/find-application" onClick={() => setOpen(false)}>Find application</Link>
              <ButtonLink className="mt-3 w-full" to="/apply" onClick={() => setOpen(false)} trailingIcon={<ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.5} />}>Apply for e-Visa</ButtonLink>
            </div>
          </nav>
        )}
      </div>
      <div className="navbar-notice border-t border-[var(--hairline)] bg-white/70">
        <Link className="shell flex min-h-8 items-center justify-center gap-2 px-1 py-1 text-center text-[11px] leading-4 text-[var(--stone)] hover:text-[var(--ink)] sm:whitespace-nowrap sm:py-0" to="/demo">
          <FlaskConical aria-hidden="true" className="text-[var(--orange)]" size={13} />Independent prototype · Try the seeded demo applications
        </Link>
      </div>
    </header>
  )
}
