import { Check, ExternalLink, FileText, RefreshCw, UploadCloud } from 'lucide-react'
import type { DocumentRecord, DocumentStatus } from '../../lib/types'
import { formatDate } from '../forms/FormPrimitives'

const labels: Record<string, string> = {
  photograph: 'Photograph', passport: 'Passport bio page', 'business-letter': 'Business card or employer letter', 'invitation-letter': 'Indian organisation invitation', 'hospital-letter': 'Hospital letter', 'patient-reference': 'Patient visa reference', 'conference-invitation': 'Conference invitation', 'admission-letter': 'Admission documentation',
}

const statusText: Record<DocumentStatus, string> = { MISSING: 'Not uploaded', UPLOADED: 'Uploaded', ACCEPTED: 'Accepted', REUPLOAD_REQUIRED: 'Replacement required', REPLACED: 'Replacement received' }

export function documentLabel(type: string) { return labels[type] ?? type.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }

export function DocumentRow({ type, document, onChoose, disabled, inputId = `document-${type}`, error, busy = false }: { type: string; document?: DocumentRecord; onChoose: (file: File) => void; disabled?: boolean; inputId?: string; error?: string; busy?: boolean }) {
  const status = document?.status ?? 'MISSING'
  const isAction = status === 'MISSING' || status === 'REUPLOAD_REQUIRED'
  const accepted = status === 'ACCEPTED' || status === 'REPLACED'
  return <div className={`border-b border-[var(--hairline)] py-6 first:border-t ${isAction ? 'border-l-2 border-l-[var(--orange)] pl-4' : ''}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3"><FileText className="mt-1 shrink-0 text-stone" size={19} aria-hidden="true" /><div className="min-w-0"><h3 className="text-base font-medium">{documentLabel(type)}</h3><p id={`${inputId}-hint`} className="mt-1 text-sm text-stone">PDF, JPG, PNG or WEBP · Maximum mock size: 10 MB</p>{document?.rejectionReason && <p id={`${inputId}-reason`} className="mt-3 text-sm leading-6 text-[#8c2525]">{document.rejectionReason}</p>}</div></div>
      <span className={`status shrink-0 ${isAction ? 'status-action' : accepted ? 'status-success' : ''}`}>{statusText[status]}</span>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 pl-8">
      {document ? (
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <Check className="shrink-0" size={15} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{document.originalFilename}</span>
          <span className="shrink-0 text-xs text-stone">{formatDate(document.uploadedAt)}</span>
          <a
            href={`/api/documents/${document.id}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="link ml-2 inline-flex shrink-0 items-center gap-1 text-xs"
            aria-label={`View ${documentLabel(type)} (opens in a new tab)`}
          >
            View <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      ) : <p className="text-sm text-stone">No file selected</p>}
      <label className={`btn btn-secondary inline-flex cursor-pointer gap-2 text-sm ${disabled ? 'pointer-events-none opacity-50' : ''}`} htmlFor={inputId}>{busy ? <RefreshCw className="animate-spin" size={15} aria-hidden="true" /> : isAction ? <UploadCloud size={15} aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}{busy ? 'Uploading…' : isAction ? 'Choose file' : 'Replace'}<span className="sr-only"> for {documentLabel(type)}</span><input id={inputId} type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" aria-invalid={Boolean(error)} aria-describedby={[`${inputId}-hint`, document?.rejectionReason && `${inputId}-reason`, error && `${inputId}-error`].filter(Boolean).join(' ')} onChange={(event) => { const file = event.target.files?.[0]; if (file) onChoose(file); event.currentTarget.value = '' }} disabled={disabled || busy} /></label>
    </div>
    {error && <p className="error pl-8" id={`${inputId}-error`} role="alert">{error}</p>}
  </div>
}

export function DocumentList({ documents }: { documents: DocumentRecord[] }) {
  if (!documents?.length) return <p className="text-sm text-stone">No documents have been uploaded.</p>
  return <div>{documents.map((document) => (
    <div key={document.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] py-4 text-sm">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <FileText size={15} className="shrink-0 text-stone" aria-hidden="true" />
        <span className="min-w-0 truncate">{document.originalFilename}</span>
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <a
          href={`/api/documents/${document.id}/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="link inline-flex items-center gap-1 text-xs"
          aria-label={`View ${documentLabel(document.documentType)}: ${document.originalFilename} (opens in a new tab)`}
        >
          View <ExternalLink size={12} aria-hidden="true" />
        </a>
        <span className="text-xs text-stone">{statusText[document.status]}</span>
      </div>
    </div>
  ))}</div>
}
