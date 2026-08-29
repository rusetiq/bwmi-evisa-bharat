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
