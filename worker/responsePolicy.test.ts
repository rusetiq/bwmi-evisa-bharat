import { describe, expect, it, vi } from 'vitest'
import { applyResponsePolicy } from './responsePolicy'
import { app } from './index'
import { metricSchema } from './routes/metrics'

describe('response policies and telemetry', () => {
  it('caches fingerprinted assets, but not HTML, failures or API state', () => {
    const policy = (path: string, type: string, status = 200) => applyResponsePolicy(new Request(`https://demo.test${path}`), new Response('', { status, headers: { 'Content-Type': type } })).headers
    expect(policy('/assets/index-12345678.js', 'text/javascript').get('Cache-Control')).toContain('immutable')
    expect(policy('/assets/index-12345678.css', 'text/css').get('Cache-Control')).toContain('31536000')
    expect(policy('/assets/index-12345678.js', 'text/html').get('Cache-Control')).toBeNull()
    expect(policy('/assets/index-12345678.js', 'text/plain', 404).get('Cache-Control')).toBeNull()
    expect(policy('/', 'text/html').get('Cache-Control')).toBeNull()
    expect(policy('/api/applications/TEST', 'application/json').get('Cache-Control')).toBe('no-store')
    expect(policy('/api/applications/TEST', 'application/json').get('X-Robots-Tag')).toBe('noindex, nofollow')
  })

  it('never returns SPA HTML as a successful JS asset', async () => {
    const response = await app.request('/assets/missing-12345678.js', {}, { ASSETS: { fetch: async () => new Response('<html />', { headers: { 'Content-Type': 'text/html' } }) } })
    expect(response.status).toBe(404)
    expect(response.headers.get('Content-Type')).not.toContain('text/html')
    expect(response.headers.get('X-Request-Id')).toBeTruthy()
  })

  it('accepts only anonymous metric fields and finite bounds', () => {
    expect(metricSchema.safeParse({ name: 'LCP', value: 1500, page: 'public' }).success).toBe(true)
    for (const bad of [
      { name: 'INP', value: Infinity, page: 'public' },
      { name: 'CLS', value: 101, page: 'public' },
      { name: 'LCP', value: 1500, page: '/application/SECRET' },
      { name: 'LCP', value: 1500, page: 'public', email: 'test@example.test' },
    ]) expect(metricSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects cross-origin and oversized telemetry without logging it', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {})
    try {
      expect((await app.request('/api/metrics', { method: 'POST', headers: { Origin: 'https://other.test' }, body: '{}' })).status).toBe(403)
      expect((await app.request('/api/metrics', { method: 'POST', body: 'x'.repeat(513) })).status).toBe(413)
      const response = await app.request('/api/metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'LCP', value: 1000, page: 'public' }) })
      expect(response.status).toBe(204)
      expect(log).toHaveBeenCalledTimes(1)
      expect(JSON.parse(log.mock.calls[0][0])).toEqual({ event: 'web_vital', name: 'LCP', value: 1000, page: 'public' })
    } finally { log.mockRestore() }
  })
})
