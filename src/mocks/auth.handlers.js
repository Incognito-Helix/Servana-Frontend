import { http, delay } from "msw"
import { ok, fail } from "./respond"

const API = import.meta.env.VITE_API_URL
const SESSION_KEY = "servana_mock_session"
const MAX_FAILED_LOGINS = 5

// Test accounts. Password for all: Password1!
export const users = [
  {
    id: "u_customer",
    name: "Ada Okafor",
    email: "customer@servana.test",
    password: "Password1!",
    role: "customer",
  },
  {
    id: "u_vendor",
    name: "Bisi Makeovers",
    email: "vendor@servana.test",
    password: "Password1!",
    role: "vendor",
  },
  {
    id: "u_admin",
    name: "Servana Admin",
    email: "admin@servana.test",
    password: "Password1!",
    role: "admin",
  },
  {
    id: "u_suspended",
    name: "Suspended User",
    email: "suspended@servana.test",
    password: "Password1!",
    role: "customer",
    suspended: true,
  },
]

const failedLogins = new Map()
export const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })

const getSessionUser = () => {
  try {
    const id = sessionStorage.getItem(SESSION_KEY)
    return users.find((u) => u.id === id) ?? null
  } catch {
    return null
  }
}

export const setSession = (id) => {
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id)
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // storage unavailable: the mock session just will not survive a refresh
  }
}

export const authHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    await delay(300)
    const { email = "", password = "" } = await request.json()
    const key = email.trim().toLowerCase()

    if (!key || !password) {
      return fail(400, "VALIDATION", "Check the highlighted fields.", {
        ...(!key && { email: "Enter your email" }),
        ...(!password && { password: "Enter your password" }),
      })
    }
    if ((failedLogins.get(key) ?? 0) >= MAX_FAILED_LOGINS) {
      return fail(429, "RATE_LIMITED", "Too many attempts. Please try again in 15 minutes.")
    }

    const user = users.find((u) => u.email === key)
    if (!user || user.password !== password) {
      failedLogins.set(key, (failedLogins.get(key) ?? 0) + 1)
      return fail(401, "INVALID_CREDENTIALS", "Invalid email or password.")
    }
    if (user.suspended) {
      return fail(403, "ACCOUNT_SUSPENDED", "This account has been suspended. Contact support.")
    }

    failedLogins.delete(key)
    setSession(user.id)
    return ok(publicUser(user))
  }),

  http.get(`${API}/auth/me`, async () => {
    await delay(200)
    const user = getSessionUser()
    return user ? ok(publicUser(user)) : fail(401, "UNAUTHORIZED", "Log in")
  }),

  http.post(`${API}/auth/logout`, async () => {
    setSession(null)
    return ok({})
  }),

  // ASSUMED contract: confirm with the backend lead.
  // A credential containing "existing" signs in the customer account.
  // Any other credential is a NEW Google user who must send role + acceptedTerms.
  http.post(`${API}/auth/google`, async ({ request }) => {
    await delay(300)
    const { credential, role, acceptedTerms } = await request.json()
    if (!credential) return fail(400, "VALIDATION", "Missing Google credential.")

    if (credential.includes("existing")) {
      const user = users[0]
      setSession(user.id)
      return ok(publicUser(user))
    }
    if (!role || acceptedTerms !== true) {
      return ok({
        needsOnboarding: true,
        profile: { name: "New Google User", email: "newuser@gmail.test" },
      })
    }
    if (!["customer", "vendor"].includes(role)) {
      return fail(400, "VALIDATION", "Pick a role.", { role: "Pick a role" })
    }

    const user = {
      id: `u_${Date.now()}`,
      name: "New Google User",
      email: "newuser@gmail.test",
      password: "",
      role,
    }
    users.push(user)
    setSession(user.id)
    return ok(publicUser(user), 201)
  }),
]
