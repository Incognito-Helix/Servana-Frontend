import { ApiError, api, unwrap } from "@/lib/api"
import { cleanLastFour, toStatus } from "./nin"

function resultOutcome(data) {
  const status = toStatus(data?.status ?? data?.result)
  if (!status || status === "not_submitted") return { kind: "error" }
  return {
    kind: "result",
    status,
    lastFour: cleanLastFour(data?.lastFour),
    reason: status === "failed" ? (data?.reason ?? data?.message ?? null) : null,
  }
}

function errorOutcome(error) {
  if (!(error instanceof ApiError)) return { kind: "error" }
  if (error.status === 429) return { kind: "rate_limited" }
  if (error.status === 0) return { kind: "network" }
  if (error.code === "ALREADY_VERIFIED") return { kind: "already_verified" }
  if (error.code === "NIN_NOT_FOUND" || error.code === "NAME_MISMATCH") {
    return { kind: "result", status: "failed", lastFour: "", reason: error.code }
  }
  if (error.status === 400 && (error.code === "VALIDATION" || error.fieldErrors?.nin))
    return { kind: "invalid" }
  return { kind: "error" }
}

// The number goes in the request body and nowhere else. Every failure comes back as a small
// result object, so nothing that could carry the request body is ever thrown or passed on.
export async function verifyNin(nin) {
  try {
    return resultOutcome(unwrap(await api.post("/verifications/nin", { nin })))
  } catch (error) {
    return errorOutcome(error)
  }
}
