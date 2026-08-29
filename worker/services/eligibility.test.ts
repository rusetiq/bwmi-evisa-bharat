import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { calculateEligibility, assertEligibilityInput, type EligibilityRule } from './eligibility'
import { HttpError } from '../http'
import type { VisaTypeRow } from '../types'

const fixedToday = '2026-08-29'
const rule: EligibilityRule = {
  nationality: 'Japan',
  passportTypes: ['ordinary'],
  supportedVisaTypes: ['e-tourist', 'e-business', 'e-medical', 'e-conference', 'e-student'],
  minDaysBeforeArrival: 4,
  maxDaysBeforeArrival: 365,
  restrictions: [],
}

const businessVisa: VisaTypeRow = {
  slug: 'e-business',
  name: 'e-Business Visa',
  category: 'Business',
  description: 'Business travel',
  common_uses: 'Meetings',
  validity: '1 year',
  entries: 'Multiple',
  fee_usd: 80,
  processing: '3–5 days',
  documents_json: '["Photograph","Invitation letter"]',
}

function dateInDays(days: number) {
  const date = new Date(`${fixedToday}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

beforeAll(() => {
  vi.useFakeTimers({ now: new Date(`${fixedToday}T12:00:00.000Z`) })
})

afterAll(() => {
  vi.useRealTimers()
})

describe('eligibility calculation', () => {
  it('matches nationality and passport case-insensitively and recommends the purpose route', () => {
    const result = calculateEligibility({
      nationality: ' japan ',
      passportType: 'Ordinary passport',
      purpose: 'Business meeting',
      expectedArrival: dateInDays(30),
      intendedLength: '30',
    }, [rule], [businessVisa])

    expect(result.eligible).toBe(true)
    expect(result.recommendedVisa).toBe('e-business')
    expect(result.visaType).toBe('e-business')
    expect(result.intendedLength).toBe(30)
    expect(result.fee).toEqual({ visaFee: 48, transactionCharge: 3, total: 51, currency: 'USD' })
    expect(result.visa).toEqual({
      slug: 'e-business',
      name: 'e-Business Visa',
      entries: 'Multiple',
      validity: '1 year',
      documents: ['Photograph', 'Invitation letter'],
    })
    expect(result.earliestApplicationDate).toBe(dateInDays(4))
    expect(result.latestApplicationDate).toBe(dateInDays(365))
  })

  it('maps medical, conference, study and general purposes to their visa types', () => {
    const purposes = [
      ['Medical treatment', 'e-medical'],
      ['Conference seminar', 'e-conference'],
      ['Short study course', 'e-student'],
      ['Holiday with family', 'e-tourist'],
    ] as const

    for (const [purpose, expectedVisa] of purposes) {
      const result = calculateEligibility({ nationality: 'Japan', passportType: 'ordinary', purpose, expectedArrival: dateInDays(10), intendedLength: 10 }, [rule])
      expect(result.recommendedVisa).toBe(expectedVisa)
    }
  })

  it('rejects malformed dates and rule violations with a useful reason', () => {
    const invalidDate = calculateEligibility({ nationality: 'Japan', passportType: 'ordinary', purpose: 'tourism', expectedArrival: 'not-a-date', intendedLength: 10 }, [rule])
    expect(invalidDate.eligible).toBe(false)
    expect(invalidDate.reason).toContain('valid expected arrival date')

    const unknownNationality = calculateEligibility({ nationality: 'Canada', passportType: 'ordinary', purpose: 'tourism', expectedArrival: dateInDays(10), intendedLength: 10 }, [rule])
    expect(unknownNationality.eligible).toBe(false)
    expect(unknownNationality.reason).toContain('nationality')

    const unsupportedPassport = calculateEligibility({ nationality: 'Japan', passportType: 'diplomatic', purpose: 'tourism', expectedArrival: dateInDays(10), intendedLength: 10 }, [rule])
    expect(unsupportedPassport.eligible).toBe(false)
    expect(unsupportedPassport.reason).toContain('ordinary passports')

    const unsupportedPurpose = calculateEligibility({ nationality: 'Japan', passportType: 'ordinary', purpose: 'medical treatment', expectedArrival: dateInDays(10), intendedLength: 10 }, [{ ...rule, supportedVisaTypes: ['e-tourist'] }])
    expect(unsupportedPurpose.eligible).toBe(false)
    expect(unsupportedPurpose.reason).toContain('purpose')

    const tooSoon = calculateEligibility({ nationality: 'Japan', passportType: 'ordinary', purpose: 'tourism', expectedArrival: dateInDays(3), intendedLength: 10 }, [rule])
    expect(tooSoon.eligible).toBe(false)
    expect(tooSoon.reason).toContain('too soon')

    const tooLate = calculateEligibility({ nationality: 'Japan', passportType: 'ordinary', purpose: 'tourism', expectedArrival: dateInDays(366), intendedLength: 10 }, [rule])
    expect(tooLate.eligible).toBe(false)
    expect(tooLate.reason).toContain('outside')
  })
})

describe('eligibility input validation', () => {
  it('accepts the required answers', () => {
    expect(assertEligibilityInput({ nationality: 'Japan', passportType: 'ordinary', purpose: 'tourism', expectedArrival: dateInDays(30), intendedLength: '30' })).toEqual({
      nationality: 'Japan',
      passportType: 'ordinary',
      purpose: 'tourism',
      expectedArrival: dateInDays(30),
      intendedLength: '30',
    })
  })

  it('throws an HTTP validation error when answers are incomplete', () => {
    try {
      assertEligibilityInput({ nationality: 'Japan' })
      throw new Error('expected validation to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError)
      expect(error).toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
    }
  })
})
