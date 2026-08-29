import { useMemo, useState } from 'react'
import { ArrowRight, Calculator } from 'lucide-react'
import { countries, visaTypes } from '@/lib/content'
import { calculateVisaFee } from '@/lib/domain'
import { ButtonLink } from '@/components/ui/Button'
import { Field, SelectInput } from '@/components/ui/Field'
import { Notice } from '@/components/ui/Notice'
import { PageFrame, PageIntro } from '@/components/layout/PublicLayout'

export function Fees() {
  const [nationality, setNationality] = useState(countries[0])
  const [visaType, setVisaType] = useState(visaTypes[0].slug)
  const [duration, setDuration] = useState('standard')
  const selectedVisa = visaTypes.find((visa) => visa.slug === visaType) ?? visaTypes[0]
  const fee = useMemo(() => calculateVisaFee(nationality, visaType, duration), [nationality, visaType, duration])

  return (
    <PageFrame>
      <PageIntro eyebrow="Plan your budget" title="A simple fee estimate." intro="Choose a nationality, visa category and duration to see the demonstration fee summary. The figures below are not official fees." />

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:gap-20">
        <section aria-labelledby="fee-calculator-heading" className="max-w-2xl">
          <div className="flex items-start gap-4 border-b border-[var(--hairline)] pb-6"><span className="flex size-10 items-center justify-center border border-[var(--hairline)] bg-[var(--paper)]"><Calculator aria-hidden="true" className="text-[var(--orange)]" size={19} strokeWidth={1.35} /></span><div><p className="eyebrow text-[var(--stone)]">Demonstration calculator</p><h2 className="display mt-2 text-3xl" id="fee-calculator-heading">What would your journey cost?</h2></div></div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Field label="Nationality" htmlFor="fee-nationality"><SelectInput id="fee-nationality" value={nationality} onChange={(event) => setNationality(event.target.value)}>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</SelectInput></Field>
            <Field label="Visa type" htmlFor="fee-visa-type"><SelectInput id="fee-visa-type" value={visaType} onChange={(event) => { setVisaType(event.target.value); setDuration('standard') }}>{visaTypes.map((visa) => <option key={visa.slug} value={visa.slug}>{visa.name}</option>)}</SelectInput></Field>
            <Field label="Duration" htmlFor="fee-duration" hint={selectedVisa.slug === 'e-tourist' ? 'Tourist visas have a separate 30-day demonstration rate.' : 'The prototype uses one standard rate for this category.'}><SelectInput id="fee-duration" value={duration} onChange={(event) => setDuration(event.target.value)}><option value="standard">Standard duration</option>{selectedVisa.slug === 'e-tourist' && <option value="30-days">Up to 30 days</option>}</SelectInput></Field>
          </div>
          <Notice className="mt-9" title="Fees shown here are demonstration data">The final amount in a real service can depend on nationality, visa category, service charges and current policy.</Notice>
        </section>

        <aside className="h-fit rounded-3xl border border-[var(--hairline)] bg-[var(--paper)] p-6 md:p-8">
          <p className="eyebrow text-[var(--stone)]">Fee summary</p>
          <h2 className="display mt-3 text-3xl">{selectedVisa.name}</h2>
          <p className="mt-2 text-[13px] text-[var(--stone)]">For applicants travelling on a {nationality} passport</p>
          <dl className="mt-8 border-y border-[var(--hairline)] py-2">
            <div className="flex items-center justify-between gap-5 border-b border-[var(--hairline)] py-4 text-[14px]"><dt className="text-[var(--stone)]">Visa fee</dt><dd className="tabular-nums">${fee.visaFee.toFixed(2)} USD</dd></div>
            <div className="flex items-center justify-between gap-5 border-b border-[var(--hairline)] py-4 text-[14px]"><dt className="text-[var(--stone)]">Transaction charge</dt><dd className="tabular-nums">${fee.transactionCharge.toFixed(2)} USD</dd></div>
            <div className="flex items-center justify-between gap-5 py-5 text-[16px] font-medium"><dt>Total</dt><dd className="tabular-nums">${fee.total.toFixed(2)} USD</dd></div>
          </dl>
          <ButtonLink className="mt-7 w-full" to={`/apply?nationality=${encodeURIComponent(nationality)}&visaType=${encodeURIComponent(visaType)}`} trailingIcon={<ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} />}>Start application</ButtonLink>
        </aside>
      </div>
    </PageFrame>
  )
}

export default Fees
