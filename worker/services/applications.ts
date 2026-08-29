import type { Application, ApplicationStatus, SectionData } from '@/lib/types'
import { calculateVisaFee, getApplicationProgress as clientProgress, getRequiredDocuments } from '@/lib/domain'
import { HttpError, now, parseDate } from '../http'
import { applicationFromBundle, createEventStatement, getApplicationBundle, getDocuments, getSectionRows, getVisaTypeRow, requireApplicationRow, upsertSectionStatement } from '../db/queries'
import type { AppEnv, ApplicationRow, StoredSections } from '../types'
import { createApplicationSchema, applicationPatchSchema, findApplicationSchema, isSupportedSection } from '../validation'

type Database = AppEnv['Bindings']['DB']
type CreateInput = ReturnType<typeof createApplicationSchema.parse>
type PatchInput = ReturnType<typeof applicationPatchSchema.parse>
type FindInput = ReturnType<typeof findApplicationSchema.parse>

const sectionFieldMap: Record<string, string> = {
  nationality: 'visa', visaCategory: 'visa', visaType: 'visa', visaTypeId: 'visa', visaSubtype: 'visa', purpose: 'visa', proposedArrival: 'visa', arrivalPort: 'visa',
  surname: 'personal', givenNames: 'personal', gender: 'personal', dob: 'personal', birthCity: 'personal', birthCountry: 'personal', citizenship: 'personal', religion: 'personal', identificationMarks: 'personal', education: 'personal',
  passportNumber: 'passport', passportType: 'passport', issuingCountry: 'passport', placeOfIssue: 'passport', issueDate: 'passport', expiryDate: 'passport',
  address1: 'contact', city: 'contact', state: 'contact', postalCode: 'contact', country: 'contact', email: 'contact', mobile: 'contact',
  fatherName: 'family', fatherNationality: 'family', motherName: 'family', motherNationality: 'family', maritalStatus: 'family',
  occupation: 'employment', employer: 'employment', designation: 'employment', employerAddress: 'employment', employerPhone: 'employment', industry: 'employment',
  expectedArrival: 'travel', expectedDeparture: 'travel', places: 'travel', accommodationName: 'travel', accommodationAddress: 'travel', indiaReference: 'travel', indiaReferencePhone: 'travel', homeReferenceName: 'travel', homeReferenceRelationship: 'travel', homeReferencePhone: 'travel', homeReferenceAddress: 'travel',
  visaRefusal: 'background', deportation: 'background', conviction: 'background', immigrationViolation: 'background', restrictedTravel: 'background', declaration: 'background',
}

const requiredFields: Record<string, string[]> = {
  visa: ['nationality', 'visaCategory', 'visaSubtype', 'purpose', 'proposedArrival', 'arrivalPort'],
  personal: ['surname', 'givenNames', 'gender', 'dob', 'birthCity', 'birthCountry', 'citizenship', 'religion', 'identificationMarks', 'education'],
  passport: ['passportNumber', 'passportType', 'issuingCountry', 'placeOfIssue', 'issueDate', 'expiryDate'],
  contact: ['address1', 'city', 'state', 'postalCode', 'country', 'email', 'mobile'],
  family: ['fatherName', 'fatherNationality', 'motherName', 'motherNationality', 'maritalStatus'],
  employment: ['occupation', 'employer', 'designation', 'employerAddress', 'employerPhone', 'industry'],
  travel: ['expectedArrival', 'expectedDeparture', 'arrivalPort', 'places', 'accommodationName', 'accommodationAddress', 'indiaReference', 'indiaReferencePhone', 'homeReferenceName', 'homeReferenceRelationship', 'homeReferencePhone', 'homeReferenceAddress'],
  background: ['visaRefusal', 'deportation', 'conviction', 'immigrationViolation', 'restrictedTravel', 'declaration'],
}

