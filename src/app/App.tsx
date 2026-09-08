import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { RouteErrorBoundary } from '@/components/layout/RouteErrorBoundary'
import { RouteExperience } from '@/components/layout/RouteExperience'
import { PublicLayout } from '@/components/layout/PublicLayout'
import Home from '@/pages/Home'
const Eligibility = lazy(() => import('@/pages/Eligibility'))
const VisaTypes = lazy(() => import('@/pages/VisaTypes'))
const VisaTypeDetail = lazy(() => import('@/pages/VisaTypeDetail'))
const Requirements = lazy(() => import('@/pages/Requirements'))
const EntryPoints = lazy(() => import('@/pages/EntryPoints'))
const Fees = lazy(() => import('@/pages/Fees'))
const Help = lazy(() => import('@/pages/Help'))
const Demo = lazy(() => import('@/pages/Demo'))
const Apply = lazy(() => import('@/pages/Apply'))
const ApplicationWizard = lazy(() => import('@/pages/ApplicationWizard'))
const Documents = lazy(() => import('@/pages/Documents'))
const Review = lazy(() => import('@/pages/Review'))
const Submitted = lazy(() => import('@/pages/Submitted'))
const Payment = lazy(() => import('@/pages/Payment'))
const PaymentVerify = lazy(() => import('@/pages/PaymentVerify'))
const FindApplication = lazy(() => import('@/pages/FindApplication'))
const ApplicationDashboard = lazy(() => import('@/pages/ApplicationDashboard'))
const Eta = lazy(() => import('@/pages/Eta'))
const PrintApplication = lazy(() => import('@/pages/PrintApplication'))
const Admin = lazy(() => import('@/pages/Admin'))
const AdminApplications = lazy(() => import('@/pages/AdminApplications'))
const AdminApplicationReview = lazy(() => import('@/pages/AdminApplicationReview'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export function App() {
  const { pathname } = useLocation()
  return (
    <>
      <RouteExperience />
      <RouteErrorBoundary key={pathname}>
      <Suspense fallback={<main id="main-content" tabIndex={-1} className="shell min-h-[70vh] py-20" aria-busy="true"><p role="status">Loading page…</p></main>}>
      <Routes>
        <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/eligibility" element={<Eligibility />} />
        <Route path="/visa-types" element={<VisaTypes />} />
        <Route path="/visa-types/:slug" element={<VisaTypeDetail />} />
        <Route path="/requirements" element={<Requirements />} />
        <Route path="/entry-points" element={<EntryPoints />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/help" element={<Help />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/apply/:applicationId" element={<ApplicationWizard />} />
        <Route path="/apply/:applicationId/documents" element={<Documents />} />
        <Route path="/apply/:applicationId/review" element={<Review />} />
        <Route path="/apply/:applicationId/submitted" element={<Submitted />} />
        <Route path="/payment/verify" element={<PaymentVerify />} />
        <Route path="/payment/:applicationId" element={<Payment />} />
        <Route path="/find-application" element={<FindApplication />} />
        <Route path="/application/:applicationId" element={<ApplicationDashboard />} />
        <Route path="/application/:applicationId/documents" element={<Documents />} />
        <Route path="/application/:applicationId/eta" element={<Eta />} />
        <Route path="/application/:applicationId/print" element={<PrintApplication />} />
        <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/applications" element={<AdminApplications />} />
        <Route path="/admin/applications/:applicationId" element={<AdminApplicationReview />} />
      </Routes>
      </Suspense>
      </RouteErrorBoundary>
    </>
  )
}
