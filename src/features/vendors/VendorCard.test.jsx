import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import VendorCard from "./VendorCard"

const base = {
  id: "v1",
  slug: "bisi",
  businessName: "Bisi Makeovers",
  isVerified: true,
  primaryService: "Makeup",
  zoneName: "Lekki",
  avgRating: 4.9,
  reviewCount: 124,
  distanceKm: 2.4,
  fromPrice: 500000,
  offersHomeService: true,
}
const show = (vendor, props = {}) =>
  render(
    <MemoryRouter>
      <VendorCard vendor={vendor} {...props} />
    </MemoryRouter>,
  )

describe("VendorCard", () => {
  it("shows everything the PRD lists", () => {
    show(base)
    expect(screen.getByRole("link", { name: "Bisi Makeovers" })).toHaveAttribute("href", "/p/bisi")
    expect(screen.getByText("Makeup · Lekki")).toBeInTheDocument()
    expect(screen.getByText("4.9 (124)")).toBeInTheDocument()
    expect(screen.getByText("2.4 km")).toBeInTheDocument()
    expect(screen.getByText("From ₦5,000")).toBeInTheDocument()
    expect(screen.getByText("Verified")).toBeInTheDocument()
    expect(screen.getByText("Home service")).toBeInTheDocument()
  })

  it("labels paid placements as Sponsored", () => {
    show(base, { sponsored: true })
    expect(screen.getByText("Sponsored")).toBeInTheDocument()
  })

  it("does not say Sponsored for organic vendors", () => {
    show(base)
    expect(screen.queryByText("Sponsored")).toBeNull()
  })

  it("shows Remote in place of a distance for remote vendors", () => {
    show({ ...base, worksRemotely: true, offersHomeService: false, distanceKm: 12 })
    expect(screen.getByText("Remote")).toBeInTheDocument()
    expect(screen.getByText("Works remotely")).toBeInTheDocument()
    expect(screen.queryByText("12.0 km")).toBeNull()
  })

  it("handles a new vendor with no reviews, price or cover", () => {
    show({ id: "v2", slug: "new", businessName: "Brand New", avgRating: null, reviewCount: 0 })
    expect(screen.getByText("No reviews yet")).toBeInTheDocument()
    expect(screen.queryByText(/From ₦/)).toBeNull()
    expect(screen.getByText("B")).toBeInTheDocument()
  })
})
