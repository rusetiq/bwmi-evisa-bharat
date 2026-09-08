import type { Metric } from 'web-vitals'

export function metricPage(path: string): 'public' | 'application' | 'payment' | 'admin' {
  if (/^\/admin(\/|$)/.test(path)) return 'admin'
  if (/^\/payment(\/|$)/.test(path)) return 'payment'
  if (/^\/(apply|application|find-application)(\/|$)/.test(path)) return 'application'
  return 'public'
}

export function startVitals() {
  if (!import.meta.env.PROD || navigator.doNotTrack === '1') return
  const page = metricPage(location.pathname)
  const report = ({ name, value }: Metric) => {
    if (!Number.isFinite(value)) return
    const body = JSON.stringify({ name, value: Math.round(value * 1000) / 1000, page })
    void fetch('/api/metrics', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true, credentials: 'omit' }).catch(() => {})
  }
  void import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
    onCLS(report)
    onINP(report)
    onLCP(report)
  }).catch(() => {})
}