const appStatuses: readonly ApplicationStatus[] = ['DRAFT', 'READY_TO_SUBMIT', 'SUBMITTED', 'PAYMENT_PENDING', 'UNDER_REVIEW', 'DOCUMENT_REUPLOAD_REQUIRED', 'GRANTED', 'REJECTED']

function valuePresent(value: unknown, field: string) {
  if (field === 'declaration') return value === true || value === 'true' || value === 'yes' || value === 'Yes'
  if (typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.length > 0
  return value !== undefined && value !== null && String(value).trim() !== ''
}

export function getApplicationProgress(sections: Record<string, SectionData>) {
  return Object.entries(requiredFields).map(([step, fields]) => ({ step, complete: fields.every((field) => valuePresent(sections[step]?.[field], field)) }))
}

export function getNextRequiredStep(sections: Record<string, SectionData>) {
  return getApplicationProgress(sections).find((item) => !item.complete)?.step ?? 'documents'
}

export function isApplicationFormComplete(sections: Record<string, SectionData>) {
  return getApplicationProgress(sections).every((item) => item.complete)
}

export function normalizeVisaSlug(value: string | undefined | null) {
  return String(value ?? 'e-tourist').trim().toLowerCase().replace(/\s+/g, '-')
}

export function canTransitionStatus(from: ApplicationStatus, to: ApplicationStatus) {
  if (from === to) return true
  const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    DRAFT: ['READY_TO_SUBMIT', 'SUBMITTED', 'PAYMENT_PENDING'],
    READY_TO_SUBMIT: ['SUBMITTED', 'PAYMENT_PENDING'],
    SUBMITTED: ['PAYMENT_PENDING', 'UNDER_REVIEW'],
    PAYMENT_PENDING: ['UNDER_REVIEW'],
    UNDER_REVIEW: ['DOCUMENT_REUPLOAD_REQUIRED', 'GRANTED', 'REJECTED'],
    DOCUMENT_REUPLOAD_REQUIRED: ['UNDER_REVIEW', 'GRANTED', 'REJECTED'],
    GRANTED: [],
    REJECTED: [],
  }
  return transitions[from]?.includes(to) ?? false
}

function makePublicId() {
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  return `IND-EV-26-${token}`
}

function asSectionData(value: unknown): SectionData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const output: SectionData = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === 'string' || typeof item === 'boolean' || (Array.isArray(item) && item.every((entry) => typeof entry === 'string'))) output[key] = item as string | boolean | string[]
  }
  return output
}

function mergeSection(sections: StoredSections, section: string, data: unknown) {
  if (!isSupportedSection(section)) return
  sections[section] = { ...(sections[section] ?? {}), ...asSectionData(data) }
}

export function sectionsFromCreateInput(input: CreateInput): StoredSections {
  const sections: StoredSections = {}
  for (const [section, data] of Object.entries(input.sections ?? {})) mergeSection(sections, section, data)
  if (input.section) mergeSection(sections, input.section, input.fields)
  const controls = new Set(['nationality', 'visaType', 'visaTypeId', 'email', 'proposedArrival', 'applicantName', 'dob', 'passportNumber', 'sections', 'section', 'fields'])
  const directBySection: Record<string, Record<string, unknown>> = {}
  for (const [key, value] of Object.entries(input)) {
    if (!controls.has(key) && key !== 'data' && sectionFieldMap[key]) {
      const section = input.section ?? sectionFieldMap[key]
      directBySection[section] = { ...(directBySection[section] ?? {}), [key]: value }
    }
  }
  for (const [section, data] of Object.entries(directBySection)) mergeSection(sections, section, data)
  const topLevelFields: Record<string, unknown> = {
    nationality: input.nationality,
    visaType: input.visaType ?? input.visaTypeId,
    proposedArrival: input.proposedArrival,
    email: input.email,
    applicantName: input.applicantName,
    dob: input.dob,
    passportNumber: input.passportNumber,
  }
  if (Object.values(topLevelFields).some((value) => value !== undefined)) {
    mergeSection(sections, 'visa', { nationality: input.nationality, visaType: input.visaType ?? input.visaTypeId, proposedArrival: input.proposedArrival })
    mergeSection(sections, 'personal', { applicantName: input.applicantName, dob: input.dob })
    mergeSection(sections, 'passport', { passportNumber: input.passportNumber })
    mergeSection(sections, 'contact', { email: input.email })
  }
  return sections
}

