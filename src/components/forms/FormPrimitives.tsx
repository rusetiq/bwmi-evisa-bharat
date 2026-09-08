import type { ChangeEvent, ReactNode } from 'react'

export type FieldOption = { value: string; label: string }

export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mb-8 max-w-2xl">

      <h1 className="display text-4xl leading-tight sm:text-5xl">{title}</h1>
      {description && <p className="mt-4 max-w-xl text-base leading-7 text-stone">{description}</p>}
    </div>
  )
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="error" role="alert">{message}</p> : null
}

type BaseFieldProps = {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
}

export function FieldLabel({ id, label, hint, required }: Omit<BaseFieldProps, 'error' | 'className'>) {
  return (
    <>
      <label className="label" htmlFor={id}>
        {label}{required && <span aria-hidden="true"> *</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="mb-2 text-xs leading-5 text-stone">{hint}</p>}
    </>
  )
}

export function TextField({ id, label, value, onChange, type = 'text', placeholder, hint, error, required, className = '', autoComplete }: BaseFieldProps & {
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'date' | 'tel' | 'number'
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <div className={className}>
      <FieldLabel id={id} label={label} hint={hint} required={required} />
      <input
        id={id}
        className="field"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete ?? fieldAutocomplete(id, type)}
        inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : type === 'number' ? 'decimal' : 'text'}
        autoCapitalize={type === 'email' ? 'none' : undefined}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined}
      />
      <span id={`${id}-error`}><FieldError message={error} /></span>
    </div>
  )
}

export function SelectField({ id, label, value, onChange, options, placeholder = 'Choose an option', hint, error, required, className = '' }: BaseFieldProps & {
  value: string
  onChange: (value: string) => void
  options: FieldOption[]
  placeholder?: string
}) {
  return (
    <div className={className}>
      <FieldLabel id={id} label={label} hint={hint} required={required} />
      <select
        id={id}
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <span id={`${id}-error`}><FieldError message={error} /></span>
    </div>
  )
}

export function TextareaField({ id, label, value, onChange, placeholder, hint, error, required, className = '', rows = 4 }: BaseFieldProps & {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className={className}>
      <FieldLabel id={id} label={label} hint={hint} required={required} />
      <textarea
        id={id}
        className="field min-h-24 resize-y"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
      />
      <span id={`${id}-error`}><FieldError message={error} /></span>
    </div>
  )
}

export function CheckboxField({ id, label, checked, onChange, hint, error, className = '' }: Omit<BaseFieldProps, 'required'> & {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className={className}>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6" htmlFor={id}>
        <input id={id} className="mt-1 h-4 w-4 accent-[var(--ink)]" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-invalid={Boolean(error)} aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined} />
        <span>{label}</span>
      </label>
      {hint && <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-stone">{hint}</p>}
      <span id={`${id}-error`}><FieldError message={error} /></span>
    </div>
  )
}

export function RadioField({ id, name, label, value, selected, onChange, hint, error, className = '' }: Omit<BaseFieldProps, 'required'> & {
  name: string
  value: string
  selected: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className={className}>
      <label className={`flex min-h-12 min-w-0 cursor-pointer items-center gap-3 border px-4 py-3 text-sm ${selected ? 'border-[var(--ink)] bg-[var(--linen)]' : 'border-[var(--hairline)] bg-white'}`} htmlFor={id}>
        <input id={id} name={name} value={value} className="h-4 w-4 accent-[var(--ink)]" type="radio" checked={selected} onChange={() => onChange(value)} />
        <span className="min-w-0 break-words">{label}</span>
      </label>
      {hint && <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-stone">{hint}</p>}
      <span id={`${id}-error`}><FieldError message={error} /></span>
    </div>
  )
}

export function ChoiceGroup({ id, label, value, options, onChange, hint, error, required, className = '' }: BaseFieldProps & {
  value: string
  options: FieldOption[]
  onChange: (value: string) => void
}) {
  return (
    <fieldset className={className}>
      <legend className="label">{label}{required && <span aria-hidden="true"> *</span>}</legend>
      {hint && <p id={`${id}-hint`} className="mb-3 text-xs leading-5 text-stone">{hint}</p>}
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" tabIndex={error ? -1 : undefined} aria-invalid={Boolean(error)} aria-required={required} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} aria-labelledby={`${id}-legend`}>
        <span className="sr-only" id={`${id}-legend`}>{label}</span>
        {options.map((option) => <RadioField key={option.value} id={`${id}-${option.value}`} name={id} label={option.label} value={option.value} selected={value === option.value} onChange={onChange} />)}
      </div>
      <span id={`${id}-error`}><FieldError message={error} /></span>
    </fieldset>
  )
}

export function Notice({ title, children, tone = 'neutral' }: { title?: string; children: ReactNode; tone?: 'neutral' | 'action' | 'success' | 'danger' }) {
  const toneClass = tone === 'action' ? 'border-[#d36a1b] bg-[#fff8f2]' : tone === 'success' ? 'border-[#7a9b82] bg-[#f2f7f3]' : tone === 'danger' ? 'border-[#b98b87] bg-[#faf3f2]' : 'border-[var(--hairline)] bg-[var(--linen)]'
  return <div className={`border p-4 text-sm leading-6 ${toneClass}`} role={tone === 'danger' ? 'alert' : tone === 'success' ? 'status' : undefined} aria-live={tone === 'success' ? 'polite' : undefined} aria-atomic={tone === 'success' ? true : undefined}>{title && <p className="mb-1 font-medium">{title}</p>}<div className="text-stone">{children}</div></div>
}

export function FormActions({ backLabel = 'Back', continueLabel = 'Continue', onBack, onContinue, continueDisabled, busy }: { backLabel?: string; continueLabel?: string; onBack?: () => void; onContinue?: () => void; continueDisabled?: boolean; busy?: boolean }) {
  return (
    <div className="mt-10 flex flex-col-reverse gap-3 border-t border-[var(--hairline)] pt-6 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={onBack}>Back</button> : <span />}
      {onContinue && <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={onContinue} disabled={continueDisabled || busy}>{busy ? 'Saving…' : continueLabel}</button>}
    </div>
  )
}

export function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(`${value}${value.length === 10 ? 'T00:00:00' : ''}`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function asInputValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function eventValue(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  return event.target.value
}

function fieldAutocomplete(id: string, type: string) {
  if (/passport|nationalId/i.test(id)) return 'off'
  if (type === 'email') return 'email'
  if (/mobile/.test(id)) return 'tel'
  const key = id.replace(/^field-/, '')
  const tokens: Record<string, string> = { address1: 'address-line1', address2: 'address-line2', city: 'address-level2', state: 'address-level1', postalCode: 'postal-code', dob: 'bday', permanentAddress1: 'section-permanent address-line1', permanentAddress2: 'section-permanent address-line2', permanentCity: 'section-permanent address-level2', permanentState: 'section-permanent address-level1', permanentPostalCode: 'section-permanent postal-code' }
  return tokens[key]
}
