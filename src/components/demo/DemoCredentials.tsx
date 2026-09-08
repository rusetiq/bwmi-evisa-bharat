import { useState } from 'react'
import { ArrowRight, Check, Copy, ExternalLink, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { demoScenarios, statusCopy, type DemoScenario } from '@/lib/content'

export function DemoCredentials({ limit, indices, compact = false }: { limit?: number; indices?: number[]; compact?: boolean }) {
  const selected = indices ? indices.map((index) => demoScenarios[index]).filter(Boolean) : demoScenarios
  const records = typeof limit === 'number' ? selected.slice(0, limit) : selected
  return (
    <div className={compact ? 'grid gap-4 lg:grid-cols-3' : 'grid gap-5 md:grid-cols-2'}>
      {records.map((scenario) => <DemoCredentialCard compact={compact} key={scenario.publicId} scenario={scenario} />)}
    </div>
  )
}

function DemoCredentialCard({ scenario, compact }: { scenario: DemoScenario; compact: boolean }) {
  const [copied, setCopied] = useState(false)
  const lookup = `/find-application?applicationId=${encodeURIComponent(scenario.publicId)}&passport=${encodeURIComponent(scenario.passportNumber)}&dob=${encodeURIComponent(scenario.dob)}`

  async function copyCredentials() {
    try {
      await navigator.clipboard.writeText(`Application ID: ${scenario.publicId}\nPassport: ${scenario.passportNumber}\nDate of birth: ${scenario.dob}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className="paper-card flex flex-col p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`status status-${statusTone(scenario.status)}`}>{statusCopy[scenario.status]}</span>
          <h3 className="display mt-4 text-[26px] leading-tight">{scenario.title}</h3>
          <p className="mt-2 text-sm font-medium text-[var(--graphite)]">{scenario.applicant}</p>
        </div>
        <span className="text-sm normal-case tracking-normal shrink-0 text-[var(--stone)]">{scenario.steps} {scenario.steps === 1 ? 'step' : 'steps'}</span>
      </div>

      {!compact && <div className="mt-5 border-l-2 border-[var(--orange)] pl-4"><p className="mt-2 text-[14px] leading-6 text-[var(--graphite)]">{scenario.whatYouSee}</p></div>}

      <dl className={`mt-6 grid gap-4 text-[13px] ${compact ? '' : 'sm:grid-cols-2'}`}>
        <Credential label="Application ID" value={scenario.publicId} />
        <Credential label="Passport number" value={scenario.passportNumber} />
        <Credential label="Date of birth" value={scenario.dob} />
      </dl>

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link className="btn btn-primary min-h-10 px-4 text-[13px]" to={compact ? lookup : scenario.launchPath}>{scenario.launchLabel} <ArrowRight aria-hidden="true" size={15} /></Link>
        {!compact && <Link className="btn btn-secondary min-h-10 px-4 text-[13px]" to={`/application/${scenario.publicId}`}>View state <ExternalLink aria-hidden="true" size={14} /></Link>}
        <button className="focus-ring inline-flex size-10 items-center justify-center rounded-lg border border-[var(--hairline)] bg-white hover:bg-[var(--linen)]" type="button" onClick={() => void copyCredentials()} aria-label={`Copy credentials for ${scenario.applicant}`}>
          {copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}
        </button>
      </div>

      {!compact && <DemoResetButton scenario={scenario} />}
    </article>
  )
}

function DemoResetButton({ scenario }: { scenario: DemoScenario }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function reset() {
    setBusy(true)
    setError('')
    try {
      await api.resetDemoApplication(scenario.publicId)
      setConfirming(false)
      setMessage('Restored to the original seeded scenario.')
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not reset this demo record.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="mt-6 border-t border-[var(--hairline)] pt-4">
    {!confirming && !message && <button type="button" className="focus-ring inline-flex items-center gap-2 text-xs text-[var(--stone)] underline decoration-[var(--cobblestone)] underline-offset-4 hover:text-[var(--ink)]" onClick={() => { setError(''); setConfirming(true) }}><RotateCcw size={13} aria-hidden="true" /> Reset demo scenario</button>}
    {message && <p className="flex items-center gap-2 text-xs text-[var(--graphite)]" role="status"><Check size={14} aria-hidden="true" />{message}</p>}
    {confirming && <div className="rounded-xl border border-[#e4b9a9] bg-[#fbf1ed] p-4" role="alert"><p className="text-xs leading-5 text-[var(--graphite)]">Reset this fictional record and restore its original status, documents, payment and timeline?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="btn btn-primary min-h-9 px-3 text-xs" disabled={busy} onClick={() => void reset()}>{busy ? 'Resetting…' : 'Reset record'}</button><button type="button" className="btn btn-secondary min-h-9 px-3 text-xs" disabled={busy} onClick={() => setConfirming(false)}>Keep current state</button></div></div>}
    {error && <p className="mt-3 text-xs leading-5 text-[#8c2525]" role="alert">{error}</p>}
  </div>
}

function statusTone(status: DemoScenario['status']) {
  if (status === 'GRANTED') return 'success'
  if (status === 'REJECTED') return 'danger'
  if (status === 'PAYMENT_PENDING' || status === 'DOCUMENT_REUPLOAD_REQUIRED') return 'action'
  return 'neutral'
}

function Credential({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-sm normal-case tracking-normal text-[var(--stone)]">{label}</dt><dd className="mt-1.5 break-all font-medium tabular-nums text-[var(--graphite)]">{value}</dd></div>
}
