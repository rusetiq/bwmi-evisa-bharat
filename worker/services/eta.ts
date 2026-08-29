import type { Eta } from '@/lib/types'
import { HttpError, now } from '../http'
import { getEta, parseEta, requireApplicationRow } from '../db/queries'
import type { AppEnv } from '../types'

type Database = AppEnv['Bindings']['DB']

function cleanDate(value: string | undefined, fallback: string) {
  if (!value || Number.isNaN(Date.parse(value))) return fallback
  return new Date(value).toISOString().slice(0, 10)
}

export function makeEtaNumber(publicId: string) {
  const suffix = publicId.split('-').pop()?.replace(/[^A-Z0-9]/gi, '').toUpperCase() || publicId.replace(/[^A-Z0-9]/gi, '').slice(-8).toUpperCase()
  return `ETA-${suffix.slice(-12)}`
}

export async function getApplicationEta(db: Database, key: string): Promise<Eta | undefined> {
  const app = await requireApplicationRow(db, key)
  return parseEta(await getEta(db, app.id))
}

export function etaInput(input: { etaNumber?: string; grantedDate?: string; grantedAt?: string; validFrom?: string; validUntil?: string; entries?: string; conditions?: string }, publicId: string) {
  const grantedAt = cleanDate(input.grantedDate ?? input.grantedAt, new Date().toISOString().slice(0, 10))
  const validFrom = cleanDate(input.validFrom, grantedAt)
  const validUntil = cleanDate(input.validUntil, new Date(Date.parse(`${validFrom}T00:00:00Z`) + 365 * 86_400_000).toISOString().slice(0, 10))
  if (Date.parse(`${validUntil}T00:00:00Z`) < Date.parse(`${validFrom}T00:00:00Z`)) throw new HttpError(422, 'INVALID_ETA_DATES', 'The ETA validity end date must be after its start date.', { validUntil: 'Choose a date after the validity start date.' })
  return { etaNumber: input.etaNumber?.trim() || makeEtaNumber(publicId), grantedAt, validFrom, validUntil, entries: input.entries?.trim() || 'Multiple', conditions: input.conditions?.trim() || 'Carry your ETA and passport when travelling.' }
}

export function etaStatement(db: Database, applicationId: number, input: ReturnType<typeof etaInput>) {
  return db.prepare(`INSERT INTO etas (application_id, eta_number, granted_at, valid_from, valid_until, entries, conditions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(application_id) DO UPDATE SET eta_number=excluded.eta_number, granted_at=excluded.granted_at, valid_from=excluded.valid_from, valid_until=excluded.valid_until, entries=excluded.entries, conditions=excluded.conditions`).bind(applicationId, input.etaNumber, input.grantedAt, input.validFrom, input.validUntil, input.entries, input.conditions)
}
