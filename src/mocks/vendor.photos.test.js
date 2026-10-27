import { describe, expect, it } from "vitest"
import { stepValidators } from "./vendor.validators"

const full = {
  coverImageUrl: "u",
  profileImageUrl: "u",
  portfolioImages: [{ id: "1", url: "u", sortOrder: 0 }],
}

describe("mock step 5 checks", () => {
  it("passes with a cover, a profile photo and one portfolio image", () => {
    expect(stepValidators[5]({}, full)).toEqual({})
  })

  it("names each missing photo", () => {
    expect(stepValidators[5]({}, {})).toEqual({
      coverImage: expect.any(String),
      profileImage: expect.any(String),
      portfolio: expect.any(String),
    })
  })

  it("needs the portfolio image specifically", () => {
    expect(stepValidators[5]({}, { ...full, portfolioImages: [] }).portfolio).toBeTruthy()
  })
})
