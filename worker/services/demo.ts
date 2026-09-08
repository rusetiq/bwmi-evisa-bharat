import type { Application, ApplicationStatus, DocumentStatus, PaymentStatus } from '@/lib/types'
import { HttpError, safeJsonParse } from '../http'
import { applicationFromBundle, getApplicationBundle, requireApplicationRow } from '../db/queries'
import type { AppEnv, StoredSections } from '../types'

type Database = AppEnv['Bindings']['DB']
type Bucket = AppEnv['Bindings']['DOCUMENTS']

type DemoDocumentSnapshot = {
  documentType: string
  objectKey: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  status: DocumentStatus
  rejectionReason?: string
  uploadedAt: string
  reviewedAt?: string
  version: number
}

type DemoPaymentSnapshot = {
  amount: number
  currency: string
  provider: string
  status: PaymentStatus
  transactionReference?: string
  createdAt: string
  updatedAt: string
}

type DemoNotificationSnapshot = { type: string; title: string; message: string; createdAt: string }
type DemoEventSnapshot = { type: string; title: string; description: string; actor: string; createdAt: string }
type DemoEtaSnapshot = { etaNumber: string; grantedAt: string; validFrom: string; validUntil: string; entries: string; conditions: string }

export type DemoResetSnapshot = {
  publicId: string
  status: ApplicationStatus
  email: string
  nationality: string
  visaType: string
  proposedArrival: string
  applicantName: string
  dob: string
  passportNumber: string
  sectionsJson: string
  version: number
  createdAt: string
  updatedAt: string
  submittedAt?: string
  rejectionReason?: string
  documents: DemoDocumentSnapshot[]
  payment?: DemoPaymentSnapshot
  notifications: DemoNotificationSnapshot[]
  events: DemoEventSnapshot[]
  eta?: DemoEtaSnapshot
}

export const DEMO_PUBLIC_IDS = [
  'IND-EV-26-DEMO01',
  'IND-EV-26-DEMO02',
  'IND-EV-26-DEMO03',
  'IND-EV-26-DEMO04',
  'IND-EV-26-DEMO05',
  'IND-EV-26-DEMO06',
] as const

type DemoPublicId = (typeof DEMO_PUBLIC_IDS)[number]

