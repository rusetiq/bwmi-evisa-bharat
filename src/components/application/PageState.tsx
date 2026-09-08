import { FileText, Plane, ReceiptText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Notice } from '../forms/FormPrimitives'

type LoadingVariant = 'application' | 'documents' | 'payment' | 'eta' | 'print'

export function PageLoading({ label = 'Loading your application…', variant = 'application' }: { label?: string; variant?: LoadingVariant }) {
  return <main className="shell py-12 sm:py-16" aria-label={label} aria-busy="true">
    <span className="sr-only" role="status" aria-live="polite">{label}</span>
    {variant === 'documents' ? <DocumentLoading /> : variant === 'payment' ? <PaymentLoading /> : variant === 'eta' ? <EtaLoading /> : variant === 'print' ? <PrintLoading /> : <ApplicationLoading />}
  </main>
}

export function PageError({ message = "We couldn't load this page.", retry, title = 'Something needs attention.', actionLabel = 'Try again', secondaryTo = '/find-application', secondaryLabel = 'Find an application' }: { message?: string; retry?: () => void; title?: string; actionLabel?: string; secondaryTo?: string; secondaryLabel?: string }) {
  return <main className="shell py-16"><div className="max-w-xl"><h1 className="display text-4xl">{title}</h1><div className="mt-6"><Notice title="We couldn't complete that request." tone="danger">{message}</Notice></div><div className="mt-6 flex flex-col gap-3 sm:flex-row">{retry && <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={retry}>{actionLabel}</button>}<Link className="btn btn-secondary w-full sm:w-auto" to={secondaryTo}>{secondaryLabel}</Link></div></div></main>
}

function ApplicationLoading() {
  return <div className="grid gap-8 lg:grid-cols-[224px_minmax(0,1fr)]"><aside className="hidden border-r border-[var(--hairline)] pr-6 lg:block"><div className="h-3 w-28 skeleton" /><div className="mt-6 grid gap-3">{Array.from({ length: 6 }, (_, index) => <div className="h-9 skeleton" key={index} />)}</div></aside><div><div className="h-3 w-32 skeleton" /><div className="mt-5 h-12 w-3/4 max-w-xl skeleton" /><div className="mt-5 h-4 w-full max-w-lg skeleton" /><div className="mt-10 grid gap-5 sm:grid-cols-2"><div className="h-20 skeleton" /><div className="h-20 skeleton" /><div className="h-20 skeleton" /><div className="h-20 skeleton" /></div></div></div>
}

function DocumentLoading() {
  return <div><div className="flex items-center gap-3 text-stone"><FileText size={20} aria-hidden="true" /><div className="h-3 w-40 skeleton" /></div><div className="mt-6 h-12 w-2/3 max-w-lg skeleton" /><div className="mt-10 grid gap-4 sm:grid-cols-2"><div className="h-24 skeleton" /><div className="h-24 skeleton" /></div><div className="mt-8 grid gap-4"><div className="h-28 skeleton" /><div className="h-28 skeleton" /></div></div>
}

function PaymentLoading() {
  return <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]"><div><div className="flex items-center gap-3 text-stone"><ReceiptText size={20} aria-hidden="true" /><div className="h-3 w-32 skeleton" /></div><div className="mt-6 h-12 w-3/4 max-w-xl skeleton" /><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="h-16 skeleton" /><div className="h-16 skeleton" /><div className="h-16 skeleton" /></div></div><div className="h-64 skeleton" /></div>
}

function EtaLoading() {
  return <div className="mx-auto max-w-4xl border border-[var(--hairline)] p-6 sm:p-8"><div className="flex items-center gap-3 text-stone"><Plane size={20} aria-hidden="true" /><div className="h-3 w-44 skeleton" /></div><div className="mt-7 h-12 w-3/4 skeleton" /><div className="mt-10 grid gap-4 sm:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <div className="h-16 skeleton" key={index} />)}</div></div>
}

function PrintLoading() {
  return <div className="mx-auto max-w-4xl"><div className="h-3 w-40 skeleton" /><div className="mt-6 h-12 w-2/3 skeleton" /><div className="mt-8 grid gap-8 md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div className="h-48 skeleton" key={index} />)}</div></div>
}
