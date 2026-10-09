import { describe, it, expect } from "vitest"
import { normalizeOtp, isCompleteOtp, formatCountdown } from "./otp"

describe("otp helpers", () => {
  it("keeps digits only", () => {
    expect(normalizeOtp("123 456")).toBe("123456")
    expect(normalizeOtp("12-34-56")).toBe("123456")
    expect(normalizeOtp("abc12")).toBe("12")
  })
  it("caps the code at 6 digits", () => {
    expect(normalizeOtp("12345678")).toBe("123456")
  })
  it("knows when the code is complete", () => {
    expect(isCompleteOtp("12345")).toBe(false)
    expect(isCompleteOtp("123456")).toBe(true)
  })
  it("formats the countdown", () => {
    expect(formatCountdown(600)).toBe("10:00")
    expect(formatCountdown(65)).toBe("1:05")
    expect(formatCountdown(-3)).toBe("0:00")
  })
})
