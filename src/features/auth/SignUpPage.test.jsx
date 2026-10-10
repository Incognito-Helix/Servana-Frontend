import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import SignupPage from "./SignupPage"
import { api } from "@/lib/api"

vi.mock("@/lib/api", () => ({ api: { post: vi.fn(), get: vi.fn() }, unwrap: (r) => r.data }))

const setup = () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  )
  return user
}

describe("SignupPage", () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it("blocks an empty submit and sends no request", async () => {
    const user = setup()
    await user.click(screen.getByRole("button", { name: "Create account" }))
    expect(await screen.findByText(/must agree to the Terms of Service/)).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it("shows the vendor policy checkbox only for vendors", async () => {
    const user = setup()
    expect(screen.queryByText(/Vendor Policy/)).toBeNull()
    await user.click(screen.getByLabelText("Vendor"))
    expect(screen.getByText(/Vendor Policy/)).toBeInTheDocument()
  })

  it("never offers an admin role", () => {
    setup()
    expect(screen.queryByLabelText(/admin/i)).toBeNull()
  })

  it("sends the typed values when the form is valid", async () => {
    api.post.mockResolvedValue({})
    const user = setup()
    await user.type(screen.getByLabelText("First name"), "Ada")
    await user.type(screen.getByLabelText("Last name"), "Obi")
    await user.type(screen.getByLabelText("Email"), "Ada@Example.com")
    await user.type(screen.getByLabelText("Password"), "Passw0rd!")
    await user.type(screen.getByLabelText("Confirm password"), "Passw0rd!")
    await user.click(screen.getByRole("checkbox", { name: /Terms of Service/ }))
    await user.click(screen.getByRole("button", { name: "Create account" }))
    expect(api.post).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({
        role: "customer",
        firstName: "Ada",
        email: "ada@example.com",
        acceptedTerms: true,
      }),
    )
  })
})
