import { Hono } from 'hono'
import { ZodError } from 'zod'
import { adminRoutes } from './routes/admin'
import { applicationRoutes } from './routes/applications'
import { documentRoutes } from './routes/documents'
import { eligibilityRoutes } from './routes/eligibility'
import { paymentRoutes } from './routes/payments'
import { publicDataRoutes } from './routes/public-data'
import { fail, HttpError } from './http'
import type { AppEnv } from './types'
import { applyResponsePolicy } from './responsePolicy'
import { metricsRoutes } from './routes/metrics'

export const app = new Hono<AppEnv>()

app.use('*', async (c, next) => {
  const started = performance.now()
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)
  c.header('X-Request-Id', requestId)
  await next()
  if (c.req.path.startsWith('/api/') && c.req.path !== '/api/metrics') {
    console.info(JSON.stringify({ event: 'request', requestId, method: c.req.method, route: c.req.routePath, status: c.res.status, durationMs: Math.round(performance.now() - started) }))
  }
})

app.options('*', (c) => c.body(null, 204))
app.route('/api/applications', applicationRoutes)
app.route('/api', documentRoutes)
app.route('/api', paymentRoutes)
app.route('/api/eligibility', eligibilityRoutes)
app.route('/api/public-data', publicDataRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/metrics', metricsRoutes)

app.onError((error, c) => {
  if (error instanceof HttpError) return fail(c, error.status, error.code, error.message, error.fields)
  if (error instanceof ZodError) return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields and try again.')
  console.error(JSON.stringify({ event: 'request_error', requestId: c.get('requestId'), route: c.req.routePath, error: 'unexpected_failure' }))
  return fail(c, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.')
})

app.notFound(async (c) => {
  if (c.req.path.startsWith('/api/')) return fail(c, 404, 'NOT_FOUND', 'That API route was not found.')
  if (c.env.ASSETS) {
    const viteRequest = c.req.path.startsWith('/@') || c.req.path.startsWith('/src/') || c.req.path.startsWith('/node_modules/')
    if (viteRequest || c.req.path.startsWith('/assets/') || /\.(?:avif|css|gif|ico|jpe?g|js|png|svg|tsx?|webp|woff2?)$/i.test(c.req.path) || c.req.path === '/robots.txt') {
      const asset = await c.env.ASSETS.fetch(c.req.raw)
      if (/\.(js|css)$/.test(c.req.path) && asset.headers.get('Content-Type')?.includes('text/html')) return c.text('Asset not found. Reload the page to load the current version.', 404)
      return asset
    }
    const url = new URL(c.req.url)
    url.pathname = '/index.html'
    return c.env.ASSETS.fetch(new Request(url, { method: 'GET', headers: c.req.raw.headers }))
  }
  return c.text('Not found', 404)
})

async function fetchWithHeaders(request: Request, env: AppEnv['Bindings'], ctx: ExecutionContext) {
  const response = await app.fetch(request, env, ctx)
  return applyResponsePolicy(request, response)
}

export default { fetch: fetchWithHeaders }
