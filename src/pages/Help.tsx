import { useMemo, useState } from 'react'
import { ArrowRight, Mail, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AccordionItem } from '@/components/ui/Accordion'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TextInput } from '@/components/ui/Field'
import { Notice } from '@/components/ui/Notice'
import { PageFrame, PageIntro } from '@/components/layout/PublicLayout'

const categories = ['All', 'Applying', 'Eligibility', 'Documents', 'Payments', 'Status', 'ETA', 'Travel'] as const
const faqs = [
  { category: 'Applying', question: 'How do I start an application?', answer: 'Begin with the application setup questions. Once an application ID is created, the workspace saves your progress as you move through each section. Keep that ID safe so you can find the application later.' },
  { category: 'Applying', question: 'Can I come back to an unfinished application?', answer: 'Yes. Use Find application with your application ID, passport number and date of birth. The prototype retrieves the saved application and takes you to the next incomplete step.' },
  { category: 'Eligibility', question: 'Does the checker guarantee that I can travel?', answer: 'No. The checker is a demonstration of a calmer decision aid and uses fictional rules. It is not an official eligibility decision, visa grant or permission to enter India.' },
  { category: 'Documents', question: 'What file types can I upload?', answer: 'The prototype accepts PDF, JPG and PNG files up to 10 MB. Use fictional documents only. A clear passport bio page should show all four edges and the machine-readable lines.' },
  { category: 'Documents', question: 'What happens if a document needs replacing?', answer: 'The application workspace will explain what needs attention and why. Choose Replace document, upload a clearer file and submit it. Your application then returns to review.' },
  { category: 'Payments', question: 'Is the payment real?', answer: 'No. Payment methods and transactions in this prototype are simulated. Never enter a real card number, bank detail or UPI credential here.' },
  { category: 'Payments', question: 'What if my demonstration payment fails?', answer: 'Open the payment page again from your application dashboard and choose Try again. The prototype keeps the payment state separate from your application details.' },
  { category: 'Status', question: 'Where can I see my application status?', answer: 'Use Find application to open the dashboard. It brings together the timeline, documents, payment state and messages in one place.' },
  { category: 'ETA', question: 'What is an ETA?', answer: 'An Electronic Travel Authorization is the approval document represented by this prototype. A granted demonstration ETA is not valid for travel.' },
  { category: 'Travel', question: 'Can I use every entry point shown?', answer: 'The entry points page contains representative demonstration data. Confirm the current approved entry point for your visa before making travel arrangements.' },
]

export function Help() {
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => faqs.filter((faq) => {
    const categoryMatch = category === 'All' || faq.category === category
    const textMatch = `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase().includes(query.trim().toLowerCase())
    return categoryMatch && textMatch
  }), [category, query])

  return (
    <PageFrame>
      <PageIntro title="How can we help?" intro="Search the common questions below or browse by topic. This support centre describes the demonstration service, not official visa policy." />

      <section aria-labelledby="help-search-heading" className="mt-10">
        <h2 className="sr-only" id="help-search-heading">Search help topics</h2>
        <div className="relative max-w-xl"><label className="sr-only" htmlFor="help-search">Search help</label><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--stone)]" size={17} strokeWidth={1.5} /><TextInput className="!pl-10" id="help-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search applying, payment, documents…" type="search" value={query} /></div>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Help category">{categories.map((item) => <button aria-pressed={category === item} className={`focus-ring rounded-lg border px-3 py-2 text-[13px] transition-colors ${category === item ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : 'border-[var(--hairline)] text-[var(--stone)] hover:border-[var(--ink)] hover:text-[var(--ink)]'}`} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="mt-10 flex items-center justify-between gap-4 border-b border-[var(--hairline)] pb-4 text-[13px] text-[var(--stone)]"><p>{filtered.length} {filtered.length === 1 ? 'answer' : 'answers'}</p>{(query || category !== 'All') && <Button className="min-h-0 py-1 text-[13px]" onClick={() => { setQuery(''); setCategory('All') }} variant="text">Clear filters</Button>}</div>
        {filtered.length ? <div className="max-w-3xl">{filtered.map((faq) => <AccordionItem key={faq.question} title={<span><span className="mr-3 text-[11px] uppercase text-[var(--orange)]">{faq.category}</span>{faq.question}</span>}>{faq.answer}</AccordionItem>)}</div> : <EmptyState className="mt-8 max-w-3xl" title="No answers found">Try a broader search or clear the topic filter to browse all demonstration help topics.</EmptyState>}
      </section>

      <section aria-labelledby="more-help-heading" className="mt-16 grid gap-8 border-t border-[var(--hairline)] pt-10 md:grid-cols-[1fr_auto] md:items-center">
        <div><h2 className="display mt-3 text-3xl" id="more-help-heading">Bring your application reference.</h2><p className="mt-3 max-w-xl text-[15px] leading-6 text-[var(--stone)]">For this prototype, use the demo records or find an application to see the relevant next step.</p></div>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"><Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-[14px] font-medium underline decoration-[var(--cobblestone)] decoration-1 underline-offset-4 hover:text-[var(--graphite)]" to="/find-application">Find an application <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} /></Link><a className="focus-ring inline-flex items-center gap-2 rounded-lg text-[14px] text-[var(--stone)] underline underline-offset-4 hover:text-[var(--ink)]" href="mailto:demo-support@gov.example"><Mail aria-hidden="true" size={15} strokeWidth={1.5} />demo-support@gov.example</a></div>
      </section>
      <Notice className="mt-10" title="Prototype support">The support address above is fictional and does not send a real service request.</Notice>
    </PageFrame>
  )
}

export default Help
