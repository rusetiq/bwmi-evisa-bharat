import type { Application } from '../../lib/types'
import { calculateApplicationFee } from '../../lib/domain'
import { SummaryList } from '../application/SummaryRow'
import { formatDate } from '../forms/FormPrimitives'

export function PaymentSummary({ application }: { application: Application }) {
  const fee = calculateApplicationFee(application)
  return <div className="card min-w-0 p-5 sm:p-7"><h2 className="display mt-3 break-words text-3xl">{application.visaTypeName || application.visaType}</h2><dl className="mt-5"><SummaryList rows={[{ label: 'Applicant', value: application.applicantName || 'Applicant details in progress' }, { label: 'Nationality', value: application.nationality || '—' }, { label: 'Application ID', value: application.publicId }]} /></dl><div className="mt-5 border-t border-[var(--hairline)] pt-3"><SummaryList rows={[{ label: 'Visa fee', value: `${fee.currency} ${fee.visaFee}` }, { label: 'Demo transaction charge', value: `${fee.currency} ${fee.transactionCharge}` }, { label: 'Total', value: <strong>{fee.currency} {fee.total}</strong> }, ...(application.payment?.transactionReference ? [{ label: 'Transaction reference', value: application.payment.transactionReference }, { label: 'Payment date', value: formatDate(application.payment.updatedAt) }] : [])]} /></div></div>
}
