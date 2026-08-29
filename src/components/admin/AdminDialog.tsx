import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../ui/cn'

export function AdminDialog({ open, onClose, title, description, children, className }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      try {
        dialog.showModal()
      } catch {
        dialog.setAttribute('open', '')
      }
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      className={cn('m-auto w-[calc(100%-2rem)] max-w-2xl border border-[var(--ink)] bg-[var(--paper)] p-0 text-[var(--ink)] backdrop:bg-[rgb(31_28_27_/_45%)]', className)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="flex items-start justify-between gap-5 border-b border-[var(--hairline)] bg-[var(--linen)] px-5 py-4 sm:px-7">
        <div>
          <h2 id={titleId} className="display text-3xl leading-tight">{title}</h2>
          {description && <p id={descriptionId} className="mt-2 max-w-xl text-sm leading-6 text-stone">{description}</p>}
        </div>
        <button type="button" className="focus-ring inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-transparent hover:border-[var(--hairline)]" onClick={onClose} aria-label="Close dialog">
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </dialog>
  )
}
