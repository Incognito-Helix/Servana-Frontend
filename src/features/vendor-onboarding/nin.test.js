import { describe, expect, it } from "vitest"
import {
  cleanLastFour,
  maskedNin,
  reasonText,
  redactNin,
  statusOf,
  toStatus,
  validateNin,
} from "./nin"

describe("NIN checks before any request", () => {
  it("accepts exactly 11 digits", () => expect(validateNin("12345678901")).toBe(""))

  it.each([
    ["", /Enter your/],
    ["1234567890", /exactly 11/],
    ["123456789012", /exactly 11/],
    ["1234567890a", /numbers only/],
    ["1234 5678 901", /numbers only/],
    ["123-456-7890", /numbers only/],
  ])("rejects %j", (input, pattern) => expect(validateNin(input)).toMatch(pattern))

  it("never repeats what was typed", () => {
    expect(validateNin("1234567890")).not.toContain("1234567890")
    expect(validateNin("123456789012")).not.toContain("123456789012")
  })
})

describe("reasons", () => {
  it("uses the PRD wording", () => {
    expect(reasonText("NIN_NOT_FOUND")).toBe("NIN not found")
    expect(reasonText("NIN not found")).toBe("NIN not found")
    expect(reasonText("NAME_MISMATCH")).toBe("Name does not match your account")
    expect(reasonText("name does not match")).toBe("Name does not match your account")
  })
  it("never shows unknown server text", () => {
    expect(reasonText("db error at 12345678901")).toBe("The check did not pass")
    expect(reasonText(null)).toBe("The check did not pass")
  })
})

describe("status values", () => {
  it("understands PASS, FAIL and the four states", () => {
    expect(toStatus("PASS")).toBe("passed")
    expect(toStatus("fail")).toBe("failed")
    expect(toStatus("Not Submitted")).toBe("not_submitted")
    expect(toStatus("pending")).toBe("pending")
    expect(toStatus("whatever")).toBeNull()
  })
  it("treats a profile with no check as not submitted", () => {
    expect(statusOf({})).toBe("not_submitted")
    expect(statusOf({ ninVerification: { status: "passed" } })).toBe("passed")
  })
})

describe("what may be shown", () => {
  it("keeps only the last 4 digits", () => {
    expect(cleanLastFour("12345678901")).toBe("8901")
    expect(cleanLastFour("8901")).toBe("8901")
    expect(cleanLastFour(null)).toBe("")
  })
  it("masks all but the last 4", () => expect(maskedNin("8901")).toBe("•••••••8901"))
  it("removes any 11-digit number from text", () => {
    expect(redactNin("failed for 12345678901 today")).toBe("failed for [removed] today")
  })
})
