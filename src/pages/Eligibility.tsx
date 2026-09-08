import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Check, ChevronLeft, RotateCcw, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { calculateVisaFee } from '@/lib/domain'
import { countries, visaTypes } from '@/lib/content'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Field, SelectInput, TextInput } from '@/components/ui/Field'
import { Notice } from '@/components/ui/Notice'
import { PageFrame, PageIntro } from '@/components/layout/PublicLayout'

type EligibilityRule = {
  nationality: string
  passportTypes: string[]
  supportedVisaTypes: string[]
  minDaysBeforeArrival: number
  maxDaysBeforeArrival: number
  restrictions?: string[]
}

const mockRules: EligibilityRule[] = [
  { nationality: 'United States', passportTypes: ['ordinary'], supportedVisaTypes: ['e-tourist', 'e-business', 'e-medical', 'e-medical-attendant', 'e-conference', 'e-student'], minDaysBeforeArrival: 4, maxDaysBeforeArrival: 180 },
  { nationality: 'United Kingdom', passportTypes: ['ordinary'], supportedVisaTypes: ['e-tourist', 'e-business', 'e-medical', 'e-medical-attendant', 'e-conference', 'e-student'], minDaysBeforeArrival: 4, maxDaysBeforeArrival: 180 },
  { nationality: 'United Arab Emirates', passportTypes: ['ordinary'], supportedVisaTypes: ['e-tourist', 'e-business', 'e-medical', 'e-medical-attendant', 'e-conference'], minDaysBeforeArrival: 4, maxDaysBeforeArrival: 180 },
  { nationality: 'Australia', passportTypes: ['ordinary'], supportedVisaTypes: ['e-tourist', 'e-business', 'e-medical', 'e-medical-attendant', 'e-conference', 'e-student'], minDaysBeforeArrival: 4, maxDaysBeforeArrival: 180 },
  { nationality: 'Canada', passportTypes: ['ordinary'], supportedVisaTypes: ['e-tourist', 'e-business', 'e-medical', 'e-medical-attendant', 'e-conference', 'e-student'], minDaysBeforeArrival: 4, maxDaysBeforeArrival: 180 },
  { nationality: 'France', passportTypes: ['ordinary'], supportedVisaTypes: ['e-tourist', 'e-business', 'e-medical', 'e-medical-attendant', 'e-conference', 'e-student'], minDaysBeforeArrival: 4, maxDaysBeforeArrival: 180 },
  { nationality: 'Germany', passportTypes: ['ordinary'], supportedVisaTypes: ['e-tourist', 'e-business', 'e-medical', 'e-medical-attendant', 'e-conference', 'e-student'], minDaysBeforeArrival: 4, maxDaysBeforeArrival: 180 },
  { nationality: 'Japan', passportTypes: ['ordinary'], supportedVisaTypes: ['e-tourist', 'e-business', 'e-medical', 'e-medical-attendant', 'e-conference', 'e-student'], minDaysBeforeArrival: 4, maxDaysBeforeArrival: 180 },
  { nationality: 'Singapore', passportTypes: ['ordinary'], supportedVisaTypes: ['e-tourist', 'e-business', 'e-medical', 'e-medical-attendant', 'e-conference', 'e-student'], minDaysBeforeArrival: 4, maxDaysBeforeArrival: 180 },
]

const steps = [
  { label: 'Nationality', key: 'nationality' },
  { label: 'Passport', key: 'passportType' },
  { label: 'Purpose', key: 'purpose' },
  { label: 'Arrival', key: 'arrival' },
  { label: 'Length of visit', key: 'duration' },
] as const

type Answers = { nationality: string; passportType: string; purpose: string; arrival: string; duration: string }

const initialAnswers: Answers = { nationality: '', passportType: 'ordinary', purpose: 'tourism', arrival: '', duration: '30' }

function daysUntil(date: string) {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const arrival = new Date(`${date}T00:00:00`).getTime()
  return Math.ceil((arrival - start) / 86_400_000)
}

