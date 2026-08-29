import { useState } from 'react'
import { ArrowRight, Check, Copy, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { demoLookups } from '@/lib/content'

type DemoRecord = (typeof demoLookups)[number]

export function DemoCredentials({ limit, indices, compact = false }: { limit?: number; indices?: number[]; compact?: boolean }) {
  const selected = indices ? indices.map((index) => demoLookups[index]).filter(Boolean) : demoLookups
  const records = typeof limit === 'number' ? selected.slice(0, limit) : selected
  return (
    <div className={compact ? 'grid gap-4 lg:grid-cols-3' : 'grid gap-5 md:grid-cols-2'}>
      {records.map((record) => <DemoCredentialCard compact={compact} key={record[0]} record={record} />)}
    </div>
  )
}

function DemoCredentialCard({ record, compact }: { record: DemoRecord; compact: boolean }) {
  const [copied, setCopied] = useState(false)
  const [applicationId, passport, dob, description] = record
  const [applicant, status] = description.split(' — ')
  const lookup = `/find-application?applicationId=${encodeURIComponent(applicationId)}&passport=${encodeURIComponent(passport)}&dob=${encodeURIComponent(dob)}`

  async function copyCredentials() {
    await navigator.clipboard.writeText(`Application ID: ${applicationId}\nPassport: ${passport}\nDate of birth: ${dob}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <article className="paper-card flex flex-col p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="status capitalize">{status}</span>
          <h3 className="display mt-4 text-[26px] leading-tight">{applicant}</h3>
        </div>
      </div>
      <dl className={`mt-6 grid gap-4 text-[13px] ${compact ? '' : 'sm:grid-cols-2'}`}>
        <Credential label="Application ID" value={applicationId} />
        <Credential label="Passport number" value={passport} />
        <Credential label="Date of birth" value={dob} />
      </dl>
      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link className="btn btn-primary min-h-10 px-4 text-[13px]" to={lookup}>Use credentials <ArrowRight aria-hidden="true" size={15} /></Link>
        <Link className="btn btn-secondary min-h-10 px-4 text-[13px]" to={`/application/${applicationId}`}>View state <ExternalLink aria-hidden="true" size={14} /></Link>
        <button className="focus-ring inline-flex size-10 items-center justify-center rounded-lg border border-[var(--hairline)] bg-white hover:bg-[var(--linen)]" type="button" onClick={() => void copyCredentials()} aria-label={`Copy credentials for ${applicant}`}>
          {copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}
        </button>
      </div>
    </article>
  )
}

function Credential({ label, value }: { label: string; value: string }) {
  return <div><dt className="eyebrow text-[var(--stone)]">{label}</dt><dd className="mt-1.5 break-all font-medium tabular-nums text-[var(--graphite)]">{value}</dd></div>
}
