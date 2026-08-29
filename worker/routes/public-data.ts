import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { ok } from '../http'
import { listEntryPointRows, listVisaTypeRows } from '../db/queries'
import { safeJsonParse } from '../http'

export const publicDataRoutes = new Hono<AppEnv>()

const fallbackVisaTypes = [
  { slug: 'e-tourist', name: 'e-Tourist Visa', category: 'Tourism', description: 'For holidays, sightseeing and casual visits with friends or family.', commonUses: 'Tourism, recreation, short yoga programmes', validity: '30 days or 1 year', entries: 'Double or multiple', feeUsd: 40, processing: 'Usually 3–5 days', documents: ['Photograph', 'Passport bio page'] },
  { slug: 'e-business', name: 'e-Business Visa', category: 'Business', description: 'For meetings, trade activity and establishing business contacts.', commonUses: 'Meetings, sales, trade fairs', validity: '1 year', entries: 'Multiple', feeUsd: 80, processing: 'Usually 3–5 days', documents: ['Photograph', 'Passport bio page', 'Business card or employer letter', 'Invitation letter'] },
  { slug: 'e-medical', name: 'e-Medical Visa', category: 'Medical', description: 'For short-term medical treatment at a recognised hospital.', commonUses: 'Treatment and medical consultation', validity: '60 days', entries: 'Triple', feeUsd: 80, processing: 'Usually 3–5 days', documents: ['Photograph', 'Passport bio page', 'Hospital letter'] },
  { slug: 'e-medical-attendant', name: 'e-Medical Attendant Visa', category: 'Medical', description: 'For eligible family members accompanying an e-Medical applicant.', commonUses: 'Accompanying a patient', validity: '60 days', entries: 'Triple', feeUsd: 80, processing: 'Usually 3–5 days', documents: ['Photograph', 'Passport bio page', 'Patient visa reference'] },
  { slug: 'e-conference', name: 'e-Conference Visa', category: 'Events', description: 'For attending approved conferences, seminars and workshops.', commonUses: 'Conferences and seminars', validity: '30 days', entries: 'Single', feeUsd: 60, processing: 'Usually 4–7 days', documents: ['Photograph', 'Passport bio page', 'Conference invitation'] },
  { slug: 'e-student', name: 'e-Student Visa', category: 'Study', description: 'A demonstration category for eligible short-term study programmes.', commonUses: 'Short courses and exchange programmes', validity: 'Up to 1 year', entries: 'Multiple', feeUsd: 70, processing: 'Usually 5–8 days', documents: ['Photograph', 'Passport bio page', 'Admission letter'] },
]

const fallbackEntryPoints = [
  ...['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kochi', 'Kolkata', 'Ahmedabad', 'Goa'].map((city) => ({ name: `${city} International Airport`, city, category: 'Airport' as const })),
  ...['Mumbai', 'Chennai', 'Cochin', 'New Mangalore'].map((city) => ({ name: `${city} Seaport`, city, category: 'Seaport' as const })),
  { name: 'Attari–Wagah', city: 'Attari', category: 'Land' as const },
  ...['Attari', 'Gede', 'Haridaspur', 'Munabao', 'Chitpur'].map((city) => ({ name: `${city} Rail Check Post`, city, category: 'Rail' as const })),
]

publicDataRoutes.get('/', async (c) => {
  const [visaRows, entryRows] = await Promise.all([listVisaTypeRows(c.env.DB), listEntryPointRows(c.env.DB)])
  const visaTypes = visaRows.length ? visaRows.map((row) => ({ slug: row.slug, name: row.name, category: row.category, description: row.description, commonUses: row.common_uses, validity: row.validity, entries: row.entries, feeUsd: row.fee_usd, processing: row.processing, documents: safeJsonParse<string[]>(row.documents_json, []) })) : fallbackVisaTypes
  const entryPoints = entryRows.length ? entryRows.map((row) => ({ name: row.name, category: row.category as 'Airport' | 'Seaport' | 'Land' | 'Rail', city: row.city })) : fallbackEntryPoints
  return c.json({ ok: true as const, data: { visaTypes, entryPoints } })
})
