import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/useAuth"

function useLoginRedirect() {
  const { pathname, search } = useLocation()
  return `/login?next=${encodeURIComponent(pathname + search)}`
}

export function RequireAuth() {
  const { user, loading } = useAuth()
  const loginUrl = useLoginRedirect()
  if (loading) return <p className="p-6">Loading...</p>
  if (!user) return <Navigate to={loginUrl} replace />
  return <Outlet />
}

export function RequireRole({ roles }) {
  const { user, loading } = useAuth()
  const loginUrl = useLoginRedirect()
  if (loading) return <p className="p-6">Loading...</p>
  if (!user) return <Navigate to={loginUrl} replace />
  if (!roles.includes(user.role)) return <Navigate to="/403" replace />
  return <Outlet />
}
