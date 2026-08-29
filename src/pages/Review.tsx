import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Pencil } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { applicationSteps, getRequiredDocuments, isStepComplete } from '../lib/domain'
import type { Application, SectionData } from '../lib/types'
import { ApplicationShell } from '../components/application/ApplicationShell'
import { PageError, PageLoading } from '../components/application/PageState'
import { CheckboxField, Notice, SectionHeading, formatDate } from '../components/forms/FormPrimitives'
import { DocumentChecklist } from '../components/documents/DocumentChecklist'

const sectionTitles: Record<string, string> = { visa: 'Visa', personal: 'Personal information', passport: 'Passport', contact: 'Contact', family: 'Family', employment: 'Employment', travel: 'Travel', background: 'Background' }

export default function Review() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [declaration, setDeclaration] = useState(false)
  const [busy, setBusy] = useState(false)

  async function load() {
    if (!applicationId) return
    setLoading(true); setError('')
    try { const result = await api.getApplication(applicationId); setApplication(result); setDeclaration(result.sections?.background?.declaration === true) } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "We couldn't load your review.") } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [applicationId])

  const completeSteps = useMemo(() => application ? applicationSteps.every((step) => isStepComplete(step, application.sections?.[step])) : false, [application])
  const completeDocuments = Boolean(application && getRequiredDocuments(normalizeVisaType(application.visaType)).every((type) => { const document = application.documents?.find((item) => item.documentType === type); return document && ['UPLOADED', 'ACCEPTED', 'REPLACED'].includes(document.status) }))
  if (loading) return <PageLoading label="Preparing your review…" />
  if (error || !application) return <PageError message={error || 'This application could not be found.'} retry={() => void load()} />
  const currentApplication = application

  function goToStep(step: string) {
    if (step === 'documents') navigate(`/apply/${currentApplication.publicId}/documents`)
    else if (step === 'review') return
    else navigate(`/apply/${currentApplication.publicId}?step=${step}`)
  }

  async function submit() {
    setSubmitError('')
    if (!completeSteps || !completeDocuments || !declaration) { setSubmitError('Complete each section, upload every required document and confirm the declaration before submitting.'); return }
    setBusy(true)
    try { await api.updateApplication(currentApplication.publicId, { section: 'background', data: { declaration: true } }); await api.submitApplication(currentApplication.publicId); navigate(`/apply/${currentApplication.publicId}/submitted`) } catch (requestError) { setSubmitError(requestError instanceof ApiError ? requestError.message : "We couldn't submit this application. Try again.") } finally { setBusy(false) }
  }

  return <ApplicationShell application={currentApplication} currentStep="review" onStepChange={goToStep} backTo={`/apply/${currentApplication.publicId}/documents`}>
    <div className="form-shell"><SectionHeading eyebrow="Step 10 · Review" title="Review before you submit." description="Take a quiet moment to check the important details. You can edit any section before sending this demo application." />
      {submitError && <div className="mb-6"><Notice title="The application is not ready yet." tone="danger">{submitError}</Notice></div>}
      <div className="space-y-8">{applicationSteps.map((step) => <ReviewSection key={step} title={sectionTitles[step]} data={currentApplication.sections?.[step] ?? {}} onEdit={() => goToStep(step)} />)}<section className="border-t border-[var(--hairline)] pt-8"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow text-stone">Documents</p><h2 className="display mt-2 text-3xl">Supporting files</h2></div><button type="button" className="link inline-flex items-center gap-1 text-sm" onClick={() => goToStep('documents')}>Edit <Pencil size={13} aria-hidden="true" /></button></div><div className="mt-5"><DocumentChecklist application={currentApplication} /></div></section><section className="border-t border-[var(--hairline)] pt-8"><CheckboxField id="review-declaration" label="I declare that the information in this application is complete and correct." checked={declaration} onChange={setDeclaration} error={submitError && !declaration ? 'Please confirm the declaration.' : undefined} /><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><Link className="text-sm text-stone underline underline-offset-4" to={`/apply/${currentApplication.publicId}/documents`}>Back to documents</Link><button type="button" className="btn btn-primary w-full gap-2 sm:w-auto" onClick={() => void submit()} disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}<ArrowRight size={16} aria-hidden="true" /></button></div></section></div>
    </div>
  </ApplicationShell>
}

function ReviewSection({ title, data, onEdit }: { title: string; data: SectionData; onEdit: () => void }) {
  const rows = Object.entries(data).filter(([, value]) => value !== undefined && value !== '' && value !== false).map(([key, value]) => ({ key, value: Array.isArray(value) ? value.join(', ') : value === true ? 'Yes' : String(value) }))
  return <section className="border-t border-[var(--hairline)] pt-6"><div className="flex items-center justify-between gap-4"><h2 className="display text-3xl">{title}</h2><button type="button" className="link inline-flex items-center gap-1 text-sm" onClick={onEdit}>Edit <Pencil size={13} aria-hidden="true" /></button></div>{rows.length ? <dl className="mt-4">{rows.map((row) => <div key={row.key} className="grid gap-1 border-b border-[var(--hairline)] py-3 sm:grid-cols-[minmax(160px,0.7fr)_minmax(0,1.3fr)]"><dt className="text-xs uppercase tracking-[.08em] text-stone">{humanize(row.key)}</dt><dd className="m-0 break-words text-sm">{row.key.toLowerCase().includes('date') || row.key === 'dob' || row.key === 'proposedArrival' || row.key === 'expectedArrival' || row.key === 'expectedDeparture' ? formatDate(row.value) : row.value}</dd></div>)}</dl> : <p className="mt-4 text-sm text-stone">This section has no saved answers yet.</p>}</section>
}

function humanize(key: string) { return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()) }
function normalizeVisaType(value: string) { return value.startsWith('e-tourist-') ? 'e-tourist' : value }
