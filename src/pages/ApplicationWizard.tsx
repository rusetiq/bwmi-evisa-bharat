import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { applicationSteps, getNextRequiredStep, isStepComplete } from '../lib/domain'
import type { Application, SectionData } from '../lib/types'
import { ApplicationShell } from '../components/application/ApplicationShell'
import { PageError, PageLoading } from '../components/application/PageState'
import { CheckboxField, ChoiceGroup, FormActions, Notice, SectionHeading, SelectField, TextareaField, TextField } from '../components/forms/FormPrimitives'
import { applicationFormSchema, fieldsForStep, formStepMeta, visaSubtypeOptions, type FormStep, type SchemaField } from '../components/forms/applicationSchema'
import { useAutosave } from '../components/forms/useAutosave'

export default function ApplicationWizard() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [draftData, setDraftData] = useState<SectionData>({})
  const requestedStep = searchParams.get('step') || ''
  const currentStep = useMemo<FormStep>(() => {
    if (application && applicationSteps.includes(requestedStep as FormStep)) return requestedStep as FormStep
    return application ? getNextRequiredStep(application.sections) as FormStep : 'visa'
  }, [application, requestedStep])
  const sectionData = application?.sections?.[currentStep] ?? {}
  const data = Object.keys(draftData).length ? draftData : sectionData
  const autosave = useAutosave(applicationId, currentStep, data, Boolean(application))

  async function load() {
    if (!applicationId) return
    setLoading(true)
    setLoadError('')
    try {
      const result = await api.getApplication(applicationId)
      setApplication(result)
      setDraftData(result.sections?.[currentStep] ?? {})
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "We couldn't load this application.")
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [applicationId])
  useEffect(() => {
    if (application) setDraftData(application.sections?.[currentStep] ?? {})
  }, [application?.publicId, currentStep])

  if (loading) return <PageLoading label="Retrieving your saved application…" />
  if (loadError || !application) return <PageError message={loadError || 'This application could not be found.'} retry={() => void load()} />
  const currentApplication = application
  if (['SUBMITTED', 'PAYMENT_PENDING', 'UNDER_REVIEW', 'DOCUMENT_REUPLOAD_REQUIRED', 'GRANTED', 'REJECTED'].includes(application.status)) {
    return <PageError message="This application has already been submitted. Open your application workspace to view its current status." retry={() => navigate(`/application/${application.publicId}`)} />
  }

  const meta = formStepMeta[currentStep]
  const contextData = { ...allSections(application), ...data }
  const visibleFields = fieldsForStep(currentStep, contextData)

  function updateField(key: string, value: string | boolean) {
    const next = { ...data, [key]: value }
    if (key === 'sameAddress' && value === true) {
      Object.assign(next, { permanentAddress1: next.address1, permanentAddress2: next.address2, permanentCity: next.city, permanentState: next.state, permanentPostalCode: next.postalCode, permanentCountry: next.country })
    }
    setDraftData(next)
    setApplication((previous) => previous ? { ...previous, sections: { ...previous.sections, [currentStep]: next }, ...(currentStep === 'visa' ? { nationality: String(next.nationality ?? previous.nationality), proposedArrival: String(next.proposedArrival ?? previous.proposedArrival), visaType: subtypeToVisaType(String(next.visaSubtype ?? previous.visaType)) } : {}) } : previous)
    autosave.queue(next)
    if (fieldErrors[key]) setFieldErrors((previous) => { const copy = { ...previous }; delete copy[key]; return copy })
  }

  function validate() {
    const errors: Record<string, string> = {}
    for (const field of visibleFields) {
      if (!field.required) continue
      const value = data[field.key]
      if ((typeof value === 'string' && !value.trim()) || value === undefined || value === false) errors[field.key] = fieldMessage(field)
    }
    if (currentStep === 'passport') {
      if (data.issueDate && data.expiryDate && String(data.issueDate) >= String(data.expiryDate)) errors.expiryDate = 'Your expiry date must be after the issue date.'
      if (data.expiryDate && (data.proposedArrival || currentApplication.proposedArrival) && String(data.expiryDate) <= String(data.proposedArrival || currentApplication.proposedArrival)) errors.expiryDate = 'Your passport must be valid beyond your arrival date.'
    }
    if (currentStep === 'travel' && data.expectedArrival && data.expectedDeparture && String(data.expectedDeparture) < String(data.expectedArrival)) errors.expectedDeparture = 'Departure must be after arrival.'
    if (currentStep === 'contact' && data.email && !/^\S+@\S+\.\S+$/.test(String(data.email))) errors.email = 'Enter a valid email address.'
    setFieldErrors(errors)
    return !Object.keys(errors).length
  }

  function continueStep() {
    if (!validate()) return
    const index = applicationSteps.indexOf(currentStep)
    if (index < applicationSteps.length - 1) navigate(`/apply/${currentApplication.publicId}?step=${applicationSteps[index + 1]}`)
    else navigate(`/apply/${currentApplication.publicId}/documents`)
  }

  function goToStep(step: string) {
    if (step === 'documents') navigate(`/apply/${currentApplication.publicId}/documents`)
    else if (step === 'review') navigate(`/apply/${currentApplication.publicId}/review`)
    else navigate(`/apply/${currentApplication.publicId}?step=${step}`)
  }

  return <ApplicationShell application={currentApplication} currentStep={currentStep} saveMessage={autosave.message || 'Changes save automatically'} onStepChange={goToStep} backTo="/">
    <div className="form-shell">
      <SectionHeading eyebrow={`Step ${String(applicationSteps.indexOf(currentStep) + 1).padStart(2, '0')} of 08 · ${meta.label}`} title={meta.title} description={meta.description} />
      {autosave.state === 'error' && <div className="mb-6"><Notice title="Your changes are still on this screen." tone="danger"><span>{autosave.message || "We couldn't save your changes."} </span><button className="link inline-flex items-center gap-1" type="button" onClick={autosave.retry}><RotateCcw size={13} aria-hidden="true" /> Retry</button></Notice></div>}
      {currentStep === 'visa' && <Notice title="A note about this prototype">Visa options and eligibility rules shown here are fictional demo data for the redesigned service.</Notice>}
      <div className="mt-8 grid gap-x-6 gap-y-6 sm:grid-cols-2">
        {visibleFields.map((field) => <SchemaFieldRenderer key={field.key} field={field} data={contextData} onChange={(value) => updateField(field.key, value)} error={fieldErrors[field.key]} />)}
      </div>
      <FormActions onBack={() => goBack(currentStep, currentApplication.publicId, navigate)} onContinue={continueStep} continueLabel={currentStep === 'background' ? 'Continue to documents' : 'Continue'} />
    </div>
  </ApplicationShell>
}

