import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import SearchPage from "./SearchPage"
import { useLocationStore } from "@/store/locationStore"

vi.mock("./SearchResults", () => ({
  default: ({ q, zoneId, filters }) => (
    <div>
      <p>
        results {q} in {zoneId}
      </p>
      <p data-testid="filters">{JSON.stringify(filters)}</p>
    </div>
  ),
}))
vi.mock("@/features/location/useZoneSuggestions", () => ({
  useZoneSuggestions: () => ({ data: [{ id: "lekki", name: "Lekki" }] }),
}))

const show = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <SearchPage />
    </MemoryRouter>,
  )
const box = () => screen.getByLabelText("Search vendors or services")
const filtersNow = () => JSON.parse(screen.getByTestId("filters").textContent)

describe("SearchPage", () => {
  beforeEach(() => useLocationStore.setState({ location: null, recents: [], pickerOpen: false }))

  it("asks for a location and disables the box when none is set", () => {
    show("/search")
    expect(screen.getByText(/Pick a location to search/)).toBeInTheDocument()
    expect(box()).toBeDisabled()
  })

  it("reads the query and zone from the URL", () => {
    show("/search?q=ma&zone=lekki")
    expect(screen.getByText("results ma in lekki")).toBeInTheDocument()
    expect(box()).toHaveValue("ma")
    expect(screen.getByText("Showing vendors in Lekki")).toBeInTheDocument()
  })

  it("ignores a one-letter query", () => {
    show("/search?q=m&zone=lekki")
    expect(screen.getByText(/results\s+in lekki/)).toBeInTheDocument()
  })

  it("passes the filters from the URL to the results", () => {
    show("/search?zone=lekki&minPrice=5000&maxPrice=20000&rating=4&homeService=1")
    expect(filtersNow()).toMatchObject({
      minPrice: 5000,
      maxPrice: 20000,
      rating: 4,
      homeService: true,
      openNow: false,
    })
  })

  it("shows the number of active filters on the Filters button", () => {
    show("/search?zone=lekki&rating=4&homeService=1")
    expect(screen.getByRole("button", { name: "Filters (2)" })).toBeInTheDocument()
  })

  it("removes a filter when its chip is clicked", async () => {
    const user = userEvent.setup()
    show("/search?zone=lekki&rating=4&homeService=1")
    await user.click(screen.getByRole("button", { name: "Remove filter: Home service" }))
    expect(filtersNow().homeService).toBe(false)
    expect(filtersNow().rating).toBe(4)
  })
})
