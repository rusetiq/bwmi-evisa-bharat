import type { Application, ApplicationEvent, DocumentRecord, Eta, Notification, Payment, SectionData, VisaType } from '@/lib/types'
import { notFound, now, safeJsonParse } from '../http'
import type { ApplicationRow, AppEnv, ApplicantRow, DocumentRow, EntryPointRow, EtaRow, EventRow, NotificationRow, PaymentRow, PassportRow, RelatedDataRow, StoredSections, VisaTypeRow } from '../types'

type Database = AppEnv['Bindings']['DB']

export async function findApplicationRow(db: Database, key: string): Promise<ApplicationRow | null> {
  const normalized = key.trim()
  if (/^\d+$/.test(normalized)) {
    return db.prepare('SELECT * FROM applications WHERE id = ? LIMIT 1').bind(Number(normalized)).first<ApplicationRow>()
  }
  return db.prepare('SELECT * FROM applications WHERE public_id = ? LIMIT 1').bind(normalized).first<ApplicationRow>()
}

export async function requireApplicationRow(db: Database, key: string): Promise<ApplicationRow> {
  const row = await findApplicationRow(db, key)
  if (!row) throw notFound()
  return row
}

export async function getVisaTypeRow(db: Database, slug: string): Promise<VisaTypeRow | null> {
  return db.prepare('SELECT * FROM visa_types WHERE slug = ? LIMIT 1').bind(slug).first<VisaTypeRow>()
}

export async function listVisaTypeRows(db: Database): Promise<VisaTypeRow[]> {
  const result = await db.prepare('SELECT * FROM visa_types ORDER BY category, name').all<VisaTypeRow>()
  return result.results ?? []
}

export async function listEntryPointRows(db: Database): Promise<EntryPointRow[]> {
  const result = await db.prepare('SELECT id, name, category, city FROM entry_points ORDER BY category, city, name').all<EntryPointRow>()
  return result.results ?? []
}

export async function getSectionRows(db: Database, applicationId: number): Promise<Record<string, SectionData>> {
  const [result, application] = await Promise.all([
    db.prepare('SELECT section, data_json FROM application_sections WHERE application_id = ? ORDER BY section').bind(applicationId).all<{ section: string; data_json: string }>(),
    db.prepare('SELECT sections_json FROM applications WHERE id = ? LIMIT 1').bind(applicationId).first<{ sections_json: string }>(),
  ])
  const sections: Record<string, SectionData> = safeJsonParse<Record<string, SectionData>>(application?.sections_json, {})
  for (const item of result.results ?? []) sections[item.section] = safeJsonParse<SectionData>(item.data_json, {})
  return sections
}

export async function getDocuments(db: Database, applicationId: number, includeHistory = false): Promise<DocumentRow[]> {
  const sql = includeHistory
    ? 'SELECT * FROM documents WHERE application_id = ? ORDER BY document_type, version DESC, id DESC'
    : `SELECT d.* FROM documents d
       WHERE d.application_id = ?
         AND d.id = (SELECT d2.id FROM documents d2 WHERE d2.application_id = d.application_id AND d2.document_type = d.document_type ORDER BY d2.version DESC, d2.id DESC LIMIT 1)
       ORDER BY d.document_type`
  const result = await db.prepare(sql).bind(applicationId).all<DocumentRow>()
  return result.results ?? []
}

export async function getDocument(db: Database, id: number): Promise<DocumentRow | null> {
  return db.prepare('SELECT * FROM documents WHERE id = ? LIMIT 1').bind(id).first<DocumentRow>()
}

export async function getLatestDocument(db: Database, applicationId: number, documentType: string): Promise<DocumentRow | null> {
  return db.prepare('SELECT * FROM documents WHERE application_id = ? AND document_type = ? ORDER BY version DESC, id DESC LIMIT 1').bind(applicationId, documentType).first<DocumentRow>()
}

export async function getPayment(db: Database, applicationId: number): Promise<PaymentRow | null> {
  return db.prepare('SELECT * FROM payments WHERE application_id = ? LIMIT 1').bind(applicationId).first<PaymentRow>()
}

export async function getNotifications(db: Database, applicationId: number, limit = 20): Promise<NotificationRow[]> {
  const result = await db.prepare('SELECT * FROM notifications WHERE application_id = ? ORDER BY created_at DESC, id DESC LIMIT ?').bind(applicationId, limit).all<NotificationRow>()
  return result.results ?? []
}

export async function getEvents(db: Database, applicationId: number, limit = 50): Promise<EventRow[]> {
  const result = await db.prepare('SELECT * FROM application_events WHERE application_id = ? ORDER BY created_at DESC, id DESC LIMIT ?').bind(applicationId, limit).all<EventRow>()
  return result.results ?? []
}

export async function getEta(db: Database, applicationId: number): Promise<EtaRow | null> {
  return db.prepare('SELECT * FROM etas WHERE application_id = ? LIMIT 1').bind(applicationId).first<EtaRow>()
}

export async function getApplicant(db: Database, applicationId: number): Promise<ApplicantRow | null> {
  return db.prepare('SELECT * FROM applicants WHERE application_id = ? LIMIT 1').bind(applicationId).first<ApplicantRow>()
}

export async function getPassport(db: Database, applicationId: number): Promise<PassportRow | null> {
  return db.prepare('SELECT * FROM passports WHERE application_id = ? LIMIT 1').bind(applicationId).first<PassportRow>()
}

