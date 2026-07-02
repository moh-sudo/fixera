import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useTheme } from './hooks/useTheme';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute    from './components/AdminRoute';
import FixeraAI from './components/FixeraAI';
import InstallPrompt from './components/InstallPrompt';
import AdminLoginPage from './pages/admin/AdminLoginPage';

// Lazy-load admin dashboard — keeps all admin/wallet service code out of the customer bundle
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

import WelcomePage             from './pages/auth/WelcomePage';
import LoginPage               from './pages/auth/LoginPage';
import SignUpPage              from './pages/auth/SignUpPage';
import ForgotPasswordPage      from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage       from './pages/auth/ResetPasswordPage';

import HomePage                from './pages/main/HomePage';
import ServiceCategoryPage     from './pages/main/ServiceCategoryPage';
import SubServicePage          from './pages/main/SubServicePage';
import BookingFormPage         from './pages/main/BookingFormPage';
import BookingConfirmationPage from './pages/main/BookingConfirmationPage';
import WorkerAssignmentPage    from './pages/main/WorkerAssignmentPage';
import PaymentPage             from './pages/main/PaymentPage';
import ReviewPage              from './pages/main/ReviewPage';
import BookingHistoryPage      from './pages/main/BookingHistoryPage';
import SupportPage              from './pages/main/SupportPage';
import ProfilePage              from './pages/main/ProfilePage';
import InspectionRequestPage    from './pages/main/InspectionRequestPage';
import InspectionDashboardPage  from './pages/main/InspectionDashboardPage';
import QuotationPage            from './pages/main/QuotationPage';
import ReceiptPage              from './pages/main/ReceiptPage';
import LaundryPage             from './pages/main/LaundryPage';
import CarpetWashingPage       from './pages/main/CarpetWashingPage';
import MoversPage              from './pages/main/MoversPage';
import MovingRequestStatusPage from './pages/main/MovingRequestStatusPage';
import WaterDeliveryStatusPage from './pages/main/WaterDeliveryStatusPage';
import CustomerOrderTrackPage from './pages/main/CustomerOrderTrackPage';
import SupplierShopPage from './pages/main/SupplierShopPage';
import SupplierOrderTrackPage from './pages/main/SupplierOrderTrackPage';
import DocumentsPage from './pages/main/DocumentsPage';
import TermsPage               from './pages/main/TermsPage';
import PrivacyPage             from './pages/main/PrivacyPage';
import AIPolicyPage            from './pages/main/AIPolicyPage';
import AboutPage               from './pages/main/AboutPage';
import FAQPage                 from './pages/main/FAQPage';
import DesignSystemPage        from './pages/DesignSystemPage';
import WalletPage              from './pages/main/WalletPage';

function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  useTheme(); // starts the auto day/night timer

  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Auth — no sidebar */}
        <Route path="/"                element={<WelcomePage />} />
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/signup"          element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* Main app — with sidebar */}
        <Route path="/home"   element={<AppLayout><HomePage /></AppLayout>} />
        <Route path="/service/:serviceId"             element={<AppLayout><ServiceCategoryPage /></AppLayout>} />
        <Route path="/service/:serviceId/:categoryId" element={<AppLayout><SubServicePage /></AppLayout>} />
        <Route path="/book/:serviceId/:categoryId/:subServiceId"    element={<AppLayout><BookingFormPage /></AppLayout>} />
        <Route path="/confirm/:serviceId/:categoryId/:subServiceId" element={<AppLayout><BookingConfirmationPage /></AppLayout>} />
        <Route path="/worker/:bookingId" element={<AppLayout><WorkerAssignmentPage /></AppLayout>} />
        <Route path="/payment" element={<AppLayout><PaymentPage /></AppLayout>} />
        <Route path="/review"             element={<AppLayout><ReviewPage /></AppLayout>} />
        <Route path="/review/:bookingId"  element={<AppLayout><ReviewPage /></AppLayout>} />
        <Route path="/history" element={<AppLayout><BookingHistoryPage /></AppLayout>} />
        <Route path="/support"    element={<AppLayout><SupportPage /></AppLayout>} />
        <Route path="/profile"    element={<AppLayout><ProfilePage /></AppLayout>} />
        <Route path="/wallet"     element={<AppLayout><WalletPage /></AppLayout>} />
        <Route path="/inspections"   element={<AppLayout><InspectionDashboardPage /></AppLayout>} />
        <Route path="/inspection"    element={<AppLayout><InspectionRequestPage /></AppLayout>} />
        <Route path="/quotation/:id" element={<AppLayout><QuotationPage /></AppLayout>} />
        <Route path="/receipt/:bookingId"  element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />
        <Route path="/laundry"            element={<AppLayout><LaundryPage /></AppLayout>} />
        <Route path="/carpet-washing"     element={<AppLayout><CarpetWashingPage /></AppLayout>} />
        <Route path="/movers"             element={<AppLayout><MoversPage /></AppLayout>} />
        <Route path="/movers/request/:id" element={<AppLayout><MovingRequestStatusPage /></AppLayout>} />
        <Route path="/water/delivery/:id" element={<AppLayout><WaterDeliveryStatusPage /></AppLayout>} />
        <Route path="/track/:id" element={<AppLayout><CustomerOrderTrackPage /></AppLayout>} />
        <Route path="/shop" element={<AppLayout><SupplierShopPage /></AppLayout>} />
        <Route path="/supplier-order/:id" element={<AppLayout><SupplierOrderTrackPage /></AppLayout>} />
        <Route path="/documents" element={<AppLayout><DocumentsPage /></AppLayout>} />
        <Route path="/faq"                element={<AppLayout><FAQPage /></AppLayout>} />
        <Route path="/terms"              element={<TermsPage />} />
        <Route path="/privacy"            element={<PrivacyPage />} />
        <Route path="/ai-policy"          element={<AIPolicyPage />} />
        <Route path="/about"              element={<AboutPage />} />

        {/* Design System showcase — public preview (Phase 2) */}
        <Route path="/design-system"      element={<DesignSystemPage />} />

        {/* Admin — separate login portal */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminRoute><Suspense fallback={null}><AdminDashboard /></Suspense></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <FixeraAI />
      <InstallPrompt />
    </BrowserRouter>
    </AuthProvider>
  );
}
