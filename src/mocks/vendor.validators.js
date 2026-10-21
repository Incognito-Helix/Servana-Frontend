import { categories, vendors } from "./fixtures"
import {
  containsContactInfo,
  isHttpUrl,
  normalizeNigerianPhone,
} from "@/features/vendor-onboarding/validators"

const SEEDED_TAKEN = ["+2348031234567"]

const activeServices = () => categories.filter((c) => c.active !== false).flatMap((c) => c.children)

const takenByOthers = (phone, profile, profiles) => {
  const taken = new Set([...vendors.map((v) => normalizeNigerianPhone(v.phone)), ...SEEDED_TAKEN])
  for (const other of Object.values(profiles ?? {})) {
    if (other.userId !== profile.userId && other.phone)
      taken.add(normalizeNigerianPhone(other.phone))
  }
  return taken.has(phone)
}

function step1(data) {
  const errors = {}
  const name = (data.businessName ?? "").trim()
  if (name.length < 2 || name.length > 80)
    errors.businessName = "Business name must be 2 to 80 characters"

  const active = activeServices()
  if (!data.primaryService) errors.primaryService = "Pick your main service"
  else if (!active.includes(data.primaryService))
    errors.primaryService = "That service is not available"

  const others = Array.isArray(data.otherServices) ? data.otherServices : []
  if (others.length > 3) errors.otherServices = "Pick up to 3 other services"
  else if (others.includes(data.primaryService))
    errors.otherServices = "Your main service cannot be repeated here"
  else if (new Set(others).size !== others.length)
    errors.otherServices = "Each service can only be picked once"
  else if (others.some((s) => !active.includes(s)))
    errors.otherServices = "One of those services is not available"

  const about = data.about ?? ""
  if (about.length > 500) errors.about = "Keep it under 500 characters"
  else if (containsContactInfo(about)) {
    errors.about = "Remove phone numbers and email addresses from your about section"
  }
  return errors
}

function step2(data, profile, profiles) {
  const errors = {}
  const phone = normalizeNigerianPhone(data.phone)
  if (!data.phone) errors.phone = "Enter your phone number"
  else if (!phone)
    errors.phone = "Enter a valid Nigerian number, like 0803 123 4567 or +234 803 123 4567"
  else if (takenByOthers(phone, profile, profiles)) {
    errors.phone =
      "That phone number is already used by another vendor. Use a different number or contact support."
  }

  if (!normalizeNigerianPhone(data.whatsapp || data.phone)) {
    errors.whatsapp = "Enter a valid Nigerian WhatsApp number"
  }
  for (const [key, value] of Object.entries(data.socials ?? {})) {
    if (value && !isHttpUrl(value))
      errors[`socials.${key}`] = "Enter a full link starting with https://"
  }
  return errors
}

export const stepValidators = { 1: step1, 2: step2 }
