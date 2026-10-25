import { COOLDOWN_DAYS } from "./location"

export const MESSAGES = {
  info: `You set your base location for free now. After your profile is submitted, you can change it once every ${COOLDOWN_DAYS} days. An active boost lifts that limit while it runs.`,
  changing: `You are changing your base location. After you save, you cannot change it again for ${COOLDOWN_DAYS} days unless a boost is active.`,
  boostActive: `You have an active boost, so the ${COOLDOWN_DAYS}-day limit is lifted while it runs. Your location stays where you set it when the boost ends, and the limit applies again.`,
  boostZones:
    "Boost zones are separate from your base location. You can pay to appear in other zones without moving your base.",
  locked: (date) =>
    `You changed your base location recently. You can change it again on ${date}, or sooner while a boost is active.`,
  geoUsing: "Using your current location.",
  geoOutside: "That location is outside Lagos. Pick a zone instead and we will use its centre.",
  geoDenied: "Location permission is blocked. Pick a zone instead and we will use its centre.",
  geoFailed: "We could not get your location. Pick a zone instead and we will use its centre.",
  geoUnsupported: "Your browser cannot share your location. Pick a zone instead.",
}
