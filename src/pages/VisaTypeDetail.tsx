import { ArrowRight, ArrowUpRight, Check, ChevronLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { visaTypes } from '@/lib/content'
import { ButtonLink, InlineLink } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { PageFrame, PageIntro, Breadcrumbs } from '@/components/layout/PublicLayout'
import { NotFound } from './NotFound'

export function VisaTypeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const visa = visaTypes.find((item) => item.slug === slug)
  if (!visa) return <NotFound />

  return (
    <PageFrame>
      <Breadcrumbs items={[{ label: 'Visa types', to: '/visa-types' }, { label: visa.name }]} />
      <PageIntro title={visa.name} intro={visa.description}>
        <ButtonLink to={`/apply?visaType=${encodeURIComponent(visa.slug)}`} trailingIcon={<ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.5} />}>Start this application</ButtonLink>
      </PageIntro>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-20">
        <div>
          <section aria-labelledby="visa-overview-heading">
            <h2 className="display text-3xl" id="visa-overview-heading">At a glance</h2>
            <dl className="mt-6 grid border-y border-[var(--hairline)] sm:grid-cols-2">
              <div className="min-w-0 border-b border-[var(--hairline)] py-5 sm:border-r sm:pr-7"><dt className="text-sm normal-case tracking-normal text-[var(--stone)]">Common uses</dt><dd className="mt-2 text-[15px] leading-6 text-[var(--ink)]">{visa.commonUses}</dd></div>
              <div className="min-w-0 border-b border-[var(--hairline)] py-5 sm:pl-7"><dt className="text-sm normal-case tracking-normal text-[var(--stone)]">Validity</dt><dd className="mt-2 text-[15px] leading-6 text-[var(--ink)]">{visa.validity}</dd></div>
              <div className="min-w-0 border-b border-[var(--hairline)] py-5 sm:border-r sm:pr-7"><dt className="text-sm normal-case tracking-normal text-[var(--stone)]">Entries</dt><dd className="mt-2 text-[15px] leading-6 text-[var(--ink)]">{visa.entries}</dd></div>
              <div className="min-w-0 border-b border-[var(--hairline)] py-5 sm:pl-7"><dt className="text-sm normal-case tracking-normal text-[var(--stone)]">Typical processing</dt><dd className="mt-2 text-[15px] leading-6 text-[var(--ink)]">{visa.processing}</dd></div>
              <div className="min-w-0 py-5 sm:border-r sm:pr-7"><dt className="text-sm normal-case tracking-normal text-[var(--stone)]">Demonstration fee</dt><dd className="mt-2 text-[15px] leading-6 text-[var(--ink)] tabular-nums">From ${visa.feeUsd} USD</dd></div>
              <div className="min-w-0 py-5 sm:pl-7"><dt className="text-sm normal-case tracking-normal text-[var(--stone)]">Category</dt><dd className="mt-2 text-[15px] leading-6 text-[var(--ink)]">{visa.category}</dd></div>
            </dl>
          </section>

          <section aria-labelledby="documents-heading" className="mt-14">
            <h2 className="display text-3xl" id="documents-heading">What you’ll need</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--stone)] text-pretty">Gather these before you start. The application workspace will show any additional questions for your journey.</p>
            <ul className="mt-6 border-y border-[var(--hairline)]">
              {visa.documents.map((document) => <li className="flex gap-3 border-b border-[var(--hairline)] py-4 last:border-b-0" key={document}><Check aria-hidden="true" className="mt-1 shrink-0 text-[var(--orange)]" size={16} strokeWidth={1.5} /><span className="text-[15px]">{document}</span></li>)}
            </ul>
          </section>

          <section aria-labelledby="purpose-heading" className="mt-14">
            <h2 className="display text-3xl" id="purpose-heading">Is this the right route?</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--stone)] text-pretty">The {visa.name} is intended for {visa.commonUses.toLowerCase()}. If your purpose or travel document is different, use the eligibility checker before starting an application.</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3"><InlineLink className="inline-flex items-center gap-2" to="/eligibility">Check eligibility <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} /></InlineLink><Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-[14px] text-[var(--stone)] underline underline-offset-4 hover:text-[var(--ink)]" to="/visa-types"><ChevronLeft aria-hidden="true" size={15} strokeWidth={1.5} />All visa types</Link></div>
          </section>
        </div>

        <aside className="lg:border-l lg:border-[var(--hairline)] lg:pl-8">
          <Notice title="Prototype information">Fees, processing times and visa categories on this page are demonstration data. Always check official guidance before travelling.</Notice>
          <div className="mt-8 border-t border-[var(--hairline)] pt-6"><p className="mt-3 text-[15px] leading-6 text-[var(--stone)]">You can save your application and return to it later.</p><ButtonLink className="mt-5 w-full" to={`/apply?visaType=${encodeURIComponent(visa.slug)}`} trailingIcon={<ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} />}>Start application</ButtonLink></div>
        </aside>
      </div>
    </PageFrame>
  )
}

export default VisaTypeDetail
