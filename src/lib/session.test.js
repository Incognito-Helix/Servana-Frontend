import { describe, it, expect } from "vitest"
import { getSessionSeed } from "./session"

describe("getSessionSeed", () => {
  it("gives the same id every time in one tab", () => {
    const first = getSessionSeed()
    expect(first).toBeTruthy()
    expect(getSessionSeed()).toBe(first)
  })
})
