import type { Application, DocumentStatus } from '@/lib/types'
import { getRequiredDocuments } from '@/lib/domain'
import { HttpError, now, sanitizeText } from '../http'
import { applicationFromBundle, createEventStatement, createNotificationStatement, getApplicationBundle, getDocument, getLatestDocument, requireApplicationRow } from '../db/queries'
import type { AppEnv, DocumentRow } from '../types'
import { allowedDocumentTypes, isAllowedDocumentType } from '../validation'

type Database = AppEnv['Bindings']['DB']
type Bucket = AppEnv['Bindings']['DOCUMENTS']

const MAX_FILE_BYTES = 10 * 1024 * 1024
const mimeExtensions: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
}
function fileExtension(filename: string) {
  const match = filename.toLowerCase().match(/\.([a-z0-9]{1,8})$/)
  return match?.[1] ?? ''
}

export function validateDocumentUpload(documentType: string, filename: string, mimeType: string, size: number) {
  if (!isAllowedDocumentType(documentType)) throw new HttpError(422, 'INVALID_DOCUMENT_TYPE', 'Choose a supported document type.', { documentType: 'Choose a supported document type.' })
  if (!filename || filename.length > 240) throw new HttpError(422, 'INVALID_FILENAME', 'Choose a file with a valid filename.', { file: 'Choose a file with a valid filename.' })
  if (!Number.isFinite(size) || size <= 0) throw new HttpError(422, 'EMPTY_FILE', 'Choose a file that is not empty.', { file: 'Choose a file that is not empty.' })
  if (size > MAX_FILE_BYTES) throw new HttpError(422, 'FILE_TOO_LARGE', 'The file must be 10 MB or smaller.', { file: 'The file must be 10 MB or smaller.' })
  const extension = fileExtension(filename)
  const allowed = mimeExtensions[mimeType.toLowerCase()]
  if (!allowed || !allowed.includes(extension)) throw new HttpError(422, 'INVALID_FILE_TYPE', 'Upload a PDF, JPG, PNG or WEBP file with a matching extension.', { file: 'Upload a PDF, JPG, PNG or WEBP file with a matching extension.' })
  if (documentType === 'photograph' && !mimeType.toLowerCase().startsWith('image/')) throw new HttpError(422, 'INVALID_PHOTO_TYPE', 'Your photograph must be a JPG, PNG or WEBP image.', { file: 'Your photograph must be a JPG, PNG or WEBP image.' })
}

export function storageKey(applicationId: number, documentType: string, filename: string) {
  const extension = fileExtension(filename) || 'bin'
  return `applications/${applicationId}/${documentType}/${crypto.randomUUID()}.${extension}`
}

async function saveToR2(bucket: Bucket | undefined, key: string, file: File, mimeType: string) {
  if (!bucket) return `mock://${key}`
  try {
    const bytes = await file.arrayBuffer()
    await bucket.put(key, bytes, { httpMetadata: { contentType: mimeType, contentDisposition: 'attachment' } })
    return key
  } catch {
    throw new HttpError(502, 'UPLOAD_FAILED', 'We could not store that file. Try again.')
  }
}

export type UploadPayload = { documentType: string; file: File }

export async function parseUpload(request: Request): Promise<UploadPayload> {
  let form: FormData
  try { form = await request.formData() } catch { throw new HttpError(400, 'INVALID_UPLOAD', 'Choose a file to upload.') }
  const typeValue = form.get('documentType') ?? form.get('type')
  const fileValue = form.get('file') ?? form.get('document')
  const documentType = typeof typeValue === 'string' ? typeValue.trim().toLowerCase() : ''
  if (!(fileValue instanceof File)) throw new HttpError(422, 'FILE_REQUIRED', 'Choose a file to upload.', { file: 'Choose a file to upload.' })
  const filename = sanitizeText(fileValue.name, 240)
  const mimeType = fileValue.type.toLowerCase()
  validateDocumentUpload(documentType, filename, mimeType, fileValue.size)
  return { documentType, file: fileValue }
}

