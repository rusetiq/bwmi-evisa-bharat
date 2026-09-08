import { Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Application } from '../../lib/types'
import { ApplicationProgress } from './ApplicationProgress'
import { StatusLabel } from './ApplicationStatus'

export function ApplicationShell({ application, currentStep, children, saveMessage, onStepChange, backTo, onExit }: { application: Application; currentStep: string; children: ReactNode; saveMessage?: string; onStepChange?: (step: string) => void; backTo?: string; onExit?: () => void }) {
  return <div className="min-h-[calc(100vh-80px)] bg-[var(--paper)]">
    <div className="border-b border-[var(--hairline)] bg-[var(--espresso)] text-white">
      <div className="shell flex min-w-0 flex-wrap items-center justify-between gap-4 py-5">
        <div className="min-w-0"><p className="mt-1 break-all text-sm font-medium tracking-wide">{application.publicId}</p></div>
        <div className="flex items-center gap-3">{application.status && <StatusLabel status={application.status} />}<span className="hidden text-xs text-[#d5cec6] sm:inline">{application.email || 'Demo applicant'}</span></div>
      </div>
    </div>
    <div className="border-b border-[var(--hairline)] bg-[var(--paper)]"><div className="shell flex min-w-0 items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3 text-sm">{backTo && (onExit ? <button className="focus-ring inline-flex items-center gap-2 rounded-lg text-stone hover:text-[var(--ink)]" type="button" onClick={onExit}><ArrowLeft size={15} aria-hidden="true" /> Exit application</button> : <Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-stone hover:text-[var(--ink)]" to={backTo}><ArrowLeft size={15} aria-hidden="true" /> Exit application</Link>)}</div><div className="flex min-w-0 items-center justify-end gap-2 text-right text-xs text-stone" role="status" aria-live="polite"><Save className="shrink-0" size={14} aria-hidden="true" /><span className="break-words">{saveMessage || 'Changes save automatically'}</span></div></div></div>
    <div className="mx-auto grid max-w-[1280px] lg:grid-cols-[224px_minmax(0,1fr)]">
      <ApplicationProgress application={application} currentStep={currentStep} onStepChange={onStepChange} />
      <main className="min-w-0 px-4 py-10 sm:px-8 lg:px-14 lg:py-14">{children}</main>
    </div>
  </div>
}