function sectionsFromPatch(input: PatchInput): StoredSections {
  const sections: StoredSections = {}
  for (const [section, data] of Object.entries(input.sections ?? {})) mergeSection(sections, section, data)
  const explicit = input.fields ?? input.data
  if (input.section && explicit) mergeSection(sections, input.section, explicit)
  const controls = new Set(['section', 'fields', 'sections', 'data', 'version', 'email', 'nationality', 'visaType', 'visaTypeId', 'proposedArrival', 'applicantName', 'dob', 'passportNumber'])
  const directBySection: Record<string, Record<string, unknown>> = {}
  for (const [key, value] of Object.entries(input)) {
    if (!controls.has(key) && sectionFieldMap[key]) {
      const section = input.section ?? sectionFieldMap[key]
      directBySection[section] = { ...(directBySection[section] ?? {}), [key]: value }
    }
  }
  for (const [section, data] of Object.entries(directBySection)) mergeSection(sections, section, data)
  if (input.nationality || input.visaType || input.visaTypeId || input.proposedArrival) mergeSection(sections, 'visa', { nationality: input.nationality, visaType: input.visaType ?? input.visaTypeId, proposedArrival: input.proposedArrival })
  if (input.applicantName || input.dob) mergeSection(sections, 'personal', { applicantName: input.applicantName, dob: input.dob })
  if (input.passportNumber) mergeSection(sections, 'passport', { passportNumber: input.passportNumber })
  if (input.email !== undefined) mergeSection(sections, 'contact', { email: input.email })
  return sections
}

function deriveApplicationFields(sections: StoredSections, input: { nationality?: string; visaType?: string; visaTypeId?: string; email?: string; proposedArrival?: string; applicantName?: string; dob?: string; passportNumber?: string }) {
  const personal = sections.personal ?? {}
  const passport = sections.passport ?? {}
  const contact = sections.contact ?? {}
  const visa = sections.visa ?? {}
  const travel = sections.travel ?? {}
  const givenNames = String(personal.givenNames ?? '').trim()
  const surname = String(personal.surname ?? '').trim()
  const composedName = [givenNames, surname].filter(Boolean).join(' ').trim()
  return {
    nationality: input.nationality ?? String(visa.nationality ?? personal.citizenship ?? ''),
    visaType: normalizeVisaSlug(input.visaType ?? input.visaTypeId ?? String(visa.visaType ?? visa.visaSubtype ?? 'e-tourist')),
    email: input.email ?? String(contact.email ?? ''),
    proposedArrival: input.proposedArrival ?? String(visa.proposedArrival ?? travel.expectedArrival ?? ''),
    applicantName: input.applicantName ?? composedName,
    dob: input.dob ?? String(personal.dob ?? ''),
    passportNumber: input.passportNumber ?? String(passport.passportNumber ?? ''),
  }
}

