import { validateApplicationStep } from './applicationValidation'
import type { ApplicationStatus, SectionData } from './types'

export const applicationSteps = ['visa', 'personal', 'passport', 'contact', 'family', 'employment', 'travel', 'background'] as const

export function isStepComplete(step: (typeof applicationSteps)[number], data: SectionData = {}, sections: Record<string, SectionData> = {}) {
  return Object.keys(validateApplicationStep(step, data, sections)).length === 0
}

export function getApplicationProgress(sections: Record<string, SectionData>) {
  return applicationSteps.map((step) => ({ step, complete: isStepComplete(step, sections[step], sections) }))
}

export function getNextRequiredStep(sections: Record<string, SectionData>) {
  return getApplicationProgress(sections).find((item) => !item.complete)?.step ?? 'documents'
}

export function getRequiredDocuments(visaType: string) {
  const base = ['photograph', 'passport']
  const extras: Record<string, string[]> = {
    'e-business': ['business-letter', 'invitation-letter'],
    'e-medical': ['hospital-letter'],
    'e-medical-attendant': ['patient-reference'],
    'e-conference': ['conference-invitation'],
    'e-student': ['admission-letter'],
  }
  return [...base, ...(extras[visaType] ?? [])]
}

export function calculateVisaFee(nationality: string, visaType: string, duration = 'standard') {
  const base: Record<string, number> = { 'e-tourist': duration === '30-days' ? 25 : 40, 'e-business': 80, 'e-medical': 80, 'e-medical-attendant': 80, 'e-conference': 60, 'e-student': 70 }
  const multiplier = nationality === 'Japan' ? 0.6 : nationality === 'United Arab Emirates' ? 0.85 : 1
  const visaFee = Math.round((base[visaType] ?? 50) * multiplier)
  return { visaFee, transactionCharge: 3, total: visaFee + 3, currency: 'USD' }
}

const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ['READY_TO_SUBMIT'], READY_TO_SUBMIT: ['SUBMITTED'], SUBMITTED: ['PAYMENT_PENDING'], PAYMENT_PENDING: ['UNDER_REVIEW'], UNDER_REVIEW: ['DOCUMENT_REUPLOAD_REQUIRED', 'GRANTED', 'REJECTED'], DOCUMENT_REUPLOAD_REQUIRED: ['UNDER_REVIEW'], GRANTED: [], REJECTED: [],
}

export function canTransition(from: ApplicationStatus, to: ApplicationStatus) { return transitions[from].includes(to) }

export function getApplicationPrimaryAction(status: ApplicationStatus) {
  if (status === 'DRAFT' || status === 'READY_TO_SUBMIT') return { label: 'Continue application', kind: 'continue' }
  if (status === 'SUBMITTED' || status === 'PAYMENT_PENDING') return { label: 'Complete payment', kind: 'payment' }
  if (status === 'DOCUMENT_REUPLOAD_REQUIRED') return { label: 'Replace requested document', kind: 'documents' }
  if (status === 'GRANTED') return { label: 'View ETA', kind: 'eta' }
  return null
}

export function calculateApplicationFee(application: { nationality: string; visaType: string; sections: Record<string, SectionData> }) {
  const subtype = application.sections.visa?.visaSubtype
  return calculateVisaFee(application.nationality, application.visaType, subtype === 'e-tourist-30' ? '30-days' : 'standard')
}