const snapshots: Record<DemoPublicId, DemoResetSnapshot> = {
  'IND-EV-26-DEMO01': {
    publicId: 'IND-EV-26-DEMO01', status: 'DRAFT', email: 'maya.thompson@example.test', nationality: 'United States', visaType: 'e-tourist', proposedArrival: '2026-11-18', applicantName: 'Maya Thompson', dob: '1996-08-14', passportNumber: 'P1234567', version: 3, createdAt: '2026-08-28T08:10:00.000Z', updatedAt: '2026-08-29T09:15:00.000Z',
    sectionsJson: String.raw`{"visa":{"nationality":"United States","visaCategory":"Tourism","visaSubtype":"e-tourist","purpose":"Tourism","proposedArrival":"2026-11-18","arrivalPort":"Delhi International Airport"},"personal":{"surname":"Thompson","givenNames":"Maya","gender":"Female","dob":"1996-08-14","birthCity":"Seattle","birthCountry":"United States","citizenship":"United States"},"passport":{"passportNumber":"P1234567","passportType":"Ordinary","issuingCountry":"United States"}}`,
    documents: [], notifications: [], events: [{ type: 'APPLICATION_CREATED', title: 'Application created', description: 'Your draft application was created.', actor: 'applicant', createdAt: '2026-08-28T08:10:00.000Z' }],
  },
  'IND-EV-26-DEMO02': {
    publicId: 'IND-EV-26-DEMO02', status: 'PAYMENT_PENDING', email: 'daniel.weber@example.test', nationality: 'Germany', visaType: 'e-business', proposedArrival: '2026-10-22', applicantName: 'Daniel Weber', dob: '1988-02-19', passportNumber: 'C01X8831', version: 7, createdAt: '2026-08-25T10:00:00.000Z', updatedAt: '2026-08-28T15:20:00.000Z', submittedAt: '2026-08-28T15:20:00.000Z',
    sectionsJson: String.raw`{"visa":{"nationality":"Germany","visaCategory":"Business","visaSubtype":"e-business","purpose":"Business meetings","proposedArrival":"2026-10-22","arrivalPort":"Mumbai International Airport"},"personal":{"surname":"Weber","givenNames":"Daniel","gender":"Male","dob":"1988-02-19","birthCity":"Berlin","birthCountry":"Germany","citizenship":"Germany","religion":"Not stated","identificationMarks":"None","education":"University"},"passport":{"passportNumber":"C01X8831","passportType":"Ordinary","issuingCountry":"Germany","placeOfIssue":"Berlin","issueDate":"2019-04-10","expiryDate":"2029-04-09"},"contact":{"address1":"14 Lindenstrasse","city":"Berlin","state":"Berlin","postalCode":"10115","country":"Germany","email":"daniel.weber@example.test","mobile":"+49 30 555 0100"},"family":{"fatherName":"Klaus Weber","fatherNationality":"Germany","motherName":"Anna Weber","motherNationality":"Germany","maritalStatus":"Married"},"employment":{"occupation":"Director","employer":"Weber Handels GmbH","designation":"Managing Director","employerAddress":"14 Lindenstrasse, Berlin","employerPhone":"+49 30 555 0101","industry":"Trade"},"travel":{"expectedArrival":"2026-10-22","expectedDeparture":"2026-10-30","arrivalPort":"Mumbai International Airport","places":"Mumbai and Pune","accommodationName":"Harbour View Hotel","accommodationAddress":"Apollo Bunder, Mumbai","indiaReference":"Ravi Mehta","indiaReferencePhone":"+91 22 5555 0101","homeReferenceName":"Anna Weber","homeReferenceRelationship":"Spouse","homeReferencePhone":"+49 30 555 0102","homeReferenceAddress":"14 Lindenstrasse, Berlin"},"background":{"visaRefusal":"No","deportation":"No","conviction":"No","immigrationViolation":"No","restrictedTravel":"No","declaration":true}}`,
    documents: [
      { documentType: 'photograph', objectKey: 'applications/2/photograph/demo-daniel.jpg', originalFilename: 'daniel-photo.jpg', mimeType: 'image/jpeg', sizeBytes: 184320, status: 'ACCEPTED', uploadedAt: '2026-08-26T12:20:00.000Z', reviewedAt: '2026-08-27T09:00:00.000Z', version: 1 },
      { documentType: 'passport', objectKey: 'applications/2/passport/demo-daniel.pdf', originalFilename: 'daniel-passport.pdf', mimeType: 'application/pdf', sizeBytes: 442100, status: 'ACCEPTED', uploadedAt: '2026-08-26T12:21:00.000Z', reviewedAt: '2026-08-27T09:00:00.000Z', version: 1 },
      { documentType: 'business-letter', objectKey: 'applications/2/business-letter/demo-daniel.pdf', originalFilename: 'employer-letter.pdf', mimeType: 'application/pdf', sizeBytes: 311200, status: 'ACCEPTED', uploadedAt: '2026-08-26T12:22:00.000Z', reviewedAt: '2026-08-27T09:00:00.000Z', version: 1 },
      { documentType: 'invitation-letter', objectKey: 'applications/2/invitation-letter/demo-daniel.pdf', originalFilename: 'invitation-letter.pdf', mimeType: 'application/pdf', sizeBytes: 278400, status: 'ACCEPTED', uploadedAt: '2026-08-26T12:23:00.000Z', reviewedAt: '2026-08-27T09:00:00.000Z', version: 1 },
    ],
    payment: { amount: 83, currency: 'USD', provider: 'Demo payment', status: 'UNPAID', createdAt: '2026-08-28T15:20:00.000Z', updatedAt: '2026-08-28T15:20:00.000Z' },
    notifications: [{ type: 'PAYMENT_PENDING', title: 'Payment is still due', message: 'Complete the demo payment to send your application for review.', createdAt: '2026-08-28T15:20:00.000Z' }],
    events: [{ type: 'APPLICATION_SUBMITTED', title: 'Application submitted', description: 'Your application is ready for payment.', actor: 'applicant', createdAt: '2026-08-28T15:20:00.000Z' }],
  },
  'IND-EV-26-DEMO03': {
    publicId: 'IND-EV-26-DEMO03', status: 'UNDER_REVIEW', email: 'sophie.martin@example.test', nationality: 'France', visaType: 'e-tourist', proposedArrival: '2026-10-14', applicantName: 'Sophie Martin', dob: '1992-11-03', passportNumber: '22FV61948', version: 10, createdAt: '2026-08-20T09:00:00.000Z', updatedAt: '2026-08-27T11:30:00.000Z', submittedAt: '2026-08-26T12:00:00.000Z',
    sectionsJson: String.raw`{"visa":{"nationality":"France","visaCategory":"Tourism","visaSubtype":"e-tourist","purpose":"Holiday","proposedArrival":"2026-10-14","arrivalPort":"Kochi International Airport"},"personal":{"surname":"Martin","givenNames":"Sophie","gender":"Female","dob":"1992-11-03","birthCity":"Lyon","birthCountry":"France","citizenship":"France","religion":"Not stated","identificationMarks":"None","education":"University"},"passport":{"passportNumber":"22FV61948","passportType":"Ordinary","issuingCountry":"France","placeOfIssue":"Lyon","issueDate":"2020-06-15","expiryDate":"2030-06-14"},"contact":{"address1":"8 Rue des Lilas","city":"Lyon","state":"Auvergne-Rhone-Alpes","postalCode":"69002","country":"France","email":"sophie.martin@example.test","mobile":"+33 4 5555 0100"},"family":{"fatherName":"Jean Martin","fatherNationality":"France","motherName":"Claire Martin","motherNationality":"France","maritalStatus":"Single"},"employment":{"occupation":"Editor","employer":"Maison Culture","designation":"Senior Editor","employerAddress":"2 Place Bellecour, Lyon","employerPhone":"+33 4 5555 0101","industry":"Publishing"},"travel":{"expectedArrival":"2026-10-14","expectedDeparture":"2026-10-28","arrivalPort":"Kochi International Airport","places":"Kochi, Munnar and Goa","accommodationName":"Pepper House Guest Rooms","accommodationAddress":"Fort Kochi, Kerala","indiaReference":"Anita Nair","indiaReferencePhone":"+91 484 555 0101","homeReferenceName":"Jean Martin","homeReferenceRelationship":"Father","homeReferencePhone":"+33 4 5555 0102","homeReferenceAddress":"8 Rue des Lilas, Lyon"},"background":{"visaRefusal":"No","deportation":"No","conviction":"No","immigrationViolation":"No","restrictedTravel":"No","declaration":true}}`,
    documents: [
      { documentType: 'photograph', objectKey: 'applications/3/photograph/demo-sophie.jpg', originalFilename: 'sophie-photo.jpg', mimeType: 'image/jpeg', sizeBytes: 201100, status: 'ACCEPTED', uploadedAt: '2026-08-25T10:00:00.000Z', reviewedAt: '2026-08-26T09:00:00.000Z', version: 1 },
      { documentType: 'passport', objectKey: 'applications/3/passport/demo-sophie.pdf', originalFilename: 'sophie-passport.pdf', mimeType: 'application/pdf', sizeBytes: 491000, status: 'ACCEPTED', uploadedAt: '2026-08-25T10:01:00.000Z', reviewedAt: '2026-08-26T09:00:00.000Z', version: 1 },
    ],
    payment: { amount: 43, currency: 'USD', provider: 'Demo payment', status: 'SUCCESS', transactionReference: 'DEMO-DEMO03-7A91C2', createdAt: '2026-08-26T12:05:00.000Z', updatedAt: '2026-08-26T12:06:00.000Z' },
    notifications: [{ type: 'UNDER_REVIEW', title: 'Application under review', message: 'Your payment and documents were received. A visa officer is reviewing the application.', createdAt: '2026-08-26T12:06:00.000Z' }],
    events: [
      { type: 'PAYMENT_RECEIVED', title: 'Payment received', description: 'Your demo payment was received.', actor: 'applicant', createdAt: '2026-08-26T12:06:00.000Z' },
      { type: 'UNDER_REVIEW', title: 'Application entered review', description: 'A visa officer is reviewing your application.', actor: 'system', createdAt: '2026-08-26T12:10:00.000Z' },
    ],
  },
  'IND-EV-26-DEMO04': {
    publicId: 'IND-EV-26-DEMO04', status: 'DOCUMENT_REUPLOAD_REQUIRED', email: 'kenji.sato@example.test', nationality: 'Japan', visaType: 'e-business', proposedArrival: '2026-09-28', applicantName: 'Kenji Sato', dob: '1985-05-22', passportNumber: 'TR4901812', version: 11, createdAt: '2026-08-19T08:00:00.000Z', updatedAt: '2026-08-27T16:10:00.000Z', submittedAt: '2026-08-24T10:00:00.000Z',
    sectionsJson: String.raw`{"visa":{"nationality":"Japan","visaCategory":"Business","visaSubtype":"e-business","purpose":"Business meetings","proposedArrival":"2026-09-28","arrivalPort":"Delhi International Airport"},"personal":{"surname":"Sato","givenNames":"Kenji","gender":"Male","dob":"1985-05-22","birthCity":"Osaka","birthCountry":"Japan","citizenship":"Japan","religion":"Not stated","identificationMarks":"None","education":"University"},"passport":{"passportNumber":"TR4901812","passportType":"Ordinary","issuingCountry":"Japan","placeOfIssue":"Osaka","issueDate":"2018-01-12","expiryDate":"2028-01-11"},"contact":{"address1":"3-4 Namba","city":"Osaka","state":"Osaka","postalCode":"542-0076","country":"Japan","email":"kenji.sato@example.test","mobile":"+81 6 5555 0100"},"family":{"fatherName":"Hiroshi Sato","fatherNationality":"Japan","motherName":"Yuki Sato","motherNationality":"Japan","maritalStatus":"Married"},"employment":{"occupation":"Engineer","employer":"Sato Robotics","designation":"Project Lead","employerAddress":"3-4 Namba, Osaka","employerPhone":"+81 6 5555 0101","industry":"Technology"},"travel":{"expectedArrival":"2026-09-28","expectedDeparture":"2026-10-06","arrivalPort":"Delhi International Airport","places":"Delhi and Gurugram","accommodationName":"Civic Square Hotel","accommodationAddress":"Connaught Place, New Delhi","indiaReference":"Arjun Rao","indiaReferencePhone":"+91 11 5555 0101","homeReferenceName":"Yuki Sato","homeReferenceRelationship":"Spouse","homeReferencePhone":"+81 6 5555 0102","homeReferenceAddress":"3-4 Namba, Osaka"},"background":{"visaRefusal":"No","deportation":"No","conviction":"No","immigrationViolation":"No","restrictedTravel":"No","declaration":true}}`,
    documents: [
      { documentType: 'photograph', objectKey: 'applications/4/photograph/demo-kenji.jpg', originalFilename: 'kenji-photo.jpg', mimeType: 'image/jpeg', sizeBytes: 198400, status: 'ACCEPTED', uploadedAt: '2026-08-24T10:10:00.000Z', reviewedAt: '2026-08-26T11:00:00.000Z', version: 1 },
      { documentType: 'passport', objectKey: 'applications/4/passport/demo-kenji.pdf', originalFilename: 'kenji-passport.pdf', mimeType: 'application/pdf', sizeBytes: 390200, status: 'REUPLOAD_REQUIRED', rejectionReason: 'The lower edge of the passport bio page is cropped.', uploadedAt: '2026-08-24T10:11:00.000Z', reviewedAt: '2026-08-27T16:00:00.000Z', version: 1 },
      { documentType: 'business-letter', objectKey: 'applications/4/business-letter/demo-kenji.pdf', originalFilename: 'employer-letter.pdf', mimeType: 'application/pdf', sizeBytes: 299200, status: 'ACCEPTED', uploadedAt: '2026-08-24T10:12:00.000Z', reviewedAt: '2026-08-26T11:00:00.000Z', version: 1 },
      { documentType: 'invitation-letter', objectKey: 'applications/4/invitation-letter/demo-kenji.pdf', originalFilename: 'invitation-letter.pdf', mimeType: 'application/pdf', sizeBytes: 280200, status: 'ACCEPTED', uploadedAt: '2026-08-24T10:13:00.000Z', reviewedAt: '2026-08-26T11:00:00.000Z', version: 1 },
    ],
    payment: { amount: 51, currency: 'USD', provider: 'Demo payment', status: 'SUCCESS', transactionReference: 'DEMO-DEMO04-2F71B8', createdAt: '2026-08-24T10:00:00.000Z', updatedAt: '2026-08-24T10:02:00.000Z' },
    notifications: [{ type: 'DOCUMENT_REUPLOAD_REQUIRED', title: 'Replace your passport scan', message: 'The lower edge of the passport bio page is cropped. Upload a clearer scan.', createdAt: '2026-08-27T16:00:00.000Z' }],
    events: [{ type: 'DOCUMENT_REUPLOAD_REQUESTED', title: 'Document replacement requested', description: 'The passport bio page needs to be replaced: the lower edge is cropped.', actor: 'Visa Review Officer', createdAt: '2026-08-27T16:00:00.000Z' }],
  },
  'IND-EV-26-DEMO05': {
    publicId: 'IND-EV-26-DEMO05', status: 'GRANTED', email: 'amelia.wilson@example.test', nationality: 'Australia', visaType: 'e-tourist', proposedArrival: '2026-09-12', applicantName: 'Amelia Wilson', dob: '1990-07-10', passportNumber: 'N8406713', version: 13, createdAt: '2026-08-10T08:00:00.000Z', updatedAt: '2026-08-22T14:00:00.000Z', submittedAt: '2026-08-15T14:00:00.000Z',
    sectionsJson: String.raw`{"visa":{"nationality":"Australia","visaCategory":"Tourism","visaSubtype":"e-tourist","purpose":"Holiday","proposedArrival":"2026-09-12","arrivalPort":"Goa International Airport"},"personal":{"surname":"Wilson","givenNames":"Amelia","gender":"Female","dob":"1990-07-10","birthCity":"Melbourne","birthCountry":"Australia","citizenship":"Australia","religion":"Not stated","identificationMarks":"None","education":"University"},"passport":{"passportNumber":"N8406713","passportType":"Ordinary","issuingCountry":"Australia","placeOfIssue":"Melbourne","issueDate":"2021-03-02","expiryDate":"2031-03-01"},"contact":{"address1":"21 Swanston Street","city":"Melbourne","state":"Victoria","postalCode":"3000","country":"Australia","email":"amelia.wilson@example.test","mobile":"+61 3 5555 0100"},"family":{"fatherName":"Thomas Wilson","fatherNationality":"Australia","motherName":"Grace Wilson","motherNationality":"Australia","maritalStatus":"Single"},"employment":{"occupation":"Architect","employer":"Wilson Studio","designation":"Architect","employerAddress":"21 Swanston Street, Melbourne","employerPhone":"+61 3 5555 0101","industry":"Design"},"travel":{"expectedArrival":"2026-09-12","expectedDeparture":"2026-09-23","arrivalPort":"Goa International Airport","places":"Goa and Bengaluru","accommodationName":"Palm Courtyard","accommodationAddress":"Panjim, Goa","indiaReference":"Neha Shah","indiaReferencePhone":"+91 832 555 0101","homeReferenceName":"Grace Wilson","homeReferenceRelationship":"Mother","homeReferencePhone":"+61 3 5555 0102","homeReferenceAddress":"21 Swanston Street, Melbourne"},"background":{"visaRefusal":"No","deportation":"No","conviction":"No","immigrationViolation":"No","restrictedTravel":"No","declaration":true}}`,
    documents: [
      { documentType: 'photograph', objectKey: 'applications/5/photograph/demo-amelia.jpg', originalFilename: 'amelia-photo.jpg', mimeType: 'image/jpeg', sizeBytes: 195100, status: 'ACCEPTED', uploadedAt: '2026-08-15T14:10:00.000Z', reviewedAt: '2026-08-18T10:00:00.000Z', version: 1 },
      { documentType: 'passport', objectKey: 'applications/5/passport/demo-amelia.pdf', originalFilename: 'amelia-passport.pdf', mimeType: 'application/pdf', sizeBytes: 428200, status: 'ACCEPTED', uploadedAt: '2026-08-15T14:11:00.000Z', reviewedAt: '2026-08-18T10:00:00.000Z', version: 1 },
    ],
    payment: { amount: 43, currency: 'USD', provider: 'Demo payment', status: 'SUCCESS', transactionReference: 'DEMO-DEMO05-6C41D0', createdAt: '2026-08-15T13:50:00.000Z', updatedAt: '2026-08-15T13:52:00.000Z' },
    notifications: [{ type: 'VISA_GRANTED', title: 'Your e-Visa has been granted', message: 'Your ETA is ready to view and print.', createdAt: '2026-08-22T14:00:00.000Z' }],
    events: [{ type: 'VISA_GRANTED', title: 'Visa granted', description: 'Your e-Visa was granted and the ETA is ready.', actor: 'Visa Review Officer', createdAt: '2026-08-22T14:00:00.000Z' }],
    eta: { etaNumber: 'ETA-DEMO05-7H4K2P', grantedAt: '2026-08-22', validFrom: '2026-09-12', validUntil: '2027-09-11', entries: 'Double', conditions: 'Carry your ETA and passport when travelling.' },
  },
  'IND-EV-26-DEMO06': {
    publicId: 'IND-EV-26-DEMO06', status: 'REJECTED', email: 'omar.almansoori@example.test', nationality: 'United Arab Emirates', visaType: 'e-conference', proposedArrival: '2026-09-05', applicantName: 'Omar Al Mansoori', dob: '1983-12-04', passportNumber: 'A7843021', version: 9, createdAt: '2026-08-05T08:00:00.000Z', updatedAt: '2026-08-21T10:30:00.000Z', submittedAt: '2026-08-12T13:00:00.000Z', rejectionReason: 'Background information did not meet the mock review criteria.',
    sectionsJson: String.raw`{"visa":{"nationality":"United Arab Emirates","visaCategory":"Events","visaSubtype":"e-conference","purpose":"Conference","proposedArrival":"2026-09-05","arrivalPort":"Mumbai International Airport"},"personal":{"surname":"Al Mansoori","givenNames":"Omar","gender":"Male","dob":"1983-12-04","birthCity":"Dubai","birthCountry":"United Arab Emirates","citizenship":"United Arab Emirates","religion":"Not stated","identificationMarks":"None","education":"University"},"passport":{"passportNumber":"A7843021","passportType":"Ordinary","issuingCountry":"United Arab Emirates","placeOfIssue":"Dubai","issueDate":"2017-09-10","expiryDate":"2027-09-09"},"contact":{"address1":"45 Al Wasl Road","city":"Dubai","state":"Dubai","postalCode":"00000","country":"United Arab Emirates","email":"omar.almansoori@example.test","mobile":"+971 4 555 0100"},"family":{"fatherName":"Ahmed Al Mansoori","fatherNationality":"United Arab Emirates","motherName":"Fatima Al Mansoori","motherNationality":"United Arab Emirates","maritalStatus":"Married"},"employment":{"occupation":"Consultant","employer":"Gulf Events LLC","designation":"Director","employerAddress":"45 Al Wasl Road, Dubai","employerPhone":"+971 4 555 0101","industry":"Events"},"travel":{"expectedArrival":"2026-09-05","expectedDeparture":"2026-09-10","arrivalPort":"Mumbai International Airport","places":"Mumbai","accommodationName":"Harbour View Hotel","accommodationAddress":"Colaba, Mumbai","indiaReference":"Priya Menon","indiaReferencePhone":"+91 22 5555 0101","homeReferenceName":"Fatima Al Mansoori","homeReferenceRelationship":"Mother","homeReferencePhone":"+971 4 555 0102","homeReferenceAddress":"45 Al Wasl Road, Dubai"},"background":{"visaRefusal":"No","deportation":"No","conviction":"Yes","immigrationViolation":"No","restrictedTravel":"No","declaration":true}}`,
    documents: [
      { documentType: 'photograph', objectKey: 'applications/6/photograph/demo-omar.jpg', originalFilename: 'omar-photo.jpg', mimeType: 'image/jpeg', sizeBytes: 205400, status: 'ACCEPTED', uploadedAt: '2026-08-12T13:10:00.000Z', reviewedAt: '2026-08-15T10:00:00.000Z', version: 1 },
      { documentType: 'passport', objectKey: 'applications/6/passport/demo-omar.pdf', originalFilename: 'omar-passport.pdf', mimeType: 'application/pdf', sizeBytes: 436000, status: 'ACCEPTED', uploadedAt: '2026-08-12T13:11:00.000Z', reviewedAt: '2026-08-15T10:00:00.000Z', version: 1 },
      { documentType: 'conference-invitation', objectKey: 'applications/6/conference-invitation/demo-omar.pdf', originalFilename: 'conference-invitation.pdf', mimeType: 'application/pdf', sizeBytes: 305000, status: 'ACCEPTED', uploadedAt: '2026-08-12T13:12:00.000Z', reviewedAt: '2026-08-15T10:00:00.000Z', version: 1 },
    ],
    payment: { amount: 63, currency: 'USD', provider: 'Demo payment', status: 'SUCCESS', transactionReference: 'DEMO-DEMO06-5D21AF', createdAt: '2026-08-12T12:50:00.000Z', updatedAt: '2026-08-12T12:52:00.000Z' },
    notifications: [{ type: 'VISA_REJECTED', title: 'Application decision', message: 'A decision has been recorded for your application.', createdAt: '2026-08-21T10:30:00.000Z' }],
    events: [{ type: 'VISA_REJECTED', title: 'Application decision recorded', description: 'Background information did not meet the mock review criteria.', actor: 'Visa Review Officer', createdAt: '2026-08-21T10:30:00.000Z' }],
  },
}

