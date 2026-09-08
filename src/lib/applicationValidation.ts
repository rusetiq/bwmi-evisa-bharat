import { fieldsForStep, type FormStep } from './applicationSchema'
import type { SectionData } from './types'

export function validationContext(sections: Record<string, SectionData>, step: FormStep, data = sections[step] ?? {}) {
  const context = { ...sections.visa, ...data }
  for (const key of ['visaRefusal', 'deportation', 'conviction', 'immigrationViolation', 'restrictedTravel']) {
    if (typeof context[key] === 'boolean') context[key] = context[key] ? 'yes' : 'no'
  }
  return context
}

export function validateApplicationStep(step: FormStep, data: SectionData = {}, sections: Record<string, SectionData> = {}) {
  const context = validationContext(sections, step, data)
  const errors: Record<string, string> = {}
  for (const field of fieldsForStep(step, context)) {
    const value = context[field.key]
    const missing = value === undefined || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length)
    if (field.required && (missing || (field.type === 'checkbox' && value !== true))) {
      errors[field.key] = field.type === 'checkbox' ? 'Please confirm this answer.' : `Complete ${field.label.toLowerCase().replace(/\?$/, '')}.`
    }
    if (!missing && field.type === 'date' && !validDate(String(value))) errors[field.key] = 'Enter a valid date.'
    if (!missing && field.type === 'email' && !/^\S+@\S+\.\S+$/.test(String(value))) errors[field.key] = 'Enter a valid email address.'
  }
  if (step === 'passport') {
    if (data.issueDate && data.expiryDate && String(data.issueDate) >= String(data.expiryDate)) errors.expiryDate = 'Expiry must be after the issue date.'
    const arrival = sections.visa?.proposedArrival
    if (data.expiryDate && arrival && String(data.expiryDate) <= String(arrival)) errors.expiryDate = 'Your passport must be valid beyond your arrival date.'
  }
  if (step === 'travel' && data.expectedArrival && data.expectedDeparture && String(data.expectedDeparture) <= String(data.expectedArrival)) errors.expectedDeparture = 'Departure must be after arrival.'
  return errors
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
