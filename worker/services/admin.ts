import type { Application, ApplicationStatus } from '@/lib/types'
import { HttpError, now, safeJsonParse } from '../http'
import { applicationFromBundle, createEventStatement, createNotificationStatement, getApplicationBundle, getPayment, requireApplicationRow } from '../db/queries'
import { etaInput, etaStatement } from './eta'
import { requestDocumentReplacement } from './documents'
import type { AppEnv, PaymentRow } from '../types'

type Database = AppEnv['Bindings']['DB']

const statuses: readonly ApplicationStatus[] = ['DRAFT', 'READY_TO_SUBMIT', 'SUBMITTED', 'PAYMENT_PENDING', 'UNDER_REVIEW', 'DOCUMENT_REUPLOAD_REQUIRED', 'GRANTED', 'REJECTED']

export type AdminListFilters = { status?: string; visaType?: string; nationality?: string; search?: string; limit?: number; offset?: number }

function statusIs(value: string): value is ApplicationStatus { return (statuses as readonly string[]).includes(value) }

function basicApplication(row: Record<string, unknown>, payment: PaymentRow | null): Application {
  const sections = safeJsonParse<Record<string, Record<string, string | boolean | string[] | undefined>>>(String(row.sections_json ?? '{}'), {})
  return {
    id: Number(row.id), publicId: String(row.public_id), status: String(row.status) as ApplicationStatus, email: String(row.email ?? ''), nationality: String(row.nationality ?? ''), visaType: String(row.visa_type_id ?? ''), visaTypeName: String(row.visa_type_name ?? row.visa_type_id ?? ''), proposedArrival: String(row.proposed_arrival ?? ''), applicantName: String(row.applicant_name ?? ''), dob: String(row.dob ?? ''), passportNumber: String(row.passport_number ?? ''), createdAt: String(row.created_at), updatedAt: String(row.updated_at), ...(row.submitted_at ? { submittedAt: String(row.submitted_at) } : {}), ...(row.rejection_reason ? { rejectionReason: String(row.rejection_reason) } : {}), sections, documents: [], ...(payment ? { payment: { id: payment.id, amount: payment.amount, currency: payment.currency, provider: payment.provider, status: payment.status, ...(payment.transaction_reference ? { transactionReference: payment.transaction_reference } : {}), createdAt: payment.created_at, updatedAt: payment.updated_at } } : {}), notifications: [], events: [],
  }
}

export async function listAdminApplications(db: Database, filters: AdminListFilters): Promise<Application[]> {
  const clauses: string[] = []
  const values: Array<string | number> = []
  if (filters.status && statusIs(filters.status)) { clauses.push('a.status = ?'); values.push(filters.status) }
  if (filters.visaType) { clauses.push('a.visa_type_id = ?'); values.push(filters.visaType.trim().slice(0, 80)) }
  if (filters.nationality) { clauses.push('lower(a.nationality) = lower(?)'); values.push(filters.nationality.trim().slice(0, 100)) }
  if (filters.search) { clauses.push('(lower(a.public_id) LIKE lower(?) OR lower(COALESCE(a.applicant_name, \'\')) LIKE lower(?) OR lower(COALESCE(a.passport_number, \'\')) LIKE lower(?))'); const term = `%${filters.search.trim().slice(0, 100)}%`; values.push(term, term, term) }
  const requestedLimit = Number(filters.limit)
  const requestedOffset = Number(filters.offset)
  const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 100, 200))
  const offset = Math.max(0, Number.isFinite(requestedOffset) ? requestedOffset : 0)
  values.push(limit, offset)
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const result = await db.prepare(`SELECT a.*, v.name AS visa_type_name, p.id AS payment_id, p.amount AS payment_amount, p.currency AS payment_currency, p.provider AS payment_provider, p.status AS payment_status, p.transaction_reference AS payment_transaction_reference, p.created_at AS payment_created_at, p.updated_at AS payment_updated_at
    FROM applications a LEFT JOIN visa_types v ON v.slug = a.visa_type_id LEFT JOIN payments p ON p.application_id = a.id ${where}
    ORDER BY COALESCE(a.submitted_at, a.updated_at) DESC, a.id DESC LIMIT ? OFFSET ?`).bind(...values).all<Record<string, unknown>>()
  return (result.results ?? []).map((row) => {
    const payment: PaymentRow | null = row.payment_id ? { id: Number(row.payment_id), application_id: Number(row.id), amount: Number(row.payment_amount ?? 0), currency: String(row.payment_currency ?? 'USD'), provider: String(row.payment_provider ?? 'Demo payment'), status: String(row.payment_status) as PaymentRow['status'], transaction_reference: row.payment_transaction_reference ? String(row.payment_transaction_reference) : null, created_at: String(row.payment_created_at), updated_at: String(row.payment_updated_at) } : null
    return basicApplication(row, payment)
  })
}

