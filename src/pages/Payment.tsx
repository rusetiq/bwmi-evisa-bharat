import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { calculateVisaFee } from '../lib/domain'
import type { Application, PaymentStatus } from '../lib/types'
import { PaymentOutcome } from '../components/payment/PaymentOutcome'
import { PaymentSummary } from '../components/payment/PaymentSummary'
import { PageError, PageLoading } from '../components/application/PageState'
import { Notice } from '../components/forms/FormPrimitives'

export default function Payment() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const [application, setApplication] = useState<Application | null>(null)
  const [method, setMethod] = useState('card')
  const [outcome, setOutcome] = useState<'success' | 'failed' | 'pending'>('success')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    if (!applicationId) return
    setLoading(true); setError('')
    try { setApplication(await api.getApplication(applicationId)) } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "We couldn't load payment for this application.") } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [applicationId])
  if (loading) return <PageLoading label="Preparing your demo payment…" />
  if (error || !application) return <PageError message={error || 'This application could not be found.'} retry={() => void load()} />
  const currentApplication = application
  const currentPaymentStatus = application.payment?.status
  const fee = calculateVisaFee(application.nationality, application.visaType)
  if (currentPaymentStatus === 'SUCCESS' || currentPaymentStatus === 'PROCESSING') return <main className="shell py-12 sm:py-20"><PaymentOutcome status={currentPaymentStatus} amount={application.payment?.amount || fee.total} transactionReference={application.payment?.transactionReference} updatedAt={application.payment?.updatedAt} applicationId={application.publicId} onRetry={currentPaymentStatus === 'PROCESSING' ? () => void load() : undefined} /></main>

  async function pay() {
    setBusy(true); setError('')
    try { const result = await api.simulatePayment(currentApplication.publicId, { method, outcome }); setApplication(result) } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "We couldn't process the demo payment. Try again.") } finally { setBusy(false) }
  }

  return <main className="shell py-12 sm:py-20"><div className="mb-8 flex flex-wrap items-center justify-between gap-3"><Link className="link text-sm" to={`/application/${currentApplication.publicId}`}>Back to application</Link><p className="eyebrow text-stone">Secure demo checkout</p></div><div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start"><div><p className="eyebrow text-stone">Payment</p><h1 className="display mt-3 text-5xl">Complete your application payment.</h1><p className="mt-5 max-w-xl text-base leading-7 text-stone">Choose a demo payment method. No card number, bank login or real transaction is requested.</p><div className="mt-8"><Notice title="Demo payment · no real transaction will occur.">This prototype records a fictional payment outcome so you can explore the complete applicant journey.</Notice></div><fieldset className="mt-8"><legend className="label">Payment method</legend><div className="grid gap-3 sm:grid-cols-3">{[['card', 'Card'], ['upi', 'UPI'], ['netbanking', 'Net banking']].map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-3 border p-4 text-sm ${method === value ? 'border-[var(--ink)] bg-[var(--linen)]' : 'border-[var(--hairline)] bg-white'}`}><input type="radio" name="payment-method" value={value} checked={method === value} onChange={() => setMethod(value)} className="accent-[var(--ink)]" />{label}</label>)}</div></fieldset><details className="mt-6 border-b border-[var(--hairline)] pb-4 text-sm"><summary className="cursor-pointer text-stone">Demo outcome controls</summary><p className="mt-3 text-xs leading-5 text-stone">Visible for demonstration testing only. The default outcome is success.</p><div className="mt-3 flex flex-wrap gap-3">{(['success', 'failed', 'pending'] as const).map((value) => <label key={value} className="inline-flex items-center gap-2 text-sm"><input type="radio" name="outcome" value={value} checked={outcome === value} onChange={() => setOutcome(value)} className="accent-[var(--ink)]" />{value[0].toUpperCase() + value.slice(1)}</label>)}</div></details>{error && <div className="mt-6"><Notice tone="danger">{error}</Notice></div>}<button type="button" className="btn btn-primary mt-8 w-full sm:w-auto" onClick={() => void pay()} disabled={busy}>{busy ? 'Processing…' : 'Simulate payment'}</button></div><PaymentSummary application={currentApplication} /></div></main>
}

export function paymentStatusLabel(status?: PaymentStatus) { return status === 'SUCCESS' ? 'Payment received' : status === 'FAILED' ? 'Payment failed' : status === 'PROCESSING' ? 'Payment being verified' : 'Not paid' }
