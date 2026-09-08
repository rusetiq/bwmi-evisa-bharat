import { describe, expect, it } from 'vitest'
import { applicationFromBundle, getApplicationBundle } from '../db/queries'
import { getAdminApplicationsPage, getAdminDashboard } from './admin'
import { updateApplication } from './applications'

type Query = { sql: string; values: unknown[] }
function fakeDatabase(resolve: (query: Query) => unknown) {
  const reads: Query[] = []
  const writes: Query[][] = []
  const db = {
    prepare(sql: string) {
      const query: Query = { sql, values: [] }
      const statement = {
        query,
        bind(...values: unknown[]) { query.values = values; return statement },
        async first() { reads.push(query); return resolve(query) ?? null },
        async all() { reads.push(query); return { results: resolve(query) ?? [] } },
      }
      return statement
    },
    async batch(statements: Array<{ query: Query }>) { writes.push(statements.map((statement) => statement.query)); return statements.map(() => ({ success: true })) },
  }
  return { db: db as unknown as D1Database, reads, writes }
}

const row = { id: 1, public_id: 'IND-EV-26-TEST', status: 'DRAFT', nationality: 'United States', visa_type_id: 'e-tourist', version: 1, sections_json: JSON.stringify({ visa: { nationality: 'United States', visaType: 'e-tourist' }, contact: { email: 'old@example.test', city: 'Seattle' } }), updated_at: '2026-09-08T00:00:00.000Z' }

describe('application database budgets', () => {
  it('loads a bundle in eight reads while preserving section overrides and fallback data', async () => {
    const { db, reads } = fakeDatabase(({ sql }) => {
      if (sql.startsWith('SELECT * FROM applications')) return row
      if (sql.includes('FROM application_sections')) return [{ section: 'contact', data_json: '{"email":"new@example.test"}' }]
      return undefined
    })
    const app = applicationFromBundle(await getApplicationBundle(db, row.public_id))
    expect(app.sections.contact.email).toBe('new@example.test')
    expect(app.sections.visa.nationality).toBe('United States')
    expect(reads).toHaveLength(8)
    expect(reads.some(({ sql }) => /FROM (applicants|passports)/.test(sql))).toBe(false)
    expect(reads.some(({ sql }) => sql.startsWith('SELECT sections_json'))).toBe(false)
  })

  it('autosaves only the affected normalized table alongside the application and section', async () => {
    const { db, reads, writes } = fakeDatabase(({ sql }) => {
      if (sql.startsWith('SELECT * FROM applications')) return row
      if (sql.includes('FROM visa_types')) return { slug: 'e-tourist' }
      return undefined
    })
    await updateApplication(db, row.public_id, { section: 'contact', fields: { email: 'saved@example.test' }, version: 1 })
    expect(reads).toHaveLength(3)
    expect(writes[0]).toHaveLength(3)
    expect(writes[0].map(({ sql }) => sql.match(/(?:UPDATE|INSERT INTO) (\w+)/)?.[1])).toEqual(['applications', 'application_sections', 'addresses'])
    expect(writes[0][2].values[1]).toBe('{"email":"saved@example.test","city":"Seattle"}')
  })
})

describe('admin query contracts', () => {
  it('returns bounded summaries with a stable cursor for ties without selecting section data', async () => {
    const records = [3, 2, 1].map((id) => ({ ...row, id }))
    const { db, reads } = fakeDatabase(({ values }) => values.length > 2 ? records.slice(2) : records)
    const first = await getAdminApplicationsPage(db, { limit: 2 })
    expect(first.items.map((item) => item.id)).toEqual([3, 2])
    expect(first.items[0]).not.toHaveProperty('sections')
    expect(first.items[0]).not.toHaveProperty('documents')
    expect(reads[0].sql).not.toContain('a.*')
    expect(reads[0].sql).not.toContain('sections_json')
    const second = await getAdminApplicationsPage(db, { limit: 2, cursor: first.nextCursor! })
    expect(second.items.map((item) => item.id)).toEqual([1])
    expect(second.nextCursor).toBeNull()
    expect(reads[1].values).toEqual([row.updated_at, 2, 3, 0])
    expect(reads[1].sql).toContain('(COALESCE(a.submitted_at, a.updated_at), a.id) < (?, ?)')
  })

  it('rejects invalid cursors before issuing a query', async () => {
    const { db, reads } = fakeDatabase(() => [])
    await expect(getAdminApplicationsPage(db, { cursor: 'bad' })).rejects.toMatchObject({ code: 'INVALID_CURSOR' })
    expect(reads).toHaveLength(0)
  })

  it('counts the full dataset in SQL and filters attention before limiting the queue', async () => {
    const stats = { awaitingReview: 350, corrections: 201, paymentPending: 400, grantedToday: 25, rejected: 300 }
    const { db, reads } = fakeDatabase(({ sql }) => sql.startsWith('SELECT COALESCE') ? stats : [])
    const result = await getAdminDashboard(db, '2026-09-07T20:00:00.000Z')
    expect(result.stats).toEqual(stats)
    expect(reads).toHaveLength(2)
    expect(reads[0].sql).not.toContain('LIMIT')
    expect(reads[0].values).toEqual(['2026-09-07T20:00:00.000Z', '2026-09-08T20:00:00.000Z'])
    expect(reads[1].sql).toContain("a.status IN ('UNDER_REVIEW', 'DOCUMENT_REUPLOAD_REQUIRED', 'PAYMENT_PENDING')")
    expect(reads[1].values).toEqual([7, 0])
  })
})
