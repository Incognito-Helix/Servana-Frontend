import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import FiltersForm from "./FiltersForm"
import { EMPTY_FILTERS } from "./filters"

const setup = (props = {}) => {
  const handlers = { onApply: vi.fn(), onClear: vi.fn(), onChangeArea: vi.fn() }
  const user = userEvent.setup()
  render(<FiltersForm filters={EMPTY_FILTERS} areaName="Lekki" {...handlers} {...props} />)
  return { user, ...handlers }
}

describe("FiltersForm", () => {
  it("applies the chosen filters", async () => {
    const { user, onApply } = setup()
    await user.type(screen.getByLabelText("Minimum price (₦)"), "5000")
    await user.type(screen.getByLabelText("Maximum price (₦)"), "20000")
    await user.selectOptions(screen.getByLabelText("Minimum rating"), "4")
    await user.click(screen.getByLabelText("Home service"))
    await user.click(screen.getByRole("button", { name: "Apply filters" }))
    expect(onApply).toHaveBeenCalledWith({
      minPrice: 5000,
      maxPrice: 20000,
      rating: 4,
      homeService: true,
      openNow: false,
    })
  })

  it("blocks a minimum price above the maximum", async () => {
    const { user, onApply } = setup()
    await user.type(screen.getByLabelText("Minimum price (₦)"), "900")
    await user.type(screen.getByLabelText("Maximum price (₦)"), "100")
    await user.click(screen.getByRole("button", { name: "Apply filters" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/can't be above/)
    expect(onApply).not.toHaveBeenCalled()
  })

  it("rejects prices with commas", async () => {
    const { user, onApply } = setup()
    await user.type(screen.getByLabelText("Minimum price (₦)"), "5,000")
    await user.click(screen.getByRole("button", { name: "Apply filters" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/whole numbers/)
    expect(onApply).not.toHaveBeenCalled()
  })

  it("clears and changes the area", async () => {
    const { user, onClear, onChangeArea } = setup()
    await user.click(screen.getByRole("button", { name: "Clear" }))
    await user.click(screen.getByRole("button", { name: "Change" }))
    expect(onClear).toHaveBeenCalled()
    expect(onChangeArea).toHaveBeenCalled()
    expect(screen.getByText("Area: Lekki")).toBeInTheDocument()
  })
})
