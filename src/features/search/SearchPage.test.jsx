import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import SearchPage from "./SearchPage"
import { useLocationStore } from "@/store/locationStore"

vi.mock("./SearchResults", () => ({
  default: ({ q, zoneId }) => (
    <p>
      results {q} in {zoneId}
    </p>
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
})
