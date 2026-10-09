export const OTP_LENGTH = 6
export const OTP_EXPIRY_SECONDS = 10 * 60 // PRD 6.1: code expires in 10 minutes
export const RESEND_COOLDOWN_SECONDS = 60 // our choice, not in the PRD

// Keeps digits only, so pasting "123 456" or "123-456" still works.
export const normalizeOtp = (value) => (value || "").replace(/\D/g, "").slice(0, OTP_LENGTH)

export const isCompleteOtp = (value) => value.length === OTP_LENGTH

export function formatCountdown(totalSeconds) {
  const s = Math.max(0, totalSeconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}
