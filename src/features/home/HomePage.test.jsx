import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import HomePage from "./HomePage"
import { useFeed } from "./useFeed"
import { useEffectiveLocation } from "@/features/location/useEffectiveLocation"
import { useLocationStore } from "@/store/locationStore"

vi.mock("./useFeed", () => ({ useFeed: vi.fn() }))
vi.mock("@/features/location/useEffectiveLocation", () => ({ useEffectiveLocation: vi.fn() }))
vi.mock("@/features/search/SearchResults", () => ({
  default: ({ q }) => <p>Search results for “{q}”</p>,
}))

const lekki = { id: "lekki", name: "Lekki", city: "Lagos" }
const area = (extra = {}) => ({
  location: lekki,
  isDefault: false,
  isLoading: false,
  isError: false,
  retry: vi.fn(),
  ...extra,
})
const feed = (top = []) => ({
  data: { top, popular: null },
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
})
const bisi = { id: "v1", slug: "bisi", businessName: "Bisi Makeovers" }
const searchBox = () => screen.getByLabelText("Search vendors or services")

const setup = () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
  return user
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLocationStore.setState({ location: null, recents: [], pickerOpen: false })
  })

  it("shows vendors for the suggested area without asking anything first", () => {
    useEffectiveLocation.mockReturnValue(area({ isDefault: true }))
    useFeed.mockReturnValue(feed([bisi]))
    setup()
    expect(screen.getByText("Bisi Makeovers")).toBeInTheDocument()
    expect(screen.getByText(/\(suggested\)/)).toBeInTheDocument()
    expect(searchBox()).toBeEnabled()
    expect(useFeed).toHaveBeenCalledWith("lekki")
  })

  it("does not say suggested once the person chose the area", () => {
    useEffectiveLocation.mockReturnValue(area())
    useFeed.mockReturnValue(feed([bisi]))
    setup()
    expect(screen.queryByText(/\(suggested\)/)).toBeNull()
  })

  it("lets the person change the area", async () => {
    useEffectiveLocation.mockReturnValue(area({ isDefault: true }))
    useFeed.mockReturnValue(feed([bisi]))
    const user = setup()
    await user.click(screen.getByRole("button", { name: "Change area" }))
    expect(useLocationStore.getState().pickerOpen).toBe(true)
  })

  it("shows an error and disables search when the areas cannot load", async () => {
    const retry = vi.fn()
    useEffectiveLocation.mockReturnValue(area({ location: null, isError: true, retry }))
    useFeed.mockReturnValue(feed())
    const user = setup()
    expect(searchBox()).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalled()
  })

  it("shows an empty state when there are no vendors", () => {
    useEffectiveLocation.mockReturnValue(area())
    useFeed.mockReturnValue(feed([]))
    setup()
    expect(screen.getByText(/No vendors in Lekki yet/)).toBeInTheDocument()
  })

  it("leaves the page alone when the search bar is tapped", async () => {
    useEffectiveLocation.mockReturnValue(area())
    useFeed.mockReturnValue(feed([bisi]))
    const user = setup()
    await user.click(searchBox())
    expect(screen.getByText("Bisi Makeovers")).toBeInTheDocument()
  })

  it("swaps the feed for search when typing, and back when cleared", async () => {
    useEffectiveLocation.mockReturnValue(area())
    useFeed.mockReturnValue(feed([bisi]))
    const user = setup()
    await user.type(searchBox(), "ma")
    expect(await screen.findByText(/Search results for/)).toBeInTheDocument()
    expect(screen.queryByText("Bisi Makeovers")).toBeNull()
    await user.clear(searchBox())
    expect(await screen.findByText("Bisi Makeovers")).toBeInTheDocument()
  })
})