export async function uploadDocument(db: Database, bucket: Bucket | undefined, key: string, payload: UploadPayload): Promise<Application> {
  const app = await requireApplicationRow(db, key)
  if (['GRANTED', 'REJECTED'].includes(app.status)) throw new HttpError(409, 'APPLICATION_CLOSED', 'This application no longer accepts document changes.')
  const uploadedAt = now()
  const objectKey = storageKey(app.id, payload.documentType, payload.file.name)
  const storedObjectKey = await saveToR2(bucket, objectKey, payload.file, payload.file.type)
  const previous = await getLatestDocument(db, app.id, payload.documentType)
  const version = (previous?.version ?? 0) + 1
  const nextStatus = app.status === 'DOCUMENT_REUPLOAD_REQUIRED' ? 'UNDER_REVIEW' : app.status
  const statements: D1PreparedStatement[] = []
  if (previous) statements.push(db.prepare("UPDATE documents SET status = 'REPLACED', reviewed_at = ? WHERE id = ?").bind(uploadedAt, previous.id))
  statements.push(db.prepare(`INSERT INTO documents (application_id, document_type, object_key, original_filename, mime_type, size_bytes, status, uploaded_at, version, replaces_document_id)
    VALUES (?, ?, ?, ?, ?, ?, 'UPLOADED', ?, ?, ?)`).bind(app.id, payload.documentType, storedObjectKey, sanitizeText(payload.file.name, 240), payload.file.type.toLowerCase(), payload.file.size, uploadedAt, version, previous?.id ?? null))
  if (nextStatus !== app.status) statements.push(db.prepare("UPDATE applications SET status = 'UNDER_REVIEW', updated_at = ?, version = version + 1 WHERE id = ?").bind(uploadedAt, app.id))
  else statements.push(db.prepare('UPDATE applications SET updated_at = ?, version = version + 1 WHERE id = ?').bind(uploadedAt, app.id))
  statements.push(createEventStatement(db, app.id, previous ? 'DOCUMENT_REPLACED' : 'DOCUMENT_UPLOADED', previous ? 'Replacement document received' : 'Document uploaded', previous ? `A new ${payload.documentType} document was uploaded for review.` : `Your ${payload.documentType} document was uploaded.`, 'applicant', uploadedAt))
  await db.batch(statements)
  return applicationFromBundle(await getApplicationBundle(db, key))
}

export async function replaceDocumentById(db: Database, bucket: Bucket | undefined, documentId: number, payload: UploadPayload) {
  const existing = await getDocument(db, documentId)
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'We could not find that document.')
  if (existing.document_type !== payload.documentType) throw new HttpError(422, 'DOCUMENT_TYPE_MISMATCH', 'Choose the requested document type.', { documentType: 'Choose the requested document type.' })
  return uploadDocument(db, bucket, String(existing.application_id), payload)
}

export async function requestDocumentReplacement(db: Database, key: string, input: { documentId?: number | string; documentType?: string; reason: string; reasonCategory?: string }) {
  const app = await requireApplicationRow(db, key)
  const numericDocumentId = input.documentId !== undefined ? Number(input.documentId) : NaN
  const document = Number.isInteger(numericDocumentId) && numericDocumentId > 0 ? await getDocument(db, numericDocumentId) : input.documentType ? await getLatestDocument(db, app.id, input.documentType) : null
  if (!document || document.application_id !== app.id) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Choose a document from this application.')
  const requestedAt = now()
  const reason = input.reasonCategory ? `${input.reasonCategory}: ${input.reason}` : input.reason
  const statements: D1PreparedStatement[] = [db.prepare("UPDATE documents SET status = 'REUPLOAD_REQUIRED', rejection_reason = ?, reviewed_at = ? WHERE id = ?").bind(reason, requestedAt, document.id), db.prepare("UPDATE applications SET status = 'DOCUMENT_REUPLOAD_REQUIRED', updated_at = ?, version = version + 1 WHERE id = ?").bind(requestedAt, app.id), createNotificationStatement(db, app.id, 'DOCUMENT_REUPLOAD_REQUIRED', 'Document replacement requested', `Please replace your ${document.document_type} document. ${input.reason}`, requestedAt), createEventStatement(db, app.id, 'DOCUMENT_REUPLOAD_REQUESTED', 'Document replacement requested', `The ${document.document_type} document needs to be replaced.`, 'Visa Review Officer', requestedAt)]
  await db.batch(statements)
  return applicationFromBundle(await getApplicationBundle(db, key))
}

