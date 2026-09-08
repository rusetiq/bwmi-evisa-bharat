import { FileWarning, Gavel, ShieldCheck, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Application } from '../../lib/types'
import { api, ApiError } from '../../lib/api'
import { Button } from '../ui/Button'
import { Notice, SelectField, TextareaField, TextField } from '../forms/FormPrimitives'
import { AdminDialog } from './AdminDialog'
import { defaultValidityEnd, documentLabel, hasSuccessfulPayment, isFinalStatus } from './adminUtils'

type ActionName = 'request-document' | 'grant' | 'reject'

export function AdminActionPanel({ application, onUpdated }: { application: Application; onUpdated: (application: Application, message: string) => void }) {
  const documents = (application.documents ?? []).filter((document) => document.status !== 'REPLACED')
  const [dialog, setDialog] = useState<ActionName | null>(null)
  const [documentId, setDocumentId] = useState(() => String(documents.find((document) => document.status === 'REUPLOAD_REQUIRED')?.id ?? documents[0]?.id ?? ''))
  const [reasonCategory, setReasonCategory] = useState('Image unclear')
  const [reason, setReason] = useState('')
  const [grantDate, setGrantDate] = useState(today())
  const [validFrom, setValidFrom] = useState(today())
  const [validUntil, setValidUntil] = useState(defaultValidityEnd(today()))
  const [entries, setEntries] = useState('Multiple')
  const [etaNumber, setEtaNumber] = useState('')
  const [rejectCategory, setRejectCategory] = useState('Incomplete information')
  const [explanation, setExplanation] = useState('')
  const [busy, setBusy] = useState<ActionName | null>(null)
  const [error, setError] = useState('')

  const final = isFinalStatus(application.status)
  const paymentReady = hasSuccessfulPayment(application)
  const canRequestDocument = !final && documents.length > 0
  const canGrant = !final && paymentReady
  const canReject = !final

  function openRequestDialog() {
    setError('')
    setReason('')
    setReasonCategory('Image unclear')
    if (!documents.some((document) => String(document.id) === documentId)) {
      setDocumentId(String(documents.find((document) => document.status === 'REUPLOAD_REQUIRED')?.id ?? documents[0]?.id ?? ''))
    }
    setDialog('request-document')
  }

  function openGrantDialog() {
    const current = today()
    setError('')
    setGrantDate(current)
    setValidFrom(current)
    setValidUntil(defaultValidityEnd(current))
    setEntries('Multiple')
    setEtaNumber('')
    setDialog('grant')
  }

  function openRejectDialog() {
    setError('')
    setRejectCategory('Incomplete information')
    setExplanation('')
    setDialog('reject')
  }

  function closeDialog() {
    if (busy) return
    setDialog(null)
    setError('')
  }

  async function submitAction(action: ActionName, body: unknown, successMessage: string) {
    setBusy(action)
    setError('')
    try {
      const updated = await api.adminAction(application.publicId, action, body)
      setDialog(null)
      onUpdated(updated, successMessage)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not complete that review action. Try again.')
    } finally {
      setBusy(null)
    }
  }

  function submitDocumentRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!documentId) {
      setError('Choose a document from this application.')
      return
    }
    if (reason.trim().length < 2) {
      setError('Add a short explanation for the requested replacement.')
      return
    }
    void submitAction('request-document', { documentId: Number(documentId), reason: reason.trim(), reasonCategory }, 'Document replacement requested. The applicant can now see the correction in their workspace.')
  }

  function submitGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!grantDate || !validFrom || !validUntil) {
      setError('Enter the grant date and validity dates.')
      return
    }
    if (validUntil < validFrom) {
      setError('The validity end date must be after its start date.')
      return
    }
    void submitAction('grant', { grantedDate: grantDate, validFrom, validUntil, entries, ...(etaNumber.trim() ? { etaNumber: etaNumber.trim() } : {}) }, 'Visa granted. The ETA and applicant notification have been created.')
  }

  function submitReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (explanation.trim().length < 2) {
      setError('Add a short explanation for the decision.')
      return
    }
    void submitAction('reject', { reasonCategory: rejectCategory, explanation: explanation.trim() }, 'Decision recorded. The applicant notification and timeline have been updated.')
  }

  return (
    <section className="border border-[var(--ink)] bg-[var(--linen)] p-5 sm:p-6" aria-labelledby="admin-actions-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="admin-actions-heading" className="display mt-2 text-3xl">Review this application</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone">Actions are persisted to the demo database and create a visible applicant update and audit event.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone"><Gavel size={15} aria-hidden="true" />{final ? 'Final decision recorded' : 'Demo session active'}</div>
      </div>

      <div className="mt-6 grid gap-4 border-t border-[var(--hairline)] pt-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <label className="label" htmlFor="admin-document-choice">Document to review</label>
          <select id="admin-document-choice" className="field focus-ring" value={documentId} onChange={(event) => setDocumentId(event.target.value)} disabled={!canRequestDocument}>
            <option value="">{documents.length ? 'Choose a document' : 'No documents uploaded'}</option>
            {documents.map((document) => <option key={document.id} value={document.id}>{documentLabel(document.documentType)} · version {document.version}</option>)}
          </select>
          <p className="mt-1.5 text-[13px] leading-5 text-stone">Choose the file that needs a clearer or corrected replacement.</p>
        </div>
        <Button className="w-full lg:w-auto" variant="orange-outline" leadingIcon={<FileWarning size={16} aria-hidden="true" />} onClick={openRequestDialog} disabled={!canRequestDocument}>Request document replacement</Button>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-[var(--hairline)] pt-5 sm:flex-row sm:flex-wrap sm:items-center">
        <Button className="w-full sm:w-auto" leadingIcon={<ShieldCheck size={16} aria-hidden="true" />} onClick={openGrantDialog} disabled={!canGrant} title={!final && !paymentReady ? 'A successful payment is required before granting.' : undefined}>Grant visa</Button>
        <Button className="w-full sm:w-auto" variant="secondary" leadingIcon={<XCircle size={16} aria-hidden="true" />} onClick={openRejectDialog} disabled={!canReject}>Reject application</Button>
        {final && <p className="text-xs text-stone">This application is closed and cannot receive another decision.</p>}
        {!final && !paymentReady && <p className="text-xs text-stone">Granting becomes available after payment is received.</p>}
      </div>

      <AdminDialog open={dialog === 'request-document'} onClose={closeDialog} title="Request a document replacement" description="The applicant will see this request in their application workspace.">
        <form className="grid gap-5" onSubmit={submitDocumentRequest}>
          <SelectField id="request-document-type" label="Document" value={documentId} onChange={setDocumentId} options={documents.map((document) => ({ value: String(document.id), label: `${documentLabel(document.documentType)} · version ${document.version}` }))} required />
          <SelectField id="request-document-reason" label="Reason" value={reasonCategory} onChange={setReasonCategory} options={['Image unclear', 'Document cropped', 'Information unreadable', 'Wrong document', 'Other'].map((value) => ({ value, label: value }))} required />
          <TextareaField id="request-document-message" label="Additional message" value={reason} onChange={setReason} hint="Explain what the applicant should correct. Keep the message concise." placeholder="For example: The lower edge of the passport bio page is cropped." required rows={4} />
          {error && <Notice title="We could not submit the request." tone="danger">{error}</Notice>}
          <div className="flex flex-col-reverse gap-3 border-t border-[var(--hairline)] pt-5 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={closeDialog} disabled={Boolean(busy)}>Cancel</button>
            <Button className="w-full sm:w-auto" type="submit" variant="primary" disabled={busy !== null} aria-busy={busy === 'request-document'}>{busy === 'request-document' ? 'Requesting…' : 'Request replacement'}</Button>
          </div>
        </form>
      </AdminDialog>

      <AdminDialog open={dialog === 'grant'} onClose={closeDialog} title="Grant visa" description="Confirm the decision details. This creates an ETA record, notification and timeline event.">
        <form className="grid gap-5" onSubmit={submitGrant}>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="grant-date" label="Granted date" type="date" value={grantDate} onChange={setGrantDate} required />
            <TextField id="eta-number" label="ETA ID" value={etaNumber} onChange={setEtaNumber} hint="Optional. Leave blank to generate a demo ETA number." placeholder="ETA-…" />
            <TextField id="valid-from" label="Valid from" type="date" value={validFrom} onChange={(value) => { setValidFrom(value); if (validUntil === defaultValidityEnd(validFrom)) setValidUntil(defaultValidityEnd(value)) }} required />
            <TextField id="valid-until" label="Valid until" type="date" value={validUntil} onChange={setValidUntil} required />
          </div>
          <SelectField id="grant-entries" label="Number of entries" value={entries} onChange={setEntries} options={['Single', 'Double', 'Multiple'].map((value) => ({ value, label: value }))} required />
          <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--linen)] px-4 py-3 text-sm leading-6"><p className="font-medium">Ready to grant {application.applicantName || 'this applicant'}?</p><p className="mt-1 text-stone">The application will move to Granted and the applicant will be able to view the ETA.</p></div>
          {error && <Notice title="We could not grant this application." tone="danger">{error}</Notice>}
          <div className="flex flex-col-reverse gap-3 border-t border-[var(--hairline)] pt-5 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={closeDialog} disabled={Boolean(busy)}>Cancel</button>
            <Button className="w-full sm:w-auto" type="submit" disabled={busy !== null} aria-busy={busy === 'grant'}>{busy === 'grant' ? 'Granting…' : 'Confirm grant'}</Button>
          </div>
        </form>
      </AdminDialog>

      <AdminDialog open={dialog === 'reject'} onClose={closeDialog} title="Reject application" description="Record a reason for the applicant and close this application with a final decision.">
        <form className="grid gap-5" onSubmit={submitReject}>
          <SelectField id="reject-category" label="Reason category" value={rejectCategory} onChange={setRejectCategory} options={['Incomplete information', 'Eligibility or visa policy', 'Background declaration', 'Document concerns', 'Other'].map((value) => ({ value, label: value }))} required />
          <TextareaField id="reject-explanation" label="Short explanation" value={explanation} onChange={setExplanation} hint="This will be included in the application decision history." placeholder="Add a clear, neutral explanation." required rows={4} />
          {error && <Notice title="We could not record the rejection." tone="danger">{error}</Notice>}
          <div className="flex flex-col-reverse gap-3 border-t border-[var(--hairline)] pt-5 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={closeDialog} disabled={Boolean(busy)}>Cancel</button>
            <Button className="w-full sm:w-auto" type="submit" variant="secondary" disabled={busy !== null} aria-busy={busy === 'reject'}>{busy === 'reject' ? 'Recording…' : 'Confirm rejection'}</Button>
          </div>
        </form>
      </AdminDialog>
    </section>
  )
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
