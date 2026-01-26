import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { AuthLayout } from './layouts/AuthLayout'

// Pages
import { 
  HomePage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  PanelsPage,
  IndicatorsPage,
  RankingsPage,
  AdminReviewPage,
  ProfilePage,
  AboutPage,
  NotFoundPage,
} from '@/pages'

// Protected Route wrapper
import { ProtectedRoute } from '@/features/auth'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes with main layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/ranking" element={<RankingsPage />} />
      </Route>

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/champion-login" element={<LoginPage />} />
        <Route path="/champion-register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute><MainLayout showSidebar /></ProtectedRoute>}>
        <Route path="/champion-dashboard" element={<DashboardPage />} />
        <Route path="/champion-panels" element={<PanelsPage />} />
        <Route path="/champion-indicators" element={<IndicatorsPage />} />
        <Route path="/champion-profile" element={<ProfilePage />} />
        <Route path="/admin-review" element={<AdminReviewPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
