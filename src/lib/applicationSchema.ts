import type { SectionData } from './types'
import { countries } from './content'

export type FormStep = 'visa' | 'personal' | 'passport' | 'contact' | 'family' | 'employment' | 'travel' | 'background'
export type SchemaFieldType = 'text' | 'email' | 'date' | 'tel' | 'select' | 'textarea' | 'checkbox' | 'choice'
export type SchemaOption = { value: string; label: string }
export type SchemaField = {
  key: string
  label: string
  type: SchemaFieldType
  required?: boolean
  hint?: string
  placeholder?: string
  autoComplete?: string
  options?: SchemaOption[]
  showWhen?: (data: SectionData) => boolean
  full?: boolean
}

export const formStepMeta: Record<FormStep, { label: string; title: string; description: string }> = {
  visa: { label: 'Visa', title: 'Tell us about your journey.', description: 'Choose the visa that matches your purpose and intended arrival.' },
  personal: { label: 'Personal', title: 'Your personal information.', description: 'Enter your name and details exactly as they appear on your identity documents.' },
  passport: { label: 'Passport', title: 'The passport you will travel with.', description: 'Use the same passport at the border and throughout this application.' },
  contact: { label: 'Contact', title: 'How can we reach you?', description: 'We use these details for application updates and mock service notifications.' },
  family: { label: 'Family', title: 'A little about your family.', description: 'These details help complete your travel record. Optional follow-up fields appear when relevant.' },
  employment: { label: 'Employment', title: 'Your work and occupation.', description: 'Tell us about your current work or study in a few clear details.' },
  travel: { label: 'Travel', title: 'The practical details of your visit.', description: 'Share your itinerary and references so your application is easy to understand.' },
  background: { label: 'Background', title: 'A calm final declaration.', description: 'Answer each question honestly. If you answer yes, add a short explanation.' },
}

export const visaCategories: SchemaOption[] = [
  { value: 'Tourism', label: 'Tourism' },
  { value: 'Business', label: 'Business' },
  { value: 'Medical', label: 'Medical treatment' },
  { value: 'Medical Attendant', label: 'Medical attendant' },
  { value: 'Conference', label: 'Conference or event' },
  { value: 'Study', label: 'Study programme' },
]

export const countryOptions = countries.map((country) => ({ value: country, label: country }))

const passportTypes: SchemaOption[] = [
  { value: 'Ordinary', label: 'Ordinary passport' },
  { value: 'Diplomatic', label: 'Diplomatic passport' },
  { value: 'Official', label: 'Official or service passport' },
]

const genderOptions: SchemaOption[] = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Other', label: 'Another identity' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
]

const educationOptions: SchemaOption[] = [
  { value: 'Primary', label: 'Primary education' },
  { value: 'Secondary', label: 'Secondary education' },
  { value: 'University', label: 'University or college' },
  { value: 'Postgraduate', label: 'Postgraduate' },
  { value: 'Other', label: 'Other' },
]

const yesNoOptions: SchemaOption[] = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

const maritalOptions: SchemaOption[] = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
]

