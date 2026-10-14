// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { api, ApiError } from "@/lib/api"
import ResetPasswordPage from "./ResetPasswordPage"

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, api: { post: vi.fn(), get: vi.fn() } }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const GOOD = "NewPass1!" // must satisfy the sign-up password rules

const renderPage = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  )

const fill = async (user, password, confirm) => {
  await user.type(screen.getByLabelText("New password"), password)
  await user.type(screen.getByLabelText("Confirm new password"), confirm)
  await user.click(screen.getByRole("button", { name: /^reset password$/i }))
}

describe("ResetPasswordPage", () => {
  it("shows a link problem when there is no token", () => {
    renderPage("/reset-password")
    expect(screen.getByRole("alert").textContent).toMatch(/not valid/i)
    expect(screen.getByRole("link", { name: /request a new link/i })).toBeTruthy()
  })

  it("requires matching passwords", async () => {
    renderPage("/reset-password?token=abc")
    await fill(userEvent.setup(), GOOD, "Different1!")
    expect(await screen.findByText("Passwords do not match")).toBeTruthy()
    expect(api.post).not.toHaveBeenCalled()
  })

  it("shows the expired-link message from the API", async () => {
    api.post.mockRejectedValueOnce(
      new ApiError({
        status: 400,
        code: "TOKEN_EXPIRED",
        message: "This reset link has expired. Request a new one.",
      }),
    )
    renderPage("/reset-password?token=abc")
    await fill(userEvent.setup(), GOOD, GOOD)
    expect(await screen.findByText(/has expired/i)).toBeTruthy()
  })

  it("confirms success and sends the token with the new password", async () => {
    api.post.mockResolvedValueOnce({ data: { success: true, data: {} } })
    renderPage("/reset-password?token=abc")
    await fill(userEvent.setup(), GOOD, GOOD)
    expect(await screen.findByText("Password updated")).toBeTruthy()
    expect(api.post).toHaveBeenCalledWith("/auth/reset-password", { token: "abc", password: GOOD })
  })
})
