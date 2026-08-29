import type { ApplicationStatus, PaymentStatus } from '../../lib/types'
import { applicationStatusLabel } from './adminUtils'

const classByStatus: Record<ApplicationStatus | PaymentStatus, string> = {
  DRAFT: 'status',
  READY_TO_SUBMIT: 'status',
  SUBMITTED: 'status',
  PAYMENT_PENDING: 'status status-action',
  UNDER_REVIEW: 'status',
  DOCUMENT_REUPLOAD_REQUIRED: 'status status-action',
  GRANTED: 'status status-success',
  REJECTED: 'status status-danger',
  UNPAID: 'status status-action',
  PROCESSING: 'status',
  SUCCESS: 'status status-success',
  FAILED: 'status status-danger',
}

const paymentLabels: Record<PaymentStatus, string> = {
  UNPAID: 'Not paid',
  PROCESSING: 'Being verified',
  SUCCESS: 'Payment received',
  FAILED: 'Payment failed',
}

export function AdminStatus({ status }: { status: ApplicationStatus }) {
  return <span className={classByStatus[status]}>{applicationStatusLabel(status)}</span>
}

export function AdminPaymentStatus({ status }: { status: PaymentStatus }) {
  return <span className={classByStatus[status]}>{paymentLabels[status]}</span>
}

