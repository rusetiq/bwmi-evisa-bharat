import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Application } from '../../lib/types'
import { formatDate } from '../forms/FormPrimitives'
import { AdminStatus } from './AdminStatus'

export function maskPassport(value: string) {
  if (!value) return '—'
  if (value.length <= 4) return value
  return `${'•'.repeat(Math.max(2, value.length - 4))}${value.slice(-4)}`
}

export function AdminApplicationsTable({ applications }: { applications: Application[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--paper)] md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Applications in the review queue</caption>
          <thead className="bg-[var(--linen)] text-[11px] uppercase tracking-[.08em] text-stone">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Application ID</th>
              <th scope="col" className="px-4 py-3 font-medium">Applicant</th>
              <th scope="col" className="px-4 py-3 font-medium">Visa</th>
              <th scope="col" className="px-4 py-3 font-medium">Nationality</th>
              <th scope="col" className="px-4 py-3 font-medium">Submitted</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Review</span></th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => <DesktopApplicationRow key={application.id} application={application} />)}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 md:hidden" aria-label="Applications in the review queue">
        {applications.map((application) => (
          <li key={application.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-mono text-[12px] tracking-[.04em]">{application.publicId}</p>
                <p className="mt-2 truncate text-base font-medium">{application.applicantName || 'Applicant not named'}</p>
              </div>
              <AdminStatus status={application.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--hairline)] pt-3 text-sm">
              <div><dt className="text-xs text-stone">Visa</dt><dd className="mt-1">{application.visaTypeName || application.visaType}</dd></div>
              <div><dt className="text-xs text-stone">Nationality</dt><dd className="mt-1">{application.nationality || '—'}</dd></div>
              <div><dt className="text-xs text-stone">Passport</dt><dd className="mt-1 font-mono text-xs">{maskPassport(application.passportNumber)}</dd></div>
              <div><dt className="text-xs text-stone">Submitted</dt><dd className="mt-1">{formatDate(application.submittedAt || application.updatedAt)}</dd></div>
            </dl>
            <Link className="focus-ring mt-4 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--graphite)] underline decoration-[var(--cobblestone)] underline-offset-4" to={`/admin/applications/${application.publicId}`}>
              Review application <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

function DesktopApplicationRow({ application }: { application: Application }) {
  return (
    <tr className="border-t border-[var(--hairline)] align-middle text-sm hover:bg-[var(--linen)]">
      <td className="px-4 py-4"><Link className="focus-ring rounded-lg font-mono text-[12px] tracking-[.04em] text-[var(--graphite)] underline decoration-[var(--cobblestone)] underline-offset-4" to={`/admin/applications/${application.publicId}`}>{application.publicId}</Link></td>
      <td className="px-4 py-4"><span className="block max-w-[180px] truncate font-medium">{application.applicantName || 'Applicant not named'}</span><span className="mt-1 block max-w-[180px] truncate text-xs text-stone">{maskPassport(application.passportNumber)}</span></td>
      <td className="px-4 py-4">{application.visaTypeName || application.visaType || '—'}</td>
      <td className="px-4 py-4">{application.nationality || '—'}</td>
      <td className="px-4 py-4 whitespace-nowrap">{formatDate(application.submittedAt || application.updatedAt)}</td>
      <td className="px-4 py-4"><AdminStatus status={application.status} /></td>
      <td className="px-4 py-4 text-right"><Link className="focus-ring inline-flex items-center gap-1 rounded-lg text-xs font-medium text-[var(--graphite)]" to={`/admin/applications/${application.publicId}`} aria-label={`Review ${application.publicId}`}><ArrowUpRight size={15} aria-hidden="true" /></Link></td>
    </tr>
  )
}
