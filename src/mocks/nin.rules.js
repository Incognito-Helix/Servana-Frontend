export const MAX_ATTEMPTS = 3
const DAY_MS = 24 * 60 * 60 * 1000

export const isElevenDigits = (value) => typeof value === "string" && /^\d{11}$/.test(value)

// Mock rules from PRD 6.3: 0000 is "NIN not found", 1111 is "name does not match", anything else passes.
export function checkNin(nin) {
  if (nin.endsWith("0000")) return { status: "failed", reason: "NIN_NOT_FOUND" }
  if (nin.endsWith("1111")) return { status: "failed", reason: "NAME_MISMATCH" }
  return { status: "passed" }
}

export const recentAttempts = (profile, now = Date.now()) =>
  (profile.ninAttempts ?? []).filter((time) => now - time < DAY_MS)

// A "pending" check settles once its time is up (mock only: it lets you see the pending screen).
export function settleNin(profile, now = Date.now()) {
  const check = profile.ninVerification
  if (check?.status === "pending" && now >= (check.settleAt ?? 0)) {
    profile.ninVerification = {
      status: check.outcome.status,
      lastFour: check.lastFour,
      reason: check.outcome.reason ?? null,
    }
  }
  return profile
}
