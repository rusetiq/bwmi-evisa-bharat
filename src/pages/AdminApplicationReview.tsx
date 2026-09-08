import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Download, ExternalLink, FileText, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Application, DocumentRecord } from '../lib/types'
import { formatDate, Notice } from '../components/forms/FormPrimitives'
import { SummaryList } from '../components/application/SummaryRow'
import { EventList } from '../components/application/Timeline'
import { EmptyState } from '../components/ui/EmptyState'
import { Button, ButtonLink } from '../components/ui/Button'
import { AdminActionPanel } from '../components/admin/AdminActionPanel'
import { AdminPaymentStatus, AdminStatus } from '../components/admin/AdminStatus'
import { AdminPageHeader, AdminSection, AdminShell } from '../components/admin/AdminShell'
import { documentLabel, formatDocumentStatus, formatDateTime, sectionValue, valueOrDash } from '../components/admin/adminUtils'

export default function AdminApplicationReview() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      if (!applicationId) {
        setError('This application reference is missing.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const result = await api.adminApplication(applicationId)
        if (active) setApplication(result)
      } catch (requestError) {
        if (active) setError(requestError instanceof ApiError ? requestError.message : 'We could not load this application. Try again.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [applicationId, refreshKey])

  function handleUpdated(updated: Application, message: string) {
    setApplication(updated)
    setNotice(message)
    setError('')
  }

  return (
    <AdminShell>
      {loading && <ReviewSkeleton />}
      {!loading && (error || !application) && <ReviewError message={error || 'This application could not be found.'} onRetry={() => setRefreshKey((value) => value + 1)} />}
      {!loading && !error && application && <ReviewContent application={application} notice={notice} onUpdated={handleUpdated} onRefresh={() => setRefreshKey((value) => value + 1)} />}
    </AdminShell>
  )
}

function ReviewContent({ application, notice, onUpdated, onRefresh }: { application: Application; notice: string; onUpdated: (application: Application, message: string) => void; onRefresh: () => void }) {
  const background = application.sections?.background ?? {}
  const backgroundFlags = useMemo(() => [
    ['Previous visa refusal', 'visaRefusal'],
    ['Previous deportation', 'deportation'],
    ['Criminal conviction', 'conviction'],
    ['Immigration violation', 'immigrationViolation'],
    ['Restricted travel history', 'restrictedTravel'],
  ] as const, [])
  const hasBackgroundConcern = backgroundFlags.some(([, key]) => String(background[key] ?? '').toLowerCase() === 'yes')

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm text-[var(--graphite)] underline decoration-[var(--cobblestone)] underline-offset-4" to="/admin/applications"><ArrowLeft size={15} aria-hidden="true" />Back to applications</Link>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto"><Button className="w-full sm:w-auto" variant="secondary" leadingIcon={<RefreshCw size={15} aria-hidden="true" />} onClick={onRefresh}>Refresh record</Button><ButtonLink className="w-full sm:w-auto" to={`/application/${application.publicId}`} variant="secondary" trailingIcon={<ExternalLink size={15} aria-hidden="true" />}>Applicant view</ButtonLink></div>
      </div>

      <AdminPageHeader
        eyebrow="Application review · fictional record"
        title={application.visaTypeName || application.visaType || 'e-Visa application'}
        intro={`${application.applicantName || 'Applicant not named'} · ${application.publicId}`}
        actions={<AdminStatus status={application.status} />}
      />

      {notice && <div className="mt-6"><Notice title="Review update saved" tone="success">{notice}</Notice></div>}

      <div className="mt-6"><Notice title="Fictional review record">This officer workspace is simulated. Decisions and document requests update the sample applicant view for demonstration purposes.</Notice></div>

      <div className="mt-8"><AdminActionPanel application={application} onUpdated={onUpdated} /></div>

      <div className="mt-12 grid gap-x-10 gap-y-12 lg:grid-cols-2">
        <AdminSection title="Applicant">
          <SummaryList rows={[
            { label: 'Full name', value: valueOrDash(application.applicantName || [sectionValue(application, 'personal', 'givenNames'), sectionValue(application, 'personal', 'surname')].filter(Boolean).join(' ')) },
            { label: 'Date of birth', value: valueOrDash(application.dob || sectionValue(application, 'personal', 'dob')) },
            { label: 'Gender', value: valueOrDash(sectionValue(application, 'personal', 'gender')) },
            { label: 'Citizenship', value: valueOrDash(sectionValue(application, 'personal', 'citizenship') || application.nationality) },
            { label: 'Email', value: valueOrDash(application.email || sectionValue(application, 'contact', 'email')) },
            { label: 'Mobile', value: valueOrDash(sectionValue(application, 'contact', 'mobile')) },
            { label: 'Current address', value: valueOrDash([sectionValue(application, 'contact', 'address1'), sectionValue(application, 'contact', 'city'), sectionValue(application, 'contact', 'country')].filter(Boolean).join(', ')) },
          ]} />
        </AdminSection>

        <AdminSection title="Passport">
          <SummaryList rows={[
            { label: 'Passport number', value: valueOrDash(application.passportNumber || sectionValue(application, 'passport', 'passportNumber')) },
            { label: 'Passport type', value: valueOrDash(sectionValue(application, 'passport', 'passportType')) },
            { label: 'Issuing country', value: valueOrDash(sectionValue(application, 'passport', 'issuingCountry') || application.nationality) },
            { label: 'Place of issue', value: valueOrDash(sectionValue(application, 'passport', 'placeOfIssue')) },
            { label: 'Issue date', value: valueOrDash(sectionValue(application, 'passport', 'issueDate')) },
            { label: 'Expiry date', value: valueOrDash(sectionValue(application, 'passport', 'expiryDate')) },
          ]} />
        </AdminSection>

        <AdminSection title="Visa and travel">
          <SummaryList rows={[
            { label: 'Visa type', value: valueOrDash(application.visaTypeName || application.visaType) },
            { label: 'Nationality', value: valueOrDash(application.nationality || sectionValue(application, 'visa', 'nationality')) },
            { label: 'Purpose', value: valueOrDash(sectionValue(application, 'visa', 'purpose')) },
            { label: 'Expected arrival', value: valueOrDash(formatDate(application.proposedArrival || sectionValue(application, 'visa', 'proposedArrival') || sectionValue(application, 'travel', 'expectedArrival'))) },
            { label: 'Expected departure', value: valueOrDash(formatDate(sectionValue(application, 'travel', 'expectedDeparture'))) },
            { label: 'Arrival port', value: valueOrDash(sectionValue(application, 'travel', 'arrivalPort') || sectionValue(application, 'visa', 'arrivalPort')) },
            { label: 'Places to visit', value: valueOrDash(sectionValue(application, 'travel', 'places')) },
            { label: 'Accommodation', value: valueOrDash([sectionValue(application, 'travel', 'accommodationName'), sectionValue(application, 'travel', 'accommodationAddress')].filter(Boolean).join(', ')) },
          ]} />
        </AdminSection>

        <AdminSection title="Background">
          {hasBackgroundConcern && <Notice title="Review attention" tone="action">At least one background declaration is marked Yes. Confirm the supporting context before recording a decision.</Notice>}
          <SummaryList rows={backgroundFlags.map(([label, key]) => ({ label, value: valueOrDash(String(background[key] ?? '')) }))} />
          <div className="mt-2"><SummaryList rows={[{ label: 'Declaration confirmed', value: background.declaration === true || String(background.declaration).toLowerCase() === 'yes' ? 'Yes' : 'No' }]} /></div>
        </AdminSection>

        <AdminSection title="Documents" eyebrow={`${application.documents?.length ?? 0} uploaded records`} className="lg:col-span-2">
          <AdminDocumentList documents={application.documents ?? []} applicationId={application.publicId} />
        </AdminSection>

        <AdminSection title="Payment">
          {application.payment ? <SummaryList rows={[
            { label: 'Status', value: <AdminPaymentStatus status={application.payment.status} /> },
            { label: 'Amount', value: `${application.payment.currency} ${application.payment.amount}` },
            { label: 'Provider', value: valueOrDash(application.payment.provider) },
            { label: 'Transaction reference', value: valueOrDash(application.payment.transactionReference) },
            { label: 'Updated', value: formatDateTime(application.payment.updatedAt) },
          ]} /> : <EmptyState title="No payment record" action={<Link className="btn btn-secondary focus-ring" to={`/application/${application.publicId}`}>Open applicant workspace</Link>}>A successful payment is required before this application can be granted.</EmptyState>}
          {application.payment && <Link className="focus-ring mt-4 inline-flex rounded-lg text-sm text-[var(--graphite)] underline decoration-[var(--cobblestone)] underline-offset-4" to={`/payment/${application.publicId}`}>Open applicant payment view</Link>}
        </AdminSection>

        <AdminSection title="Activity">
          {application.events?.length ? <EventList events={application.events} /> : <p className="text-sm leading-6 text-stone">No activity has been recorded for this application yet.</p>}
        </AdminSection>
      </div>

      <div className="mt-12 border-t border-[var(--hairline)] pt-5 text-xs leading-5 text-stone"><p>Application created {formatDateTime(application.createdAt)} · Last updated {formatDateTime(application.updatedAt)}</p><p className="mt-2">All records and decisions on this page are fictional demonstration data.</p></div>
    </>
  )
}

function AdminDocumentList({ documents, applicationId }: { documents: DocumentRecord[]; applicationId: string }) {
  if (!documents.length) {
    return (
      <EmptyState title="No documents uploaded" action={<Link className="btn btn-secondary focus-ring" to={`/application/${applicationId}`}>Open applicant workspace</Link>}>
        There are no files for the reviewing officer to assess yet.
      </EmptyState>
    )
  }

  return (
    <div className="grid gap-3">
      {documents.map((document) => {
        const requested = document.status === 'REUPLOAD_REQUIRED'
        const statusClass = requested ? 'status status-action' : document.status === 'ACCEPTED' || document.status === 'REPLACED' ? 'status status-success' : 'status'
        const isPhoto = document.documentType === 'photograph' || (document.mimeType && document.mimeType.startsWith('image/'))
        const docUrl = `/api/documents/${document.id}/view`

        return (
          <article key={document.id} className={`border bg-[var(--paper)] p-4 sm:p-5 ${requested ? 'border-[#d9691a]' : 'border-[var(--hairline)]'}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--hairline)] bg-[var(--linen)] text-[var(--graphite)]">
                  {isPhoto ? <ImageIcon size={18} aria-hidden="true" /> : <FileText size={18} aria-hidden="true" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-medium">{documentLabel(document.documentType)}</h3>
                  <p className="mt-1 truncate text-sm text-stone">
                    {document.originalFilename || 'Filename not recorded'} · {document.mimeType || 'Unknown format'} {document.sizeBytes ? `· ${Math.round(document.sizeBytes / 1024)} KB` : ''}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <span className={statusClass}>{formatDocumentStatus(document.status)}</span>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 border-t border-[var(--hairline)] pt-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-stone">Version</dt><dd className="mt-1 font-mono tabular-nums">{document.version}</dd></div>
              <div><dt className="text-xs text-stone">Uploaded</dt><dd className="mt-1">{formatDateTime(document.uploadedAt)}</dd></div>
              <div><dt className="text-xs text-stone">Reviewed</dt><dd className="mt-1">{formatDateTime(document.reviewedAt)}</dd></div>
            </dl>

            {document.rejectionReason && (
              <p className="mt-4 border-t border-[var(--hairline)] pt-3 text-sm leading-6 text-[#8c2525]">
                {document.rejectionReason}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--hairline)] pt-4">
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary min-h-9 w-full gap-2 px-4 text-[13px] sm:w-auto"
              >
                <ExternalLink size={14} aria-hidden="true" />
                View document
              </a>

              <a
                href={docUrl}
                download={document.originalFilename || 'document'}
                className="btn btn-secondary min-h-9 w-full gap-2 px-4 text-[13px] sm:w-auto"
              >
                <Download size={14} aria-hidden="true" />
                Download
              </a>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function ReviewSkeleton() {
  return <div aria-label="Loading application review" aria-busy="true"><div className="h-4 w-36 skeleton" /><div className="mt-8 h-14 w-2/3 max-w-xl skeleton" /><div className="mt-8 h-44 skeleton" /><div className="mt-10 grid gap-8 lg:grid-cols-2"><div className="h-64 skeleton" /><div className="h-64 skeleton" /></div></div>
}

function ReviewError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="max-w-xl"><Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm text-[var(--graphite)] underline decoration-[var(--cobblestone)] underline-offset-4" to="/admin/applications"><ArrowLeft size={15} aria-hidden="true" />Back to applications</Link><h1 className="display mt-10 text-5xl">This review needs attention.</h1><div className="mt-6"><Notice title="We could not load the application." tone="danger">{message}</Notice></div><Button className="mt-6" onClick={onRetry}>Try again</Button></div>
}
