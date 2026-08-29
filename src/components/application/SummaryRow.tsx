import type { ReactNode } from 'react'

export function SummaryRow({ label, value, action }: { label: string; value?: ReactNode; action?: ReactNode }) {
  return <div className="flex flex-col gap-1 border-b border-[var(--hairline)] py-4 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"><dt className="text-xs uppercase tracking-[.08em] text-stone">{label}</dt><dd className="m-0 flex items-center gap-3 text-sm text-[var(--ink)]">{value || '—'}{action}</dd></div>
}

export function SummaryList({ rows }: { rows: Array<{ label: string; value?: ReactNode; action?: ReactNode }> }) {
  return <dl>{rows.map((row) => <SummaryRow key={row.label} {...row} />)}</dl>
}