export function isDemoPublicId(value: string): value is (typeof DEMO_PUBLIC_IDS)[number] {
  return (DEMO_PUBLIC_IDS as readonly string[]).includes(value)
}

export function assertDemoResetTarget(value: string) {
  const publicId = value.trim()
  if (!isDemoPublicId(publicId)) throw new HttpError(403, 'DEMO_RESET_ONLY', 'Only the six seeded demonstration records can be reset.')
  return publicId
}

export function getDemoResetSnapshot(value: string) {
  return snapshots[assertDemoResetTarget(value)]
}

const childTables = ['application_sections', 'applicants', 'passports', 'addresses', 'family_details', 'employment_details', 'travel_details', 'visa_details', 'background_answers', 'documents', 'payments', 'notifications', 'application_events', 'etas'] as const
const sectionTables: Record<string, string> = { contact: 'addresses', family: 'family_details', employment: 'employment_details', travel: 'travel_details', visa: 'visa_details', background: 'background_answers' }

function nullable(value: unknown) { return value === undefined || value === null || value === '' ? null : String(value) }

function snapshotStatements(db: Database, applicationId: number, snapshot: DemoResetSnapshot) {
  const sections = safeJsonParse<StoredSections>(snapshot.sectionsJson, {})
  const statements: D1PreparedStatement[] = childTables.map((table) => db.prepare(`DELETE FROM ${table} WHERE application_id = ?`).bind(applicationId))
  statements.push(db.prepare(`UPDATE applications SET status = ?, email = ?, nationality = ?, visa_type_id = ?, proposed_arrival = ?, applicant_name = ?, dob = ?, passport_number = ?, sections_json = ?, version = ?, created_at = ?, updated_at = ?, submitted_at = ?, rejection_reason = ? WHERE id = ? AND public_id = ?`).bind(snapshot.status, snapshot.email, snapshot.nationality, snapshot.visaType, snapshot.proposedArrival, snapshot.applicantName, snapshot.dob, snapshot.passportNumber, snapshot.sectionsJson, snapshot.version, snapshot.createdAt, snapshot.updatedAt, snapshot.submittedAt ?? null, snapshot.rejectionReason ?? null, applicationId, snapshot.publicId))

  for (const [section, data] of Object.entries(sections)) {
    statements.push(db.prepare('INSERT INTO application_sections (application_id, section, data_json, updated_at) VALUES (?, ?, ?, ?)').bind(applicationId, section, JSON.stringify(data), snapshot.updatedAt))
  }

  const personal = sections.personal ?? {}
  const passport = sections.passport ?? {}
  statements.push(db.prepare(`INSERT INTO applicants (application_id, surname, given_names, gender, birth_city, birth_country, citizenship, religion, identification_marks, education, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(applicationId, nullable(personal.surname), nullable(personal.givenNames), nullable(personal.gender), nullable(personal.birthCity), nullable(personal.birthCountry), nullable(personal.citizenship), nullable(personal.religion), nullable(personal.identificationMarks), nullable(personal.education), JSON.stringify(personal), snapshot.updatedAt))
  statements.push(db.prepare(`INSERT INTO passports (application_id, passport_number, passport_type, issuing_country, place_of_issue, issue_date, expiry_date, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(applicationId, nullable(passport.passportNumber), nullable(passport.passportType), nullable(passport.issuingCountry), nullable(passport.placeOfIssue), nullable(passport.issueDate), nullable(passport.expiryDate), JSON.stringify(passport), snapshot.updatedAt))

  for (const [section, table] of Object.entries(sectionTables)) {
    if (!sections[section]) continue
    statements.push(db.prepare(`INSERT INTO ${table} (application_id, data_json, updated_at) VALUES (?, ?, ?)`).bind(applicationId, JSON.stringify(sections[section]), snapshot.updatedAt))
  }

  for (const document of snapshot.documents) {
    statements.push(db.prepare(`INSERT INTO documents (application_id, document_type, object_key, original_filename, mime_type, size_bytes, status, rejection_reason, uploaded_at, reviewed_at, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(applicationId, document.documentType, document.objectKey, document.originalFilename, document.mimeType, document.sizeBytes, document.status, document.rejectionReason ?? null, document.uploadedAt, document.reviewedAt ?? null, document.version))
  }
  if (snapshot.payment) {
    statements.push(db.prepare(`INSERT INTO payments (application_id, amount, currency, provider, status, transaction_reference, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(applicationId, snapshot.payment.amount, snapshot.payment.currency, snapshot.payment.provider, snapshot.payment.status, snapshot.payment.transactionReference ?? null, snapshot.payment.createdAt, snapshot.payment.updatedAt))
  }
  for (const notification of snapshot.notifications) {
    statements.push(db.prepare('INSERT INTO notifications (application_id, type, title, message, created_at) VALUES (?, ?, ?, ?, ?)').bind(applicationId, notification.type, notification.title, notification.message, notification.createdAt))
  }
  for (const event of snapshot.events) {
    statements.push(db.prepare('INSERT INTO application_events (application_id, type, title, description, actor, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(applicationId, event.type, event.title, event.description, event.actor, event.createdAt))
  }
  if (snapshot.eta) {
    statements.push(db.prepare('INSERT INTO etas (application_id, eta_number, granted_at, valid_from, valid_until, entries, conditions) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(applicationId, snapshot.eta.etaNumber, snapshot.eta.grantedAt, snapshot.eta.validFrom, snapshot.eta.validUntil, snapshot.eta.entries, snapshot.eta.conditions))
  }
  return statements
}

export async function resetDemoApplication(db: Database, bucket: Bucket | undefined, key: string): Promise<Application> {
  const publicId = assertDemoResetTarget(key)
  const snapshot = getDemoResetSnapshot(publicId)
  const current = await requireApplicationRow(db, publicId)
  const oldDocuments = await db.prepare('SELECT object_key FROM documents WHERE application_id = ? AND object_key IS NOT NULL').bind(current.id).all<{ object_key: string }>()
  const retainedKeys = new Set(snapshot.documents.map((document) => document.objectKey))
  await db.batch(snapshotStatements(db, current.id, snapshot))
  if (bucket) {
    for (const row of oldDocuments.results ?? []) {
      if (retainedKeys.has(row.object_key)) continue
      try { await bucket.delete(row.object_key) } catch { /* A missing demo object does not block a database reset. */ }
    }
  }
  return applicationFromBundle(await getApplicationBundle(db, publicId))
}
