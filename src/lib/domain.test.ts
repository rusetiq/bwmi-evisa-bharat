import { describe, expect, it } from 'vitest'
import {
  applicationSteps,
  calculateVisaFee,
  calculateApplicationFee,
  canTransition,
  getApplicationPrimaryAction,
  getApplicationProgress,
  getNextRequiredStep,
  getRequiredDocuments,
  isStepComplete,
} from './domain'
import type { ApplicationStatus, SectionData } from './types'

const completeSections: Record<string, SectionData> = {
  visa: {
    nationality: 'United States',
    visaCategory: 'Tourism',
    visaSubtype: 'e-tourist-30',
    purpose: 'Holiday',
    proposedArrival: '2026-10-01',
    arrivalPort: 'Delhi International Airport',
  },
  personal: {
    surname: 'Thompson',
    givenNames: 'Maya',
    gender: 'Female',
    dob: '1996-08-14',
    birthCity: 'Boston',
    birthCountry: 'United States',
    citizenship: 'United States',
    religion: 'None',
    identificationMarks: 'None',
    education: 'University',
  },
  passport: {
    passportNumber: 'P1234567',
    passportType: 'Ordinary',
    issuingCountry: 'United States',
    placeOfIssue: 'Boston',
    issueDate: '2021-01-01',
    expiryDate: '2031-01-01',
  },
  contact: {
    sameAddress: true,
    address1: '1 Main Street',
    city: 'Boston',
    state: 'Massachusetts',
    postalCode: '02108',
    country: 'United States',
    email: 'maya@example.com',
    mobile: '+15555550123',
  },
  family: {
    fatherName: 'Alex Thompson',
    fatherNationality: 'United States',
    motherName: 'Jordan Thompson',
    motherNationality: 'United States',
    maritalStatus: 'Single',
  },
  employment: {
    occupation: 'Employed',
    employer: 'Example Inc',
    designation: 'Manager',
    employerAddress: '2 Market Street',
    employerPhone: '+15555550124',
    industry: 'Technology',
  },
  travel: {
    previousVisit: 'no',
    tourLocations: 'Delhi',
    tourActivity: 'Sightseeing',
    expectedArrival: '2026-10-01',
    expectedDeparture: '2026-10-15',
    arrivalPort: 'Delhi International Airport',
    places: 'Delhi and Agra',
    accommodationName: 'Example Hotel',
    accommodationAddress: '3 Lake Road',
    indiaReference: 'Hotel desk',
    indiaReferencePhone: '+911155555555',
    homeReferenceName: 'Alex Thompson',
    homeReferenceRelationship: 'Parent',
    homeReferencePhone: '+15555550125',
    homeReferenceAddress: '1 Main Street, Boston',
  },
  background: {
    visaRefusal: 'no',
    deportation: 'no',
    conviction: 'no',
    immigrationViolation: 'no',
    restrictedTravel: 'no',
    declaration: true,
  },
}

describe('application completion rules', () => {
  it('requires every field in a step and a confirmed declaration', () => {
    expect(isStepComplete('visa', completeSections.visa)).toBe(true)
    expect(isStepComplete('visa', { ...completeSections.visa, arrivalPort: '' })).toBe(false)
    expect(isStepComplete('background', { ...completeSections.background, declaration: false })).toBe(false)
  })

  it('reports the first incomplete step and documents when the form is complete', () => {
    expect(getApplicationProgress(completeSections).every((item) => item.complete)).toBe(true)
    expect(getNextRequiredStep(completeSections)).toBe('documents')

    const sections = { ...completeSections, passport: { ...completeSections.passport, expiryDate: '' } }
    expect(getNextRequiredStep(sections)).toBe('passport')
    expect(applicationSteps).toHaveLength(8)
  })
})

