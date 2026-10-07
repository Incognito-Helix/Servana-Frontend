import { useEffect } from "react"
import { api, unwrap } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"

export default function AuthBootstrap({ children }) {
  const setUser = useAuthStore((s) => s.setUser)
  const clearUser = useAuthStore((s) => s.clearUser)

  useEffect(() => {
    // Local testing only. Stripped from production builds.
    const devRole = import.meta.env.DEV && import.meta.env.VITE_DEV_ROLE
    if (devRole) {
      setUser({ role: devRole })
      return
    }

    let cancelled = false
    api
      .get("/auth/me")
      .then((res) => {
        if (!cancelled) {
          const me = unwrap(res)
          setUser(me.user ?? me)
        }
      })
      .catch(() => {
        if (!cancelled) clearUser()
      })
    return () => {
      cancelled = true
    }
  }, [setUser, clearUser])

  return children
}
