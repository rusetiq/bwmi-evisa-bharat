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

export const demoLookups = [
  ['IND-EV-26-DEMO01', 'P1234567', '1996-08-14', 'Maya Thompson — draft'],
  ['IND-EV-26-DEMO02', 'C01X8831', '1988-02-19', 'Daniel Weber — payment pending'],
  ['IND-EV-26-DEMO03', '22FV61948', '1992-11-03', 'Sophie Martin — under review'],
  ['IND-EV-26-DEMO04', 'TR4901812', '1985-05-22', 'Kenji Sato — document replacement'],
  ['IND-EV-26-DEMO05', 'N8406713', '1990-07-10', 'Amelia Wilson — granted'],
  ['IND-EV-26-DEMO06', 'A7843021', '1983-12-04', 'Omar Al Mansoori — decision made'],
]
