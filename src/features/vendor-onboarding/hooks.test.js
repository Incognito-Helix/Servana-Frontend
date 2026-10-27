import { describe, expect, it } from "vitest"
import { mergeProfile } from "./hooks"

describe("mergeProfile", () => {
  it("never lowers the saved step", () => {
    expect(mergeProfile({ onboarding_step: 4 }, { onboarding_step: 3, about: "x" })).toEqual({
      onboarding_step: 4,
      about: "x",
    })
  })
  it("moves forward", () => {
    expect(mergeProfile({ onboarding_step: 2 }, { onboarding_step: 3 }).onboarding_step).toBe(3)
  })
  it("works with no earlier data", () => {
    expect(mergeProfile(undefined, { onboarding_step: 2 })).toEqual({ onboarding_step: 2 })
  })
})
