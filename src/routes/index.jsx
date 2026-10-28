import { createBrowserRouter } from "react-router-dom"
import PublicLayout from "@/layouts/PublicLayout"
import VendorLayout from "@/layouts/VendorLayout"
import AdminLayout from "@/layouts/AdminLayout"
import Stub from "@/pages/Stub"
import NotFound from "@/pages/NotFound"
import Forbidden from "@/pages/Forbidden"
import { RequireAuth, RequireRole } from "./guards"
import DevUI from "@/pages/DevUI"
import SignupPage from "@/features/auth/SignupPage"
import VerifyEmailPage from "@/features/auth/VerifyEmailPage"
import LoginPage from "@/features/auth/LoginPage"
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage"
import ResetPasswordPage from "@/features/auth/ResetPasswordPage"
import ChangePasswordPage from "@/features/auth/ChangePasswordPage"
import HomePage from "@/features/home/HomePage"
import OnboardingWizard from "@/features/vendor-onboarding/OnboardingWizard"
import OnboardingResume from "@/features/vendor-onboarding/OnboardingResume"
import SearchPage from "@/features/search/SearchPage"
import VendorProfilePage from "@/features/profile/VendorProfilePage"
const s = (title) => <Stub title={title} />

export const router = createBrowserRouter([
  { path: "/dev/ui", element: <DevUI /> },

  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/p/:slug", element: <VendorProfilePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/vendor-policy", element: s("Vendor Policy and Guidelines") },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/hire-response", element: s("Did you hire this vendor?") },
      { path: "/terms", element: s("Terms of Service") },
      { path: "/privacy", element: s("Privacy Policy") },
      {
        element: <RequireRole roles={["customer"]} />,
        children: [
          { path: "/account", element: s("Account settings") },
          { path: "/account/reviews", element: s("My reviews") },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [{ path: "/account/security", element: <ChangePasswordPage /> }],
  },

  {
    element: <RequireRole roles={["vendor"]} />,
    children: [
      {
        element: <VendorLayout />,
        children: [
          { path: "/vendor/onboarding", element: <OnboardingResume /> },
          { path: "/vendor/onboarding/:step", element: <OnboardingWizard /> },
          { path: "/vendor/onboarding/review", element: s("Review and submit") },
          { path: "/vendor/profile", element: s("My profile and dashboard") },
          { path: "/vendor/boosts", element: s("Boosts") },
          { path: "/vendor/boosts/checkout", element: s("Boost checkout") },
          { path: "/vendor/boosts/renew", element: s("Renew boost") },
          { path: "/vendor/payment/callback", element: s("Payment callback") },
        ],
      },
    ],
  },
  {
    element: <RequireRole roles={["admin"]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "/admin", element: s("Admin overview") },
          { path: "/admin/vendors", element: s("Vendor queue") },
          { path: "/admin/vendors/:id", element: s("Vendor detail") },
          { path: "/admin/categories", element: s("Categories") },
          { path: "/admin/zones", element: s("Zones") },
          { path: "/admin/pricing", element: s("Boost pricing") },
          { path: "/admin/payments", element: s("Revenue and payments") },
          { path: "/admin/reviews", element: s("Review moderation") },
          { path: "/admin/users", element: s("User lookup") },
          { path: "/admin/audit-log", element: s("Audit log") },
        ],
      },
    ],
  },
  { path: "/403", element: <Forbidden /> },
  { path: "*", element: <NotFound /> },
])
