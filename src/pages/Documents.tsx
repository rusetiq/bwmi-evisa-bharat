import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { getRequiredDocuments } from '../lib/domain'
import type { Application } from '../lib/types'
import { ApplicationShell } from '../components/application/ApplicationShell'
import { PageError, PageLoading } from '../components/application/PageState'
import { Notice, SectionHeading } from '../components/forms/FormPrimitives'
import { DocumentChecklist } from '../components/documents/DocumentChecklist'
import { documentLabel, DocumentRow } from '../components/documents/DocumentRow'

export default function Documents() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [uploadMessage, setUploadMessage] = useState('')

  async function load() {
    if (!applicationId) return
    setLoading(true); setError('')
    try { setApplication(await api.getApplication(applicationId)) } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "We couldn't load this application's documents.") } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [applicationId])

  const requiredDocuments = useMemo(() => application ? getRequiredDocuments(normalizeVisaType(application.visaType)) : [], [application])
  const complete = Boolean(application && requiredDocuments.every((type) => { const document = application.documents?.find((item) => item.documentType === type); return document && ['UPLOADED', 'ACCEPTED', 'REPLACED'].includes(document.status) }))
  const actionRequired = application?.documents?.filter((document) => document.status === 'REUPLOAD_REQUIRED') ?? []

  if (loading) return <PageLoading label="Retrieving your document checklist…" variant="documents" />
  if (error || !application) return <PageError message={error || 'This application could not be found.'} retry={() => void load()} />
  const currentApplication = application

  async function upload(type: string, file: File) {
    setUploadMessage('')
    setFieldErrors((previous) => { const copy = { ...previous }; delete copy[type]; return copy })
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    const extensionOk = /\.(pdf|jpe?g|png|webp)$/i.test(file.name)
    if (!extensionOk || (file.type && !allowed.includes(file.type))) { setFieldErrors((previous) => ({ ...previous, [type]: 'Choose a PDF, JPG, PNG or WEBP file.' })); return }
    if (file.size > 10 * 1024 * 1024) { setFieldErrors((previous) => ({ ...previous, [type]: 'That file is larger than the 10 MB demo limit.' })); return }
    const form = new FormData(); form.append('documentType', type); form.append('file', file)
    setUploading(type)
    try { setApplication(await api.uploadDocument(currentApplication.publicId, form)); setUploadMessage(`${documentLabel(type)} uploaded successfully.`) } catch (requestError) { setFieldErrors((previous) => ({ ...previous, [type]: requestError instanceof ApiError ? requestError.message : "We couldn't upload that file. Try again." })) } finally { setUploading(null) }
  }

  function goToStep(step: string) {
    if (step === 'review') navigate(`/apply/${currentApplication.publicId}/review`)
    else if (step === 'documents') return
    else navigate(`/apply/${currentApplication.publicId}?step=${step}`)
  }

  const submitted = ['SUBMITTED', 'PAYMENT_PENDING', 'UNDER_REVIEW', 'DOCUMENT_REUPLOAD_REQUIRED', 'GRANTED', 'REJECTED'].includes(application.status)
  return <ApplicationShell application={currentApplication} currentStep="documents" onStepChange={goToStep} backTo={`/apply/${currentApplication.publicId}`}>
    <div className="form-shell"><SectionHeading eyebrow="Step 09 · Documents" title="Bring the essentials together." description="Upload clear, legible copies. Only fictional demo files should be used with this prototype." />
      <div className="mb-6"><Notice title="Fictional uploads only">Use a sample image or PDF to explore the upload and replacement flow. Nothing here is sent to a government service.</Notice></div>
      {uploadMessage && <div className="mb-6"><Notice title="Upload complete" tone="success">{uploadMessage} The latest document state is shown below.</Notice></div>}
      {actionRequired.length > 0 && <div className="mb-6"><Notice title="A document needs your attention." tone="action">Replace the requested file below. The review can continue once the new version is received.</Notice></div>}
      <DocumentChecklist application={currentApplication} />
      <div className="mt-8">{requiredDocuments.map((type) => <DocumentRow key={type} type={type} document={currentApplication.documents?.find((item) => item.documentType === type)} onChoose={(file) => void upload(type, file)} disabled={Boolean(uploading) || (submitted && !actionRequired.some((document) => document.documentType === type))} error={fieldErrors[type]} busy={uploading === type} />)}</div>
      <div className="mt-8 border-t border-[var(--hairline)] pt-6">{submitted ? <div className="flex flex-wrap items-center justify-between gap-4"><p className="max-w-lg text-sm leading-6 text-stone">Your submitted documents remain available here. You can replace only a file specifically requested by the reviewing team.</p><Link className="btn btn-secondary" to={`/application/${currentApplication.publicId}`}>View application</Link></div> : <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-stone">{complete ? 'All required documents are ready for review.' : 'Upload each required document to continue.'}</p><button type="button" className="btn btn-primary w-full gap-2 sm:w-auto" disabled={!complete || Boolean(uploading)} onClick={() => navigate(`/apply/${currentApplication.publicId}/review`)}>Continue to review <ArrowRight size={16} aria-hidden="true" /></button></div>}</div>
    </div>
  </ApplicationShell>
}

function normalizeVisaType(value: string) { return value.startsWith('e-tourist-') ? 'e-tourist' : value }
