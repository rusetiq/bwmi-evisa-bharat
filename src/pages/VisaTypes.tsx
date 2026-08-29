import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { visaTypes } from '@/lib/content'
import { Button, InlineLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TextInput } from '@/components/ui/Field'
import { PageFrame, PageIntro } from '@/components/layout/PublicLayout'

const categories = ['All', 'Tourism', 'Business', 'Medical', 'Study', 'Events', 'Other'] as const

export function VisaTypes() {
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => visaTypes.filter((visa) => {
    const matchesCategory = category === 'All' || visa.category === category
    const haystack = `${visa.name} ${visa.description} ${visa.commonUses}`.toLowerCase()
    return matchesCategory && haystack.includes(query.trim().toLowerCase())
  }), [category, query])

  return (
    <PageFrame>
      <PageIntro title="Choose the visa that matches your journey." intro="These categories are demonstration content designed to make the application path easier to understand. Check the details before you begin." />

      <section aria-labelledby="visa-filter-heading" className="mt-10">
        <h2 className="sr-only" id="visa-filter-heading">Filter visa categories</h2>
        <div className="flex flex-col gap-5 border-b border-[var(--hairline)] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Visa category">
            {categories.map((item) => (
              <button aria-pressed={category === item} className={`focus-ring rounded-lg border px-3 py-2 text-[13px] transition-colors ${category === item ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : 'border-[var(--hairline)] bg-transparent text-[var(--stone)] hover:border-[var(--ink)] hover:text-[var(--ink)]'}`} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-xs">
            <label className="sr-only" htmlFor="visa-search">Search visa types</label>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--stone)]" size={17} strokeWidth={1.5} />
            <TextInput className="!pl-10" id="visa-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search visa types" type="search" value={query} />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 text-[13px] text-[var(--stone)]"><p>{filtered.length} {filtered.length === 1 ? 'category' : 'categories'}</p>{(category !== 'All' || query) && <Button className="min-h-0 py-1 text-[13px]" onClick={() => { setCategory('All'); setQuery('') }} variant="text">Clear filters</Button>}</div>

        {filtered.length ? (
          <div className="mt-3 grid border-t border-[var(--hairline)] md:grid-cols-2">
            {filtered.map((visa) => (
              <article className="border-b border-[var(--hairline)] py-8 md:px-7 md:odd:border-r md:even:pl-8 lg:px-9 lg:odd:pl-0 lg:even:pl-9" key={visa.slug}>
                <div className="mt-4 flex items-start justify-between gap-5">
                  <h2 className="display text-3xl leading-tight md:text-4xl">{visa.name}</h2>
                  <ArrowUpRight aria-hidden="true" className="mt-1 shrink-0 text-[var(--stone)]" size={20} strokeWidth={1.35} />
                </div>
                <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--stone)] text-pretty">{visa.description}</p>
                <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 border-y border-[var(--hairline)] py-5 sm:grid-cols-4">
                  <div><dt className="eyebrow text-[var(--stone)]">Validity</dt><dd className="mt-2 text-[14px]">{visa.validity}</dd></div>
                  <div><dt className="eyebrow text-[var(--stone)]">Entries</dt><dd className="mt-2 text-[14px]">{visa.entries}</dd></div>
                  <div><dt className="eyebrow text-[var(--stone)]">Fee from</dt><dd className="mt-2 text-[14px] tabular-nums">${visa.feeUsd} USD</dd></div>
                  <div><dt className="eyebrow text-[var(--stone)]">Timing</dt><dd className="mt-2 text-[14px]">{visa.processing}</dd></div>
                </dl>
                <p className="mt-5 text-[13px] text-[var(--stone)]"><span className="font-medium text-[var(--ink)]">Common uses:</span> {visa.commonUses}</p>
                <Link className="focus-ring mt-6 inline-flex items-center gap-2 rounded-lg text-[14px] font-medium underline decoration-[var(--cobblestone)] decoration-1 underline-offset-4 hover:text-[var(--graphite)]" to={`/visa-types/${visa.slug}`}>Learn more <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} /></Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState className="mt-8" title="No visa categories found">Try a different search or clear the category filter to see all demonstration visa types.</EmptyState>
        )}
      </section>

      <div className="mt-12 border-t border-[var(--hairline)] pt-6 text-[14px] text-[var(--stone)]"><InlineLink className="inline-flex items-center gap-2" to="/eligibility">Not sure which route fits? Check eligibility <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} /></InlineLink></div>
    </PageFrame>
  )
}

export default VisaTypes
