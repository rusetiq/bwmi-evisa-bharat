import { calculateVisaFee } from '@/lib/domain'
import { HttpError, parseDate } from '../http'
import type { AppEnv, VisaTypeRow } from '../types'
import { eligibilitySchema } from '../validation'
import { listVisaTypeRows } from '../db/queries'

type Database = AppEnv['Bindings']['DB']

export type EligibilityRule = {
  nationality: string
  passportTypes: string[]
  supportedVisaTypes: string[]
  minDaysBeforeArrival: number
  maxDaysBeforeArrival: number
  restrictions: string[]
}

export type EligibilityInput = {
  nationality: string
  passportType: string
  purpose: string
  expectedArrival: string
  intendedLength: number | string
}

export type EligibilityResult = {
  eligible: boolean
  recommendedVisa: string
  visaType: string
  intendedLength: number
  expectedArrival: string
  reason: string
  fee?: ReturnType<typeof calculateVisaFee>
  visa?: { slug: string; name: string; entries: string; validity: string; documents: string[] }
  earliestApplicationDate?: string
  latestApplicationDate?: string
}

const fallbackRules: EligibilityRule[] = ['Australia', 'Canada', 'France', 'Germany', 'Japan', 'Singapore', 'United Arab Emirates', 'United Kingdom', 'United States'].map((nationality) => ({ nationality, passportTypes: ['ordinary'], supportedVisaTypes: ['e-tourist', 'e-business', 'e-conference', 'e-medical', 'e-medical-attendant', 'e-student'], minDaysBeforeArrival: 4, maxDaysBeforeArrival: 365, restrictions: [] }))

function normalize(value: string) { return value.trim().toLowerCase() }

function visaForPurpose(purpose: string) {
  const value = normalize(purpose)
  if (value.includes('business') || value.includes('trade') || value.includes('meeting')) return 'e-business'
  if (value.includes('medical') || value.includes('treatment')) return 'e-medical'
  if (value.includes('conference') || value.includes('seminar') || value.includes('event')) return 'e-conference'
  if (value.includes('student') || value.includes('study') || value.includes('course')) return 'e-student'
  return 'e-tourist'
}

function toDays(value: string | number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

function ruleMatchesNationality(rule: EligibilityRule, nationality: string) { return normalize(rule.nationality) === normalize(nationality) }
function passportMatches(rule: EligibilityRule, passportType: string) {
  const candidate = normalize(passportType).replace(/\s+passport$/, '')
  return rule.passportTypes.some((item) => normalize(item).replace(/\s+passport$/, '') === candidate)
}

export function calculateEligibility(input: EligibilityInput, rules: EligibilityRule[] = fallbackRules, visaTypes: VisaTypeRow[] = []): EligibilityResult {
  const expectedArrival = parseDate(input.expectedArrival)
  const recommendedVisa = visaForPurpose(input.purpose)
  const length = toDays(input.intendedLength)
  const base = { recommendedVisa, visaType: recommendedVisa, intendedLength: length, expectedArrival: input.expectedArrival }
  if (!expectedArrival) return { eligible: false, ...base, reason: 'Enter a valid expected arrival date so we can check the application window.' }
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  const daysBeforeArrival = Math.ceil((expectedArrival.getTime() - now.getTime()) / 86_400_000)
  const rule = rules.find((candidate) => ruleMatchesNationality(candidate, input.nationality))
  if (!rule) return { eligible: false, ...base, reason: 'This nationality is not included in the mock e-Visa rules. You may need a regular visa or additional guidance.' }
  if (!passportMatches(rule, input.passportType)) return { eligible: false, ...base, reason: 'The mock e-Visa route supports ordinary passports for this nationality. Other passport types may require regular visa guidance.' }
  if (!rule.supportedVisaTypes.includes(recommendedVisa)) return { eligible: false, ...base, reason: 'This purpose is not included in the mock e-Visa rules for the selected nationality.' }
  if (daysBeforeArrival < rule.minDaysBeforeArrival) return { eligible: false, ...base, reason: 'The expected arrival date is too soon for the mock online application window.' }
  if (daysBeforeArrival > rule.maxDaysBeforeArrival) return { eligible: false, ...base, reason: 'The expected arrival date is outside the mock online application window.' }
  const fee = calculateVisaFee(rule.nationality, recommendedVisa)
  const visa = visaTypes.find((candidate) => candidate.slug === recommendedVisa)
  return { eligible: true, ...base, fee, visa: visa ? { slug: visa.slug, name: visa.name, entries: visa.entries, validity: visa.validity, documents: parseList(visa.documents_json) } : undefined, reason: 'Based on these answers, you can continue with a mock online e-Visa application.', earliestApplicationDate: new Date(now.getTime() + rule.minDaysBeforeArrival * 86_400_000).toISOString().slice(0, 10), latestApplicationDate: new Date(now.getTime() + rule.maxDaysBeforeArrival * 86_400_000).toISOString().slice(0, 10) }
}

export async function loadEligibilityRules(db: Database): Promise<EligibilityRule[]> {
  try {
    const result = await db.prepare('SELECT nationality, passport_types_json, supported_visa_types_json, min_days_before_arrival, max_days_before_arrival, restrictions_json FROM eligibility_rules ORDER BY nationality').all<{ nationality: string; passport_types_json: string; supported_visa_types_json: string; min_days_before_arrival: number; max_days_before_arrival: number; restrictions_json: string }>()
    if (!result.results?.length) return fallbackRules
    return result.results.map((row) => ({ nationality: row.nationality, passportTypes: parseList(row.passport_types_json), supportedVisaTypes: parseList(row.supported_visa_types_json), minDaysBeforeArrival: row.min_days_before_arrival, maxDaysBeforeArrival: row.max_days_before_arrival, restrictions: parseList(row.restrictions_json) }))
  } catch {
    return fallbackRules
  }
}

function parseList(value: string) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [] } catch { return [] }
}

export async function checkEligibility(db: Database, rawInput: unknown) {
  const candidate = rawInput && typeof rawInput === 'object' ? rawInput as Record<string, unknown> : {}
  const input = eligibilitySchema.parse({ ...candidate, expectedArrival: candidate.expectedArrival ?? candidate.arrivalDate, intendedLength: candidate.intendedLength ?? candidate.lengthOfStay ?? candidate.visitLength })
  const [rules, visaTypes] = await Promise.all([loadEligibilityRules(db), listVisaTypeRows(db)])
  return calculateEligibility(input, rules, visaTypes)
}

export function assertEligibilityInput(input: unknown): EligibilityInput {
  const parsed = eligibilitySchema.safeParse(input)
  if (!parsed.success) throw new HttpError(422, 'VALIDATION_ERROR', 'Answer each eligibility question to continue.')
  return parsed.data
}