function validateDerivedFields(sections: StoredSections, derived: ReturnType<typeof deriveApplicationFields>) {
  const fields: Record<string, string> = {}
  const contactEmail = sections.contact?.email
  if (contactEmail && (typeof contactEmail !== 'string' || !/^\S+@\S+\.\S+$/.test(contactEmail))) fields['contact.email'] = 'Enter a valid email address.'
  const passport = sections.passport ?? {}
  if (passport.issueDate && !parseDate(String(passport.issueDate))) fields['passport.issueDate'] = 'Enter a valid passport issue date.'
  if (passport.expiryDate && !parseDate(String(passport.expiryDate))) fields['passport.expiryDate'] = 'Enter a valid passport expiry date.'
  if (passport.issueDate && passport.expiryDate && parseDate(String(passport.issueDate)) && parseDate(String(passport.expiryDate)) && parseDate(String(passport.expiryDate))! <= parseDate(String(passport.issueDate))!) fields['passport.expiryDate'] = 'Passport expiry must be after the issue date.'
  if (derived.dob && !parseDate(derived.dob)) fields['personal.dob'] = 'Enter a valid date of birth.'
  if (derived.proposedArrival && !parseDate(derived.proposedArrival)) fields['visa.proposedArrival'] = 'Enter a valid arrival date.'
  const travel = sections.travel ?? {}
  if (travel.expectedArrival && travel.expectedDeparture && parseDate(String(travel.expectedArrival)) && parseDate(String(travel.expectedDeparture)) && parseDate(String(travel.expectedDeparture))! <= parseDate(String(travel.expectedArrival))!) fields['travel.expectedDeparture'] = 'Departure must be after arrival.'
  return fields
}

function normalizedStatements(db: Database, applicationId: number, sections: StoredSections, updatedAt: string) {
  const statements: D1PreparedStatement[] = []
  const applicant = sections.personal ?? {}
  const passport = sections.passport ?? {}
  statements.push(db.prepare(`INSERT INTO applicants (application_id, surname, given_names, gender, birth_city, birth_country, citizenship, religion, identification_marks, education, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(application_id) DO UPDATE SET surname=excluded.surname, given_names=excluded.given_names, gender=excluded.gender, birth_city=excluded.birth_city, birth_country=excluded.birth_country, citizenship=excluded.citizenship, religion=excluded.religion, identification_marks=excluded.identification_marks, education=excluded.education, data_json=excluded.data_json, updated_at=excluded.updated_at`).bind(applicationId, applicant.surname ?? null, applicant.givenNames ?? null, applicant.gender ?? null, applicant.birthCity ?? null, applicant.birthCountry ?? null, applicant.citizenship ?? null, applicant.religion ?? null, applicant.identificationMarks ?? null, applicant.education ?? null, JSON.stringify(applicant), updatedAt))
  statements.push(db.prepare(`INSERT INTO passports (application_id, passport_number, passport_type, issuing_country, place_of_issue, issue_date, expiry_date, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(application_id) DO UPDATE SET passport_number=excluded.passport_number, passport_type=excluded.passport_type, issuing_country=excluded.issuing_country, place_of_issue=excluded.place_of_issue, issue_date=excluded.issue_date, expiry_date=excluded.expiry_date, data_json=excluded.data_json, updated_at=excluded.updated_at`).bind(applicationId, passport.passportNumber ?? null, passport.passportType ?? null, passport.issuingCountry ?? null, passport.placeOfIssue ?? null, passport.issueDate ?? null, passport.expiryDate ?? null, JSON.stringify(passport), updatedAt))
  const tableBySection: Record<string, string> = { contact: 'addresses', family: 'family_details', employment: 'employment_details', travel: 'travel_details', visa: 'visa_details', background: 'background_answers' }
  for (const [section, table] of Object.entries(tableBySection)) {
    statements.push(db.prepare(`INSERT INTO ${table} (application_id, data_json, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(application_id) DO UPDATE SET data_json=excluded.data_json, updated_at=excluded.updated_at`).bind(applicationId, JSON.stringify(sections[section] ?? {}), updatedAt))
  }
  return statements
}

