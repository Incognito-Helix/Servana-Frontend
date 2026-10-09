import { http, delay } from "msw"
import { ok, fail } from "./respond"
import { users, publicUser, setSession } from "./auth.handlers"

const API = import.meta.env.VITE_API_URL
const VALID_OTP = "123456"
const EXPIRED_OTP = "000000"
const MAX_WRONG_OTP = 5
const RESEND_COOLDOWN_MS = 60 * 1000

const pending = new Map()
const wrongAttempts = new Map()
const lastResend = new Map()

const keyOf = (email = "") => email.trim().toLowerCase()
const otpError = (code, message) => fail(400, code, message, { otp: message })

export const signupHandlers = [
  http.post(`${API}/auth/register`, async ({ request }) => {
    await delay(400)
    const body = await request.json()
    const email = keyOf(body.email)
    if (!email) {
      return fail(400, "VALIDATION", "Check the highlighted fields.", { email: "Enter your email" })
    }
    if (users.some((u) => u.email === email)) {
      return fail(409, "EMAIL_TAKEN", "An account with this email already exists.", {
        email: "An account with this email already exists",
      })
    }
    const name =
      body.name ?? ([body.firstName, body.lastName].filter(Boolean).join(" ") || "New User")
    pending.set(email, {
      id: `u_${Date.now()}`,
      name,
      email,
      password: body.password ?? "",
      role: body.role === "vendor" ? "vendor" : "customer",
    })
    wrongAttempts.delete(email)
    lastResend.set(email, Date.now())
    console.info(`[MSW] Verification code for ${email}: ${VALID_OTP}`)
    return ok({ email }, 201)
  }),

  http.post(`${API}/auth/verify-email`, async ({ request }) => {
    await delay(400)
    const { email: rawEmail, otp = "" } = await request.json()
    const email = keyOf(rawEmail)
    const user = pending.get(email)

    if ((wrongAttempts.get(email) ?? 0) >= MAX_WRONG_OTP) {
      return fail(429, "RATE_LIMITED", "Too many attempts. Please request a new code.")
    }
    if (otp === EXPIRED_OTP) {
      return otpError("OTP_EXPIRED", "That code has expired. Request a new one.")
    }
    if (!user || otp !== VALID_OTP) {
      wrongAttempts.set(email, (wrongAttempts.get(email) ?? 0) + 1)
      return otpError("INVALID_OTP", "That code is incorrect. Check the email and try again.")
    }

    pending.delete(email)
    wrongAttempts.delete(email)
    users.push(user)
    setSession(user.id)
    return ok(publicUser(user))
  }),

  http.post(`${API}/auth/resend-otp`, async ({ request }) => {
    await delay(300)
    const { email: rawEmail } = await request.json()
    const email = keyOf(rawEmail)
    if (Date.now() - (lastResend.get(email) ?? 0) < RESEND_COOLDOWN_MS) {
      return fail(429, "RATE_LIMITED", "Please wait a minute before requesting another code.")
    }
    if (pending.has(email)) {
      lastResend.set(email, Date.now())
      wrongAttempts.delete(email)
      console.info(`[MSW] Verification code for ${email}: ${VALID_OTP}`)
    }
    return ok({})
  }),
]
