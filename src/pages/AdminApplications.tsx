import { FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { countries, visaTypes } from '../lib/content'
import type { AdminApplicationSummary } from '../lib/types'
import { Notice } from '../components/forms/FormPrimitives'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { AdminApplicationsTable } from '../components/admin/AdminApplicationsTable'
import { AdminPageHeader, AdminShell } from '../components/admin/AdminShell'
import { applicationStatuses } from '../components/admin/adminUtils'

type FilterValues = { search: string; status: string; visaType: string; nationality: string }

function readFilters(params: URLSearchParams): FilterValues {
  return { search: params.get('search') ?? '', status: params.get('status') ?? '', visaType: params.get('visaType') ?? '', nationality: params.get('nationality') ?? '' }
}

export default function AdminApplications() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryString = searchParams.toString()
  const [filters, setFilters] = useState<FilterValues>(() => readFilters(searchParams))
  const [applications, setApplications] = useState<AdminApplicationSummary[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [previousPages, setPreviousPages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => { setFilters(readFilters(searchParams)) }, [queryString])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      const query = new URLSearchParams(queryString)
      query.set('limit', '50')
      try {
        const result = await api.adminApplicationsPage(`?${query.toString()}`)
        if (active) { setApplications(result.items); setNextCursor(result.nextCursor) }
      } catch (requestError) {
        if (active) setError(requestError instanceof ApiError ? requestError.message : 'We could not load these applications. Try again.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [queryString, refreshKey])

  function updateFilter(field: keyof FilterValues, value: string) {
    setFilters((previous) => ({ ...previous, [field]: value }))
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => { if (value.trim()) next.set(key, value.trim()) })
    setPreviousPages([])
    setSearchParams(next)
  }

  function clearFilters() {
    setPreviousPages([])
    setSearchParams(new URLSearchParams())
  }

  const hasFilters = Object.values(filters).some(Boolean)
  return (
    <AdminShell>
      <AdminPageHeader
        title="Find the next application."
        intro="Search by application ID, applicant or passport. Use filters to narrow the review queue without losing your place on refresh."
        actions={<Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm text-[var(--graphite)] underline decoration-[var(--cobblestone)] underline-offset-4" to="/admin"><ArrowLeft size={15} aria-hidden="true" />Back to overview</Link>}
      />

      <div className="mt-6"><Notice title="Fictional records only">This review queue is simulated. Filters, statuses and officer actions are included to make the demo flow explorable.</Notice></div>

      <section className="mt-8 rounded-2xl border border-[var(--hairline)] bg-[var(--paper)] p-5 sm:p-6" aria-labelledby="filters-heading">
        <div className="flex items-center gap-3"><SlidersHorizontal size={17} aria-hidden="true" /><h2 id="filters-heading" className="display text-2xl">Search and filter</h2></div>
        <form className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end" onSubmit={applyFilters}>
          <div>
            <label className="label" htmlFor="admin-search">Search</label>
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone" size={16} aria-hidden="true" /><input id="admin-search" className="field focus-ring pl-10" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="ID, applicant or passport" /></div>
          </div>
          <div>
            <label className="label" htmlFor="admin-status">Status</label>
            <select id="admin-status" className="field focus-ring" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">All statuses</option>{applicationStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
          </div>
          <div>
            <label className="label" htmlFor="admin-visa">Visa type</label>
            <select id="admin-visa" className="field focus-ring" value={filters.visaType} onChange={(event) => updateFilter('visaType', event.target.value)}><option value="">All visa types</option>{visaTypes.map((visa) => <option key={visa.slug} value={visa.slug}>{visa.name}</option>)}</select>
          </div>
          <div>
            <label className="label" htmlFor="admin-nationality">Nationality</label>
            <select id="admin-nationality" className="field focus-ring" value={filters.nationality} onChange={(event) => updateFilter('nationality', event.target.value)}><option value="">All nationalities</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select>
          </div>
          <Button className="w-full lg:w-auto" type="submit" leadingIcon={<Search size={15} aria-hidden="true" />}>Apply</Button>
        </form>
        {hasFilters && <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--hairline)] pt-4"><span className="text-xs text-stone">Active filters are in the URL.</span><button type="button" className="focus-ring inline-flex items-center gap-1 rounded-lg text-xs font-medium text-[var(--graphite)] underline decoration-[var(--cobblestone)] underline-offset-4" onClick={clearFilters}>Clear filters <X size={13} aria-hidden="true" /></button></div>}
      </section>

      <section className="mt-10" aria-labelledby="results-heading" aria-live="polite">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--hairline)] pb-4">
          <div><h2 id="results-heading" className="display mt-2 text-3xl">{loading ? 'Loading applications' : `${applications.length} application${applications.length === 1 ? '' : 's'} on this page`}</h2></div>
          <Button className="w-full sm:w-auto" variant="secondary" leadingIcon={<RefreshCw size={15} aria-hidden="true" />} onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>Refresh</Button>
        </div>
        <div className="mt-5">
          {error && <Notice title="Applications could not be loaded." tone="danger">{error} <button type="button" className="ml-1 font-medium text-[#8c2525] underline underline-offset-4" onClick={() => setRefreshKey((value) => value + 1)}>Try again</button></Notice>}
          {loading && <ApplicationListSkeleton />}
          {!loading && !error && applications.length > 0 && <AdminApplicationsTable applications={applications} />}
          {!loading && !error && <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Application pages">
            <Button variant="secondary" disabled={!searchParams.has('cursor')} onClick={() => {
              const previous = previousPages.at(-1)
              const next = new URLSearchParams(previous ?? queryString)
              if (previous === undefined) next.delete('cursor')
              setPreviousPages((pages) => pages.slice(0, -1))
              setSearchParams(next)
            }}>{previousPages.length ? 'Previous page' : 'First page'}</Button>
            <Button variant="secondary" disabled={!nextCursor} onClick={() => {
              if (!nextCursor) return
              const next = new URLSearchParams(queryString)
              next.set('cursor', nextCursor)
              setPreviousPages((pages) => [...pages, queryString])
              setSearchParams(next)
            }}>Next page</Button>
          </nav>}
          {!loading && !error && applications.length === 0 && <EmptyState title="No applications match these filters." action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : <Link className="btn btn-primary focus-ring" to="/admin">Return to overview</Link>}>Try a broader search or remove one of the filters.</EmptyState>}
        </div>
      </section>
    </AdminShell>
  )
}

function ApplicationListSkeleton() {
  return <div className="grid gap-3" aria-label="Loading applications" aria-busy="true"><div className="h-20 skeleton" /><div className="h-20 skeleton" /><div className="h-20 skeleton" /></div>
}
