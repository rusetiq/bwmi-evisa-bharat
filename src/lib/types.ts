export type ApplicationStatus =
  | 'DRAFT'
  | 'READY_TO_SUBMIT'
  | 'SUBMITTED'
  | 'PAYMENT_PENDING'
  | 'UNDER_REVIEW'
  | 'DOCUMENT_REUPLOAD_REQUIRED'
  | 'GRANTED'
  | 'REJECTED'

export type PaymentStatus = 'UNPAID' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
export type DocumentStatus = 'MISSING' | 'UPLOADED' | 'ACCEPTED' | 'REUPLOAD_REQUIRED' | 'REPLACED'

export type SectionData = Record<string, string | boolean | string[] | undefined>

export type Application = {
  id: number
  publicId: string
  status: ApplicationStatus
  email: string
  nationality: string
  visaType: string
  visaTypeName: string
  proposedArrival: string
  applicantName: string
  dob: string
  passportNumber: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  rejectionReason?: string
  sections: Record<string, SectionData>
  documents: DocumentRecord[]
  payment?: Payment
  notifications: Notification[]
  events: ApplicationEvent[]
  eta?: Eta
}

export type DocumentRecord = {
  id: number
  documentType: string
  originalFilename: string
  mimeType: string
  status: DocumentStatus
  rejectionReason?: string
  uploadedAt: string
  reviewedAt?: string
  version: number
}

export type Payment = {
  id: number
  amount: number
  currency: string
  provider: string
  status: PaymentStatus
  transactionReference?: string
  createdAt: string
  updatedAt: string
}

export type Notification = { id: number; type: string; title: string; message: string; readAt?: string; createdAt: string }
export type ApplicationEvent = { id: number; type: string; title: string; description: string; actor: string; createdAt: string }
export type Eta = { etaNumber: string; grantedAt: string; validFrom: string; validUntil: string; entries: string; conditions: string }
export type VisaType = { slug: string; name: string; category: string; description: string; commonUses: string; validity: string; entries: string; feeUsd: number; processing: string; documents: string[] }
export type EntryPoint = { name: string; category: 'Airport' | 'Seaport' | 'Land' | 'Rail'; city: string }

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } }

export type EligibilityInput = {
  nationality: string
  passportType: string
  purpose: string
  expectedArrival: string
  intendedLength: string | number
}

export type EligibilityResult = {
  eligible: boolean
  recommendedVisa: string
  visaType: string
  intendedLength: number
  expectedArrival: string
  reason: string
  fee?: { visaFee: number; transactionCharge: number; total: number; currency: string }
  visa?: { slug: string; name: string; entries: string; validity: string; documents: string[] }
  earliestApplicationDate?: string
  latestApplicationDate?: string
}
