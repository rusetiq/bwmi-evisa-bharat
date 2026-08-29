import type { Application } from '@/lib/types'
import { calculateVisaFee } from '@/lib/domain'
import { HttpError, now } from '../http'
import { applicationFromBundle, createEventStatement, createNotificationStatement, getApplicationBundle, getPayment, parsePayment, requireApplicationRow } from '../db/queries'
import type { AppEnv } from '../types'
import { paymentSchema } from '../validation'

type Database = AppEnv['Bindings']['DB']
type PaymentInput = ReturnType<typeof paymentSchema.parse>

export function normalizePaymentStatus(input: PaymentInput) {
  const candidate = input.status ?? (input.outcome === 'success' || input.simulate === 'success' ? 'SUCCESS' : input.outcome === 'failed' || input.simulate === 'failed' ? 'FAILED' : input.outcome === 'pending' || input.simulate === 'pending' || input.outcome === 'processing' || input.simulate === 'processing' ? 'PROCESSING' : undefined)
  return candidate ?? 'SUCCESS'
}

function transactionReference(publicId: string) {
  return `DEMO-${publicId.replace(/[^A-Z0-9]/gi, '').slice(-8).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

export async function getPaymentForApplication(db: Database, key: string) {
  const app = await requireApplicationRow(db, key)
  return parsePayment(await getPayment(db, app.id))
}

export async function simulatePayment(db: Database, key: string, rawInput: unknown): Promise<Application> {
  const input = paymentSchema.parse(rawInput ?? {})
  const status = normalizePaymentStatus(input)
  const bundle = await getApplicationBundle(db, key)
  const app = bundle.row
  if (['GRANTED', 'REJECTED'].includes(app.status)) throw new HttpError(409, 'PAYMENT_CLOSED', 'This application is no longer accepting payments.')
  if (!['SUBMITTED', 'PAYMENT_PENDING', 'UNDER_REVIEW'].includes(app.status)) throw new HttpError(409, 'APPLICATION_NOT_SUBMITTED', 'Submit the application before starting payment.')
  const updatedAt = now()
  const fee = calculateVisaFee(app.nationality, app.visa_type_id)
  const reference = status === 'SUCCESS' ? transactionReference(app.public_id) : null
  const nextApplicationStatus = status === 'SUCCESS' ? 'UNDER_REVIEW' : app.status === 'UNDER_REVIEW' ? 'UNDER_REVIEW' : 'PAYMENT_PENDING'
  const title = status === 'SUCCESS' ? 'Payment received' : status === 'FAILED' ? 'Payment was not completed' : 'Payment is being verified'
  const message = status === 'SUCCESS' ? 'Your demo payment was received and your application is now under review.' : status === 'FAILED' ? 'The demo payment was not completed. You can try again.' : 'We are confirming your demo payment. Check again shortly.'
  const statements: D1PreparedStatement[] = [db.prepare(`INSERT INTO payments (application_id, amount, currency, provider, status, transaction_reference, created_at, updated_at)
    VALUES (?, ?, ?, 'Demo payment', ?, ?, COALESCE((SELECT created_at FROM payments WHERE application_id = ?), ?), ?)
    ON CONFLICT(application_id) DO UPDATE SET amount=excluded.amount, currency=excluded.currency, provider=excluded.provider, status=excluded.status, transaction_reference=excluded.transaction_reference, updated_at=excluded.updated_at`).bind(app.id, fee.total, fee.currency, status, reference, app.id, updatedAt, updatedAt), db.prepare('UPDATE applications SET status = ?, updated_at = ?, version = version + 1 WHERE id = ?').bind(nextApplicationStatus, updatedAt, app.id), createEventStatement(db, app.id, status === 'SUCCESS' ? 'PAYMENT_RECEIVED' : status === 'FAILED' ? 'PAYMENT_FAILED' : 'PAYMENT_PROCESSING', title, message, 'applicant', updatedAt), createNotificationStatement(db, app.id, status === 'SUCCESS' ? 'PAYMENT_RECEIVED' : status === 'FAILED' ? 'PAYMENT_FAILED' : 'PAYMENT_PROCESSING', title, message, updatedAt)]
  await db.batch(statements)
  return applicationFromBundle(await getApplicationBundle(db, key))
}
