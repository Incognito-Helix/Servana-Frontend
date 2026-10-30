import { describe, expect, it } from "vitest"
import { checkNin, isElevenDigits, recentAttempts, settleNin } from "./nin.rules"

const DAY = 24 * 60 * 60 * 1000

describe("mock NIN rules (PRD 6.3)", () => {
  it("passes any other 11-digit NIN", () =>
    expect(checkNin("12345678901")).toEqual({ status: "passed" }))
  it("fails 0000 as not found", () =>
    expect(checkNin("12345670000")).toEqual({ status: "failed", reason: "NIN_NOT_FOUND" }))
  it("fails 1111 as a name mismatch", () =>
    expect(checkNin("12345671111")).toEqual({ status: "failed", reason: "NAME_MISMATCH" }))
  it("needs exactly 11 digits", () => {
    expect(isElevenDigits("12345678901")).toBe(true)
    for (const bad of ["1234567890", "123456789012", "1234567890a", "", null, 12345678901]) {
      expect(isElevenDigits(bad)).toBe(false)
    }
  })
})

describe("attempt window", () => {
  it("counts only the last 24 hours", () => {
    const now = Date.now()
    expect(
      recentAttempts({ ninAttempts: [now - 2 * DAY, now - DAY + 1000, now] }, now),
    ).toHaveLength(2)
    expect(recentAttempts({}, now)).toEqual([])
  })
})

describe("pending checks", () => {
  const pending = (settleAt) => ({
    ninVerification: {
      status: "pending",
      lastFour: "2222",
      outcome: { status: "passed" },
      settleAt,
    },
  })

  it("settle once their time is up", () => {
    expect(settleNin(pending(1000), 2000).ninVerification).toEqual({
      status: "passed",
      lastFour: "2222",
      reason: null,
    })
  })
  it("stay pending before then", () =>
    expect(settleNin(pending(5000), 2000).ninVerification.status).toBe("pending"))
  it("leave other results alone", () => {
    const done = { ninVerification: { status: "failed", reason: "NIN_NOT_FOUND" } }
    expect(settleNin(done, 9999)).toEqual(done)
  })
})
