import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PaymentStatus } from '../../lib/types'
import { formatDate } from '../forms/FormPrimitives'

export function PaymentOutcome({ status, amount, transactionReference, updatedAt, applicationId, onRetry }: { status: PaymentStatus; amount?: number; transactionReference?: string; updatedAt?: string; applicationId: string; onRetry?: () => void }) {
  const success = status === 'SUCCESS'
  const failed = status === 'FAILED'
  const title = success ? 'Payment received' : failed ? 'Payment was not completed' : "We're confirming your payment"
  const description = success ? 'Your demo payment has been recorded and your application can move into review.' : failed ? 'No money has been taken. You can try the demo payment again when you are ready.' : 'The demo payment is being checked. You can return to your application while this status updates.'
  return <div className="mx-auto max-w-2xl py-12 text-center sm:py-20"><div className="mx-auto flex h-14 w-14 items-center justify-center border border-[var(--hairline)] bg-[var(--linen)]">{success ? <CheckCircle2 className="text-[#356846]" size={26} aria-hidden="true" /> : failed ? <XCircle className="text-[#8c3530]" size={26} aria-hidden="true" /> : <Clock3 className="text-stone" size={26} aria-hidden="true" />}</div><p className="eyebrow mt-7 text-stone">Demo payment status</p><h1 className="display mt-3 text-5xl">{title}</h1><p className="mx-auto mt-5 max-w-lg text-base leading-7 text-stone">{description}</p>{(amount || transactionReference) && <div className="card mx-auto mt-8 max-w-md text-left"><div className="flex justify-between gap-4 border-b border-[var(--hairline)] p-4 text-sm"><span className="text-stone">Amount</span><strong>USD {amount ?? '—'}</strong></div>{transactionReference && <div className="flex justify-between gap-4 border-b border-[var(--hairline)] p-4 text-sm"><span className="text-stone">Transaction ID</span><strong>{transactionReference}</strong></div>}{updatedAt && <div className="flex justify-between gap-4 p-4 text-sm"><span className="text-stone">Date</span><strong>{formatDate(updatedAt)}</strong></div>}</div>}<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">{failed && onRetry && <button type="button" className="btn btn-primary" onClick={onRetry}>Try again</button>}<Link className="btn btn-secondary" to={`/application/${applicationId}`}>View application</Link></div></div>
}

