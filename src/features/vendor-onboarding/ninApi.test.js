import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError, api } from "@/lib/api"
import { verifyNin } from "./ninApi"

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, api: { post: vi.fn(), get: vi.fn() } }
})

const NIN = "12345678901"
const apiError = (status, code, message = "x") => new ApiError({ status, code, message })

beforeEach(() => vi.clearAllMocks())

describe("verifyNin", () => {
  it("sends the NIN in the body only", async () => {
    api.post.mockResolvedValueOnce({ data: { data: { status: "PASS", lastFour: "8901" } } })
    await verifyNin(NIN)
    expect(api.post).toHaveBeenCalledWith("/verifications/nin", { nin: NIN })
  })

  it("keeps only 4 digits even if the server sends more", async () => {
    api.post.mockResolvedValueOnce({ data: { data: { status: "passed", lastFour: NIN } } })
    expect(await verifyNin(NIN)).toEqual({
      kind: "result",
      status: "passed",
      lastFour: "8901",
      reason: null,
    })
  })

  it("returns the reason for a failed check", async () => {
    api.post.mockResolvedValueOnce({ data: { data: { status: "FAIL", reason: "NIN not found" } } })
    expect(await verifyNin(NIN)).toMatchObject({
      kind: "result",
      status: "failed",
      reason: "NIN not found",
    })
  })

  it("reports a pending check", async () => {
    api.post.mockResolvedValueOnce({ data: { data: { status: "pending" } } })
    expect((await verifyNin(NIN)).status).toBe("pending")
  })

  it.each([
    [apiError(429, "RATE_LIMITED"), "rate_limited"],
    [apiError(0, "NETWORK_ERROR"), "network"],
    [apiError(409, "ALREADY_VERIFIED"), "already_verified"],
    [apiError(400, "VALIDATION"), "invalid"],
    [apiError(500, "UNKNOWN_ERROR"), "error"],
    [new Error(`boom ${NIN}`), "error"],
  ])("maps %#", async (error, kind) => {
    api.post.mockRejectedValueOnce(error)
    expect((await verifyNin(NIN)).kind).toBe(kind)
  })

  it("never lets the NIN come back out, whatever happens", async () => {
    const leaky = [
      new Error(`request failed for ${NIN}`),
      Object.assign(new Error("x"), { config: { data: JSON.stringify({ nin: NIN }) } }),
      apiError(500, "UNKNOWN_ERROR", `bad ${NIN}`),
    ]
    for (const error of leaky) {
      api.post.mockRejectedValueOnce(error)
      expect(JSON.stringify(await verifyNin(NIN))).not.toContain(NIN)
    }
  })
})
