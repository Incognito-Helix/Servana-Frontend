export const NIN_LENGTH = 11
export const MAX_ATTEMPTS = 3

// Checked in the browser before anything is sent. The messages never repeat what was typed.
export function validateNin(value) {
  const nin = String(value ?? "").trim()
  if (!nin) return `Enter your ${NIN_LENGTH}-digit NIN`
  if (!/^\d+$/.test(nin)) return "Use numbers only, with no spaces or dashes"
  if (nin.length !== NIN_LENGTH) return `Your NIN must be exactly ${NIN_LENGTH} digits`
  return ""
}

// The wording the PRD asks for. Anything unrecognised gets a generic line, never the server text.
export function reasonText(reason) {
  const text = String(reason ?? "")
    .toLowerCase()
    .replace(/_/g, " ")
  if (text.includes("not found")) return "NIN not found"
  if (text.includes("match")) return "Name does not match your account"
  return "The check did not pass"
}

export function toStatus(value) {
  const text = String(value ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
  if (text === "pass" || text === "passed") return "passed"
  if (text === "fail" || text === "failed") return "failed"
  if (text === "pending") return "pending"
  if (text === "not_submitted") return "not_submitted"
  return null
}

export const statusOf = (profile) => toStatus(profile?.ninVerification?.status) ?? "not_submitted"

// Only 4 digits are ever kept, even if the server sent more.
export const cleanLastFour = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(-4)

export const maskedNin = (lastFour) => (lastFour ? "•".repeat(7) + lastFour : "")

// Safety net for any text shown on screen.
export const redactNin = (text) => String(text ?? "").replace(/\d{11}/g, "[removed]")
