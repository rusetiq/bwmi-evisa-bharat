import { ArrowRight, Check, FileText, Mail, ScanLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AccordionItem } from '@/components/ui/Accordion'
import { ButtonLink } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { PageFrame, PageIntro } from '@/components/layout/PublicLayout'

const beforeStart = ['A passport that remains valid for your intended journey', 'An email address you can access', 'A way to complete the demonstration payment', 'Your expected arrival and accommodation details']
const documents = ['A clear scan of your passport bio page', 'A recent colour photograph in an accepted format', 'Visa-specific evidence, such as an invitation or hospital letter', 'Fictional or demonstration documents only for this prototype']

function Checklist({ items }: { items: string[] }) {
  return <ul className="grid gap-4">{items.map((item) => <li className="flex gap-3 text-[15px] leading-6 text-[var(--stone)]" key={item}><Check aria-hidden="true" className="mt-1 shrink-0 text-[var(--orange)]" size={16} strokeWidth={1.5} /><span>{item}</span></li>)}</ul>
}

export function Requirements() {
  return (
    <PageFrame>
      <PageIntro title="The essentials before you begin." intro="A short checklist for the demonstration application. Keep your passport nearby and allow time to review every answer before submitting." />

      <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-20">
        <div>
          <section aria-labelledby="before-start-heading">
            <div className="flex items-start gap-4"><span className="flex size-10 shrink-0 items-center justify-center border border-[var(--hairline)] bg-[var(--paper)]"><FileText aria-hidden="true" className="text-[var(--orange)]" size={19} strokeWidth={1.35} /></span><div><h2 className="display mt-2 text-3xl" id="before-start-heading">Before you start</h2></div></div>
            <div className="mt-7 border-y border-[var(--hairline)] py-7"><Checklist items={beforeStart} /></div>
          </section>

          <section aria-labelledby="documents-heading" className="mt-14">
            <div className="flex items-start gap-4"><span className="flex size-10 shrink-0 items-center justify-center border border-[var(--hairline)] bg-[var(--paper)]"><ScanLine aria-hidden="true" className="text-[var(--orange)]" size={19} strokeWidth={1.35} /></span><div><h2 className="display mt-2 text-3xl" id="documents-heading">Documents</h2></div></div>
            <div className="mt-7 border-y border-[var(--hairline)] py-7"><Checklist items={documents} /></div>
          </section>

          <section aria-labelledby="document-guidance-heading" className="mt-14">
            <h2 className="display text-3xl" id="document-guidance-heading">A clear scan is a kind scan.</h2>
            <div className="mt-6">
              <AccordionItem open title="Photograph">
                <ul className="grid gap-2"><li>Use a recent colour photograph with a plain, light background.</li><li>Keep your face fully visible and remove sunglasses or headwear unless worn for religious reasons.</li><li>Use JPG or PNG within the 10 MB demonstration limit.</li></ul>
              </AccordionItem>
              <AccordionItem title="Passport bio page">
                <ul className="grid gap-2"><li>Upload the page showing your photograph, name, passport number and dates.</li><li>Make sure all four edges and the machine-readable lines are visible.</li><li>Use PDF, JPG or PNG within the 10 MB demonstration limit.</li></ul>
              </AccordionItem>
              <AccordionItem title="Visa-specific evidence">
                <p>Business, medical, conference and student routes may ask for one additional letter or reference. The application workspace will tell you exactly what is needed for your selected category.</p>
              </AccordionItem>
            </div>
          </section>

          <section aria-labelledby="after-approval-heading" className="mt-14">
            <div className="flex items-start gap-4"><span className="flex size-10 shrink-0 items-center justify-center border border-[var(--hairline)] bg-[var(--paper)]"><Mail aria-hidden="true" className="text-[var(--orange)]" size={19} strokeWidth={1.35} /></span><div><h2 className="display mt-2 text-3xl" id="after-approval-heading">After approval</h2></div></div>
            <div className="mt-7 border-y border-[var(--hairline)] py-7"><Checklist items={['Check your ETA details carefully', 'Carry the passport used for the application', 'Keep a copy of the ETA with your travel documents', 'Complete immigration formalities on arrival']} /></div>
          </section>
        </div>

        <aside className="lg:border-l lg:border-[var(--hairline)] lg:pl-8">
          <Notice title="Demonstration guidance">The requirements on this page are intentionally simplified and are not an official checklist. Use the prototype with fictional details only.</Notice>
          <div className="mt-8 border-t border-[var(--hairline)] pt-6"><p className="mt-3 text-[15px] leading-6 text-[var(--stone)]">Compare categories or answer five questions about your journey.</p><div className="mt-5 grid gap-3"><ButtonLink className="w-full" to="/eligibility" variant="secondary" trailingIcon={<ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} />}>Check eligibility</ButtonLink><Link className="focus-ring rounded-lg text-center text-[14px] underline underline-offset-4 hover:text-[var(--graphite)]" to="/visa-types">View visa types</Link></div></div>
        </aside>
      </div>
    </PageFrame>
  )
}

export default Requirements
