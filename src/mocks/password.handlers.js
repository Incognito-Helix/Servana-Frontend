import { http, delay } from "msw"
import { ok, fail } from "./respond"
import { users, getSessionUser } from "./auth.handlers"

const API = import.meta.env.VITE_API_URL

// Test tokens: good-token works once (after a forgot-password request for a real email),
// used-token is already used, expired-token has expired.
const used = new Set(["used-token"])
const tokenEmail = new Map()

const requestUser = (request) => {
  const auth = request.headers.get("Authorization") || ""
  return auth.startsWith("Bearer mock-token-")
    ? users.find((u) => u.id === auth.replace("Bearer mock-token-", ""))
    : getSessionUser()
}

export const passwordHandlers = [
  // Same answer whether or not the email exists.
  http.post(`${API}/auth/forgot-password`, async ({ request }) => {
    await delay(500)
    const { email = "" } = await request.json()
    const key = email.trim().toLowerCase()
    if (!key)
      return fail(400, "VALIDATION", "Check the highlighted fields.", { email: "Enter your email" })
    if (users.some((u) => u.email === key)) {
      tokenEmail.set("good-token", key)
      used.delete("good-token")
      console.info(
        `[MSW] Reset link for ${key}: ${window.location.origin}/reset-password?token=good-token`,
      )
    }
    return ok({})
  }),

  http.post(`${API}/auth/reset-password`, async ({ request }) => {
    await delay(400)
    const { token = "", password = "" } = await request.json()
    if (token === "expired-token") {
      return fail(400, "TOKEN_EXPIRED", "This reset link has expired. Request a new one.")
    }
    if (used.has(token)) {
      return fail(400, "TOKEN_USED", "This reset link has already been used. Request a new one.")
    }
    const user = users.find((u) => u.email === tokenEmail.get(token))
    if (!user) return fail(400, "TOKEN_INVALID", "This reset link is not valid. Request a new one.")
    if (!password)
      return fail(400, "VALIDATION", "Check the highlighted fields.", {
        password: "Enter a new password",
      })
    user.password = password
    used.add(token)
    return ok({})
  }),

  http.post(`${API}/auth/change-password`, async ({ request }) => {
    await delay(400)
    const user = requestUser(request)
    if (!user) return fail(401, "UNAUTHORIZED", "Log in")
    const { currentPassword = "", newPassword = "" } = await request.json()
    if (currentPassword !== user.password) {
      return fail(400, "WRONG_PASSWORD", "Current password is incorrect.", {
        currentPassword: "Current password is incorrect",
      })
    }
    if (newPassword === currentPassword) {
      return fail(400, "VALIDATION", "Choose a different password.", {
        newPassword: "Choose a password you have not used before",
      })
    }
    user.password = newPassword
    return ok({})
  }),
]
