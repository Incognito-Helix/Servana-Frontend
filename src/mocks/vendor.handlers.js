import { http, delay } from "msw"
import { ok, fail } from "./respond"
import { users, getSessionUser } from "./auth.handlers"
import { stepSavers, stepValidators } from "./vendor.validators"
import { hasActiveBoost } from "./boosts.handlers"
import { settleNin } from "./nin.rules"

const API = import.meta.env.VITE_API_URL
const STORAGE_KEY = "servana_mock_vendor_profiles"
const TOTAL_STEPS = 6
const PROTECTED = [
  "id",
  "userId",
  "status",
  "slug",
  "coverImageUrl",
  "profileImageUrl",
  "portfolioImages",
  "onboarding_step",
  "hasActiveBoost",
  "cooldownOverride",
  "ninVerification",
  "ninAttempts",
]
const view = (profile) => ({ ...profile, hasActiveBoost: hasActiveBoost(profile.userId) })

export const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

export const save = (profiles) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  } catch {
    // storage unavailable: progress will not survive a refresh
  }
}

const requestUser = (request) => {
  const auth = request.headers.get("Authorization") || ""
  return auth.startsWith("Bearer mock-token-")
    ? users.find((u) => u.id === auth.replace("Bearer mock-token-", ""))
    : getSessionUser()
}

export const guard = (request) => {
  const user = requestUser(request)
  if (!user) return { error: fail(401, "UNAUTHORIZED", "Log in") }
  if (user.role !== "vendor")
    return { error: fail(403, "FORBIDDEN", "Only vendors have a vendor profile.") }
  return { user }
}

export const profileFor = (profiles, user) => {
  if (!profiles[user.id]) {
    profiles[user.id] = {
      id: `p_${user.id}`,
      userId: user.id,
      status: "draft",
      slug: null,
      onboarding_step: 1,
    }
  }
  return profiles[user.id]
}

// ASSUMED shapes: the card calls the resume field onboarding_step. Confirm the rest with the backend lead.
export const vendorHandlers = [
  http.get(`${API}/vendors/profile`, async ({ request }) => {
    await delay(300)
    const { user, error } = guard(request)
    if (error) return error
    const profiles = load()
    const profile = profileFor(profiles, user)
    settleNin(profile)
    save(profiles)
    return ok(view(profile))
  }),

  // advance: false is an autosave (any partial data, no validation).
  // advance: true is "Save and continue" (validated, moves onboarding_step forward).
  http.patch(`${API}/vendors/profile`, async ({ request }) => {
    await delay(250)
    const { user, error } = guard(request)
    if (error) return error
    const { step, advance = false, data = {} } = await request.json()
    if (!Number.isInteger(step) || step < 1 || step > TOTAL_STEPS) {
      return fail(400, "VALIDATION", "Unknown onboarding step.")
    }
    const profiles = load()
    const profile = profileFor(profiles, user)
    settleNin(profile)

    if (step > profile.onboarding_step) {
      return fail(409, "STEP_LOCKED", "Finish the earlier steps first.")
    }
    if (advance) {
      const fieldErrors = stepValidators[step]?.(data, profile, profiles)
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        return fail(400, "VALIDATION", "Check the highlighted fields.", fieldErrors)
      }
    }
    const toSave = stepSavers[step] ? stepSavers[step](data, profile, advance) : data
    for (const [key, value] of Object.entries(toSave)) {
      if (!PROTECTED.includes(key)) profile[key] = value
    }

    if (advance) profile.onboarding_step = Math.max(profile.onboarding_step, step + 1)
    save(profiles)
    return ok(view(profile))
  }),
]