export async function createApplication(db: Database, rawInput: unknown): Promise<Application> {
  const input = createApplicationSchema.parse(rawInput)
  const sections = sectionsFromCreateInput(input)
  const derived = deriveApplicationFields(sections, input)
  const errors = validateDerivedFields(sections, derived)
  if (Object.keys(errors).length) throw new HttpError(422, 'VALIDATION_ERROR', 'Check the highlighted fields and try again.', errors)
  const visa = await getVisaTypeRow(db, derived.visaType)
  if (!visa) throw new HttpError(422, 'UNKNOWN_VISA_TYPE', 'Choose a valid visa type.', { visaType: 'Choose a valid visa type.' })
  const createdAt = now()
  const publicId = makePublicId()
  const appInsert = db.prepare(`INSERT INTO applications (public_id, status, email, nationality, visa_type_id, proposed_arrival, applicant_name, dob, passport_number, sections_json, version, created_at, updated_at)
    VALUES (?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`).bind(publicId, derived.email || null, derived.nationality, derived.visaType, derived.proposedArrival || null, derived.applicantName || null, derived.dob || null, derived.passportNumber || null, JSON.stringify(sections), createdAt, createdAt)
  const statements: D1PreparedStatement[] = [appInsert]
  const inserted = await db.batch(statements)
  if (!inserted) throw new HttpError(500, 'CREATE_FAILED', 'We could not create your application.')
  const row = await requireApplicationRow(db, publicId)
  const sectionStatements = Object.entries(sections).map(([section, data]) => upsertSectionStatement(db, row.id, section, data, createdAt))
  sectionStatements.push(...normalizedStatements(db, row.id, sections, createdAt))
  sectionStatements.push(createEventStatement(db, row.id, 'APPLICATION_CREATED', 'Application created', 'Your draft application was created.', 'applicant', createdAt))
  await db.batch(sectionStatements)
  return applicationFromBundle(await getApplicationBundle(db, publicId))
}

export async function updateApplication(db: Database, key: string, rawInput: unknown): Promise<{ updatedAt: string; version: number }> {
  const input = applicationPatchSchema.parse(rawInput)
  const current = await requireApplicationRow(db, key)
  if (input.version !== undefined && input.version !== current.version) throw new HttpError(409, 'VERSION_CONFLICT', 'This application changed in another tab. Refresh and try again.')
  const existingSections = await getSectionRows(db, current.id)
  const incomingSections = sectionsFromPatch(input)
  const sections: StoredSections = { ...existingSections }
  for (const [section, data] of Object.entries(incomingSections)) sections[section] = { ...(sections[section] ?? {}), ...data }
  const derived = deriveApplicationFields(sections, {
    nationality: input.nationality,
    visaType: input.visaType ?? input.visaTypeId,
    email: input.email,
    proposedArrival: input.proposedArrival,
    applicantName: input.applicantName,
    dob: input.dob,
    passportNumber: input.passportNumber,
  })
  const errors = validateDerivedFields(sections, derived)
  if (Object.keys(errors).length) throw new HttpError(422, 'VALIDATION_ERROR', 'Check the highlighted fields and try again.', errors)
  const visa = await getVisaTypeRow(db, derived.visaType)
  if (!visa) throw new HttpError(422, 'UNKNOWN_VISA_TYPE', 'Choose a valid visa type.', { visaType: 'Choose a valid visa type.' })
  const updatedAt = now()
  const nextStatus = current.status === 'DRAFT' && isApplicationFormComplete(sections) ? 'READY_TO_SUBMIT' : current.status
  const statements: D1PreparedStatement[] = [db.prepare(`UPDATE applications SET email = ?, nationality = ?, visa_type_id = ?, proposed_arrival = ?, applicant_name = ?, dob = ?, passport_number = ?, sections_json = ?, status = ?, version = version + 1, updated_at = ? WHERE id = ?`).bind(derived.email || null, derived.nationality, derived.visaType, derived.proposedArrival || null, derived.applicantName || null, derived.dob || null, derived.passportNumber || null, JSON.stringify(sections), nextStatus, updatedAt, current.id)]
  for (const [section, data] of Object.entries(incomingSections)) statements.push(upsertSectionStatement(db, current.id, section, { ...(existingSections[section] ?? {}), ...data }, updatedAt))
  statements.push(...normalizedStatements(db, current.id, sections, updatedAt))
  if (nextStatus !== current.status) statements.push(createEventStatement(db, current.id, 'FORM_READY', 'Application details completed', 'All application form sections are complete.', 'system', updatedAt))
  await db.batch(statements)
  return { updatedAt, version: current.version + 1 }
}

