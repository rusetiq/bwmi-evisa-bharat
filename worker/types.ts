import type { ApplicationStatus, DocumentStatus, PaymentStatus, SectionData } from '@/lib/types'

export type Bindings = {
  DB: D1Database
  DOCUMENTS?: R2Bucket
  ADMIN_DEMO_KEY?: string
  ASSETS?: Fetcher
}

export type AppEnv = { Bindings: Bindings }

export type ApplicationRow = {
  id: number
  public_id: string
  status: ApplicationStatus
  email: string | null
  nationality: string
  visa_type_id: string
  proposed_arrival: string | null
  applicant_name: string | null
  dob: string | null
  passport_number: string | null
  sections_json: string
  version: number
  created_at: string
  updated_at: string
  submitted_at: string | null
  rejection_reason: string | null
}

export type ApplicationSectionRow = {
  application_id: number
  section: string
  data_json: string
  updated_at: string
}

export type VisaTypeRow = {
  slug: string
  name: string
  category: string
  description: string
  common_uses: string
  validity: string
  entries: string
  fee_usd: number
  processing: string
  documents_json: string
}

export type EntryPointRow = { id: number; name: string; category: string; city: string }

export type ApplicantRow = {
  application_id: number
  surname: string | null
  given_names: string | null
  gender: string | null
  birth_city: string | null
  birth_country: string | null
  citizenship: string | null
  religion: string | null
  identification_marks: string | null
  education: string | null
  data_json: string
}

export type PassportRow = {
  application_id: number
  passport_number: string | null
  passport_type: string | null
  issuing_country: string | null
  place_of_issue: string | null
  issue_date: string | null
  expiry_date: string | null
  data_json: string
}

export type RelatedDataRow = { application_id: number; data_json: string; updated_at: string }

export type DocumentRow = {
  id: number
  application_id: number
  document_type: string
  object_key: string | null
  original_filename: string
  mime_type: string
  size_bytes: number
  status: DocumentStatus
  rejection_reason: string | null
  uploaded_at: string
  reviewed_at: string | null
  version: number
  replaces_document_id: number | null
}

export type PaymentRow = {
  id: number
  application_id: number
  amount: number
  currency: string
  provider: string
  status: PaymentStatus
  transaction_reference: string | null
  created_at: string
  updated_at: string
}

export type NotificationRow = {
  id: number
  application_id: number
  type: string
  title: string
  message: string
  read_at: string | null
  created_at: string
}

export type EventRow = {
  id: number
  application_id: number
  type: string
  title: string
  description: string
  actor: string
  created_at: string
}

export type EtaRow = {
  id: number
  application_id: number
  eta_number: string
  granted_at: string
  valid_from: string
  valid_until: string
  entries: string
  conditions: string
}

export type StoredSections = Record<string, SectionData>
