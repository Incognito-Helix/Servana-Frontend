const PHONE_PATTERN = /^(?:\+234|234|0)([789][01]\d{8})$/

export function normalizeNigerianPhone(value) {
  const cleaned = String(value ?? "").replace(/[\s().-]/g, "")
  const match = PHONE_PATTERN.exec(cleaned)
  return match ? `+234${match[1]}` : null
}

export const isNigerianPhone = (value) => normalizeNigerianPhone(value) !== null

export function isHttpUrl(value) {
  try {
    const url = new URL(String(value).trim())
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".")
  } catch {
    return false
  }
}

const EMAIL_LIKE = /[^\s@]+@[^\s@]+\.[^\s@]+/
const PHONE_LIKE = /\+?\d(?:[ -]?\d){8,}/

export const containsContactInfo = (text) => EMAIL_LIKE.test(text) || PHONE_LIKE.test(text)
