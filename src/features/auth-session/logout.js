import { api } from "@/lib/api"
import { clearToken } from "@/lib/token"
import { useAuthStore } from "@/store/authStore"

export async function logout() {
  try {
    await api.post("/auth/logout")
  } catch {
    // still log out locally
  }
  clearToken()
  useAuthStore.getState().clearUser()
}
