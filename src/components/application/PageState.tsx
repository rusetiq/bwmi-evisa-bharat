import { Link } from 'react-router-dom'
import { Notice } from '../forms/FormPrimitives'

export function PageLoading({ label = 'Loading your application…' }: { label?: string }) {
  return <div className="shell py-16"><div className="h-2 w-28 skeleton" /><div className="mt-6 h-10 w-2/3 max-w-md skeleton" /><p className="mt-5 text-sm text-stone">{label}</p></div>
}

export function PageError({ message = "We couldn't load this page.", retry }: { message?: string; retry?: () => void }) {
  return <div className="shell py-16"><div className="max-w-xl"><h1 className="display text-4xl">Something needs attention.</h1><div className="mt-6"><Notice title="We couldn't complete that request." tone="danger">{message}</Notice></div><div className="mt-6 flex flex-wrap gap-3">{retry && <button type="button" className="btn btn-primary" onClick={retry}>Try again</button>}<Link className="btn btn-secondary" to="/find-application">Find an application</Link></div></div></div>
}

