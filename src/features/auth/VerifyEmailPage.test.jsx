import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import VerifyEmailPage from "./VerifyEmailPage"
import { api } from "@/lib/api"

vi.mock("@/lib/api", () => ({ api: { post: vi.fn(), get: vi.fn() }, unwrap: (r) => r.data }))

const setup = (state = { email: "ada@example.com" }) => {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[{ pathname: "/verify-email", state }]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/signup" element={<p>signup page</p>} />
        <Route path="/" element={<p>home page</p>} />
        <Route path="/vendor/onboarding/1" element={<p>onboarding page</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return user
}
const verifyButton = () => screen.getByRole("button", { name: /Verify email|Verifying/ })

describe("VerifyEmailPage", () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it("sends users without an email back to sign up", () => {
    setup({})
    expect(screen.getByText("signup page")).toBeInTheDocument()
  })

  it("keeps Verify disabled until 6 digits and cleans pasted codes", async () => {
    const user = setup()
    expect(verifyButton()).toBeDisabled()
    await user.click(screen.getByLabelText("Verification code"))
    await user.paste("123 456")
    expect(screen.getByLabelText("Verification code")).toHaveValue("123456")
    expect(verifyButton()).toBeEnabled()
  })

  it("shows an error for a wrong or expired code", async () => {
    api.post.mockRejectedValue({ status: 400, message: "bad" })
    const user = setup()
    await user.type(screen.getByLabelText("Verification code"), "123456")
    await user.click(verifyButton())
    expect(await screen.findByText(/wrong or has expired/)).toBeInTheDocument()
  })

  it("sends a verified customer home", async () => {
    api.post.mockResolvedValue({})
    api.get.mockResolvedValue({ data: { user: { role: "customer" } } })
    const user = setup()
    await user.type(screen.getByLabelText("Verification code"), "123456")
    await user.click(verifyButton())
    expect(await screen.findByText("home page")).toBeInTheDocument()
  })

  it("sends a verified vendor to onboarding", async () => {
    api.post.mockResolvedValue({})
    api.get.mockResolvedValue({ data: { user: { role: "vendor" } } })
    const user = setup()
    await user.type(screen.getByLabelText("Verification code"), "123456")
    await user.click(verifyButton())
    expect(await screen.findByText("onboarding page")).toBeInTheDocument()
  })

  it("starts with the resend button on cooldown", () => {
    setup()
    expect(screen.getByRole("button", { name: /Resend code in/ })).toBeDisabled()
  })
})
