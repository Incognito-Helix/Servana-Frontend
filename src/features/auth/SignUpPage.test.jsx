import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
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

const fillValidForm = async (user) => {
  await user.type(screen.getByLabelText("First name"), "Ada")
  await user.type(screen.getByLabelText("Last name"), "Obi")
  await user.type(screen.getByLabelText("Email"), "Ada@Example.com")
  await user.type(screen.getByLabelText("Password"), "Passw0rd!")
  await user.type(screen.getByLabelText("Confirm password"), "Passw0rd!")
  await user.click(screen.getByRole("checkbox", { name: /Terms of Service/ }))
  await user.click(screen.getByRole("button", { name: "Create account" }))
}

describe("SignupPage", () => {
  beforeEach(() => vi.resetAllMocks())

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

  it("registers, then asks for the code", async () => {
    api.post.mockResolvedValue({})
    const user = setup()
    await fillValidForm(user)
    await vi.waitFor(() => expect(api.post).toHaveBeenCalledTimes(2))
    expect(api.post).toHaveBeenNthCalledWith(
      1,
      "/auth/register",
      expect.objectContaining({ role: "customer", firstName: "Ada", email: "ada@example.com" }),
    )
    expect(api.post).toHaveBeenNthCalledWith(2, "/auth/send-email-otp", {
      email: "ada@example.com",
    })
  })

  it("offers Log in and Resend code when the email is already registered", async () => {
    api.post.mockRejectedValueOnce({ status: 409, code: "EMAIL_ALREADY_EXISTS", message: "exists" })
    const user = setup()
    await fillValidForm(user)
    const notice = await screen.findByRole("alert")
    expect(within(notice).getByText(/already registered/)).toBeInTheDocument()
    expect(within(notice).getByRole("link", { name: "Log in" })).toBeInTheDocument()
    expect(within(notice).getByRole("button", { name: "Resend code" })).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it("sends a new code from the already-registered notice", async () => {
    api.post.mockRejectedValueOnce({ status: 409, code: "EMAIL_ALREADY_EXISTS", message: "exists" })
    api.post.mockResolvedValue({})
    const user = setup()
    await fillValidForm(user)
    const notice = await screen.findByRole("alert")
    await user.click(within(notice).getByRole("button", { name: "Resend code" }))
    await vi.waitFor(() =>
      expect(api.post).toHaveBeenLastCalledWith("/auth/send-email-otp", {
        email: "ada@example.com",
      }),
    )
  })
})
