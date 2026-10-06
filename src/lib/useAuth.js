// TEMPORARY until D03 (Zustand store + /auth/me). Same shape: { user, loading }.
export function useAuth() {
  const role = import.meta.env.VITE_DEV_ROLE // "", "customer", "vendor" or "admin"
  return { user: role ? { role } : null, loading: false }
}