function evaluate(answers: Answers) {
  const rule = mockRules.find((item) => item.nationality === answers.nationality)
  const visaSlug = { tourism: 'e-tourist', business: 'e-business', medical: 'e-medical', conference: 'e-conference', study: 'e-student' }[answers.purpose] ?? 'e-tourist'
  if (!rule) return { eligible: false, reason: 'This nationality is not included in the demonstration e-Visa rules. Please view the broader visa guidance for next steps.', visaSlug }
  if (!rule.passportTypes.includes(answers.passportType)) return { eligible: false, reason: 'The selected passport type is not supported by this demonstration e-Visa route. A regular visa route may be more suitable.', visaSlug }
  if (!rule.supportedVisaTypes.includes(visaSlug)) return { eligible: false, reason: 'The selected purpose is not available for this nationality in the demonstration rules. Another visa route may be more suitable.', visaSlug }
  const days = daysUntil(answers.arrival)
  if (days < rule.minDaysBeforeArrival) return { eligible: false, reason: `Applications in this demonstration should be started at least ${rule.minDaysBeforeArrival} days before arrival. Choose a later date or view visa guidance.`, visaSlug }
  if (days > rule.maxDaysBeforeArrival) return { eligible: false, reason: `Applications in this demonstration can be started up to ${rule.maxDaysBeforeArrival} days before arrival. Choose a date closer to your trip or view visa guidance.`, visaSlug }
  return { eligible: true, reason: '', visaSlug }
}