describe('required document rules', () => {
  it('always requires the photograph and passport', () => {
    expect(getRequiredDocuments('e-tourist')).toEqual(['photograph', 'passport'])
    expect(getRequiredDocuments('unknown')).toEqual(['photograph', 'passport'])
  })

  it('adds the visa-specific supporting documents', () => {
    expect(getRequiredDocuments('e-business')).toEqual(['photograph', 'passport', 'business-letter', 'invitation-letter'])
    expect(getRequiredDocuments('e-medical')).toEqual(['photograph', 'passport', 'hospital-letter'])
    expect(getRequiredDocuments('e-student')).toEqual(['photograph', 'passport', 'admission-letter'])
  })
})

describe('visa fee calculation', () => {
  it('uses the saved tourist subtype for checkout and preserves legacy standard fees', () => {
    const app = { nationality: 'United States', visaType: 'e-tourist', sections: completeSections }
    expect(calculateApplicationFee(app).total).toBe(28)
    expect(calculateApplicationFee({ ...app, sections: { visa: { visaSubtype: 'e-tourist-1-year' } } }).total).toBe(43)
    expect(calculateApplicationFee({ ...app, sections: { visa: { visaSubtype: 'e-tourist' } } }).total).toBe(43)
    expect(calculateApplicationFee({ ...app, nationality: 'Japan' }).total).toBe(18)
  })
  it('calculates standard and short tourist fees', () => {
    expect(calculateVisaFee('United States', 'e-tourist')).toEqual({ visaFee: 40, transactionCharge: 3, total: 43, currency: 'USD' })
    expect(calculateVisaFee('United States', 'e-tourist', '30-days')).toEqual({ visaFee: 25, transactionCharge: 3, total: 28, currency: 'USD' })
  })

  it('applies nationality fee multipliers and an unknown visa fallback', () => {
    expect(calculateVisaFee('Japan', 'e-business')).toEqual({ visaFee: 48, transactionCharge: 3, total: 51, currency: 'USD' })
    expect(calculateVisaFee('United Arab Emirates', 'e-tourist')).toEqual({ visaFee: 34, transactionCharge: 3, total: 37, currency: 'USD' })
    expect(calculateVisaFee('Canada', 'not-a-visa')).toEqual({ visaFee: 50, transactionCharge: 3, total: 53, currency: 'USD' })
  })
})

describe('application status transitions', () => {
  it('allows the forward application and review paths', () => {
    const allowed: Array<[ApplicationStatus, ApplicationStatus]> = [
      ['DRAFT', 'READY_TO_SUBMIT'],
      ['READY_TO_SUBMIT', 'SUBMITTED'],
      ['SUBMITTED', 'PAYMENT_PENDING'],
      ['PAYMENT_PENDING', 'UNDER_REVIEW'],
      ['UNDER_REVIEW', 'DOCUMENT_REUPLOAD_REQUIRED'],
      ['UNDER_REVIEW', 'GRANTED'],
      ['UNDER_REVIEW', 'REJECTED'],
      ['DOCUMENT_REUPLOAD_REQUIRED', 'UNDER_REVIEW'],
    ]
    for (const [from, to] of allowed) expect(canTransition(from, to)).toBe(true)
  })

  it('does not reopen final states or move backwards', () => {
    expect(canTransition('DRAFT', 'SUBMITTED')).toBe(false)
    expect(canTransition('UNDER_REVIEW', 'PAYMENT_PENDING')).toBe(false)
    expect(canTransition('GRANTED', 'UNDER_REVIEW')).toBe(false)
    expect(canTransition('REJECTED', 'DRAFT')).toBe(false)
    expect(canTransition('DRAFT', 'DRAFT')).toBe(false)
  })

  it('exposes the appropriate applicant action for each actionable state', () => {
    expect(getApplicationPrimaryAction('DRAFT')).toEqual({ label: 'Continue application', kind: 'continue' })
    expect(getApplicationPrimaryAction('PAYMENT_PENDING')).toEqual({ label: 'Complete payment', kind: 'payment' })
    expect(getApplicationPrimaryAction('DOCUMENT_REUPLOAD_REQUIRED')).toEqual({ label: 'Replace requested document', kind: 'documents' })
    expect(getApplicationPrimaryAction('GRANTED')).toEqual({ label: 'View ETA', kind: 'eta' })
    expect(getApplicationPrimaryAction('REJECTED')).toBeNull()
  })
})
