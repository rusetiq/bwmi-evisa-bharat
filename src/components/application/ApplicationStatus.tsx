import type { ApplicationStatus, PaymentStatus } from '../../lib/types'
import { statusCopy } from '../../lib/content'

const statusTone: Record<ApplicationStatus | PaymentStatus, 'neutral' | 'action' | 'success' | 'danger'> = {
  DRAFT: 'neutral', READY_TO_SUBMIT: 'neutral', SUBMITTED: 'neutral', PAYMENT_PENDING: 'action', UNDER_REVIEW: 'neutral', DOCUMENT_REUPLOAD_REQUIRED: 'action', GRANTED: 'success', REJECTED: 'danger',
  UNPAID: 'action', PROCESSING: 'neutral', SUCCESS: 'success', FAILED: 'danger',
}

const paymentCopy: Record<PaymentStatus, string> = { UNPAID: 'Not paid', PROCESSING: 'Being verified', SUCCESS: 'Payment received', FAILED: 'Payment failed' }

export function StatusLabel({ status }: { status: ApplicationStatus | PaymentStatus }) {
  const label = status in statusCopy ? statusCopy[status as ApplicationStatus] : paymentCopy[status as PaymentStatus]
  return <span className={`status status-${statusTone[status]}`}>{label}</span>
}

export function statusLabel(status: ApplicationStatus | PaymentStatus) {
  return status in statusCopy ? statusCopy[status as ApplicationStatus] : paymentCopy[status as PaymentStatus]
}