export function Eligibility() {
  const [answers, setAnswers] = useState<Answers>(initialAnswers)
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<ReturnType<typeof evaluate> | null>(null)
  const [error, setError] = useState('')
  const current = steps[step]
  const resultVisa = useMemo(() => visaTypes.find((item) => item.slug === result?.visaSlug) ?? visaTypes[0], [result])
  const fee = result ? calculateVisaFee(answers.nationality, result.visaSlug, answers.duration === '30' ? '30-days' : 'standard') : null

  function update(key: keyof Answers, value: string) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [key]: value }))
    setError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!answers[current.key]) {
      setError(`Choose your ${current.label.toLowerCase()} to continue.`)
      return
    }
    if (step < steps.length - 1) {
      setStep((value) => value + 1)
      return
    }
    setResult(evaluate(answers))
  }

  function reset() {
    setAnswers(initialAnswers)
    setStep(0)
    setResult(null)
    setError('')
  }

  return (
    <PageFrame>
      <PageIntro eyebrow="Before you begin" title="Check if an e-Visa fits your journey." intro="Answer five short questions. This checker uses demonstration rules to suggest a route; it is not an official eligibility decision." />

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-20">
        <section aria-labelledby="eligibility-form-heading" className="max-w-2xl">
          {!result ? (
            <>
              <div className="mb-10 flex items-center justify-between gap-4 border-b border-[var(--hairline)] pb-5">
                <p className="text-[14px] font-medium" id="eligibility-form-heading">Question {step + 1} of {steps.length}</p>
                <p className="text-[13px] text-[var(--stone)]">Takes about 2 minutes</p>
              </div>
              <div aria-label="Eligibility progress" className="mb-10 grid grid-cols-5 gap-2">
                {steps.map((item, index) => (
                  <div key={item.key}>
                    <div className={`h-1 ${index <= step ? 'bg-[var(--orange)]' : 'bg-[var(--cobblestone)]'}`} />
                    <p className={`mt-2 hidden text-[11px] leading-4 sm:block ${index === step ? 'font-medium text-[var(--ink)]' : 'text-[var(--stone)]'}`}>{item.label}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {step === 0 && <Field label="What nationality is shown on your passport?" htmlFor="eligibility-nationality" hint="Select the nationality you will travel under."><SelectInput id="eligibility-nationality" value={answers.nationality} onChange={(event) => update('nationality', event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'eligibility-error' : undefined}><option value="">Select a nationality</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</SelectInput></Field>}
                {step === 1 && <Field label="What type of passport do you hold?" htmlFor="eligibility-passport" hint="The demonstration route is designed for ordinary passports."><SelectInput id="eligibility-passport" value={answers.passportType} onChange={(event) => update('passportType', event.target.value)} aria-invalid={Boolean(error)}><option value="ordinary">Ordinary passport</option><option value="diplomatic">Diplomatic passport</option><option value="service">Official / service passport</option></SelectInput></Field>}
                {step === 2 && <Field label="What is the main purpose of your visit?" htmlFor="eligibility-purpose"><SelectInput id="eligibility-purpose" value={answers.purpose} onChange={(event) => update('purpose', event.target.value)} aria-invalid={Boolean(error)}><option value="tourism">Tourism and visiting</option><option value="business">Business activity</option><option value="medical">Medical treatment</option><option value="conference">Conference or event</option><option value="study">Short-term study</option></SelectInput></Field>}
                {step === 3 && <Field label="When do you expect to arrive in India?" htmlFor="eligibility-arrival" hint="Use your planned arrival date; you can adjust it in an application later."><TextInput id="eligibility-arrival" type="date" value={answers.arrival} onChange={(event) => update('arrival', event.target.value)} aria-invalid={Boolean(error)} /></Field>}
                {step === 4 && <Field label="How long do you intend to stay?" htmlFor="eligibility-duration"><SelectInput id="eligibility-duration" value={answers.duration} onChange={(event) => update('duration', event.target.value)} aria-invalid={Boolean(error)}><option value="30">Up to 30 days</option><option value="60">31–60 days</option><option value="180">61–180 days</option></SelectInput></Field>}
                {error && <p className="error mt-3" id="eligibility-error" role="alert">{error}</p>}
                <div className="mt-10 flex flex-col-reverse gap-3 border-t border-[var(--hairline)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Button disabled={step === 0} onClick={() => { setStep((value) => Math.max(0, value - 1)); setError('') }} variant="secondary" leadingIcon={<ChevronLeft aria-hidden="true" size={16} strokeWidth={1.5} />}>Back</Button>
                  <Button type="submit" trailingIcon={<ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} />}>{step === steps.length - 1 ? 'See my result' : 'Continue'}</Button>
                </div>
              </form>
            </>
          ) : (
            <div aria-live="polite">
              {result.eligible ? (
                <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--paper)] p-6 md:p-10">
                  <div className="flex size-11 items-center justify-center border border-[#7a9b82] bg-[#f2f7f3] text-[#356846]"><Check aria-hidden="true" size={22} strokeWidth={1.5} /></div>

                  <h2 className="display mt-3 text-balance text-4xl leading-tight md:text-5xl">You’re eligible for an {resultVisa.name}.</h2>
                  <p className="mt-5 max-w-xl text-[16px] leading-7 text-[var(--stone)] text-pretty">Based on the information provided, you can continue online in this prototype.</p>
                  <div className="mt-8 grid gap-5 border-y border-[var(--hairline)] py-6 sm:grid-cols-3">
                    <div><p className="text-sm font-medium normal-case tracking-normal text-[var(--stone)]">Approx. fee</p><p className="mt-2 text-[18px] font-medium tabular-nums">${fee?.total} USD</p></div>
                    <div><p className="text-sm font-medium normal-case tracking-normal text-[var(--stone)]">Entry allowance</p><p className="mt-2 text-[15px]">{resultVisa.entries}</p></div>
                    <div><p className="text-sm font-medium normal-case tracking-normal text-[var(--stone)]">Processing</p><p className="mt-2 text-[15px]">{resultVisa.processing}</p></div>
                  </div>
                  <h3 className="mt-8 text-[15px] font-medium">Have these ready</h3>
                  <ul className="mt-3 grid gap-2 text-[14px] leading-6 text-[var(--stone)] sm:grid-cols-2">{resultVisa.documents.map((document) => <li className="flex gap-2" key={document}><Check aria-hidden="true" className="mt-1 shrink-0 text-[var(--orange)]" size={15} strokeWidth={1.5} />{document}</li>)}</ul>
                  <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"><ButtonLink to={`/apply?nationality=${encodeURIComponent(answers.nationality)}&visaType=${encodeURIComponent(resultVisa.slug)}&arrival=${encodeURIComponent(answers.arrival)}`} trailingIcon={<ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} />}>Start application</ButtonLink><Button onClick={reset} variant="text" leadingIcon={<RotateCcw aria-hidden="true" size={15} strokeWidth={1.5} />}>Start over</Button></div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--paper)] p-6 md:p-10">
                  <div className="flex size-11 items-center justify-center border border-[#d9691a] bg-[#fff7f0] text-[#9b4200]"><ShieldAlert aria-hidden="true" size={22} strokeWidth={1.5} /></div>

                  <h2 className="display mt-3 text-balance text-4xl leading-tight md:text-5xl">You may need a regular visa.</h2>
                  <p className="mt-5 max-w-xl text-[16px] leading-7 text-[var(--stone)] text-pretty">{result.reason}</p>
                  <Notice className="mt-7" tone="warning" title="What to do next">Visa rules can depend on details this checker does not ask about. Review the visa guidance before making travel arrangements.</Notice>
                  <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"><ButtonLink to="/visa-types" variant="secondary" trailingIcon={<ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} />}>View visa guidance</ButtonLink><Button onClick={reset} variant="text" leadingIcon={<RotateCcw aria-hidden="true" size={15} strokeWidth={1.5} />}>Check another journey</Button></div>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="border-t border-[var(--hairline)] pt-6 lg:border-l lg:border-t-0 lg:pl-8">

          <p className="mt-4 text-[15px] leading-7 text-[var(--stone)] text-pretty">This is an educational prototype. It does not replace official visa guidance or guarantee admission to India.</p>
          <Link className="focus-ring mt-5 inline-flex items-center gap-2 rounded-lg text-[14px] font-medium underline decoration-[var(--cobblestone)] decoration-1 underline-offset-4 hover:text-[var(--graphite)]" to="/requirements">Read requirements <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} /></Link>
        </aside>
      </div>
    </PageFrame>
  )
}

export default Eligibility