export async function getRelatedData(db: Database, table: 'addresses' | 'family_details' | 'employment_details' | 'travel_details' | 'visa_details' | 'background_answers', applicationId: number): Promise<RelatedDataRow | null> {
  // The table name is selected from a closed allowlist above; all values remain bound parameters.
  return db.prepare(`SELECT application_id, data_json, updated_at FROM ${table} WHERE application_id = ? LIMIT 1`).bind(applicationId).first<RelatedDataRow>()
}

export function parseDocuments(rows: DocumentRow[]): DocumentRecord[] {
  return rows.map((row) => ({
    id: row.id,
    documentType: row.document_type,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    status: row.status,
    ...(row.rejection_reason ? { rejectionReason: row.rejection_reason } : {}),
    uploadedAt: row.uploaded_at,
    ...(row.reviewed_at ? { reviewedAt: row.reviewed_at } : {}),
    version: row.version,
  }))
}

export function parsePayment(row: PaymentRow | null): Payment | undefined {
  if (!row) return undefined
  return {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    provider: row.provider,
    status: row.status,
    ...(row.transaction_reference ? { transactionReference: row.transaction_reference } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function parseNotifications(rows: NotificationRow[]): Notification[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    ...(row.read_at ? { readAt: row.read_at } : {}),
    createdAt: row.created_at,
  }))
}

export function parseEvents(rows: EventRow[]): ApplicationEvent[] {
  return rows.map((row) => ({ id: row.id, type: row.type, title: row.title, description: row.description, actor: row.actor, createdAt: row.created_at }))
}

export function parseEta(row: EtaRow | null): Eta | undefined {
  if (!row) return undefined
  return { etaNumber: row.eta_number, grantedAt: row.granted_at, validFrom: row.valid_from, validUntil: row.valid_until, entries: row.entries, conditions: row.conditions }
}

function parseVisa(row: VisaTypeRow | null, slug: string): VisaType {
  return {
    slug,
    name: row?.name ?? slug,
    category: row?.category ?? 'Other',
    description: row?.description ?? '',
    commonUses: row?.common_uses ?? '',
    validity: row?.validity ?? '',
    entries: row?.entries ?? '',
    feeUsd: row?.fee_usd ?? 0,
    processing: row?.processing ?? '',
    documents: safeJsonParse<string[]>(row?.documents_json, []),
  }
}

export type ApplicationBundle = {
  row: ApplicationRow
  sections: StoredSections
  documents: DocumentRow[]
  payment: PaymentRow | null
  notifications: NotificationRow[]
  events: EventRow[]
  eta: EtaRow | null
  visaType: VisaTypeRow | null
  applicant: ApplicantRow | null
  passport: PassportRow | null
}

export async function getApplicationBundle(db: Database, key: string, includeDocumentHistory = false): Promise<ApplicationBundle> {
  const row = await requireApplicationRow(db, key)
  const [sections, documents, payment, notifications, events, eta, visaType, applicant, passport] = await Promise.all([
    getSectionRows(db, row.id),
    getDocuments(db, row.id, includeDocumentHistory),
    getPayment(db, row.id),
    getNotifications(db, row.id),
    getEvents(db, row.id),
    getEta(db, row.id),
    getVisaTypeRow(db, row.visa_type_id),
    getApplicant(db, row.id),
    getPassport(db, row.id),
  ])
  return { row, sections, documents, payment, notifications, events, eta, visaType, applicant, passport }
}

export function applicationFromBundle(bundle: ApplicationBundle): Application {
  const row = bundle.row
  const visa = parseVisa(bundle.visaType, row.visa_type_id)
  return {
    id: row.id,
    publicId: row.public_id,
    status: row.status,
    email: row.email ?? '',
    nationality: row.nationality,
    visaType: visa.slug,
    visaTypeName: visa.name,
    proposedArrival: row.proposed_arrival ?? String(bundle.sections.visa?.proposedArrival ?? bundle.sections.travel?.expectedArrival ?? ''),
    applicantName: row.applicant_name ?? String(bundle.sections.personal?.givenNames ?? ''),
    dob: row.dob ?? String(bundle.sections.personal?.dob ?? ''),
    passportNumber: row.passport_number ?? String(bundle.sections.passport?.passportNumber ?? ''),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.submitted_at ? { submittedAt: row.submitted_at } : {}),
    ...(row.rejection_reason ? { rejectionReason: row.rejection_reason } : {}),
    sections: bundle.sections,
    documents: parseDocuments(bundle.documents),
    ...(parsePayment(bundle.payment) ? { payment: parsePayment(bundle.payment) } : {}),
    notifications: parseNotifications(bundle.notifications),
    events: parseEvents(bundle.events),
    ...(parseEta(bundle.eta) ? { eta: parseEta(bundle.eta) } : {}),
  }
}

export function applicationSelectFields() {
  return 'id, public_id, status, email, nationality, visa_type_id, proposed_arrival, applicant_name, dob, passport_number, sections_json, version, created_at, updated_at, submitted_at, rejection_reason'
}

export function createEventStatement(db: Database, applicationId: number, type: string, title: string, description: string, actor: string, createdAt = now()) {
  return db.prepare('INSERT INTO application_events (application_id, type, title, description, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(applicationId, type, title, description, actor, createdAt)
}

export function createNotificationStatement(db: Database, applicationId: number, type: string, title: string, message: string, createdAt = now()) {
  return db.prepare('INSERT INTO notifications (application_id, type, title, message, created_at) VALUES (?, ?, ?, ?, ?)').bind(applicationId, type, title, message, createdAt)
}

export function upsertSectionStatement(db: Database, applicationId: number, section: string, data: SectionData, updatedAt: string) {
  return db.prepare(`INSERT INTO application_sections (application_id, section, data_json, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(application_id, section) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at`).bind(applicationId, section, JSON.stringify(data), updatedAt)
}
