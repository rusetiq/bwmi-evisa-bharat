import { z } from 'zod'

const scalar = z.union([z.string().max(2000), z.boolean(), z.array(z.string().max(500)).max(100)])
export const sectionDataSchema = z.record(z.string().min(1).max(100), scalar.optional())

export const createApplicationSchema = z.object({
  nationality: z.string().trim().min(2).max(100).optional(),
  visaType: z.string().trim().min(2).max(80).optional(),
  visaTypeId: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(250).optional().or(z.literal('')),
  proposedArrival: z.string().trim().max(30).optional(),
  applicantName: z.string().trim().max(200).optional(),
  dob: z.string().trim().max(30).optional(),
  passportNumber: z.string().trim().max(40).optional(),
  sections: z.record(z.string().min(1).max(50), sectionDataSchema).optional(),
  section: z.string().trim().min(1).max(50).optional(),
  fields: sectionDataSchema.optional(),
}).passthrough()

export const applicationPatchSchema = z.object({
  section: z.string().trim().min(1).max(50).optional(),
  fields: sectionDataSchema.optional(),
  sections: z.record(z.string().min(1).max(50), sectionDataSchema).optional(),
  data: sectionDataSchema.optional(),
  version: z.number().int().nonnegative().optional(),
  email: z.string().trim().email().max(250).optional().or(z.literal('')),
  nationality: z.string().trim().min(2).max(100).optional(),
  visaType: z.string().trim().min(2).max(80).optional(),
  visaTypeId: z.string().trim().min(2).max(80).optional(),
  proposedArrival: z.string().trim().max(30).optional(),
  applicantName: z.string().trim().max(200).optional(),
  dob: z.string().trim().max(30).optional(),
  passportNumber: z.string().trim().max(40).optional(),
}).passthrough()

export const findApplicationSchema = z.object({
  applicationId: z.string().trim().min(3).max(80).optional(),
  publicId: z.string().trim().min(3).max(80).optional(),
  id: z.string().trim().min(1).max(80).optional(),
  passport: z.string().trim().min(3).max(40).optional(),
  passportNumber: z.string().trim().min(3).max(40).optional(),
  dob: z.string().trim().min(8).max(30).optional(),
  dateOfBirth: z.string().trim().min(8).max(30).optional(),
}).refine((value) => Boolean(value.applicationId || value.publicId || value.id), { message: 'Enter your application ID.', path: ['applicationId'] })
  .refine((value) => Boolean(value.passport || value.passportNumber), { message: 'Enter your passport number.', path: ['passportNumber'] })
  .refine((value) => Boolean(value.dob || value.dateOfBirth), { message: 'Enter your date of birth.', path: ['dob'] })

export const paymentSchema = z.object({
  status: z.enum(['UNPAID', 'PROCESSING', 'SUCCESS', 'FAILED']).optional(),
  outcome: z.enum(['success', 'pending', 'failed', 'processing']).optional(),
  simulate: z.enum(['success', 'pending', 'failed', 'processing']).optional(),
}).passthrough()

export const requestDocumentSchema = z.object({
  documentId: z.union([z.number().int().positive(), z.string().trim().min(1).max(50)]).optional(),
  documentType: z.string().trim().min(2).max(100).optional(),
  reason: z.string().trim().min(2).max(1000),
  reasonCategory: z.string().trim().max(100).optional(),
}).refine((value) => Boolean(value.documentId || value.documentType), { message: 'Choose a document to replace.', path: ['documentType'] })

export const grantSchema = z.object({
  grantedDate: z.string().trim().max(40).optional(),
  grantedAt: z.string().trim().max(40).optional(),
  validFrom: z.string().trim().max(40).optional(),
  validUntil: z.string().trim().max(40).optional(),
  entries: z.string().trim().max(100).optional(),
  etaNumber: z.string().trim().max(80).optional(),
  conditions: z.string().trim().max(1000).optional(),
}).passthrough()

export const rejectSchema = z.object({
  reasonCategory: z.string().trim().min(2).max(100),
  explanation: z.string().trim().min(2).max(2000).optional(),
  reason: z.string().trim().min(2).max(2000).optional(),
}).refine((value) => Boolean(value.explanation || value.reason), { message: 'Add a short explanation.', path: ['explanation'] })

export const eligibilitySchema = z.object({
  nationality: z.string().trim().min(2).max(100),
  passportType: z.string().trim().min(2).max(100),
  purpose: z.string().trim().min(2).max(100),
  expectedArrival: z.string().trim().min(8).max(30),
  intendedLength: z.union([z.number().int().positive().max(365), z.string().trim().min(1).max(10)]),
})

export const supportedSections = ['visa', 'personal', 'passport', 'contact', 'family', 'employment', 'travel', 'background'] as const
export type SupportedSection = typeof supportedSections[number]

export function isSupportedSection(value: string): value is SupportedSection {
  return (supportedSections as readonly string[]).includes(value)
}

export const allowedDocumentTypes = ['photograph', 'passport', 'business-letter', 'invitation-letter', 'hospital-letter', 'patient-reference', 'conference-invitation', 'admission-letter'] as const
export type AllowedDocumentType = typeof allowedDocumentTypes[number]

export function isAllowedDocumentType(value: string): value is AllowedDocumentType {
  return (allowedDocumentTypes as readonly string[]).includes(value)
}
