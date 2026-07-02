import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import InstallPrompt from './components/InstallPrompt';

import WelcomePage        from './pages/auth/WelcomePage';
import RoleLoginPage      from './pages/auth/RoleLoginPage';
import LoginPage          from './pages/auth/LoginPage';
import RegisterPage       from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from './pages/auth/ResetPasswordPage';
import OnboardingPage     from './pages/auth/OnboardingPage';

import DashboardPage  from './pages/main/DashboardPage';
import JobDetailPage  from './pages/main/JobDetailPage';
import ActiveJobPage  from './pages/main/ActiveJobPage';
import HistoryPage    from './pages/main/HistoryPage';
import EarningsPage   from './pages/main/EarningsPage';
import WithdrawPage   from './pages/main/WithdrawPage';
import TopupPage      from './pages/main/TopupPage';
import ProfilePage    from './pages/main/ProfilePage';
import ReceiptPage    from './pages/main/ReceiptPage';
import SupportPage       from './pages/main/SupportPage';
import VendorDashboard  from './pages/vendor/VendorDashboard';
import VendorOrderPage   from './pages/vendor/VendorOrderPage';
import RiderDashboard   from './pages/rider/RiderDashboard';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierOrderPage  from './pages/supplier/SupplierOrderPage';
import MoverDashboard    from './pages/mover/MoverDashboard';
import MoverRequestPage  from './pages/mover/MoverRequestPage';
import FleetPage         from './pages/mover/FleetPage';
import WaterCarrierDashboard from './pages/water/WaterCarrierDashboard';
import WaterDeliveryPage     from './pages/water/WaterDeliveryPage';
import CrewManagementPage from './pages/crew/CrewManagementPage';
import PartnerAgreementPage from './pages/main/PartnerAgreementPage';
import QualificationChecklistPage from './pages/main/QualificationChecklistPage';
import TermsPage from './pages/main/TermsPage';
import PrivacyPage from './pages/main/PrivacyPage';
import AIPolicyPage from './pages/main/AIPolicyPage';

function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                 element={<Navigate to="/welcome" />} />
          <Route path="/welcome"          element={<WelcomePage />} />
          <Route path="/signin"           element={<RoleLoginPage />} />
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/login/:role"      element={<LoginPage />} />
          <Route path="/register"         element={<RegisterPage />} />
          <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
          <Route path="/reset-password"   element={<ResetPasswordPage />} />
          <Route path="/onboarding"       element={<OnboardingPage />} />

          <Route path="/dashboard"     element={<AppLayout><DashboardPage /></AppLayout>} />
          <Route path="/job/:id"        element={<AppLayout><JobDetailPage /></AppLayout>} />
          <Route path="/active/:id"     element={<AppLayout><ActiveJobPage /></AppLayout>} />
          <Route path="/history"        element={<AppLayout><HistoryPage /></AppLayout>} />
          <Route path="/earnings"       element={<AppLayout><EarningsPage /></AppLayout>} />
          <Route path="/withdraw"       element={<AppLayout><WithdrawPage /></AppLayout>} />
          <Route path="/topup"          element={<AppLayout><TopupPage /></AppLayout>} />
          <Route path="/profile"        element={<AppLayout><ProfilePage /></AppLayout>} />
          <Route path="/support"        element={<AppLayout><SupportPage /></AppLayout>} />

          {/* ── Vendor routes ── */}
          <Route path="/vendor/dashboard" element={<AppLayout><VendorDashboard /></AppLayout>} />
          <Route path="/vendor/order/:id" element={<AppLayout><VendorOrderPage /></AppLayout>} />

          {/* ── Rider routes ── */}
          <Route path="/rider/dashboard"  element={<AppLayout><RiderDashboard /></AppLayout>} />
          <Route path="/rider/active"     element={<AppLayout><RiderDashboard /></AppLayout>} />

          {/* ── Supplier routes ── */}
          <Route path="/supplier/dashboard" element={<AppLayout><SupplierDashboard /></AppLayout>} />
          <Route path="/supplier/order/:id" element={<AppLayout><SupplierOrderPage /></AppLayout>} />

          {/* ── Mover routes ── */}
          <Route path="/mover/dashboard"    element={<AppLayout><MoverDashboard /></AppLayout>} />
          <Route path="/mover/request/:id"  element={<AppLayout><MoverRequestPage /></AppLayout>} />
          <Route path="/fleet"              element={<AppLayout><FleetPage /></AppLayout>} />

          {/* ── Water Carrier routes ── */}
          <Route path="/water/dashboard"     element={<AppLayout><WaterCarrierDashboard /></AppLayout>} />
          <Route path="/water/delivery/:id"  element={<AppLayout><WaterDeliveryPage /></AppLayout>} />

          {/* ── Partner agreement + qualification checklist (all roles) ── */}
          <Route path="/agreement"           element={<AppLayout><PartnerAgreementPage /></AppLayout>} />
          <Route path="/qualifications"      element={<AppLayout><QualificationChecklistPage /></AppLayout>} />

          {/* ── Legal documents (public) ── */}
          <Route path="/terms"      element={<TermsPage />} />
          <Route path="/privacy"    element={<PrivacyPage />} />
          <Route path="/ai-policy"  element={<AIPolicyPage />} />

          {/* ── Crew Management (movers / vendors / water carriers / suppliers) ── */}
          <Route path="/crew"               element={<AppLayout><CrewManagementPage /></AppLayout>} />

          <Route path="/receipt/:jobId" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
        <InstallPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
}
