import { describe, expect, it } from "vitest"
import { stepValidators, stepSavers } from "./vendor.validators"
import { defaultHours } from "@/features/vendor-onboarding/hours"

const full = {
  coverImageUrl: "u",
  profileImageUrl: "u",
  portfolioImages: [{ id: "1", url: "u", sortOrder: 0 }],
}

describe("mock step 5 checks", () => {
  it("passes with a cover, a profile photo and one portfolio image", () => {
    expect(stepValidators[5]({ hours: defaultHours() }, full)).toEqual({})
  })

  it("names each missing photo", () => {
    expect(stepValidators[5]({ hours: defaultHours() }, {})).toEqual({
      coverImage: expect.any(String),
      profileImage: expect.any(String),
      portfolio: expect.any(String),
    })
  })

  it("needs the portfolio image specifically", () => {
    expect(
      stepValidators[5]({ hours: defaultHours() }, { ...full, portfolioImages: [] }).portfolio,
    ).toBeTruthy()
  })

  it("clears worksRemotely when the primary service is non-tech", () => {
    expect(stepSavers[1]({ primaryService: "Makeup" }, { worksRemotely: true }).worksRemotely).toBe(
      false,
    )
  })

  it("rejects bad hours with the day's row path", () => {
    const hours = defaultHours()
    hours.tue = { closed: false, open: "18:00", close: "09:00" }
    expect(stepValidators[5]({ hours }, full)["hours.tue.close"]).toMatch(/before closing/)
  })
})
