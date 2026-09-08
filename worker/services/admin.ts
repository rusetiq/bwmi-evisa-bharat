import type { AdminApplicationSummary, AdminApplicationsPage, AdminDashboard, ApplicationStatus } from '@/lib/types'
import { HttpError, now } from '../http'
import { applicationFromBundle, createEventStatement, createNotificationStatement, getApplicationBundle, requireApplicationRow } from '../db/queries'
import { etaInput, etaStatement } from './eta'
import { requestDocumentReplacement } from './documents'
import type { AppEnv } from '../types'

type Database = AppEnv['Bindings']['DB']

const statuses: readonly ApplicationStatus[] = ['DRAFT', 'READY_TO_SUBMIT', 'SUBMITTED', 'PAYMENT_PENDING', 'UNDER_REVIEW', 'DOCUMENT_REUPLOAD_REQUIRED', 'GRANTED', 'REJECTED']

export type AdminListFilters = { status?: string; visaType?: string; nationality?: string; search?: string; limit?: number; offset?: number; cursor?: string; attention?: boolean }

function statusIs(value: string): value is ApplicationStatus { return (statuses as readonly string[]).includes(value) }

function basicApplication(row: Record<string, unknown>): AdminApplicationSummary {
  return {
    id: Number(row.id), publicId: String(row.public_id), status: String(row.status) as ApplicationStatus, nationality: String(row.nationality ?? ''), visaType: String(row.visa_type_id ?? ''), visaTypeName: String(row.visa_type_name ?? row.visa_type_id ?? ''), applicantName: String(row.applicant_name ?? ''), passportNumber: String(row.passport_number ?? ''), updatedAt: String(row.updated_at), ...(row.submitted_at ? { submittedAt: String(row.submitted_at) } : {}),
  }
}

export async function getAdminApplicationsPage(db: Database, filters: AdminListFilters): Promise<AdminApplicationsPage> {
  const clauses: string[] = []
  const values: Array<string | number> = []
  if (filters.status && statusIs(filters.status)) { clauses.push('a.status = ?'); values.push(filters.status) }
  if (filters.attention) clauses.push("a.status IN ('UNDER_REVIEW', 'DOCUMENT_REUPLOAD_REQUIRED', 'PAYMENT_PENDING')")
  if (filters.visaType) { clauses.push('a.visa_type_id = ?'); values.push(filters.visaType.trim().slice(0, 80)) }
  if (filters.nationality) { clauses.push('lower(a.nationality) = lower(?)'); values.push(filters.nationality.trim().slice(0, 100)) }
  if (filters.search) { clauses.push('(lower(a.public_id) LIKE lower(?) OR lower(COALESCE(a.applicant_name, \'\')) LIKE lower(?) OR lower(COALESCE(a.passport_number, \'\')) LIKE lower(?))'); const term = `%${filters.search.trim().slice(0, 100)}%`; values.push(term, term, term) }
  const requestedLimit = Number(filters.limit)
  const requestedOffset = Number(filters.offset)
  const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 50, 200))
  const offset = Math.max(0, Number.isFinite(requestedOffset) ? Math.floor(requestedOffset) : 0)
  if (filters.cursor) {
    let cursor: unknown
    try { cursor = JSON.parse(atob(filters.cursor)) } catch { throw new HttpError(422, 'INVALID_CURSOR', 'Choose a valid application page.') }
    if (!Array.isArray(cursor) || cursor.length !== 2 || typeof cursor[0] !== 'string' || !Number.isSafeInteger(cursor[1]) || cursor[1] < 1) throw new HttpError(422, 'INVALID_CURSOR', 'Choose a valid application page.')
    clauses.push('(COALESCE(a.submitted_at, a.updated_at), a.id) < (?, ?)')
    values.push(cursor[0], cursor[1])
  }
  values.push(limit + 1, filters.cursor ? 0 : offset)
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const result = await db.prepare(`SELECT a.id, a.public_id, a.status, a.nationality, a.visa_type_id, a.applicant_name, a.passport_number, a.updated_at, a.submitted_at, v.name AS visa_type_name
    FROM applications a LEFT JOIN visa_types v ON v.slug = a.visa_type_id ${where}
    ORDER BY COALESCE(a.submitted_at, a.updated_at) DESC, a.id DESC LIMIT ? OFFSET ?`).bind(...values).all<Record<string, unknown>>()
  const rows = result.results ?? []
  const items = rows.slice(0, limit).map(basicApplication)
  const last = items.at(-1)
  return { items, nextCursor: rows.length > limit && last ? btoa(JSON.stringify([last.submittedAt || last.updatedAt, last.id])) : null }
}

export async function listAdminApplications(db: Database, filters: AdminListFilters) {
  return (await getAdminApplicationsPage(db, filters)).items
}

export async function getAdminDashboard(db: Database, dayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z'): Promise<AdminDashboard> {
  const start = new Date(dayStart)
  if (!Number.isFinite(start.getTime())) throw new HttpError(422, 'INVALID_DATE', 'Choose a valid dashboard date.')
  const end = new Date(start.getTime() + 86_400_000).toISOString()
  const [counts, page] = await Promise.all([
    db.prepare(`SELECT COALESCE(SUM(status = 'UNDER_REVIEW'), 0) AS awaitingReview,
      COALESCE(SUM(status = 'DOCUMENT_REUPLOAD_REQUIRED'), 0) AS corrections,
      COALESCE(SUM(status = 'PAYMENT_PENDING'), 0) AS paymentPending,
      COALESCE(SUM(status = 'GRANTED' AND updated_at >= ? AND updated_at < ?), 0) AS grantedToday,
      COALESCE(SUM(status = 'REJECTED'), 0) AS rejected FROM applications`).bind(start.toISOString(), end).first<AdminDashboard['stats']>(),
    getAdminApplicationsPage(db, { attention: true, limit: 6 }),
  ])
  return { stats: counts ?? { awaitingReview: 0, corrections: 0, paymentPending: 0, grantedToday: 0, rejected: 0 }, applications: page.items }
}

export async function getAdminApplication(db: Database, key: string) {
  return applicationFromBundle(await getApplicationBundle(db, key, true))
}

export async function grantApplication(db: Database, key: string, input: { etaNumber?: string; grantedDate?: string; grantedAt?: string; validFrom?: string; validUntil?: string; entries?: string; conditions?: string }) {
  const bundle = await getApplicationBundle(db, key, true)
  const app = bundle.row
  if (['GRANTED', 'REJECTED'].includes(app.status)) throw new HttpError(409, 'APPLICATION_CLOSED', 'This application already has a final decision.')
  const payment = bundle.payment
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
