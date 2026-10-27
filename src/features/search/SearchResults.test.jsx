import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import SearchResults from "./SearchResults"
import { useSearch } from "./useSearch"

vi.mock("./useSearch", () => ({ useSearch: vi.fn(), PAGE_SIZE: 20 }))

const result = (items, extra = {}) => ({
  data: { pages: [{ items, hasMore: false }] },
  isLoading: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: vi.fn(),
  refetch: vi.fn(),
  ...extra,
})
const zed = { id: "1", slug: "zed", businessName: "Zed Cuts", sponsored: true }
const amy = { id: "2", slug: "amy", businessName: "Amy Hair" }

const show = () =>
  render(
    <MemoryRouter>
      <SearchResults q="hair" zoneId="lekki" />
    </MemoryRouter>,
  )

describe("SearchResults", () => {
  beforeEach(() => vi.clearAllMocks())

  it("shows results in the order the API sent them", () => {
    useSearch.mockReturnValue(result([amy, zed]))
    show()
    const names = screen.getAllByRole("link").map((a) => a.textContent)
    expect(names).toEqual(["Amy Hair", "Zed Cuts"])
  })

  it("labels sponsored vendors only", () => {
    useSearch.mockReturnValue(result([zed, amy]))
    show()
    expect(screen.getAllByText("Sponsored")).toHaveLength(1)
  })

  it("shows skeletons while loading", () => {
    useSearch.mockReturnValue(result([], { data: undefined, isLoading: true }))
    show()
    expect(screen.getByLabelText("Loading vendors")).toBeInTheDocument()
  })

  it("shows an empty state", () => {
    useSearch.mockReturnValue(result([]))
    show()
    expect(screen.getByText(/No vendors found for “hair”/)).toBeInTheDocument()
  })

  it("shows an error with a retry button", async () => {
    const refetch = vi.fn()
    useSearch.mockReturnValue(result([], { data: undefined, isError: true, refetch }))
    const user = userEvent.setup()
    show()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(refetch).toHaveBeenCalled()
  })

  it("loads the next page from the Load more button", async () => {
    const fetchNextPage = vi.fn()
    useSearch.mockReturnValue(result([amy], { hasNextPage: true, fetchNextPage }))
    const user = userEvent.setup()
    show()
    await user.click(screen.getByRole("button", { name: "Load more" }))
    expect(fetchNextPage).toHaveBeenCalled()
  })
})
