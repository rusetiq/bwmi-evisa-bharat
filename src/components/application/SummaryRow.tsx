import type { ReactNode } from 'react'

export function SummaryRow({ label, value, action }: { label: string; value?: ReactNode; action?: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-1 border-b border-[var(--hairline)] py-4 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"><dt className="text-xs normal-case tracking-normal text-stone">{label}</dt><dd className="m-0 flex min-w-0 flex-wrap items-center gap-3 break-words text-sm text-[var(--ink)] sm:justify-end"><span className="min-w-0 break-words">{value || '—'}</span>{action}</dd></div>
}

export function SummaryList({ rows }: { rows: Array<{ label: string; value?: ReactNode; action?: ReactNode }> }) {
  return <dl>{rows.map((row) => <SummaryRow key={row.label} {...row} />)}</dl>
}
