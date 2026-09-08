import { Check } from 'lucide-react'
import { applicationSteps, getRequiredDocuments, isStepComplete } from '../../lib/domain'
import type { Application } from '../../lib/types'

const labels: Record<string, string> = { visa: 'Visa', personal: 'Personal', passport: 'Passport', contact: 'Contact', family: 'Family', employment: 'Employment', travel: 'Travel', background: 'Background', documents: 'Documents', review: 'Review' }

export function ApplicationProgress({ application, currentStep, onStepChange }: { application: Application; currentStep: string; onStepChange?: (step: string) => void }) {
  const progress = applicationSteps.map((step) => ({ step, complete: isComplete(application, step) }))
  const requiredDocuments = getRequiredDocuments(normalizeVisaType(application.visaType))
  const items = [...progress, { step: 'documents', complete: requiredDocuments.every((type) => application.documents?.some((document) => document.documentType === type && ['UPLOADED', 'ACCEPTED', 'REPLACED'].includes(document.status))) }, { step: 'review', complete: ['SUBMITTED', 'PAYMENT_PENDING', 'UNDER_REVIEW', 'DOCUMENT_REUPLOAD_REQUIRED', 'GRANTED', 'REJECTED'].includes(application.status) }]
  return (
    <nav aria-label="Application progress" className="min-w-0 border-b border-[var(--hairline)] bg-[var(--linen)] lg:border-b-0 lg:border-r">
      <div className="flex gap-2 overflow-x-auto px-4 py-3 lg:block lg:w-56 lg:px-5 lg:py-8">

        {items.map((item, index) => {
          const isCurrent = currentStep === item.step
          const canNavigate = Boolean(onStepChange) && (item.complete || isCurrent)
          return (
            <button
              type="button"
              key={item.step}
              className={`group flex min-w-max items-center gap-2 border-b-2 px-2 py-2 text-left text-xs lg:mb-1 lg:w-full lg:border-b-0 lg:border-l-2 lg:px-3 lg:py-2 ${isCurrent ? 'border-[var(--ink)] font-medium lg:bg-white' : 'border-transparent text-stone hover:text-[var(--ink)]'} ${!canNavigate ? 'cursor-default' : 'cursor-pointer'}`}
              onClick={() => canNavigate && onStepChange?.(item.step)}
              aria-current={isCurrent ? 'step' : undefined}
              disabled={!canNavigate}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center border text-[10px] ${item.complete ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : isCurrent ? 'border-[var(--orange)] text-[var(--orange)]' : 'border-[var(--cobblestone)]'}`}>
                {item.complete ? <Check size={12} strokeWidth={2.5} aria-hidden="true" /> : String(index + 1).padStart(2, '0')}
              </span>
              <span>{labels[item.step]}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function isComplete(application: Application, step: string) {
  const section = application.sections?.[step]
  if (!section) return false
  return applicationSteps.includes(step as typeof applicationSteps[number]) ? isStepComplete(step as typeof applicationSteps[number], section, application.sections) : false
}

function normalizeVisaType(value: string) { return value.startsWith('e-tourist-') ? 'e-tourist' : value }
