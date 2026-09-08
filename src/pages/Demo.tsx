import { ArrowRight, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DemoCredentials } from '@/components/demo/DemoCredentials'
import { Notice } from '@/components/ui/Notice'
import { PageFrame, PageIntro } from '@/components/layout/PublicLayout'

export function Demo() {
  return (
    <PageFrame>
      <PageIntro title="Every application state, ready to explore." intro="Use these fictional credentials to experience the applicant journey from draft through decision. No account or password is needed." />
      <Notice className="mt-10" tone="warning" title="Use fictional details only">These records are seeded demonstration data. Never upload a real passport, photograph or payment detail to this prototype.</Notice>

      <section aria-labelledby="demo-records-heading" className="mt-12">
        <div className="mb-7 flex items-end justify-between gap-5"><div><h2 className="display mt-2 text-3xl" id="demo-records-heading">Choose a journey.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--stone)]">Each card explains the flow, opens the right starting point and includes credentials you can copy. Reset any seeded record after exploring it.</p></div><FlaskConical aria-hidden="true" className="hidden text-[var(--orange)] sm:block" size={26} strokeWidth={1.35} /></div>
        <DemoCredentials />
      </section>

      <section aria-labelledby="demo-flow-heading" className="mt-16 grid gap-8 border-t border-[var(--hairline)] pt-10 md:grid-cols-[1fr_1fr] md:gap-16">
        <div><h2 className="display mt-3 text-3xl" id="demo-flow-heading">See the service from both sides.</h2><p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--stone)] text-pretty">Applicants can find an application, follow messages and respond to document requests. Review officers can use the admin view to change a seeded record and create the next event.</p></div>
        <div className="paper-card flex flex-col items-start justify-center p-7"><p className="mt-3 text-[14px] leading-6 text-[var(--graphite)]">Open the internal review desk to request a replacement, grant an ETA or record a decision.</p><Link className="btn btn-primary mt-5" to="/admin">Open demo admin <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} /></Link></div>
      </section>
    </PageFrame>
  )
}

export default Demo
