import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { demoLookups } from '../lib/content'
import { Notice, SectionHeading, TextField } from '../components/forms/FormPrimitives'

export default function FindApplication() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [applicationId, setApplicationId] = useState(params.get('applicationId') ?? '')
  const [passportNumber, setPassportNumber] = useState(params.get('passport') ?? '')
  const [dob, setDob] = useState(params.get('dob') ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!applicationId || !passportNumber || !dob) { setError('Enter all three details to find your application.'); return }
    setBusy(true)
    try { const result = await api.findApplication({ applicationId, publicId: applicationId, passportNumber, dob }); navigate(`/application/${result.publicId}`) } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'No application matched those details.') } finally { setBusy(false) }
  }

  return <main className="shell py-12 sm:py-20"><div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,640px)_300px] lg:gap-20"><div className="min-w-0"><Link className="link text-sm" to="/">Back to e-Visa home</Link><div className="mt-10"><SectionHeading title="Find your application." description="Enter the details used when the application was created. Your application ID is printed on your confirmation." /></div><form className="space-y-6" onSubmit={submit} noValidate><TextField id="find-application-id" label="Application ID" value={applicationId} onChange={setApplicationId} placeholder="IND-EV-26-7K4P9X" required /><div className="grid min-w-0 gap-6 sm:grid-cols-2"><TextField id="find-passport" label="Passport number" value={passportNumber} onChange={setPassportNumber} required /><TextField id="find-dob" label="Date of birth" type="date" value={dob} onChange={setDob} required /></div>{error && <Notice title="We couldn't find a match." tone="danger">{error} Check the application ID, date of birth and passport number, then try again.</Notice>}<button type="submit" className="btn btn-primary w-full gap-2 sm:w-auto" disabled={busy}>{busy ? 'Finding…' : 'Find application'}<ArrowRight size={16} aria-hidden="true" /></button></form><details className="mt-10 border-t border-[var(--hairline)] pt-5"><summary className="cursor-pointer text-sm text-stone">Demo records for a guided walkthrough</summary><p className="mt-3 text-xs leading-5 text-stone">These fictional records are included for the prototype and are not real applications.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{demoLookups.map(([id, passport, date, description]) => <button type="button" key={id} className="min-w-0 rounded-2xl border border-[var(--hairline)] bg-[var(--linen)] p-3 text-left text-xs hover:border-[var(--ink)]" onClick={() => { setApplicationId(id); setPassportNumber(passport); setDob(date) }}><span className="block break-words font-medium">{description}</span><span className="mt-1 block break-all text-stone">{id}</span></button>)}</div></details></div><aside className="border-t border-[var(--hairline)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><Search size={20} aria-hidden="true" /><p className="mt-4 text-sm leading-6 text-stone">We use your date of birth and passport number as a simple retrieval check for this unauthenticated prototype.</p><p className="mt-6 text-xs leading-5 text-stone">No external identity service is contacted.</p></aside></div></main>
}
