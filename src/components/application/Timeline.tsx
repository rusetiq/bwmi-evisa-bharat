import { Check, Circle } from 'lucide-react'
import type { Application, ApplicationEvent } from '../../lib/types'
import { formatDate } from '../forms/FormPrimitives'

const timelineLabels = ['Application submitted', 'Payment received', 'Documents received', 'Government review', 'Decision']

export function ApplicationTimeline({ application }: { application: Application }) {
  const events = application.events ?? []
  const isDone = (label: string) => {
    if (label === 'Application submitted') return Boolean(application.submittedAt) || events.some((event) => /submitted/i.test(event.title))
    if (label === 'Payment received') return application.payment?.status === 'SUCCESS' || events.some((event) => /payment received/i.test(event.title))
    if (label === 'Documents received') return (application.documents?.length ?? 0) > 0 && application.documents.every((document) => document.status !== 'MISSING')
    if (label === 'Government review') return ['UNDER_REVIEW', 'DOCUMENT_REUPLOAD_REQUIRED', 'GRANTED', 'REJECTED'].includes(application.status)
    return ['GRANTED', 'REJECTED'].includes(application.status)
  }
  const currentLabel = application.status === 'DRAFT' || application.status === 'READY_TO_SUBMIT' ? 'Application submitted' : application.status === 'PAYMENT_PENDING' ? 'Payment received' : application.status === 'UNDER_REVIEW' || application.status === 'DOCUMENT_REUPLOAD_REQUIRED' ? 'Government review' : 'Decision'
  return (
    <ol className="grid gap-0 md:grid-cols-5">
      {timelineLabels.map((label, index) => {
        const done = isDone(label)
        const current = !done && label === currentLabel
        return <li key={label} className="relative flex gap-3 border-l border-[var(--hairline)] pb-6 pl-5 last:border-l-0 md:block md:border-l-0 md:pb-0 md:pl-0 md:pr-5">
          {index < timelineLabels.length - 1 && <span aria-hidden="true" className={`absolute left-[7px] top-4 h-px w-5 md:left-3 md:top-3 md:h-px md:w-[calc(100%-12px)] ${done ? 'bg-[var(--ink)]' : 'bg-[var(--hairline)]'}`} />}
          <span className={`relative z-10 flex h-6 w-6 items-center justify-center border bg-white ${done ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : current ? 'border-[var(--orange)] text-[var(--orange)]' : 'border-[var(--cobblestone)] text-stone'}`}>
            {done ? <Check size={13} aria-hidden="true" /> : current ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--orange)]" /> : <Circle size={10} aria-hidden="true" />}
          </span>
          <p className={`mt-1 text-sm md:mt-3 ${current ? 'font-medium' : 'text-stone'}`}>{label}</p>
          {current && <p className="mt-1 text-xs text-stone">Current</p>}
        </li>
      })}
    </ol>
  )
}

export function EventList({ events }: { events: ApplicationEvent[] }) {
  if (!events?.length) return <p className="text-sm text-stone">No timeline events yet.</p>
  return <ol className="space-y-5">{events.map((event) => <li key={event.id} className="relative pl-6"><span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-[var(--orange)]" /><p className="text-sm font-medium">{event.title}</p><p className="mt-1 text-sm leading-6 text-stone">{event.description}</p><p className="mt-1 text-xs text-stone">{formatDate(event.createdAt)} · {event.actor}</p></li>)}</ol>
}

