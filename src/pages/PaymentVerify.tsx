import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShieldCheck } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import type { Application } from '../lib/types'
import { StatusLabel } from '../components/application/ApplicationStatus'
import { Notice, TextField, SectionHeading } from '../components/forms/FormPrimitives'
import { PaymentOutcome } from '../components/payment/PaymentOutcome'

export default function PaymentVerify() {
  const [applicationId, setApplicationId] = useState('')
  const [passportNumber, setPassportNumber] = useState('')
  const [dob, setDob] = useState('')
  const [application, setApplication] = useState<Application | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function find(event: FormEvent) {
    event.preventDefault(); setError(''); setApplication(null)
    if (!applicationId || !passportNumber || !dob) { setError('Enter the application ID, passport number and date of birth.'); return }
    setBusy(true)
    try { const result = await api.findApplication({ applicationId, publicId: applicationId, passportNumber, dob }); setApplication(await api.getApplication(result.publicId)) } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'We could not find a matching application.') } finally { setBusy(false) }
  }

  return <main className="shell py-12 sm:py-20"><div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,640px)_300px] lg:gap-20"><div className="min-w-0"><Link className="link text-sm" to="/">Back to e-Visa home</Link><div className="mt-10"><SectionHeading eyebrow="Payment verification" title="Check a payment status." description="Use the same application details to view the latest demo payment record." /></div><form className="space-y-6" onSubmit={find} noValidate aria-busy={busy}><TextField id="verify-application-id" label="Application ID" value={applicationId} onChange={setApplicationId} placeholder="IND-EV-26-7K4P9X" required /><div className="grid gap-6 sm:grid-cols-2"><TextField id="verify-passport" label="Passport number" value={passportNumber} onChange={setPassportNumber} required /><TextField id="verify-dob" label="Date of birth" type="date" value={dob} onChange={setDob} required /></div>{error && <Notice tone="danger">{error} Check the details or use one of the guided records on the demo page.</Notice>}<button type="submit" className="btn btn-primary w-full gap-2 sm:w-auto" disabled={busy}>{busy ? 'Checking…' : 'Check payment'}<Search size={16} aria-hidden="true" /></button></form>{busy && <PaymentResultLoading />}{application && <PaymentVerificationResult application={application} onRefresh={() => void refresh(application.publicId, setApplication, setError)} />}</div><aside className="border-t border-[var(--hairline)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><ShieldCheck size={20} aria-hidden="true" /><p className="mt-4 text-sm leading-6 text-stone">Your details are used only to locate the fictional record in this prototype. No external payment provider is contacted.</p><Link className="link mt-5 inline-flex text-sm" to="/demo">Open guided demo records</Link></aside></div></main>
}

function PaymentVerificationResult({ application, onRefresh }: { application: Application; onRefresh: () => void }) {
  const payment = application.payment
  if (!payment || payment.status === 'UNPAID' || payment.status === 'FAILED') return <section className="mt-12 border-t border-[var(--hairline)] pt-8"><div className="mt-3 flex flex-wrap items-center justify-between gap-4"><h2 className="display text-3xl">Payment required.</h2><StatusLabel status={payment?.status ?? 'UNPAID'} /></div><p className="mt-4 text-sm leading-6 text-stone">{payment?.status === 'FAILED' ? 'The last demo attempt did not complete.' : 'This application has not received a successful payment yet.'}</p><Link className="btn btn-primary mt-6" to={`/payment/${application.publicId}`}>Pay now</Link></section>
  if (payment.status === 'PROCESSING') return <section className="mt-12 border-t border-[var(--hairline)] pt-8"><PaymentOutcome status="PROCESSING" amount={payment.amount} applicationId={application.publicId} onRetry={onRefresh} /></section>
  return <section className="mt-12 border-t border-[var(--hairline)] pt-8"><PaymentOutcome status="SUCCESS" amount={payment.amount} transactionReference={payment.transactionReference} updatedAt={payment.updatedAt || payment.createdAt} applicationId={application.publicId} /></section>
}

async function refresh(id: string, setApplication: (value: Application) => void, setError: (value: string) => void) { try { setApplication(await api.getApplication(id)) } catch (error) { setError(error instanceof ApiError ? error.message : 'We could not refresh the payment status.') } }

function PaymentResultLoading() {
  return <div className="mt-12 border-t border-[var(--hairline)] pt-8" aria-label="Loading payment result" aria-busy="true"><div className="h-3 w-32 skeleton" /><div className="mt-5 h-10 w-2/3 max-w-md skeleton" /><div className="mt-5 h-20 skeleton" /></div>
}
