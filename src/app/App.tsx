import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import Home from '@/pages/Home'
import Eligibility from '@/pages/Eligibility'
import VisaTypes from '@/pages/VisaTypes'
import VisaTypeDetail from '@/pages/VisaTypeDetail'
import Requirements from '@/pages/Requirements'
import EntryPoints from '@/pages/EntryPoints'
import Fees from '@/pages/Fees'
import Help from '@/pages/Help'
import Demo from '@/pages/Demo'
import Apply from '@/pages/Apply'
import ApplicationWizard from '@/pages/ApplicationWizard'
import Documents from '@/pages/Documents'
import Review from '@/pages/Review'
import Submitted from '@/pages/Submitted'
import Payment from '@/pages/Payment'
import PaymentVerify from '@/pages/PaymentVerify'
import FindApplication from '@/pages/FindApplication'
import ApplicationDashboard from '@/pages/ApplicationDashboard'
import Eta from '@/pages/Eta'
import PrintApplication from '@/pages/PrintApplication'
import Admin from '@/pages/Admin'
import AdminApplications from '@/pages/AdminApplications'
import AdminApplicationReview from '@/pages/AdminApplicationReview'
import NotFound from '@/pages/NotFound'

export function App() {
  return (
    <PublicLayout>
      <Routes>
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
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/applications" element={<AdminApplications />} />
        <Route path="/admin/applications/:applicationId" element={<AdminApplicationReview />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PublicLayout>
  )
}
