import { describe, expect, it } from 'vitest'
import { HttpError } from '../http'
import { assertDemoResetTarget, DEMO_PUBLIC_IDS, getDemoResetSnapshot, isDemoPublicId } from './demo'

describe('demo reset targets', () => {
  it('allows only the six seeded public IDs', () => {
    expect(DEMO_PUBLIC_IDS).toHaveLength(6)
    for (const publicId of DEMO_PUBLIC_IDS) {
      expect(isDemoPublicId(publicId)).toBe(true)
      expect(assertDemoResetTarget(publicId)).toBe(publicId)
      expect(getDemoResetSnapshot(publicId).publicId).toBe(publicId)
    }
  })

  it('rejects user-created IDs and numeric database IDs', () => {
    for (const value of ['IND-EV-26-NEWAPP1', '1', 'ind-ev-26-demo01']) {
      expect(() => assertDemoResetTarget(value)).toThrowError(HttpError)
      expect(() => assertDemoResetTarget(value)).toThrow('Only the six seeded demonstration records can be reset.')
    }
  })

  it('keeps the original related state for scenarios that use it', () => {
    const reupload = getDemoResetSnapshot('IND-EV-26-DEMO04')
    expect(reupload.status).toBe('DOCUMENT_REUPLOAD_REQUIRED')
    expect(reupload.documents.find((document) => document.documentType === 'passport')).toMatchObject({ status: 'REUPLOAD_REQUIRED', version: 1 })
    expect(reupload.payment?.status).toBe('SUCCESS')

    const granted = getDemoResetSnapshot('IND-EV-26-DEMO05')
    expect(granted.eta).toMatchObject({ etaNumber: 'ETA-DEMO05-7H4K2P', entries: 'Double' })
  })
})
