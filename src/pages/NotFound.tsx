import { ArrowLeft, ArrowRight, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { PageFrame } from '@/components/layout/PublicLayout'

export function NotFound() {
  return (
    <PageFrame>
      <div className="grid min-h-[52vh] items-center gap-10 lg:grid-cols-[1fr_280px] lg:gap-20">
        <div>
          <h1 className="display mt-5 max-w-2xl text-balance text-[clamp(3.2rem,7vw,5.7rem)] leading-[.9]">This page took a different route.</h1>
          <p className="mt-6 max-w-xl text-[17px] leading-7 text-[var(--stone)] text-pretty">The address may be out of date, or the page may have moved. Start from the e-Visa home page or browse the available guidance.</p>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><ButtonLink to="/" leadingIcon={<ArrowLeft aria-hidden="true" size={16} strokeWidth={1.5} />}>Back to home</ButtonLink></div>
        </div>
        <div className="border-t border-[var(--hairline)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><Compass aria-hidden="true" className="text-[var(--orange)]" size={28} strokeWidth={1.25} /><p className="display mt-5 text-3xl">Keep moving.</p><p className="mt-3 text-[14px] leading-6 text-[var(--stone)]">Your application, if you have one, is still safe. Find it with your reference details.</p><Link className="focus-ring mt-5 inline-block rounded-lg text-[14px] font-medium underline decoration-[var(--cobblestone)] decoration-1 underline-offset-4 hover:text-[var(--graphite)]" to="/find-application">Find an application</Link></div>
      </div>
    </PageFrame>
  )
}

export default NotFound
