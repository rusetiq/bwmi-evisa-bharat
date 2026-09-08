import { describe, expect, it } from 'vitest'
import { validateApplicationStep } from '@/lib/applicationValidation'
import { getApplicationProgress } from '@/lib/domain'
import { getApplicationProgress as serverProgress } from './applications'

describe('shared conditional validation', () => {
  it('requires spouse details only when married', () => {
    expect(validateApplicationStep('family', { maritalStatus: 'Single' })).not.toHaveProperty('spouseName')
    expect(validateApplicationStep('family', { maritalStatus: 'Married' })).toHaveProperty('spouseName')
  })
  it('requires permanent address unless the current address is reused', () => {
    expect(validateApplicationStep('contact', { sameAddress: false })).toHaveProperty('permanentAddress1')
    expect(validateApplicationStep('contact', { sameAddress: true })).not.toHaveProperty('permanentAddress1')
  })
  it('requires details for previous names, passports and visits', () => {
    expect(validateApplicationStep('personal', { hasPreviousName: true })).toHaveProperty('previousSurname')
    expect(validateApplicationStep('passport', { hasOtherPassport: true })).toHaveProperty('otherPassportDetails')
    expect(validateApplicationStep('travel', { previousVisit: 'yes' })).toHaveProperty('previousVisaNumber')
  })
  it('uses the visa section to select purpose-specific requirements', () => {
    expect(validateApplicationStep('travel', {}, { visa: { visaCategory: 'Business' } })).toHaveProperty('indianCompany')
    expect(validateApplicationStep('travel', {}, { visa: { visaCategory: 'Tourism' } })).not.toHaveProperty('indianCompany')
  })
  it('handles both legacy boolean and current yes/no background answers', () => {
    expect(validateApplicationStep('background', { conviction: true })).toHaveProperty('convictionDetails')
    expect(validateApplicationStep('background', { conviction: 'yes' })).toHaveProperty('convictionDetails')
    expect(validateApplicationStep('background', { conviction: false })).not.toHaveProperty('convictionDetails')
  })
  it('rejects whitespace, invalid dates and equal arrival/departure dates', () => {
    expect(validateApplicationStep('personal', { surname: '  ', dob: '2026-02-30' })).toHaveProperty('surname')
    expect(validateApplicationStep('personal', { dob: '2026-02-30' })).toHaveProperty('dob')
    expect(validateApplicationStep('travel', { expectedArrival: '2026-10-01', expectedDeparture: '2026-10-01' })).toHaveProperty('expectedDeparture')
  })
  it('keeps frontend and server progress identical for conditional fields', () => {
    const sections = { family: { maritalStatus: 'Married' }, visa: { visaCategory: 'Medical' }, background: { conviction: true } }
    expect(serverProgress(sections)).toEqual(getApplicationProgress(sections))
    expect(serverProgress(sections).find((item) => item.step === 'family')?.complete).toBe(false)
  })
})
