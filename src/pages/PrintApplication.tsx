import { useEffect, useState } from 'react'
import { ArrowLeft, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { applicationSteps } from '../lib/domain'
import type { Application, SectionData } from '../lib/types'
import { PageError, PageLoading } from '../components/application/PageState'
import { StatusLabel } from '../components/application/ApplicationStatus'
import { DocumentList } from '../components/documents/DocumentRow'
import { formatDate } from '../components/forms/FormPrimitives'

const titles: Record<string, string> = { visa: 'Visa', personal: 'Personal information', passport: 'Passport', contact: 'Contact', family: 'Family', employment: 'Employment', travel: 'Travel', background: 'Background' }

export default function PrintApplication() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const [application, setApplication] = useState<Application | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { if (!applicationId) return; void api.getApplication(applicationId).then(setApplication).catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : "We couldn't load the submitted application.")).finally(() => setLoading(false)) }, [applicationId])
  if (loading) return <PageLoading label="Preparing a printable application…" />
  if (error || !application) return <PageError message={error || 'This application could not be found.'} retry={() => window.location.reload()} />
  return <main className="shell py-10 sm:py-16"><div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4"><Link className="link inline-flex items-center gap-2 text-sm" to={`/application/${application.publicId}`}><ArrowLeft size={15} aria-hidden="true" />Back to application</Link><button type="button" className="btn btn-primary gap-2" onClick={() => window.print()}><Printer size={15} aria-hidden="true" />Print application</button></div><article className="mx-auto max-w-4xl bg-white"><header className="border-b-2 border-[var(--ink)] pb-8"><p className="eyebrow text-stone">Government of India · Prototype</p><div className="mt-4 flex flex-wrap items-end justify-between gap-6"><div><h1 className="display text-5xl">Submitted application</h1><p className="mt-3 font-mono text-sm tracking-[.08em]">{application.publicId}</p></div><StatusLabel status={application.status} /></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><PrintMeta label="Applicant" value={application.applicantName} /><PrintMeta label="Passport" value={application.passportNumber} /><PrintMeta label="Submitted" value={formatDate(application.submittedAt || application.updatedAt)} /></div></header><div className="mt-8 grid gap-8 md:grid-cols-2">{applicationSteps.map((step) => <PrintSection key={step} title={titles[step]} data={application.sections?.[step] ?? {}} />)}</div><section className="mt-10 border-t border-[var(--hairline)] pt-6"><p className="eyebrow text-stone">Documents</p><h2 className="display mt-2 text-3xl">Submitted files</h2><div className="mt-3"><DocumentList documents={application.documents ?? []} /></div></section><footer className="mt-10 border-t border-[var(--hairline)] pt-5 text-xs leading-5 text-stone"><p>This is a fictional prototype document. It is not a government record and is not valid for travel.</p><p className="mt-1">Generated on {formatDate(new Date().toISOString())}.</p></footer></article></main>
}

function PrintMeta({ label, value }: { label: string; value?: string }) { return <div><p className="eyebrow text-stone">{label}</p><p className="mt-2 text-sm">{value || '—'}</p></div> }

function PrintSection({ title, data }: { title: string; data: SectionData }) { const rows = Object.entries(data).filter(([, value]) => value !== undefined && value !== '' && value !== false); return <section className="break-inside-avoid border-t border-[var(--hairline)] pt-4"><h2 className="display text-2xl">{title}</h2>{rows.length ? <dl className="mt-3">{rows.map(([key, value]) => <div key={key} className="grid grid-cols-[minmax(90px,.8fr)_minmax(0,1.2fr)] gap-3 border-b border-[var(--hairline)] py-2 text-xs"><dt className="text-stone">{humanize(key)}</dt><dd className="m-0 break-words">{Array.isArray(value) ? value.join(', ') : value === true ? 'Yes' : String(value)}</dd></div>)}</dl> : <p className="mt-3 text-sm text-stone">No saved details.</p>}</section> }
function humanize(key: string) { return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()) }

