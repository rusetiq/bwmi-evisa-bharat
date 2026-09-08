import type { EntryPoint, VisaType } from './types'

export const visaTypes: VisaType[] = [
  { slug: 'e-tourist', name: 'e-Tourist Visa', category: 'Tourism', description: 'For holidays, sightseeing and casual visits with friends or family.', commonUses: 'Tourism, recreation, short yoga programmes', validity: '30 days or 1 year', entries: 'Double or multiple', feeUsd: 40, processing: 'Usually 3–5 days', documents: ['Photograph', 'Passport bio page'] },
  { slug: 'e-business', name: 'e-Business Visa', category: 'Business', description: 'For meetings, trade activity and establishing business contacts.', commonUses: 'Meetings, sales, trade fairs', validity: '1 year', entries: 'Multiple', feeUsd: 80, processing: 'Usually 3–5 days', documents: ['Photograph', 'Passport bio page', 'Business card or employer letter', 'Invitation letter'] },
  { slug: 'e-medical', name: 'e-Medical Visa', category: 'Medical', description: 'For short-term medical treatment at a recognised hospital.', commonUses: 'Treatment and medical consultation', validity: '60 days', entries: 'Triple', feeUsd: 80, processing: 'Usually 3–5 days', documents: ['Photograph', 'Passport bio page', 'Hospital letter'] },
  { slug: 'e-medical-attendant', name: 'e-Medical Attendant Visa', category: 'Medical', description: 'For eligible family members accompanying an e-Medical applicant.', commonUses: 'Accompanying a patient', validity: '60 days', entries: 'Triple', feeUsd: 80, processing: 'Usually 3–5 days', documents: ['Photograph', 'Passport bio page', 'Patient visa reference'] },
  { slug: 'e-conference', name: 'e-Conference Visa', category: 'Events', description: 'For attending approved conferences, seminars and workshops.', commonUses: 'Conferences and seminars', validity: '30 days', entries: 'Single', feeUsd: 60, processing: 'Usually 4–7 days', documents: ['Photograph', 'Passport bio page', 'Conference invitation'] },
  { slug: 'e-student', name: 'e-Student Visa', category: 'Study', description: 'A demonstration category for eligible short-term study programmes.', commonUses: 'Short courses and exchange programmes', validity: 'Up to 1 year', entries: 'Multiple', feeUsd: 70, processing: 'Usually 5–8 days', documents: ['Photograph', 'Passport bio page', 'Admission letter'] },
]

export const entryPoints: EntryPoint[] = [
  ...['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kochi', 'Kolkata', 'Ahmedabad', 'Goa'].map((name) => ({ name: `${name} International Airport`, city: name, category: 'Airport' as const })),
  ...['Mumbai', 'Chennai', 'Cochin', 'New Mangalore'].map((name) => ({ name: `${name} Seaport`, city: name, category: 'Seaport' as const })),
  { name: 'Attari–Wagah', city: 'Attari', category: 'Land' },
  ...['Attari', 'Gede', 'Haridaspur', 'Munabao', 'Chitpur'].map((name) => ({ name: `${name} Rail Check Post`, city: name, category: 'Rail' as const })),
]

export const countries = ['Australia', 'Canada', 'France', 'Germany', 'Japan', 'Singapore', 'United Arab Emirates', 'United Kingdom', 'United States']

export const statusCopy = {
  DRAFT: 'Draft', READY_TO_SUBMIT: 'Ready to submit', SUBMITTED: 'Submitted', PAYMENT_PENDING: 'Payment pending', UNDER_REVIEW: 'Under review', DOCUMENT_REUPLOAD_REQUIRED: 'Action required', GRANTED: 'Granted', REJECTED: 'Decision made',
} as const

export type DemoScenario = {
  publicId: string
  passportNumber: string
  dob: string
  applicant: string
  status: keyof typeof statusCopy
  title: string
  whatYouSee: string
  steps: number
  launchLabel: string
  launchPath: string
}

export const demoScenarios: DemoScenario[] = [
  {
    publicId: 'IND-EV-26-DEMO01', passportNumber: 'P1234567', dob: '1996-08-14', applicant: 'Maya Thompson', status: 'DRAFT',
    title: 'Resume a draft', whatYouSee: 'A partially completed tourist application with autosave and the remaining form steps ready to explore.', steps: 3, launchLabel: 'Resume draft', launchPath: '/find-application?applicationId=IND-EV-26-DEMO01&passport=P1234567&dob=1996-08-14',
  },
  {
    publicId: 'IND-EV-26-DEMO02', passportNumber: 'C01X8831', dob: '1988-02-19', applicant: 'Daniel Weber', status: 'PAYMENT_PENDING',
    title: 'Complete a payment', whatYouSee: 'A submitted business application waiting for a selectable fictional payment outcome.', steps: 2, launchLabel: 'Open payment', launchPath: '/application/IND-EV-26-DEMO02',
  },
  {
    publicId: 'IND-EV-26-DEMO03', passportNumber: '22FV61948', dob: '1992-11-03', applicant: 'Sophie Martin', status: 'UNDER_REVIEW',
    title: 'Follow an application under review', whatYouSee: 'A paid application with received documents, review messaging and a complete event timeline.', steps: 2, launchLabel: 'View review status', launchPath: '/application/IND-EV-26-DEMO03',
  },
  {
    publicId: 'IND-EV-26-DEMO04', passportNumber: 'TR4901812', dob: '1985-05-22', applicant: 'Kenji Sato', status: 'DOCUMENT_REUPLOAD_REQUIRED',
    title: 'Replace a requested document', whatYouSee: 'A business application where the passport scan was flagged and a replacement upload can continue review.', steps: 3, launchLabel: 'Open document request', launchPath: '/application/IND-EV-26-DEMO04',
  },
  {
    publicId: 'IND-EV-26-DEMO05', passportNumber: 'N8406713', dob: '1990-07-10', applicant: 'Amelia Wilson', status: 'GRANTED',
    title: 'View a granted ETA', whatYouSee: 'A finished tourist application with a fictional ETA ready to view, print and verify.', steps: 2, launchLabel: 'View granted ETA', launchPath: '/application/IND-EV-26-DEMO05',
  },
  {
    publicId: 'IND-EV-26-DEMO06', passportNumber: 'A7843021', dob: '1983-12-04', applicant: 'Omar Al Mansoori', status: 'REJECTED',
    title: 'Review a decision', whatYouSee: 'A completed conference application showing a recorded mock decision and reason in its history.', steps: 2, launchLabel: 'View decision', launchPath: '/application/IND-EV-26-DEMO06',
  },
]

export type DemoLookup = [string, string, string, string]

export const demoLookups: DemoLookup[] = demoScenarios.map((scenario) => [
  scenario.publicId,
  scenario.passportNumber,
  scenario.dob,
  `${scenario.applicant} — ${statusCopy[scenario.status].toLowerCase()}`,
])
