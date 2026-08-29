import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from './cn'

export function FieldLabel({ htmlFor, children, optional = false }: { htmlFor?: string; children: ReactNode; optional?: boolean }) {
  return (
    <label className="label" htmlFor={htmlFor}>
      {children}
      {optional && <span className="ml-1 font-normal text-[var(--stone)]">(optional)</span>}
    </label>
  )
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-[13px] leading-5 text-[var(--stone)] text-pretty">{children}</p>
}

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null
  return <p className="error text-pretty" id={id} role="alert">{children}</p>
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field focus-ring', className)} {...props} />
}

export function SelectInput({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('field focus-ring', className)} {...props}>{children}</select>
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('field focus-ring min-h-28 resize-y', className)} {...props} />
}

export function Field({ label, htmlFor, hint, error, optional = false, children }: { label: ReactNode; htmlFor?: string; hint?: ReactNode; error?: ReactNode; optional?: boolean; children: ReactNode }) {
  return (
    <div>
      <FieldLabel htmlFor={htmlFor} optional={optional}>{label}</FieldLabel>
      {children}
      {hint && <FieldHint>{hint}</FieldHint>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
