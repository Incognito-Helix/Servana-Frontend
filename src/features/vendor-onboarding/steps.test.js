import { describe, expect, it } from "vitest"
import { currentStepOf, parseStep, resumePath, REVIEW_PATH } from "./steps"

describe("onboarding steps", () => {
  it("parses only whole steps from 1 to 6", () => {
    expect(parseStep("3")).toBe(3)
    for (const bad of ["0", "7", "abc", "2.5", "", "review", undefined]) {
      expect(parseStep(bad)).toBeNull()
    }
  })

  it("starts at step 1 when the profile has no progress", () => {
    expect(currentStepOf({})).toBe(1)
    expect(currentStepOf(undefined)).toBe(1)
  })

  it("resumes at the step where the vendor stopped", () => {
    expect(resumePath({ onboarding_step: 4 })).toBe("/vendor/onboarding/4")
  })

  it("resumes at the review card once all six steps are saved and NIN is passed", () => {
    expect(
      resumePath({
        onboarding_step: 7,
        ninVerification: { status: "passed" },
      }),
    ).toBe(REVIEW_PATH)
  })

  it("returns to NIN verification when all steps are saved but NIN is not passed", () => {
    expect(
      resumePath({
        onboarding_step: 7,
        ninVerification: { status: "failed" },
      }),
    ).toBe("/vendor/onboarding/6")
  })
})
