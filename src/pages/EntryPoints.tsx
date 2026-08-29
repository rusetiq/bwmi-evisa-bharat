import { useMemo, useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { entryPoints } from '@/lib/content'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TextInput } from '@/components/ui/Field'
import { Notice } from '@/components/ui/Notice'
import { PageFrame, PageIntro } from '@/components/layout/PublicLayout'

const categories = ['All', 'Airport', 'Seaport', 'Land', 'Rail'] as const

export function EntryPoints() {
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => entryPoints.filter((entry) => {
    const categoryMatch = category === 'All' || entry.category === category
    const queryMatch = `${entry.name} ${entry.city} ${entry.category}`.toLowerCase().includes(query.trim().toLowerCase())
    return categoryMatch && queryMatch
  }), [category, query])

  return (
    <PageFrame>
      <PageIntro eyebrow="Arriving in India" title="Choose an entry point with confidence." intro="Browse representative airports, seaports, land crossings and rail check posts in this demonstration list." />

      <section aria-labelledby="entry-points-filter-heading" className="mt-10">
        <h2 className="sr-only" id="entry-points-filter-heading">Filter entry points</h2>
        <div className="flex flex-col gap-5 border-b border-[var(--hairline)] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Entry point category">
            {categories.map((item) => <button aria-pressed={category === item} className={`focus-ring rounded-lg border px-3 py-2 text-[13px] transition-colors ${category === item ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : 'border-[var(--hairline)] text-[var(--stone)] hover:border-[var(--ink)] hover:text-[var(--ink)]'}`} key={item} type="button" onClick={() => setCategory(item)}>{item === 'All' ? 'All types' : `${item}${item === 'Airport' ? 's' : item === 'Seaport' ? 's' : ''}`}</button>)}
          </div>
          <div className="relative w-full lg:max-w-xs"><label className="sr-only" htmlFor="entry-search">Search entry points</label><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--stone)]" size={17} strokeWidth={1.5} /><TextInput className="!pl-10" id="entry-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search city or point" type="search" value={query} /></div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 text-[13px] text-[var(--stone)]"><p>{filtered.length} {filtered.length === 1 ? 'entry point' : 'entry points'}</p>{(category !== 'All' || query) && <Button className="min-h-0 py-1 text-[13px]" onClick={() => { setCategory('All'); setQuery('') }} variant="text">Clear filters</Button>}</div>
        {filtered.length ? <div className="mt-3 border-t border-[var(--hairline)]">{filtered.map((entry) => <div className="grid gap-3 border-b border-[var(--hairline)] py-5 sm:grid-cols-[minmax(0,1fr)_160px_100px] sm:items-center" key={`${entry.category}-${entry.name}`}><div className="flex items-start gap-3"><MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--orange)]" size={18} strokeWidth={1.35} /><div><h3 className="text-[15px] font-medium">{entry.name}</h3><p className="mt-1 text-[13px] text-[var(--stone)]">{entry.city}</p></div></div><p className="text-[13px] text-[var(--stone)]">{entry.category}</p><p className="text-[12px] text-[var(--stone)] sm:text-right">Demonstration</p></div>)}</div> : <EmptyState className="mt-8" title="No entry points found">Try another city or clear the filters to browse the representative list.</EmptyState>}
      </section>

      <Notice className="mt-12" title="Please check before travelling">The list above is representative demonstration data, not an authoritative list of Indian immigration entry points. Confirm the current approved route for your visa before departure.</Notice>
    </PageFrame>
  )
}

export default EntryPoints
