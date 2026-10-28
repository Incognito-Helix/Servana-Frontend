import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import SearchResults from "./SearchResults"
import { useSearch } from "./useSearch"
import { EMPTY_FILTERS } from "./filters"

vi.mock("./useSearch", () => ({ useSearch: vi.fn(), PAGE_SIZE: 20 }))

const result = (items, extra = {}) => ({
  data: { pages: [{ items, hasMore: false }] },
  isLoading: false,
  isError: false,
  isFetchNextPageError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: vi.fn(),
  refetch: vi.fn(),
  ...extra,
})
const zed = { id: "1", slug: "zed", businessName: "Zed Cuts", sponsored: true }
const amy = { id: "2", slug: "amy", businessName: "Amy Hair" }

const show = (props = {}) =>
  render(
    <MemoryRouter>
      <SearchResults q="hair" zoneId="lekki" {...props} />
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

  it("suggests nearby areas when nothing matches", async () => {
    useSearch.mockReturnValue(result([]))
    const onPickArea = vi.fn()
    const nearby = [
      { id: "ikeja", name: "Ikeja" },
      { id: "yaba", name: "Yaba" },
    ]
    const user = userEvent.setup()
    show({ nearbyAreas: nearby, onPickArea })
    expect(screen.getByText(/Try a nearby area/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try Ikeja" }))
    expect(onPickArea).toHaveBeenCalledWith(nearby[0])
  })

  it("offers Clear filters when filters hide everything", async () => {
    useSearch.mockReturnValue(result([]))
    const onClearFilters = vi.fn()
    const user = userEvent.setup()
    show({ filters: { ...EMPTY_FILTERS, openNow: true }, onClearFilters })
    expect(screen.getByText(/removing some filters/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(onClearFilters).toHaveBeenCalled()
  })

  it("falls back to Change area when there is nothing else to offer", () => {
    useSearch.mockReturnValue(result([]))
    show()
    expect(screen.getByRole("button", { name: "Change area" })).toBeInTheDocument()
  })

  it("keeps the results and says so when the next page fails", () => {
    useSearch.mockReturnValue(
      result([amy], { isError: true, isFetchNextPageError: true, hasNextPage: true }),
    )
    show()
    expect(screen.getByText("Amy Hair")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't load more/)
  })

  it("marks each card for impression tracking", () => {
    useSearch.mockReturnValue(result([zed, amy]))
    const { container } = show()
    expect(container.querySelector('li[data-vendor-id="1"]')).toHaveAttribute(
      "data-sponsored",
      "true",
    )
    expect(container.querySelector('li[data-vendor-id="2"]')).toHaveAttribute(
      "data-sponsored",
      "false",
    )
  })
})
