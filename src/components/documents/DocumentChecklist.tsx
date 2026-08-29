import { getRequiredDocuments } from '../../lib/domain'
import type { Application } from '../../lib/types'
import { documentLabel } from './DocumentRow'

export function DocumentChecklist({ application }: { application: Application }) {
  const required = getRequiredDocuments(application.visaType)
  return <div className="grid gap-3 sm:grid-cols-2">{required.map((type) => { const document = application.documents?.find((item) => item.documentType === type); const received = Boolean(document && ['UPLOADED', 'ACCEPTED', 'REPLACED'].includes(document.status)); return <div key={type} className="flex items-start gap-3 rounded-2xl border border-[var(--hairline)] bg-[var(--linen)] p-4"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${received ? 'bg-[#356846]' : 'bg-[var(--orange)]'}`} /><div><p className="text-sm font-medium">{documentLabel(type)}</p><p className="mt-1 text-xs text-stone">{document ? (document.status === 'REUPLOAD_REQUIRED' ? 'Needs a replacement' : received ? 'Received' : 'Required before submission') : 'Required before submission'}</p></div></div> })}</div>
}