export async function getAdminApplication(db: Database, key: string) {
  return applicationFromBundle(await getApplicationBundle(db, key, true))
}

export async function grantApplication(db: Database, key: string, input: { etaNumber?: string; grantedDate?: string; grantedAt?: string; validFrom?: string; validUntil?: string; entries?: string; conditions?: string }) {
  const bundle = await getApplicationBundle(db, key, true)
  const app = bundle.row
  if (['GRANTED', 'REJECTED'].includes(app.status)) throw new HttpError(409, 'APPLICATION_CLOSED', 'This application already has a final decision.')
  const payment = await getPayment(db, app.id)
  if (!payment || payment.status !== 'SUCCESS') throw new HttpError(409, 'PAYMENT_REQUIRED', 'A successful payment is required before granting this application.')
  const eta = etaInput(input, app.public_id)
  const timestamp = now()
  const statements: D1PreparedStatement[] = [db.prepare("UPDATE applications SET status = 'GRANTED', updated_at = ?, version = version + 1 WHERE id = ?").bind(timestamp, app.id), etaStatement(db, app.id, eta), createNotificationStatement(db, app.id, 'VISA_GRANTED', 'Your e-Visa has been granted', `Your ${app.visa_type_id} application was granted. Your ETA is ready to view.`, timestamp), createEventStatement(db, app.id, 'VISA_GRANTED', 'Visa granted', `Your e-Visa was granted. ETA number: ${eta.etaNumber}.`, 'Visa Review Officer', timestamp)]
  await db.batch(statements)
  return applicationFromBundle(await getApplicationBundle(db, key))
}

export async function rejectApplication(db: Database, key: string, input: { reasonCategory: string; explanation?: string; reason?: string }) {
  const app = await requireApplicationRow(db, key)
  if (['GRANTED', 'REJECTED'].includes(app.status)) throw new HttpError(409, 'APPLICATION_CLOSED', 'This application already has a final decision.')
  const explanation = (input.explanation ?? input.reason ?? '').trim()
  if (!explanation) throw new HttpError(422, 'REASON_REQUIRED', 'Add a short explanation for the decision.')
  const reason = `${input.reasonCategory.trim()}: ${explanation}`
  const timestamp = now()
  const statements: D1PreparedStatement[] = [db.prepare("UPDATE applications SET status = 'REJECTED', rejection_reason = ?, updated_at = ?, version = version + 1 WHERE id = ?").bind(reason, timestamp, app.id), createNotificationStatement(db, app.id, 'VISA_REJECTED', 'Application decision', 'A decision has been recorded for your application. Sign in with your details to review it.', timestamp), createEventStatement(db, app.id, 'VISA_REJECTED', 'Application decision recorded', reason, 'Visa Review Officer', timestamp)]
  await db.batch(statements)
  return applicationFromBundle(await getApplicationBundle(db, key))
}

export { requestDocumentReplacement }
