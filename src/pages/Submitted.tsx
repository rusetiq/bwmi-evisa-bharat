import { useEffect, useState } from 'react'
import { Check, Clipboard, Printer } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Application } from '../lib/types'
import { PageError, PageLoading } from '../components/application/PageState'
import { Notice } from '../components/forms/FormPrimitives'

export default function Submitted() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const [application, setApplication] = useState<Application | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => { if (!applicationId) return; void api.getApplication(applicationId).then(setApplication).catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : "We couldn't retrieve your submitted application.")).finally(() => setLoading(false)) }, [applicationId])
  if (loading) return <PageLoading label="Confirming your submission…" />
  if (error || !application) return <PageError message={error || 'This application could not be found.'} retry={() => window.location.reload()} />
  const currentApplication = application

  async function copyId() {
    try { await navigator.clipboard?.writeText(currentApplication.publicId); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { setCopied(false) }
  }

  return <main className="shell py-12 sm:py-20"><div className="mx-auto max-w-3xl"><Link className="link text-sm" to={`/application/${currentApplication.publicId}`}>Open application workspace</Link><div className="py-12 sm:py-20"><div className="flex h-14 w-14 items-center justify-center border border-[#7a9b82] bg-[#f2f7f3]"><Check className="text-[#356846]" size={26} aria-hidden="true" /></div><p className="eyebrow mt-8 text-stone">Submission complete</p><h1 className="display mt-3 max-w-2xl text-5xl leading-tight sm:text-6xl">Your application has been submitted.</h1><p className="mt-6 max-w-xl text-base leading-7 text-stone">Keep this reference safe. It is the quickest way to return to your application and follow its progress.</p><div className="mt-10 border-y border-[var(--hairline)] py-6"><p className="eyebrow text-stone">Application ID</p><div className="mt-3 flex flex-wrap items-center gap-3"><code className="break-all text-xl tracking-[.08em]">{currentApplication.publicId}</code><button type="button" className="btn btn-secondary gap-2" onClick={() => void copyId()}><Clipboard size={15} aria-hidden="true" />{copied ? 'Copied' : 'Copy ID'}</button></div></div><div className="mt-8"><Notice title="A note about this prototype">We have recorded this reference against the mock applicant email <strong>{currentApplication.email || 'provided address'}</strong>. No real email has been sent.</Notice></div><div className="mt-8 flex flex-col gap-3 sm:flex-row"><button type="button" className="btn btn-primary" onClick={() => navigate(`/payment/${currentApplication.publicId}`)}>Continue to payment</button><Link className="btn btn-secondary gap-2" to={`/application/${currentApplication.publicId}/print`}><Printer size={15} aria-hidden="true" />Print application</Link></div></div></div></main>
}
