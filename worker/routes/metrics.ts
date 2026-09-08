import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { readJson } from '../http'

export const metricSchema = z.object({
  name: z.enum(['LCP', 'INP', 'CLS']),
  value: z.number().finite().min(0).max(600000),
  page: z.enum(['public', 'application', 'payment', 'admin']),
}).strict().refine((value) => value.name !== 'CLS' || value.value <= 100)

export const metricsRoutes = new Hono<AppEnv>()
metricsRoutes.use('*', bodyLimit({ maxSize: 512, onError: (c) => c.body(null, 413) }))
metricsRoutes.post('/', async (c) => {
  const origin = c.req.header('Origin')
  if (origin && origin !== new URL(c.req.url).origin) return c.body(null, 403)
  if (Number(c.req.header('Content-Length') ?? 0) > 512) return c.body(null, 413)
  const metric = await readJson(c, metricSchema)
  console.info(JSON.stringify({ event: 'web_vital', ...metric }))
  return c.body(null, 204)
})
