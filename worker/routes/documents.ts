import { Hono } from 'hono'
import { ok } from '../http'
import type { AppEnv } from '../types'
import { getDocument } from '../db/queries'
import { getDocumentContent, parseUpload, replaceDocumentById, uploadDocument } from '../services/documents'

export const documentRoutes = new Hono<AppEnv>()

documentRoutes.get('/documents/:id/view', async (c) => {
  const docId = Number(c.req.param('id'))
  return getDocumentContent(c.env.DB, c.env.DOCUMENTS, docId)
})

documentRoutes.get('/documents/:id', async (c) => {
  const docId = Number(c.req.param('id'))
  return getDocumentContent(c.env.DB, c.env.DOCUMENTS, docId)
})

documentRoutes.post('/applications/:id/documents', async (c) => {
  const payload = await parseUpload(c.req.raw)
  return ok(c, await uploadDocument(c.env.DB, c.env.DOCUMENTS, c.req.param('id'), payload), 201)
})

documentRoutes.patch('/:id', async (c) => {
  const existing = await getDocument(c.env.DB, Number(c.req.param('id')))
  if (!existing) return c.json({ ok: false as const, error: { code: 'NOT_FOUND', message: 'We could not find that document.' } }, 404)
  const payload = await parseUpload(c.req.raw)
  return ok(c, await replaceDocumentById(c.env.DB, c.env.DOCUMENTS, existing.id, payload))
})
