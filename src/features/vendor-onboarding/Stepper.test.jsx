// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Stepper from "./Stepper"

afterEach(cleanup)

const renderStepper = (props) =>
  render(
    <MemoryRouter>
      <Stepper {...props} />
    </MemoryRouter>,
  )

describe("Stepper", () => {
  it("links the steps reached so far and locks the later ones", () => {
    renderStepper({ active: 2, reached: 3 })
    expect(screen.getAllByRole("link")).toHaveLength(3)
  })

  it("marks the active step", () => {
    renderStepper({ active: 2, reached: 3 })
    const current = document.querySelector('[aria-current="step"]')
    expect(current?.getAttribute("href")).toBe("/vendor/onboarding/2")
  })
})
