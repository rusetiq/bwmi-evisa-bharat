import { useEffect, useState } from 'react'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { AdminApplicationSummary, AdminDashboard } from '../lib/types'
import { Notice } from '../components/forms/FormPrimitives'
import { EmptyState } from '../components/ui/EmptyState'
import { Button, ButtonLink } from '../components/ui/Button'
import { AdminApplicationsTable } from '../components/admin/AdminApplicationsTable'
import { AdminPageHeader, AdminShell, AdminStatCard } from '../components/admin/AdminShell'

export default function Admin() {
  const [reviewQueue, setApplications] = useState<AdminApplicationSummary[]>([])
  const [stats, setStats] = useState<AdminDashboard['stats']>({ awaitingReview: 0, corrections: 0, paymentPending: 0, grantedToday: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const result = await api.adminDashboard()
        if (active) { setApplications(result.applications); setStats(result.stats) }
      } catch (requestError) {
        if (active) setError(requestError instanceof ApiError ? requestError.message : 'We could not load the review queue. Try again.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [refreshKey])

  return (
    <AdminShell>
      <AdminPageHeader
        title="Admin Dashboard"
        intro="Review fictional e-Visa applications, request corrections and record decisions from one place."
        actions={<Button className="w-full sm:w-auto" variant="secondary" leadingIcon={<RefreshCw size={15} aria-hidden="true" />} onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>Refresh queue</Button>}
      />

      <div className="mt-8">
        <Notice title="Prototype review environment" tone="neutral">This portal uses a mocked officer session and fictional applications. Actions are persisted for the demonstration and are visible in the applicant workspace.</Notice>
      </div>

      {error && <div className="mt-6"><Notice title="The review queue could not be loaded." tone="danger">{error} <button type="button" className="ml-1 font-medium text-[#8c2525] underline underline-offset-4" onClick={() => setRefreshKey((value) => value + 1)}>Try again</button></Notice></div>}

      <section className="mt-8" aria-labelledby="admin-stats-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 id="admin-stats-heading" className="display break-words text-3xl">Work waiting for a decision</h2>
          </div>
          <Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm text-[var(--graphite)] underline decoration-[var(--cobblestone)] underline-offset-4" to="/admin/applications">Open all applications <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <AdminStatCard label="Awaiting review" value={loading ? '—' : stats.awaitingReview} detail="Payment received, review not closed" to="/admin/applications?status=UNDER_REVIEW" />
          <AdminStatCard label="Document corrections" value={loading ? '—' : stats.corrections} detail="Applicants need to replace a file" to="/admin/applications?status=DOCUMENT_REUPLOAD_REQUIRED" />
          <AdminStatCard label="Payment pending" value={loading ? '—' : stats.paymentPending} detail="Submitted applications not yet paid" to="/admin/applications?status=PAYMENT_PENDING" />
          <AdminStatCard label="Granted today" value={loading ? '—' : stats.grantedToday} detail="Final decisions recorded today" to="/admin/applications?status=GRANTED" />
          <AdminStatCard label="Rejected" value={loading ? '—' : stats.rejected} detail="Applications with a final decision" to="/admin/applications?status=REJECTED" />
        </div>
      </section>

      <section className="mt-12" aria-labelledby="admin-queue-heading">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--hairline)] pb-4">
          <div className="min-w-0">
            <h2 id="admin-queue-heading" className="display break-words text-3xl">Applications needing attention</h2>
          </div>
          <Link className="focus-ring rounded-lg text-sm text-[var(--graphite)] underline decoration-[var(--cobblestone)] underline-offset-4" to="/admin/applications">Search and filter</Link>
        </div>
        <div className="mt-5">
          {loading && <AdminQueueSkeleton />}
          {!loading && !error && reviewQueue.length > 0 && <AdminApplicationsTable applications={reviewQueue} />}
          {!loading && !error && reviewQueue.length === 0 && <EmptyState title="The priority queue is clear." action={<Link className="btn btn-primary focus-ring" to="/admin/applications">Open all applications</Link>}>No applications are currently waiting for review, correction or payment.</EmptyState>}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-[var(--hairline)] pt-6">
        <ButtonLink to="/admin/applications" trailingIcon={<ArrowRight size={15} aria-hidden="true" />}>Open application list</ButtonLink>
        <Link className="focus-ring rounded-lg text-sm text-[var(--graphite)] underline decoration-[var(--cobblestone)] underline-offset-4" to="/demo">View seeded demo references</Link>
      </div>
    </AdminShell>
  )
}

function AdminQueueSkeleton() {
  return <div className="grid gap-3" aria-label="Loading review queue" aria-busy="true"><div className="h-16 skeleton" /><div className="h-16 skeleton" /><div className="h-16 skeleton" /></div>
}
