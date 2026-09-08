export function applyResponsePolicy(request: Request, response: Response) {
  const path = new URL(request.url).pathname
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Frame-Options', 'DENY')
  if (/^\/(api|apply|application|payment|admin|find-application|demo)(\/|$)/.test(path)) headers.set('X-Robots-Tag', 'noindex, nofollow')
  if (path.startsWith('/api/')) headers.set('Cache-Control', 'no-store')
  const fingerprinted = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(js|css|woff2?|avif|webp|png|jpe?g)$/.test(path)
  if (fingerprinted && response.status === 200 && !headers.get('Content-Type')?.includes('text/html')) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
