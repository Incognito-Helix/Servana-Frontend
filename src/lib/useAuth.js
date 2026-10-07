import { useAuthStore } from "@/store/authStore"

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)
  return { user, loading: status === "loading" }
}