export async function getApplication(db: Database, key: string, includeHistory = false): Promise<Application> {
  return applicationFromBundle(await getApplicationBundle(db, key, includeHistory))
}

export async function getDashboard(db: Database, key: string): Promise<Application> {
  return getApplication(db, key)
}

export async function findApplication(db: Database, rawInput: unknown) {
  const input = findApplicationSchema.parse(rawInput)
  const key = input.applicationId ?? input.publicId ?? input.id ?? ''
  const passportNumber = input.passportNumber ?? input.passport ?? ''
  const dob = input.dateOfBirth ?? input.dob ?? ''
  const row = await db.prepare('SELECT public_id FROM applications WHERE (public_id = ? OR CAST(id AS TEXT) = ?) AND lower(COALESCE(passport_number, \'\')) = lower(?) AND dob = ? LIMIT 1').bind(key, key, passportNumber, dob).first<{ public_id: string }>()
  if (!row) throw new HttpError(404, 'APPLICATION_NOT_FOUND', 'We could not find an application with those details.')
  return { publicId: row.public_id }
}

export async function canSubmitApplication(db: Database, key: string) {
  const bundle = await getApplicationBundle(db, key)
  const sections = bundle.sections
  const progress = getApplicationProgress(sections)
  const fields: Record<string, string> = {}
  for (const item of progress) if (!item.complete) fields[item.step] = `Complete the ${item.step} section.`
  const required = getRequiredDocuments(bundle.row.visa_type_id)
  const docs = await getDocuments(db, bundle.row.id)
  const uploaded = new Set(docs.filter((doc) => ['UPLOADED', 'ACCEPTED', 'REPLACED'].includes(doc.status)).map((doc) => doc.document_type))
  for (const requiredType of required) if (!uploaded.has(requiredType)) fields[`documents.${requiredType}`] = 'Upload this required document.'
  return { ok: Object.keys(fields).length === 0, fields, bundle, requiredDocuments: required }
}

export async function submitApplication(db: Database, key: string): Promise<Application> {
  const check = await canSubmitApplication(db, key)
  if (!check.ok) throw new HttpError(422, 'APPLICATION_INCOMPLETE', 'Complete the required sections and documents before submitting.', check.fields)
  const current = check.bundle.row
  if (current.status === 'PAYMENT_PENDING') return applicationFromBundle(check.bundle)
  if (!['DRAFT', 'READY_TO_SUBMIT', 'SUBMITTED'].includes(current.status)) return applicationFromBundle(check.bundle)
  const updatedAt = now()
  const amount = calculateVisaFee(current.nationality, current.visa_type_id).total
  const statements: D1PreparedStatement[] = [db.prepare(`UPDATE applications SET status = 'PAYMENT_PENDING', submitted_at = COALESCE(submitted_at, ?), updated_at = ?, version = version + 1 WHERE id = ?`).bind(updatedAt, updatedAt, current.id), db.prepare(`INSERT INTO payments (application_id, amount, currency, provider, status, created_at, updated_at)
    SELECT ?, ?, 'USD', 'Demo payment', 'UNPAID', ?, ?
    WHERE NOT EXISTS (SELECT 1 FROM payments WHERE application_id = ?)`).bind(current.id, amount, updatedAt, updatedAt, current.id), createEventStatement(db, current.id, 'APPLICATION_SUBMITTED', 'Application submitted', 'Your application is ready for payment.', 'applicant', updatedAt)]
  await db.batch(statements)
  return getApplication(db, key)
}

export function clientProgressMatchesServer(sections: Record<string, SectionData>) {
  return JSON.stringify(getApplicationProgress(sections)) === JSON.stringify(clientProgress(sections))
}
