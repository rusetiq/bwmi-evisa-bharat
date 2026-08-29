import { Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Application } from '../../lib/types'
import { ApplicationProgress } from './ApplicationProgress'
import { StatusLabel } from './ApplicationStatus'

export function ApplicationShell({ application, currentStep, children, saveMessage, onStepChange, backTo }: { application: Application; currentStep: string; children: ReactNode; saveMessage?: string; onStepChange?: (step: string) => void; backTo?: string }) {
  return <div className="min-h-[calc(100vh-80px)] bg-[var(--paper)]">
    <div className="border-b border-[var(--hairline)] bg-[var(--espresso)] text-white">
      <div className="shell flex flex-wrap items-center justify-between gap-4 py-5">
        <div><p className="eyebrow text-[#d5cec6]">Indian e-Visa · Application</p><p className="mt-1 text-sm font-medium tracking-wide">{application.publicId}</p></div>
        <div className="flex items-center gap-3">{application.status && <StatusLabel status={application.status} />}<span className="hidden text-xs text-[#d5cec6] sm:inline">{application.email || 'Demo applicant'}</span></div>
      </div>
    </div>
    <div className="border-b border-[var(--hairline)] bg-[var(--paper)]"><div className="shell flex items-center justify-between gap-4 py-4"><div className="flex items-center gap-3 text-sm">{backTo && <Link className="inline-flex items-center gap-2 text-stone hover:text-[var(--ink)]" to={backTo}><ArrowLeft size={15} aria-hidden="true" /> Exit application</Link>}</div><div className="flex items-center gap-2 text-xs text-stone" role="status" aria-live="polite"><Save size={14} aria-hidden="true" />{saveMessage || 'Changes save automatically'}</div></div></div>
    <div className="mx-auto grid max-w-[1280px] lg:grid-cols-[224px_minmax(0,1fr)]">
      <ApplicationProgress application={application} currentStep={currentStep} onStepChange={onStepChange} />
      <main className="min-w-0 px-4 py-10 sm:px-8 lg:px-14 lg:py-14">{children}</main>
    </div>
  </div>
}

