import { Hono } from 'hono'
import { fail, ok, readJson } from '../http'
import type { AppEnv } from '../types'
import { grantSchema, rejectSchema, requestDocumentSchema } from '../validation'
import { getAdminApplication, grantApplication, listAdminApplications, rejectApplication } from '../services/admin'
import { requestDocumentReplacement } from '../services/documents'

export const adminRoutes = new Hono<AppEnv>()

adminRoutes.use('*', async (c, next) => {
  const expected = c.env.ADMIN_DEMO_KEY || 'evisa-review-demo'
  if (c.req.method !== 'GET' && c.req.header('X-Demo-Admin') !== expected) return fail(c, 401, 'ADMIN_REQUIRED', 'This demo review area requires the admin key.')
  await next()
})

adminRoutes.get('/applications', async (c) => ok(c, await listAdminApplications(c.env.DB, { status: c.req.query('status'), visaType: c.req.query('visaType'), nationality: c.req.query('nationality'), search: c.req.query('search'), limit: Number(c.req.query('limit') || 100), offset: Number(c.req.query('offset') || 0) })))

adminRoutes.get('/applications/:id', async (c) => ok(c, await getAdminApplication(c.env.DB, c.req.param('id'))))

adminRoutes.post('/applications/:id/request-document', async (c) => ok(c, await requestDocumentReplacement(c.env.DB, c.req.param('id'), await readJson(c, requestDocumentSchema))))

adminRoutes.post('/applications/:id/grant', async (c) => ok(c, await grantApplication(c.env.DB, c.req.param('id'), await readJson(c, grantSchema))))

adminRoutes.post('/applications/:id/reject', async (c) => ok(c, await rejectApplication(c.env.DB, c.req.param('id'), await readJson(c, rejectSchema))))
