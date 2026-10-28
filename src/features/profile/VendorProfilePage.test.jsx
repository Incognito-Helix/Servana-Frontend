import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import VendorProfilePage from "./VendorProfilePage"
import { useVendorProfile } from "./useVendorProfile"
import { toProfileData } from "./profileData"

vi.mock("./useVendorProfile", () => ({ useVendorProfile: vi.fn() }))

const raw = {
  id: "v1",
  slug: "bisi",
  businessName: "Bisi Makeovers",
  isVerified: true,
  status: "approved",
  primaryService: "Makeup",
  zoneName: "Lekki",
  avgRating: 4.9,
  reviewCount: 124,
  about: "Makeup artist in Lekki.",
  phone: "08031234567",
  whatsapp: "08031234567",
  services: [
    { name: "Bridal makeup", priceMin: 1500000, priceMax: 2500000 },
    { name: "Day makeup", priceMin: 500000 },
  ],
  portfolioImages: [{ url: "https://x.test/1.jpg" }],
  workingHours: [1, 2, 3, 4, 5, 6]
    .map((d) => ({ dayOfWeek: d, openTime: "09:00", closeTime: "18:00", isClosed: false }))
    .concat({ dayOfWeek: 7, isClosed: true }),
  socialLinks: [
    { platform: "instagram", url: "https://instagram.com/bisi" },
    { platform: "x", url: "javascript:alert(1)" },
  ],
}

const loaded = (extra = {}) => ({
  data: toProfileData({ ...raw, ...extra }),
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
})
const show = () =>
  render(
    <MemoryRouter initialEntries={["/p/bisi"]}>
      <Routes>
        <Route path="/p/:slug" element={<VendorProfilePage />} />
      </Routes>
    </MemoryRouter>,
  )

describe("VendorProfilePage", () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.useRealTimers())

  it("shows the header details", () => {
    useVendorProfile.mockReturnValue(loaded())
    show()
    expect(screen.getByRole("heading", { name: "Bisi Makeovers" })).toBeInTheDocument()
    expect(screen.getByText("Verified")).toBeInTheDocument()
    expect(screen.getByText("4.9 (124)")).toBeInTheDocument()
    expect(screen.getByText("From ₦5,000")).toBeInTheDocument()
    expect(screen.getByText("Makeup artist in Lekki.")).toBeInTheDocument()
  })

  it("lists services with prices and ranges", () => {
    useVendorProfile.mockReturnValue(loaded())
    show()
    expect(screen.getByText("₦15,000 to ₦25,000")).toBeInTheDocument()
    expect(screen.getByText("₦5,000")).toBeInTheDocument()
  })

  it("gives portfolio photos alt text", () => {
    useVendorProfile.mockReturnValue(loaded())
    show()
    expect(screen.getByAltText("Bisi Makeovers portfolio photo 1")).toBeInTheDocument()
  })

  it("shows Open now using Lagos time", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-10-21T10:00:00+01:00"))
    useVendorProfile.mockReturnValue(loaded())
    show()
    expect(screen.getByText(/Open now/)).toBeInTheDocument()
  })

  it("shows safe social links only", () => {
    useVendorProfile.mockReturnValue(loaded())
    show()
    expect(screen.getByRole("link", { name: /Instagram/ })).toHaveAttribute(
      "href",
      "https://instagram.com/bisi",
    )
    expect(screen.queryByRole("link", { name: /^X/ })).toBeNull()
  })

  it("never shows a phone number", () => {
    useVendorProfile.mockReturnValue(loaded())
    show()
    expect(document.body.textContent).not.toMatch(/0803/)
  })

  it("tells the owner when the profile is not public yet", () => {
    useVendorProfile.mockReturnValue(loaded({ status: "pending" }))
    show()
    expect(screen.getByText(/Only you can see this profile/)).toHaveAttribute("role", "status")
  })

  it("shows a not-available page for a 404", () => {
    useVendorProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 404 },
      refetch: vi.fn(),
    })
    show()
    expect(screen.getByText("This profile isn't available")).toBeInTheDocument()
  })

  it("offers a retry for other errors", async () => {
    const refetch = vi.fn()
    useVendorProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 0 },
      refetch,
    })
    const user = userEvent.setup()
    show()
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(refetch).toHaveBeenCalled()
  })

  it("copies the profile link", async () => {
    useVendorProfile.mockReturnValue(loaded())
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, "writeText")
    show()
    await user.click(screen.getByRole("button", { name: "Copy link" }))
    expect(copy).toHaveBeenCalledWith(`${window.location.origin}/p/bisi`)
    expect(await screen.findByText("Link copied")).toBeInTheDocument()
  })
})
