import { describe, expect, it } from 'vitest'
import { calculateVisaFee, getRequiredDocuments } from '@/lib/domain'
import { calculateEligibility } from './eligibility'
import { canTransitionStatus, getApplicationProgress, getNextRequiredStep, isApplicationFormComplete } from './applications'
import { etaInput } from './eta'
import { validateDocumentUpload } from './documents'

const completeSections = {
  visa: { nationality: 'United States', visaCategory: 'Tourism', visaSubtype: 'e-tourist', purpose: 'Holiday', proposedArrival: '2099-10-10', arrivalPort: 'Delhi International Airport' },
  personal: { surname: 'Example', givenNames: 'Asha', gender: 'Female', dob: '1996-08-14', birthCity: 'Seattle', birthCountry: 'United States', citizenship: 'United States', religion: 'None', identificationMarks: 'None', education: 'University' },
  passport: { passportNumber: 'P1234567', passportType: 'Ordinary', issuingCountry: 'United States', placeOfIssue: 'Seattle', issueDate: '2019-01-01', expiryDate: '2029-01-01' },
  contact: { address1: '1 Main Street', city: 'Seattle', state: 'Washington', postalCode: '98101', country: 'United States', email: 'asha@example.test', mobile: '+12065550100' },
  family: { fatherName: 'R Example', fatherNationality: 'United States', motherName: 'S Example', motherNationality: 'United States', maritalStatus: 'Single' },
  employment: { occupation: 'Designer', employer: 'Example Co', designation: 'Designer', employerAddress: '1 Main Street', employerPhone: '+12065550101', industry: 'Design' },
  travel: { expectedArrival: '2099-10-10', expectedDeparture: '2099-10-20', arrivalPort: 'Delhi International Airport', places: 'Delhi', accommodationName: 'Demo Hotel', accommodationAddress: 'Delhi', indiaReference: 'Ravi', indiaReferencePhone: '+91115550100', homeReferenceName: 'R Example', homeReferenceRelationship: 'Father', homeReferencePhone: '+12065550102', homeReferenceAddress: '1 Main Street' },
  background: { visaRefusal: false, deportation: false, conviction: false, immigrationViolation: false, restrictedTravel: false, declaration: true },
} as const

describe('application domain', () => {
  it('accepts a complete form even when background answers are false', () => {
    expect(isApplicationFormComplete(completeSections)).toBe(true)
    expect(getNextRequiredStep(completeSections)).toBe('documents')
    expect(getApplicationProgress(completeSections).every((step) => step.complete)).toBe(true)
  })

  it('identifies the next incomplete section', () => {
    expect(getNextRequiredStep({ visa: completeSections.visa })).toBe('personal')
  })

  it('enforces the lifecycle transition', () => {
    expect(canTransitionStatus('PAYMENT_PENDING', 'UNDER_REVIEW')).toBe(true)
    expect(canTransitionStatus('GRANTED', 'UNDER_REVIEW')).toBe(false)
  })
})

describe('eligibility and fees', () => {
  it('recommends a tourist route for an eligible ordinary passport', () => {
    const arrival = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
    const result = calculateEligibility({ nationality: 'United States', passportType: 'Ordinary', purpose: 'Tourism', expectedArrival: arrival, intendedLength: 10 })
    expect(result.eligible).toBe(true)
    expect(result.recommendedVisa).toBe('e-tourist')
  })

  it('calculates nationality-adjusted fees and required documents', () => {
    expect(calculateVisaFee('Japan', 'e-tourist').total).toBe(27)
    expect(getRequiredDocuments('e-business')).toEqual(['photograph', 'passport', 'business-letter', 'invitation-letter'])
  })
})

describe('document and ETA safeguards', () => {
  it('accepts matching mock document types and rejects oversized uploads', () => {
    expect(() => validateDocumentUpload('passport', 'scan.pdf', 'application/pdf', 1000)).not.toThrow()
    expect(() => validateDocumentUpload('passport', 'scan.pdf', 'application/pdf', 10 * 1024 * 1024 + 1)).toThrow()
  })

  it('creates a stable default ETA shape', () => {
    const eta = etaInput({ validFrom: '2026-09-01', validUntil: '2027-08-31' }, 'IND-EV-26-DEMO05')
    expect(eta.etaNumber).toBe('ETA-DEMO05')
    expect(eta.entries).toBe('Multiple')
  })
})
