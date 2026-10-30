import { http, delay } from "msw"
import { ok, fail } from "./respond"
import { guard, load, profileFor, save } from "./vendor.handlers"
import { MAX_ATTEMPTS, checkNin, isElevenDigits, recentAttempts, settleNin } from "./nin.rules"

const API = import.meta.env.VITE_API_URL

// Only the last 4 digits, the result and the attempt times are stored. Nothing here logs the request.
export const ninHandlers = [
  http.post(`${API}/verifications/nin`, async ({ request }) => {
    await delay(900)
    const { user, error } = guard(request)
    if (error) return error
    const { nin } = await request.json()
    if (!isElevenDigits(nin)) {
      return fail(400, "VALIDATION", "Check the highlighted fields.", {
        nin: "Your NIN must be exactly 11 digits, numbers only",
      })
    }

    const profiles = load()
    const profile = settleNin(profileFor(profiles, user))
    if (profile.ninVerification?.status === "passed") {
      return fail(409, "ALREADY_VERIFIED", "Your NIN has already been verified.")
    }
    const now = Date.now()
    const attempts = recentAttempts(profile, now)
    if (attempts.length >= MAX_ATTEMPTS) {
      return fail(429, "RATE_LIMITED", "Too many attempts. Please try again later.")
    }
    profile.ninAttempts = [...attempts, now]
    const lastFour = nin.slice(-4)

    // Test hook: a NIN ending in 2222 stays pending for 3 seconds, then passes.
    if (nin.endsWith("2222")) {
      profile.ninVerification = {
        status: "pending",
        lastFour,
        outcome: { status: "passed" },
        settleAt: now + 3000,
      }
      save(profiles)
      return ok({ status: "pending", lastFour })
    }

    const result = checkNin(nin)
    profile.ninVerification = {
      status: result.status,
      lastFour: result.status === "passed" ? lastFour : "",
      reason: result.reason ?? null,
    }
    save(profiles)
    return ok(profile.ninVerification)
  }),
]
