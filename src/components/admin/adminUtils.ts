import type { Application, ApplicationStatus, DocumentRecord, SectionData } from '../../lib/types'

export const ADMIN_IDENTITY = {
  name: 'Visa Review Officer',
  email: 'demo-admin@gov.example',
}

export const applicationStatuses: Array<{ value: ApplicationStatus; label: string }> = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'READY_TO_SUBMIT', label: 'Ready to submit' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'PAYMENT_PENDING', label: 'Payment pending' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'DOCUMENT_REUPLOAD_REQUIRED', label: 'Document correction' },
  { value: 'GRANTED', label: 'Granted' },
  { value: 'REJECTED', label: 'Rejected' },
]

const documentLabels: Record<string, string> = {
  photograph: 'Photograph',
  passport: 'Passport bio page',
  'business-letter': 'Business letter',
  'invitation-letter': 'Invitation letter',
  'hospital-letter': 'Hospital letter',
  'patient-reference': 'Patient reference',
  'conference-invitation': 'Conference invitation',
  'admission-letter': 'Admission letter',
}

const statusLabels: Record<ApplicationStatus, string> = Object.fromEntries(applicationStatuses.map((item) => [item.value, item.label])) as Record<ApplicationStatus, string>

export function applicationStatusLabel(status: ApplicationStatus) {
  return statusLabels[status] ?? status
}

export function documentLabel(type: string) {
  return documentLabels[type] ?? type.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function sectionValue(application: Application, section: string, field: string): string {
  const value = application.sections?.[section]?.[field]
  if (typeof value === 'string') return value
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  return ''
}

export function valueOrDash(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return '—'
}

export function sectionData(application: Application, section: string): SectionData {
  return application.sections?.[section] ?? {}
}

export function isFinalStatus(status: ApplicationStatus) {
  return status === 'GRANTED' || status === 'REJECTED'
}

export function hasSuccessfulPayment(application: Application) {
  return application.payment?.status === 'SUCCESS'
}

export function formatDocumentStatus(status: DocumentRecord['status']) {
  const labels: Record<DocumentRecord['status'], string> = {
    MISSING: 'Missing',
    UPLOADED: 'Uploaded',
    ACCEPTED: 'Accepted',
    REUPLOAD_REQUIRED: 'Replacement requested',
    REPLACED: 'Replaced',
  }
  return labels[status]
}

export function sameCalendarDate(first?: string, second = new Date().toISOString()) {
  if (!first) return false
  return first.slice(0, 10) === second.slice(0, 10)
}

export function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function defaultValidityEnd(start: string) {
  const date = new Date(`${start}T00:00:00`)
  if (Number.isNaN(date.getTime())) return start
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