export const applicationFormSchema: Record<FormStep, SchemaField[]> = {
  visa: [
    { key: 'nationality', label: 'Nationality', type: 'select', options: countryOptions, required: true },
    { key: 'visaCategory', label: 'Visa category', type: 'select', options: visaCategories, required: true },
    { key: 'visaSubtype', label: 'Visa subtype', type: 'select', options: [], required: true, hint: 'The available subtype depends on your category.' },
    { key: 'purpose', label: 'Intended purpose', type: 'text', required: true, placeholder: 'For example, holiday with family' },
    { key: 'proposedArrival', label: 'Proposed arrival date', type: 'date', required: true },
    { key: 'arrivalPort', label: 'Port of arrival', type: 'text', required: true, placeholder: 'For example, Delhi International Airport' },
  ],
  personal: [
    { key: 'surname', label: 'Surname', type: 'text', required: true, autoComplete: 'family-name' },
    { key: 'givenNames', label: 'Given names', type: 'text', required: true, autoComplete: 'given-name' },
    { key: 'hasPreviousName', label: 'Have you used a previous name?', type: 'checkbox', hint: 'Select this if your name has legally changed.' },
    { key: 'previousSurname', label: 'Previous surname', type: 'text', required: true, showWhen: (data) => data.hasPreviousName === true },
    { key: 'previousGivenNames', label: 'Previous given names', type: 'text', required: true, showWhen: (data) => data.hasPreviousName === true },
    { key: 'gender', label: 'Gender', type: 'choice', options: genderOptions, required: true, full: true },
    { key: 'dob', label: 'Date of birth', type: 'date', required: true },
    { key: 'birthCity', label: 'City of birth', type: 'text', required: true },
    { key: 'birthCountry', label: 'Country of birth', type: 'select', options: countryOptions, required: true },
    { key: 'citizenship', label: 'Current citizenship', type: 'select', options: countryOptions, required: true },
    { key: 'nationalId', label: 'National identification number', type: 'text', hint: 'Optional. Leave blank if you do not have one.' },
    { key: 'religion', label: 'Religion', type: 'text', required: true, hint: 'Enter “None” if that is your answer.' },
    { key: 'identificationMarks', label: 'Visible identification marks', type: 'text', required: true, placeholder: 'Enter “None” if there are no marks.' },
    { key: 'education', label: 'Education level', type: 'select', options: educationOptions, required: true },
  ],
  passport: [
    { key: 'passportNumber', label: 'Passport number', type: 'text', required: true, placeholder: 'For example, P1234567' },
    { key: 'passportType', label: 'Passport type', type: 'select', options: passportTypes, required: true },
    { key: 'issuingCountry', label: 'Issuing country', type: 'select', options: countryOptions, required: true },
    { key: 'placeOfIssue', label: 'Place of issue', type: 'text', required: true },
    { key: 'issueDate', label: 'Issue date', type: 'date', required: true },
    { key: 'expiryDate', label: 'Expiry date', type: 'date', required: true },
    { key: 'hasOtherPassport', label: 'Do you hold another valid passport or identity document?', type: 'checkbox', full: true },
    { key: 'otherPassportDetails', label: 'Other passport or identity document details', type: 'textarea', required: true, showWhen: (data) => data.hasOtherPassport === true, full: true },
  ],
  contact: [
    { key: 'address1', label: 'Current address line 1', type: 'text', required: true },
    { key: 'address2', label: 'Current address line 2', type: 'text' },
    { key: 'city', label: 'City', type: 'text', required: true },
    { key: 'state', label: 'State or province', type: 'text', required: true },
    { key: 'postalCode', label: 'Postal code', type: 'text', required: true },
    { key: 'country', label: 'Country', type: 'select', options: countryOptions, required: true },
    { key: 'email', label: 'Email address', type: 'email', required: true, placeholder: 'you@example.com' },
    { key: 'mobile', label: 'Mobile number', type: 'tel', required: true, placeholder: '+971 50 000 0000' },
    { key: 'sameAddress', label: 'Permanent address is the same as my current address', type: 'checkbox', full: true },
    { key: 'permanentAddress1', label: 'Permanent address line 1', type: 'text', required: true, showWhen: (data) => data.sameAddress !== true },
    { key: 'permanentAddress2', label: 'Permanent address line 2', type: 'text', showWhen: (data) => data.sameAddress !== true },
    { key: 'permanentCity', label: 'Permanent city', type: 'text', required: true, showWhen: (data) => data.sameAddress !== true },
    { key: 'permanentState', label: 'Permanent state or province', type: 'text', required: true, showWhen: (data) => data.sameAddress !== true },
    { key: 'permanentPostalCode', label: 'Permanent postal code', type: 'text', required: true, showWhen: (data) => data.sameAddress !== true },
    { key: 'permanentCountry', label: 'Permanent country', type: 'select', options: countryOptions, required: true, showWhen: (data) => data.sameAddress !== true },
  ],
  family: [
    { key: 'fatherName', label: "Father’s full name", type: 'text', required: true },
    { key: 'fatherNationality', label: "Father’s nationality", type: 'select', options: countryOptions, required: true },
    { key: 'fatherPreviousNationality', label: "Father’s previous nationality", type: 'text' },
    { key: 'fatherBirthPlace', label: "Father’s place of birth", type: 'text' },
    { key: 'fatherBirthCountry', label: "Father’s country of birth", type: 'select', options: countryOptions },
    { key: 'motherName', label: "Mother’s full name", type: 'text', required: true },
    { key: 'motherNationality', label: "Mother’s nationality", type: 'select', options: countryOptions, required: true },
    { key: 'motherPreviousNationality', label: "Mother’s previous nationality", type: 'text' },
    { key: 'motherBirthPlace', label: "Mother’s place of birth", type: 'text' },
    { key: 'motherBirthCountry', label: "Mother’s country of birth", type: 'select', options: countryOptions },
    { key: 'maritalStatus', label: 'Marital status', type: 'choice', options: maritalOptions, required: true, full: true },
    { key: 'spouseName', label: 'Spouse’s full name', type: 'text', required: true, showWhen: (data) => data.maritalStatus === 'Married' },
    { key: 'spouseNationality', label: 'Spouse’s nationality', type: 'select', options: countryOptions, required: true, showWhen: (data) => data.maritalStatus === 'Married' },
  ],
  employment: [
    { key: 'occupation', label: 'Current occupation', type: 'select', required: true, options: [{ value: 'Employed', label: 'Employed' }, { value: 'Self-employed', label: 'Self-employed' }, { value: 'Student', label: 'Student' }, { value: 'Retired', label: 'Retired' }, { value: 'Homemaker', label: 'Homemaker' }, { value: 'Other', label: 'Other' }] },
    { key: 'employer', label: 'Employer or organisation', type: 'text', required: true },
    { key: 'designation', label: 'Designation', type: 'text', required: true },
    { key: 'employerAddress', label: 'Employer address', type: 'textarea', required: true, full: true },
    { key: 'employerPhone', label: 'Employer phone', type: 'tel', required: true },
    { key: 'previousOccupation', label: 'Previous occupation', type: 'text' },
    { key: 'industry', label: 'Industry or field', type: 'text', required: true },
  ],
  travel: [
    { key: 'expectedArrival', label: 'Expected arrival', type: 'date', required: true },
    { key: 'expectedDeparture', label: 'Expected departure', type: 'date', required: true },
    { key: 'arrivalPort', label: 'Arrival port', type: 'text', required: true },
    { key: 'departurePort', label: 'Departure port, if known', type: 'text' },
    { key: 'places', label: 'Places you plan to visit in India', type: 'textarea', required: true, placeholder: 'For example, Delhi and Agra', full: true },
    { key: 'accommodationName', label: 'Accommodation name', type: 'text', required: true },
    { key: 'accommodationAddress', label: 'Accommodation address', type: 'textarea', required: true, full: true },
    { key: 'indiaReference', label: 'Indian reference name', type: 'text', required: true },
    { key: 'indiaReferencePhone', label: 'Indian reference phone', type: 'tel', required: true },
    { key: 'previousVisit', label: 'Have you visited India before?', type: 'choice', options: yesNoOptions, required: true, full: true },
    { key: 'previousVisaType', label: 'Previous visa type', type: 'text', required: true, showWhen: (data) => data.previousVisit === 'yes' },
    { key: 'previousVisaNumber', label: 'Previous visa number', type: 'text', required: true, showWhen: (data) => data.previousVisit === 'yes' },
    { key: 'previousVisaPlaceIssued', label: 'Place issued', type: 'text', required: true, showWhen: (data) => data.previousVisit === 'yes' },
    { key: 'previousVisaIssueDate', label: 'Issue date', type: 'date', required: true, showWhen: (data) => data.previousVisit === 'yes' },
    { key: 'previousCities', label: 'Cities previously visited', type: 'textarea', required: true, showWhen: (data) => data.previousVisit === 'yes', full: true },
    { key: 'homeReferenceName', label: 'Home-country reference name', type: 'text', required: true },
    { key: 'homeReferenceRelationship', label: 'Relationship to you', type: 'text', required: true },
    { key: 'homeReferencePhone', label: 'Home-country reference phone', type: 'tel', required: true },
    { key: 'homeReferenceAddress', label: 'Home-country reference address', type: 'textarea', required: true, full: true },
    { key: 'tourLocations', label: 'Tour locations', type: 'textarea', required: true, showWhen: (data) => data.visaCategory === 'Tourism', full: true },
    { key: 'tourActivity', label: 'Tour activity', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Tourism' },
    { key: 'indianCompany', label: 'Indian company', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Business' },
    { key: 'indianCompanyAddress', label: 'Indian company address', type: 'textarea', required: true, showWhen: (data) => data.visaCategory === 'Business', full: true },
    { key: 'businessContactPerson', label: 'Indian contact person', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Business' },
    { key: 'applicantCompany', label: 'Your company', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Business' },
    { key: 'natureOfBusiness', label: 'Nature of business', type: 'textarea', required: true, showWhen: (data) => data.visaCategory === 'Business', full: true },
    { key: 'businessPurpose', label: 'Business purpose', type: 'textarea', required: true, showWhen: (data) => data.visaCategory === 'Business', full: true },
    { key: 'hospitalName', label: 'Hospital name', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Medical' },
    { key: 'hospitalCity', label: 'Hospital city', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Medical' },
    { key: 'treatmentCategory', label: 'Treatment category', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Medical' },
    { key: 'hospitalReference', label: 'Hospital reference', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Medical' },
    { key: 'medicalApplicantId', label: 'Linked medical applicant ID', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Medical Attendant' },
    { key: 'patientRelationship', label: 'Relationship to patient', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Medical Attendant' },
    { key: 'conferenceName', label: 'Conference name', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Conference' },
    { key: 'conferenceOrganizer', label: 'Organizer', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Conference' },
    { key: 'conferenceVenue', label: 'Venue', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Conference' },
    { key: 'conferenceDates', label: 'Event dates', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Conference' },
    { key: 'invitationDetails', label: 'Invitation details', type: 'textarea', required: true, showWhen: (data) => data.visaCategory === 'Conference', full: true },
    { key: 'institution', label: 'Institution', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Study' },
    { key: 'course', label: 'Course or programme', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Study' },
    { key: 'courseDuration', label: 'Duration', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Study' },
    { key: 'admissionNumber', label: 'Admission or reference number', type: 'text', required: true, showWhen: (data) => data.visaCategory === 'Study' },
  ],
  background: [
    { key: 'visaRefusal', label: 'Have you previously been refused a visa?', type: 'choice', options: yesNoOptions, required: true, full: true },
    { key: 'visaRefusalDetails', label: 'Please provide details', type: 'textarea', required: true, showWhen: (data) => data.visaRefusal === 'yes', full: true },
    { key: 'deportation', label: 'Have you previously been deported or removed?', type: 'choice', options: yesNoOptions, required: true, full: true },
    { key: 'deportationDetails', label: 'Please provide details', type: 'textarea', required: true, showWhen: (data) => data.deportation === 'yes', full: true },
    { key: 'conviction', label: 'Do you have a criminal conviction to declare?', type: 'choice', options: yesNoOptions, required: true, full: true },
    { key: 'convictionDetails', label: 'Please provide details', type: 'textarea', required: true, showWhen: (data) => data.conviction === 'yes', full: true },
    { key: 'immigrationViolation', label: 'Have you had an immigration violation?', type: 'choice', options: yesNoOptions, required: true, full: true },
    { key: 'immigrationViolationDetails', label: 'Please provide details', type: 'textarea', required: true, showWhen: (data) => data.immigrationViolation === 'yes', full: true },
    { key: 'restrictedTravel', label: 'Are you subject to any travel restriction?', type: 'choice', options: yesNoOptions, required: true, full: true },
    { key: 'restrictedTravelDetails', label: 'Please provide details', type: 'textarea', required: true, showWhen: (data) => data.restrictedTravel === 'yes', full: true },
    { key: 'declaration', label: 'I confirm that these answers are complete and accurate.', type: 'checkbox', required: true, full: true },
  ],
}

export function fieldsForStep(step: FormStep, data: SectionData) {
  return applicationFormSchema[step].filter((field) => !field.showWhen || field.showWhen(data))
}

export function visaSubtypeOptions(category?: string): SchemaOption[] {
  const options: Record<string, SchemaOption[]> = {
    Tourism: [{ value: 'e-tourist-30', label: 'e-Tourist — 30 days' }, { value: 'e-tourist-1-year', label: 'e-Tourist — 1 year' }],
    Business: [{ value: 'e-business', label: 'e-Business' }],
    Medical: [{ value: 'e-medical', label: 'e-Medical' }],
    'Medical Attendant': [{ value: 'e-medical-attendant', label: 'e-Medical Attendant' }],
    Conference: [{ value: 'e-conference', label: 'e-Conference' }],
    Study: [{ value: 'e-student', label: 'e-Student' }],
  }
  return options[category ?? ''] ?? []
}
