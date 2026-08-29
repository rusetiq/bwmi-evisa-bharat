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

export const app = new Hono<AppEnv>()

app.options('*', (c) => c.body(null, 204))
app.route('/api/applications', applicationRoutes)
app.route('/api', documentRoutes)
app.route('/api', paymentRoutes)
app.route('/api/eligibility', eligibilityRoutes)
app.route('/api/public-data', publicDataRoutes)
app.route('/api/admin', adminRoutes)

app.onError((error, c) => {
  if (error instanceof HttpError) return fail(c, error.status, error.code, error.message, error.fields)
  if (error instanceof ZodError) return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields and try again.')
  return fail(c, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.')
})

app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) return fail(c, 404, 'NOT_FOUND', 'That API route was not found.')
  if (c.env.ASSETS) {
    if (c.req.path.startsWith('/assets/') || /\.(?:avif|css|gif|ico|jpe?g|js|png|svg|webp|woff2?)$/i.test(c.req.path) || c.req.path === '/robots.txt') {
      return c.env.ASSETS.fetch(c.req.raw)
    }
    const url = new URL(c.req.url)
    url.pathname = '/index.html'
    return c.env.ASSETS.fetch(new Request(url, { method: 'GET', headers: c.req.raw.headers }))
  }
  return c.text('Not found', 404)
})

async function fetchWithHeaders(request: Request, env: AppEnv['Bindings'], ctx: ExecutionContext) {
  const response = await app.fetch(request, env, ctx)
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Frame-Options', 'DENY')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export default { fetch: fetchWithHeaders }
