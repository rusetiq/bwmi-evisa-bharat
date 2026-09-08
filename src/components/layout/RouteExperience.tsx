import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { visaTypes } from '../../lib/content'

const pages: Record<string, [string, string]> = {
  '/': ['Home', 'Explore the independent Indian e-Visa redesign and its simulated application journey.'],
  '/visa-types': ['Visa types', 'Compare demonstration visa categories, documents and visit durations.'],
  '/eligibility': ['Eligibility checker', 'Explore a visa route using the prototype eligibility checker.'],
  '/requirements': ['Document requirements', 'Prepare fictional documents for the demonstration application.'],
  '/entry-points': ['Entry points', 'Browse the prototype directory of arrival locations.'],
  '/fees': ['Fee estimator', 'Estimate fictional visa fees by nationality and duration.'],
  '/help': ['Help', 'Find answers about the simulated application and review journey.'],
  '/demo': ['Demo scenarios', 'Explore fictional application scenarios and their example credentials.'],
  '/apply': ['Start an application', 'Create a fictional application for the independent e-Visa prototype.'],
  '/find-application': ['Find an application', 'Retrieve a fictional application using its demonstration reference.'],
  '/payment/verify': ['Verify demo payment', 'Check the status of a simulated payment.'],
  '/admin': ['Review desk', 'Explore the fictional visa review dashboard.'],
  '/admin/applications': ['Review applications', 'Browse the demonstration application review queue.'],
}

export function RouteExperience() {
  const { pathname, search } = useLocation()
  const keyboardNavigation = useRef(false)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) keyboardNavigation.current = true
    }
    const onPointerDown = () => { keyboardNavigation.current = false }
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [])
  useEffect(() => {
    const visa = visaTypes.find((item) => pathname === `/visa-types/${item.slug}`)
    const fallback = pathname.startsWith('/admin/') ? 'Review application' : pathname.endsWith('/eta') ? 'Demo ETA' : pathname.endsWith('/print') ? 'Print application' : pathname.endsWith('/documents') ? 'Application documents' : pathname.endsWith('/review') ? 'Review your application' : pathname.endsWith('/submitted') ? 'Application submitted' : pathname.startsWith('/apply/') ? 'Application form' : pathname.startsWith('/payment/') ? 'Simulated payment' : pathname.startsWith('/application/') ? 'Application workspace' : 'Page not found'
    const [title, description] = pages[pathname] ?? (visa ? [visa.name, `${visa.description} Independent demonstration content.`] : [fallback, 'Independent Indian e-Visa prototype. All application details and transactions are fictional.'])
    document.title = `${title} · Indian e-Visa prototype`
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
    robots.content = /^\/(apply|application|payment|admin|find-application|demo)(\/|$)/.test(pathname) ? 'noindex, nofollow' : 'index, follow'
  }, [pathname])

  useEffect(() => {
    let done = false
    const focusHeading = () => {
      const heading = [...document.querySelectorAll<HTMLElement>('h1')].find((item) => item.getClientRects().length > 0)
      const main = heading?.closest('main')
      if (!heading || !main || done) return
      done = true
      observer.disconnect()
      main.id = 'main-content'
      main.tabIndex = -1
      heading.tabIndex = -1
      heading.dataset.routeFocus = keyboardNavigation.current ? 'keyboard' : 'pointer'
      heading.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    const observer = new MutationObserver(focusHeading)
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden'] })
    const frame = requestAnimationFrame(focusHeading)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [pathname, search])
  return <a href="#main-content" className="skip-link">Skip to main content</a>
}
