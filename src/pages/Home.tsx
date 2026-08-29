import { ArrowRight, ArrowUpRight, BriefcaseBusiness, GraduationCap, HeartPulse, MapPin, Stethoscope, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { visaTypes } from '@/lib/content'
import { ButtonLink, InlineLink } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { SectionTitle } from '@/components/ui/SectionHeading'
import { PageFrame } from '@/components/layout/PublicLayout'
import { DemoCredentials } from '@/components/demo/DemoCredentials'

const categoryIcons = {
  'e-tourist': MapPin,
  'e-business': BriefcaseBusiness,
  'e-medical': Stethoscope,
  'e-medical-attendant': HeartPulse,
  'e-conference': UsersRound,
  'e-student': GraduationCap,
} as const

const process = [
  ['01', 'Apply', 'Tell us about your trip and save your application as you go.'],
  ['02', 'Submit documents', 'Upload a clear photograph, passport scan and any supporting evidence.'],
  ['03', 'Pay & track', 'Use the demonstration payment flow and follow every status change.'],
  ['04', 'Receive your ETA', 'View your electronic travel authorisation when a decision is granted.'],
]

export function Home() {
  return (
    <>
      <section>
        <PageFrame className="grid gap-12 py-16 md:grid-cols-[minmax(0,1.05fr)_minmax(340px,.95fr)] md:items-center md:gap-16 md:py-24 lg:py-28">
          <div className="hero-copy max-w-2xl">
            <h1 className="display max-w-2xl text-balance text-[clamp(3.3rem,7vw,6.2rem)] leading-[.94] text-[var(--ink)]">Your journey to India starts here.</h1>
            <p className="mt-7 max-w-xl text-[18px] leading-8 text-[var(--stone)] text-pretty">Apply for an Indian e-Visa, upload your documents and follow your application from one place.</p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <ButtonLink to="/apply" trailingIcon={<ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.5} />}>Apply for e-Visa</ButtonLink>
              <Link className="focus-ring rounded-lg text-[14px] font-medium underline underline-offset-4 hover:text-[var(--ink)]" to="/find-application">Check an application</Link>
            </div>
            <InlineLink className="mt-6 inline-flex items-center gap-2 text-[14px]" to="/eligibility">Check if you’re eligible <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} /></InlineLink>
          </div>

          <div className="hero-art relative aspect-[3/4] min-w-0 w-full overflow-hidden rounded-2xl bg-black shadow-[var(--shadow-paper)] sm:rounded-3xl">
            <img className="hero-photo absolute inset-0 block h-full w-full object-cover object-top" src="/india-gateway.jpg" alt="India Gate beneath a ceremonial aircraft formation trailing the colours of the Indian flag" width="958" height="1800" fetchPriority="high" />
          </div>
        </PageFrame>
      </section>

      <PageFrame>
        <section aria-labelledby="process-heading">
          <div className="max-w-2xl">
            <SectionTitle id="process-heading">One application. One place to follow it.</SectionTitle>
          </div>
          <div className="mt-12 grid border-y border-[var(--hairline)] md:grid-cols-4">
            {process.map(([number, title, description]) => (
              <div className="border-b border-[var(--hairline)] py-7 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0" key={number}>
                <span className="display text-4xl text-[var(--orange)]">{number}</span>
                <h3 className="mt-6 text-[18px] font-medium">{title}</h3>
                <p className="mt-3 max-w-[220px] text-[14px] leading-6 text-[var(--stone)] text-pretty">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="visa-categories-heading" className="mt-24">
          <div className="flex flex-col gap-5 border-b border-[var(--hairline)] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionTitle id="visa-categories-heading">Visa categories</SectionTitle>
            </div>
            <InlineLink className="inline-flex items-center gap-2 text-[14px]" to="/visa-types">View all visa categories <ArrowRight aria-hidden="true" size={15} strokeWidth={1.5} /></InlineLink>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3">
            {visaTypes.map((visa) => {
              const Icon = categoryIcons[visa.slug as keyof typeof categoryIcons] ?? MapPin
              return (
                <Link className="focus-ring group border-b border-[var(--hairline)] py-7 md:border-r md:px-6 md:first:pl-0 md:nth-[2]:pl-6 md:nth-[3n]:border-r-0 lg:nth-[3n]:pr-0" key={visa.slug} to={`/visa-types/${visa.slug}`}>
                  <Icon aria-hidden="true" className="text-[var(--orange)]" size={22} strokeWidth={1.35} />
                  <div className="mt-6 flex items-start justify-between gap-5">
                    <h3 className="display text-2xl leading-tight group-hover:text-[var(--graphite)]">{visa.name}</h3>
                    <ArrowUpRight aria-hidden="true" className="mt-1 shrink-0 text-[var(--stone)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={18} strokeWidth={1.35} />
                  </div>
                  <p className="mt-3 max-w-sm text-[14px] leading-6 text-[var(--stone)] text-pretty">{visa.description}</p>
                  <p className="mt-5 text-[12px] text-[var(--stone)]">{visa.validity} · {visa.entries}</p>
                  <span className="mt-5 inline-block text-[13px] font-medium underline decoration-[var(--cobblestone)] decoration-1 underline-offset-4">Learn more</span>
                </Link>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="resume-heading" className="paper-card mt-24">
          <div className="grid gap-8 px-6 py-8 md:grid-cols-[1fr_auto] md:items-center md:px-10 md:py-10">
            <div>
              <h2 className="display text-3xl text-balance md:text-4xl">Already started?</h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[var(--stone)] text-pretty">Resume an application, make a payment, upload a requested document or view your visa decision.</p>
            </div>
            <ButtonLink to="/find-application" variant="secondary" trailingIcon={<ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} />}>Find my application</ButtonLink>
          </div>
        </section>

        <section aria-labelledby="demo-heading" className="mt-24 rounded-3xl bg-[var(--linen)] p-6 sm:p-10 lg:p-12">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="display mt-3 text-[clamp(2rem,4vw,2.75rem)] leading-tight" id="demo-heading">Real demo states. No setup required.</h2><p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--stone)]">Use a fictional record to see a draft, respond to a requested document, or open a granted ETA. The credentials are provided openly for this demonstration.</p></div>
            <InlineLink className="shrink-0" to="/demo">See all demo credentials</InlineLink>
          </div>
          <DemoCredentials compact indices={[0, 3, 4]} />
        </section>

        <Notice className="mt-12" title="Prototype notice">This service is a demonstration of a redesigned Indian e-Visa journey. Use fictional details only. No application, payment or travel document is valid.</Notice>
      </PageFrame>
    </>
  )
}

export default Home
