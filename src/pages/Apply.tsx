import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { SelectField, TextField, Notice, SectionHeading } from '../components/forms/FormPrimitives'
import { countryOptions, visaCategories, visaSubtypeOptions } from '../components/forms/applicationSchema'

const visaTypeForCategory: Record<string, string> = { Tourism: 'e-tourist', Business: 'e-business', Medical: 'e-medical', 'Medical Attendant': 'e-medical-attendant', Conference: 'e-conference', Study: 'e-student' }

export default function Apply() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [nationality, setNationality] = useState(params.get('nationality') || '')
  const [passportType, setPassportType] = useState('Ordinary')
  const [visaCategory, setVisaCategory] = useState(params.get('category') || 'Tourism')
  const [visaSubtype, setVisaSubtype] = useState(params.get('visaType') || '')
  const [proposedArrival, setProposedArrival] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const subtypes = visaSubtypeOptions(visaCategory)

  function changeCategory(value: string) {
    setVisaCategory(value)
    setVisaSubtype(visaSubtypeOptions(value)[0]?.value ?? '')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const nextErrors: Record<string, string> = {}
    if (!nationality) nextErrors.nationality = 'Choose your nationality.'
    if (!visaCategory) nextErrors.visaCategory = 'Choose a visa category.'
    if (!visaSubtype) nextErrors.visaSubtype = 'Choose a visa subtype.'
    if (!proposedArrival) nextErrors.proposedArrival = 'Choose your proposed arrival date.'
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Enter a valid email address.'
    if (Object.keys(nextErrors).length) { setFieldErrors(nextErrors); requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return }
    setFieldErrors({})
    setBusy(true)
    try {
      const application = await api.createApplication({ nationality, passportType, visaCategory, visaSubtype, visaType: visaTypeForCategory[visaCategory] ?? 'e-tourist', proposedArrival, email })
      navigate(`/apply/${application.publicId || application.id}`)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "We couldn't create your application. Try again.")
    } finally { setBusy(false) }
  }

  return <main className="shell py-12 sm:py-20"><div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,760px)_280px] lg:gap-20"><div className="min-w-0"><Link className="link inline-flex items-center gap-2 text-sm" to="/">Back to e-Visa home</Link><div className="mt-10"><SectionHeading eyebrow="Start an application" title="Begin with the essentials." description="This creates a saved application workspace. You can complete the remaining details at your own pace." /></div><div className="mb-6"><Notice title="Fictional application">This workspace is simulated for the demo. Use made-up details and an email you do not need to receive.</Notice></div>{error && <div className="mb-6"><Notice title="We couldn't create that application." tone="danger">{error}</Notice></div>}<form className="min-w-0 space-y-6" onSubmit={submit} noValidate><div className="grid min-w-0 gap-6 sm:grid-cols-2"><SelectField id="nationality" label="Nationality" value={nationality} onChange={setNationality} options={countryOptions} required error={fieldErrors.nationality} /><SelectField id="passport-type" label="Passport type" value={passportType} onChange={setPassportType} options={[{ value: 'Ordinary', label: 'Ordinary passport' }, { value: 'Diplomatic', label: 'Diplomatic passport' }, { value: 'Official', label: 'Official or service passport' }]} required /></div><div className="grid min-w-0 gap-6 sm:grid-cols-2"><SelectField id="visa-category" label="Visa category" value={visaCategory} onChange={changeCategory} options={visaCategories} required error={fieldErrors.visaCategory} /><SelectField id="visa-subtype" label="Visa subtype" value={visaSubtype} onChange={setVisaSubtype} options={subtypes} required error={fieldErrors.visaSubtype} /></div><div className="grid min-w-0 gap-6 sm:grid-cols-2"><TextField id="arrival" label="Proposed arrival date" type="date" value={proposedArrival} onChange={setProposedArrival} required error={fieldErrors.proposedArrival} /><TextField id="email" label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required error={fieldErrors.email} /></div><div className="flex flex-col gap-4 border-t border-[var(--hairline)] pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-md text-xs leading-5 text-stone">Mock prototype: your details are saved to this demonstration service only.</p><button type="submit" className="btn btn-primary w-full gap-2 sm:w-auto" disabled={busy}>{busy ? 'Creating…' : 'Create application'}<ArrowRight size={16} aria-hidden="true" /></button></div></form></div><aside className="border-t border-[var(--hairline)] pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0"><p className="mt-4 text-sm leading-6 text-stone">Have your passport nearby. You will need the bio page, a recent photograph and an email address you can check.</p><p className="mt-6 text-sm leading-6 text-stone">Your application ID will be generated immediately and can be used to return later.</p><p className="mt-6 text-xs leading-5 text-stone">Fictional data only · No real visa application is created.</p></aside></div></main>
}