function SchemaFieldRenderer({ field, data, onChange, error }: { field: SchemaField; data: SectionData; onChange: (value: string | boolean) => void; error?: string }) {
  const className = field.full ? 'sm:col-span-2' : ''
  const value = data[field.key]
  if (field.type === 'checkbox') return <CheckboxField id={`field-${field.key}`} label={field.label} checked={value === true} onChange={onChange} hint={field.hint} error={error} className={className} />
  if (field.type === 'choice') return <ChoiceGroup id={`field-${field.key}`} label={field.label} value={typeof value === 'string' ? value : ''} options={field.options ?? []} onChange={onChange as (value: string) => void} hint={field.hint} error={error} required={field.required} className={className} />
  if (field.type === 'select') {
    const options = field.key === 'visaSubtype' ? visaSubtypeOptions(typeof data.visaCategory === 'string' ? data.visaCategory : '') : field.options ?? []
    return <SelectField id={`field-${field.key}`} label={field.label} value={typeof value === 'string' ? value : ''} onChange={onChange as (value: string) => void} options={options} hint={field.hint} error={error} required={field.required} className={className} />
  }
  if (field.type === 'textarea') return <TextareaField id={`field-${field.key}`} label={field.label} value={typeof value === 'string' ? value : ''} onChange={onChange as (value: string) => void} placeholder={field.placeholder} hint={field.hint} error={error} required={field.required} className={className} />
  return <TextField id={`field-${field.key}`} label={field.label} type={field.type} value={typeof value === 'string' ? value : ''} onChange={onChange as (value: string) => void} placeholder={field.placeholder} hint={field.hint} error={error} required={field.required} autoComplete={field.autoComplete} className={className} />
}

function fieldMessage(field: SchemaField) { return field.label.endsWith('?') ? `Choose an answer for “${field.label.slice(0, -1)}”.` : `Enter ${field.label.toLowerCase()}.` }

function subtypeToVisaType(subtype: string) {
  if (subtype.startsWith('e-tourist')) return 'e-tourist'
  return subtype || 'e-tourist'
}

function allSections(application: Application): SectionData {
  return Object.values(application.sections ?? {}).reduce<SectionData>((result, section) => ({ ...result, ...section }), {})
}

function goBack(step: FormStep, id: string, navigate: ReturnType<typeof useNavigate>) {
  const index = applicationSteps.indexOf(step)
  if (index <= 0) navigate('/apply')
  else navigate(`/apply/${id}?step=${applicationSteps[index - 1]}`)
}
