import { categories, vendors, zones } from "./fixtures"
import {
  containsContactInfo,
  isHttpUrl,
  normalizeNigerianPhone,
} from "@/features/vendor-onboarding/validators"
import {
  MAX_RADIUS_KM,
  baseChanged,
  cooldownEnd,
  insideLagos,
  isLocked,
  isTechCreativeService,
} from "@/features/vendor-onboarding/location"
import { hasActiveBoost } from "./boosts.handlers"
import { formatLagosDate } from "@/lib/dates"

const SEEDED_TAKEN = ["+2348031234567"]
const BASE_KEYS = ["state", "city", "zone", "locationSource", "latitude", "longitude"]

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

function step3(data, profile) {
  const errors = {}
  const zone = zones.find((z) => z.id === data.zone)
  if (!data.state) errors.state = "Pick your state"
  if (!data.city) errors.city = "Pick your city"
  if (!data.zone) errors.zone = "Pick your zone"
  else if (!zone) errors.zone = "That zone is not available"
  else if (zone.state !== data.state || zone.city !== data.city)
    errors.zone = "That zone is not in the selected city"

  if (data.latitude != null || data.longitude != null) {
    if (!insideLagos(data.latitude, data.longitude))
      errors.latitude = "Your location must be inside Lagos"
  }

  if (data.worksRemotely && !isTechCreativeService(categories, profile.primaryService)) {
    errors.worksRemotely = "Works remotely is only for Tech and creative services"
  }
  if (data.homeService && !data.worksRemotely) {
    const radius = Number(data.travelRadiusKm)
    if (!Number.isInteger(radius) || radius < 1 || radius > MAX_RADIUS_KM) {
      errors.travelRadiusKm = `Enter how far you will travel, from 1 to ${MAX_RADIUS_KM} km`
    }
  }

  const view = {
    ...profile,
    hasActiveBoost: Boolean(profile.hasActiveBoost) || hasActiveBoost(profile.userId),
  }
  if (!errors.zone && isLocked(view) && baseChanged(profile, data)) {
    errors.zone = `You changed your base location recently. You can change it again on ${formatLagosDate(cooldownEnd(profile))}, or sooner while a boost is active.`
  }

  return errors
}
function step4(data) {
  const errors = {}
  const services = Array.isArray(data.services) ? data.services : []
  if (services.length < 1) errors.services = "Add at least one service"
  else if (services.length > 20) errors.services = "You can add up to 20 services"

  const seen = new Set()
  services.forEach((service, i) => {
    const name = String(service.name ?? "").trim()
    if (name.length < 2 || name.length > 60)
      errors[`services.${i}.name`] = "Service name must be 2 to 60 characters"
    else if (seen.has(name.toLowerCase()))
      errors[`services.${i}.name`] = "You already added this service"
    seen.add(name.toLowerCase())

    const start = service.priceFromKobo
    if (!Number.isInteger(start) || start <= 0)
      errors[`services.${i}.startPrice`] = "Enter a starting price above ₦0"
    const max = service.maxPriceKobo
    if (max != null) {
      if (!Number.isInteger(max) || max <= 0)
        errors[`services.${i}.maxPrice`] = "Enter a valid max price, or leave it empty"
      else if (Number.isInteger(start) && max < start) {
        errors[`services.${i}.maxPrice`] = "Max price cannot be below the starting price"
      }
    }
  })
  return errors
}

function step5(data, profile) {
  const errors = {}
  if (!profile.coverImageUrl) errors.coverImage = "Add a cover image"
  if (!profile.profileImageUrl) errors.profileImage = "Add a profile photo"
  if (!(profile.portfolioImages ?? []).length) errors.portfolio = "Add at least one portfolio image"
  return errors
}

export const stepValidators = { 1: step1, 2: step2, 3: step3, 4: step4, 5: step5 }

// Decides what is actually stored. After setup, a base location change is only
// committed with "Save and continue" (never by autosave), and that stamps the cooldown.
export const stepSavers = {
  1: (data, profile) =>
    isTechCreativeService(categories, data.primaryService) || !profile.worksRemotely
      ? data
      : { ...data, worksRemotely: false },

  3: (data, profile, advance) => {
    const clean = { ...data }
    delete clean.baseLocationChangedAt
    if (profile.status === "draft" || !baseChanged(profile, clean)) return clean
    if (!advance) {
      for (const key of BASE_KEYS) delete clean[key]
      return clean
    }
    return { ...clean, baseLocationChangedAt: new Date().toISOString() }
  },
}
