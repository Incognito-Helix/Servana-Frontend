import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import HomePage from "./HomePage"
import { useFeed } from "./useFeed"
import { useLocationStore } from "@/store/locationStore"

vi.mock("./useFeed", () => ({ useFeed: vi.fn() }))

const lekki = { id: "lekki", name: "Lekki", city: "Lagos" }
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

  it("asks for a location first and disables the search box", () => {
    useFeed.mockReturnValue(feed())
    setup()
    expect(screen.getByText(/Pick a location to see vendors/)).toBeInTheDocument()
    expect(searchBox()).toBeDisabled()
  })

  it("shows top vendors for the chosen location", () => {
    useLocationStore.setState({ location: lekki })
    useFeed.mockReturnValue(feed([bisi]))
    setup()
    expect(screen.getByText("Bisi Makeovers")).toBeInTheDocument()
    expect(useFeed).toHaveBeenCalledWith("lekki")
  })

  it("shows an empty state when there are no vendors", () => {
    useLocationStore.setState({ location: lekki })
    useFeed.mockReturnValue(feed([]))
    setup()
    expect(screen.getByText(/No vendors in Lekki yet/)).toBeInTheDocument()
  })

  it("leaves the page alone when the search bar is tapped", async () => {
    useLocationStore.setState({ location: lekki })
    useFeed.mockReturnValue(feed([bisi]))
    const user = setup()
    await user.click(searchBox())
    expect(screen.getByText("Bisi Makeovers")).toBeInTheDocument()
  })

  it("swaps the feed for search when typing, and back when cleared", async () => {
    useLocationStore.setState({ location: lekki })
    useFeed.mockReturnValue(feed([bisi]))
    const user = setup()
    await user.type(searchBox(), "ma")
    expect(await screen.findByText(/Search results for/)).toBeInTheDocument()
    expect(screen.queryByText("Bisi Makeovers")).toBeNull()
    await user.clear(searchBox())
    expect(await screen.findByText("Bisi Makeovers")).toBeInTheDocument()
  })
})
