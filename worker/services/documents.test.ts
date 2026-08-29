import { describe, expect, it } from 'vitest'
import { requiredDocumentStatus } from './documents'

describe('required document status', () => {
  it('marks missing supporting files and preserves the latest known status', () => {
    expect(requiredDocumentStatus([
      { document_type: 'photograph', status: 'UPLOADED' },
      { document_type: 'passport', status: 'ACCEPTED' },
      { document_type: 'business-letter', status: 'REUPLOAD_REQUIRED' },
    ], 'e-business')).toEqual([
      { documentType: 'photograph', status: 'UPLOADED', required: true },
      { documentType: 'passport', status: 'ACCEPTED', required: true },
      { documentType: 'business-letter', status: 'REUPLOAD_REQUIRED', required: true },
      { documentType: 'invitation-letter', status: 'MISSING', required: true },
    ])
  })

  it('ignores documents that are not required by the selected visa', () => {
    expect(requiredDocumentStatus([
      { document_type: 'hospital-letter', status: 'UPLOADED' },
      { document_type: 'photograph', status: 'REPLACED' },
    ], 'e-tourist')).toEqual([
      { documentType: 'photograph', status: 'REPLACED', required: true },
      { documentType: 'passport', status: 'MISSING', required: true },
    ])
  })
})