export function requiredDocumentStatus(documents: Array<Pick<DocumentRow, 'document_type' | 'status'>>, visaType: string) {
  const latest = new Map(documents.map((doc) => [doc.document_type, doc.status]))
  return getRequiredDocuments(visaType).map((documentType) => ({ documentType, status: latest.get(documentType) ?? 'MISSING' as DocumentStatus, required: true }))
}

export function listAllowedDocumentTypes() { return [...allowedDocumentTypes] }

function escapeXml(unsafe: string): string {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

export function generateDemoDocumentSvg(document: DocumentRow): string {
  const type = document.document_type || 'document'
  const filename = escapeXml(document.original_filename || 'document.pdf')
  const uploaded = escapeXml(document.uploaded_at ? new Date(document.uploaded_at).toUTCString() : 'Demonstration Record')
  const status = escapeXml(document.status)
  const sizeText = document.size_bytes ? `${Math.round(document.size_bytes / 1024)} KB` : '180 KB'
  const isPhoto = type === 'photograph' || (document.mime_type && document.mime_type.startsWith('image/'))
  const statusColor = status === 'ACCEPTED' ? '#356846' : status === 'REUPLOAD_REQUIRED' ? '#d9691a' : '#121212'

  if (isPhoto) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="100%" height="100%" style="background:#f4f1ea; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdfcf9"/>
      <stop offset="100%" stop-color="#ede8dd"/>
    </linearGradient>
    <pattern id="photoGrid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e3ded2" stroke-width="0.75"/>
    </pattern>
  </defs>
  <rect width="600" height="750" fill="url(#bgGrad)"/>
  <rect width="600" height="750" fill="url(#photoGrid)" opacity="0.65"/>
  <rect x="30" y="30" width="540" height="690" rx="16" fill="#ffffff" stroke="#121212" stroke-width="2"/>
  <rect x="30" y="30" width="540" height="70" rx="16" fill="#121212"/>
  <rect x="30" y="70" width="540" height="30" fill="#121212"/>
  <text x="300" y="65" fill="#ffffff" font-size="15" font-weight="600" letter-spacing="2" text-anchor="middle">GOVERNMENT OF INDIA · VISA REVIEW DESK</text>
  <text x="300" y="85" fill="#d97757" font-size="11" font-weight="600" letter-spacing="1.5" text-anchor="middle">DEMONSTRATION APPLICANT PHOTOGRAPH</text>
  <rect x="150" y="130" width="300" height="360" rx="12" fill="#e8e5dc" stroke="#d5cec6" stroke-width="2"/>
  <circle cx="300" cy="250" r="65" fill="#bbb4a6"/>
  <path d="M 200 450 C 200 350 400 350 400 450 Z" fill="#bbb4a6"/>
  <circle cx="300" cy="225" r="48" fill="#d5cfc3"/>
  <rect x="175" y="455" width="250" height="26" rx="6" fill="#121212" fill-opacity="0.85"/>
  <text x="300" y="472" fill="#ffffff" font-size="11" font-weight="500" text-anchor="middle">ICAO / VISA COMPLIANT 35×45mm</text>
  <rect x="60" y="520" width="480" height="150" rx="10" fill="#f8f8f6" stroke="#e7e6e1" stroke-width="1"/>
  <text x="85" y="552" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">ORIGINAL FILENAME</text>
  <text x="85" y="574" fill="#121212" font-size="14" font-weight="500">${filename}</text>
  <text x="330" y="552" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">DOCUMENT TYPE</text>
  <text x="330" y="574" fill="#121212" font-size="14" font-weight="500">Applicant Photograph</text>
  <line x1="85" y1="594" x2="515" y2="594" stroke="#e7e6e1" stroke-width="1"/>
  <text x="85" y="622" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">UPLOADED AT</text>
  <text x="85" y="644" fill="#121212" font-size="13" font-weight="500">${uploaded}</text>
  <text x="330" y="622" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">STATUS · SIZE</text>
  <text x="330" y="644" fill="${statusColor}" font-size="13" font-weight="600">${status} · ${sizeText}</text>
  <text x="300" y="705" fill="#9c9a92" font-size="10" letter-spacing="0.5" text-anchor="middle">PROTOTYPE RECORD · DEMONSTRATION ATTACHMENT VIEW</text>
</svg>`
  }

  const isPassport = type === 'passport'
  const titleLabel = isPassport ? 'PASSPORT BIO-DATA PAGE' : type.replace(/[-_]/g, ' ').toUpperCase()
  const docHeading = isPassport ? 'REPUBLIC OF INDIA / RÉPUBLIQUE D\'INDE' : 'OFFICIAL DEMONSTRATION SUPPORTING RECORD'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="100%" height="100%" style="background:#f4f1ea; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#faf8f4"/>
    </linearGradient>
    <pattern id="docLines" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 0 40 L 40 40" fill="none" stroke="#f0ebe0" stroke-width="0.75"/>
    </pattern>
  </defs>
  <rect width="800" height="1050" fill="#ede8df"/>
  <rect x="40" y="40" width="720" height="970" rx="12" fill="url(#paperGrad)" stroke="#121212" stroke-width="2"/>
  <rect x="40" y="40" width="720" height="970" fill="url(#docLines)" opacity="0.6"/>
  <rect x="40" y="40" width="720" height="90" rx="12" fill="#121212"/>
  <rect x="40" y="90" width="720" height="40" fill="#121212"/>
  <text x="400" y="85" fill="#ffffff" font-size="17" font-weight="700" letter-spacing="2.5" text-anchor="middle">${docHeading}</text>
  <text x="400" y="112" fill="#d97757" font-size="12" font-weight="600" letter-spacing="2" text-anchor="middle">INDIAN E-VISA REDESIGN PROTOTYPE</text>
  <rect x="75" y="165" width="650" height="50" rx="6" fill="#f4efe4" stroke="#d5cec6" stroke-width="1"/>
  <text x="100" y="196" fill="#121212" font-size="16" font-weight="700" letter-spacing="1.5">${titleLabel}</text>
  <text x="690" y="196" fill="${statusColor}" font-size="13" font-weight="600" text-anchor="end">${status}</text>
  <rect x="75" y="240" width="650" height="380" rx="8" fill="#ffffff" stroke="#e7e6e1" stroke-width="1.5"/>
  ${isPassport ? `
  <rect x="105" y="270" width="180" height="230" rx="8" fill="#e8e5dc" stroke="#c4bfb4" stroke-width="1.5"/>
  <circle cx="195" cy="350" r="42" fill="#bbb4a6"/>
  <path d="M 130 480 C 130 410 260 410 260 480 Z" fill="#bbb4a6"/>
  <text x="195" y="490" fill="#7b7974" font-size="10" font-weight="600" text-anchor="middle">PASSPORT PHOTO</text>
  <text x="320" y="295" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">DOCUMENT TYPE / CODE</text>
  <text x="320" y="320" fill="#121212" font-size="16" font-weight="700">P &lt; IND</text>
  <text x="320" y="365" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">ATTACHED DEMO FILE</text>
  <text x="320" y="390" fill="#121212" font-size="14" font-weight="500">${filename}</text>
  <text x="320" y="435" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">RECORD DETAILS</text>
  <text x="320" y="460" fill="#121212" font-size="13" font-weight="500">${sizeText} · ${document.mime_type || 'application/pdf'}</text>
  <text x="320" y="495" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">APPLICATION ID</text>
  <text x="320" y="520" fill="#121212" font-size="15" font-weight="600">APP-REF #${document.application_id}</text>
  ` : `
  <text x="105" y="280" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">SUPPORTING DOCUMENT CLASSIFICATION</text>
  <text x="105" y="310" fill="#121212" font-size="18" font-weight="700">${titleLabel}</text>
  <text x="105" y="360" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">ORIGINAL FILENAME</text>
  <text x="105" y="385" fill="#121212" font-size="15" font-weight="500">${filename}</text>
  <text x="105" y="435" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">VERIFICATION STATUS</text>
  <text x="105" y="460" fill="${statusColor}" font-size="15" font-weight="600">${status} · Version ${document.version}</text>
  <text x="105" y="510" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">SUMMARY NOTE</text>
  <text x="105" y="535" fill="#121212" font-size="13" font-weight="400">This supporting attachment has been received by the review queue for officer verification.</text>
  `}
  <rect x="75" y="650" width="650" height="220" rx="8" fill="#f8f8f6" stroke="#e7e6e1" stroke-width="1"/>
  <text x="105" y="685" fill="#7b7974" font-size="11" font-weight="600" letter-spacing="1">METADATA AUDIT</text>
  <text x="105" y="715" fill="#373734" font-size="13">Uploaded: <tspan font-weight="600">${uploaded}</tspan></text>
  <text x="105" y="745" fill="#373734" font-size="13">MIME Format: <tspan font-weight="600">${document.mime_type || 'application/pdf'}</tspan></text>
  <text x="105" y="775" fill="#373734" font-size="13">Storage Key: <tspan font-family="monospace" font-size="11">${escapeXml(document.object_key || 'stored-in-r2')}</tspan></text>
  <text x="105" y="805" fill="#373734" font-size="13">Review State: <tspan font-weight="600" fill="${statusColor}">${status}</tspan></text>
  ${document.rejection_reason ? `<text x="105" y="840" fill="#8c2525" font-size="13" font-weight="500">Notice: ${escapeXml(document.rejection_reason)}</text>` : ''}
  <!-- Bottom MRZ / Stamp strip -->
  <rect x="75" y="895" width="650" height="75" rx="6" fill="#121212"/>
  <text x="105" y="928" fill="#ffffff" font-family="monospace" font-size="13" letter-spacing="2">P&lt;INDDEMO&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="105" y="952" fill="#d97757" font-family="monospace" font-size="13" letter-spacing="2">EVISA2026&lt;9IND8802190M3112318&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;04</text>
  <text x="400" y="995" fill="#9c9a92" font-size="10" letter-spacing="0.5" text-anchor="middle">INDIAN E-VISA PROTOTYPE · DEMONSTRATION RECORD VIEW</text>
</svg>`
}

export async function getDocumentContent(db: Database, bucket: Bucket | undefined, documentId: number): Promise<Response> {
  const document = await getDocument(db, documentId)
  if (!document) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'We could not find that document.')

  if (bucket && document.object_key) {
    try {
      const object = await bucket.get(document.object_key)
      if (object) {
        const headers = new Headers()
        headers.set('Content-Type', document.mime_type || object.httpMetadata?.contentType || 'application/octet-stream')
        headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(document.original_filename)}"`)
        headers.set('Cache-Control', 'private, max-age=3600')
        return new Response(object.body, { status: 200, headers })
      }
    } catch {
      // Fall through to demo renderer if R2 fetch fails
    }
  }

  const svg = generateDemoDocumentSvg(document)
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Content-Disposition': `inline; filename="${encodeURIComponent(document.original_filename)}.svg"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
