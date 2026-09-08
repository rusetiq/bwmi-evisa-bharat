import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

const links = [
  { to: '/visa-types', label: 'Visa types' },
  { to: '/requirements', label: 'Requirements' },
  { to: '/entry-points', label: 'Entry points' },
  { to: '/fees', label: 'Fees' },
  { to: '/help', label: 'Help' },
]

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-black text-white">
      <div className="shell py-12 md:py-16">
        <div className="grid gap-10 border-b border-white/15 pb-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
          <div>

            <p className="display mt-4 max-w-sm text-3xl leading-tight text-white">A clearer way to prepare for your journey.</p>
            <p className="mt-5 max-w-sm text-[13px] leading-6 text-white/60">This is a fictional prototype for demonstration. It is not an official Government of India website.</p>
          </div>
          <div>

            <nav aria-label="Footer navigation" className="mt-4 grid gap-3 text-[14px] text-white/75">
              {links.map((item) => <Link className="focus-ring w-fit rounded-lg hover:text-white" key={item.to} to={item.to}>{item.label}</Link>)}
            </nav>
          </div>
          <div>

            <nav aria-label="Application links" className="mt-4 grid gap-3 text-[14px] text-white/75">
              <Link className="focus-ring inline-flex w-fit items-center gap-2 rounded-lg hover:text-white" to="/eligibility">Check eligibility <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} /></Link>
              <Link className="focus-ring inline-flex w-fit items-center gap-2 rounded-lg hover:text-white" to="/find-application">Find an application <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} /></Link>
              <Link className="focus-ring inline-flex w-fit items-center gap-2 rounded-lg hover:text-white" to="/demo">Demo credentials <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} /></Link>
            </nav>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6 text-[12px] leading-5 text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>Prototype data only · Never upload real identity documents or payment details</p>
          <p>© 2026 Rusetiq · Independent redesign prototype</p>
        </div>
      </div>
    </footer>
  )
}
