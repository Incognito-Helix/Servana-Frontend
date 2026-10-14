// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { api, ApiError } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import LoginPage from "./LoginPage"

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, api: { post: vi.fn(), get: vi.fn() } }
})

beforeEach(() => useAuthStore.getState().clearUser())
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const renderLogin = (path = "/login") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Home page</p>} />
        <Route path="/search" element={<p>Search page</p>} />
      </Routes>
    </MemoryRouter>,
  )

const fillAndSubmit = async (user) => {
  await user.type(screen.getByLabelText("Email"), "ada@test.com")
  await user.type(screen.getByLabelText("Password"), "Password1!")
  await user.click(screen.getByRole("button", { name: /^log in$/i }))
}

describe("LoginPage", () => {
  it("shows messages for empty fields", async () => {
    renderLogin()
    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }))
    expect(await screen.findByText("Enter your email")).toBeTruthy()
    expect(screen.getByText("Enter your password")).toBeTruthy()
    expect(api.post).not.toHaveBeenCalled()
  })

  it("shows the generic error for wrong credentials", async () => {
    api.post.mockRejectedValueOnce(
      new ApiError({
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      }),
    )
    renderLogin()
    await fillAndSubmit(userEvent.setup())
    expect(await screen.findByText("Invalid email or password.")).toBeTruthy()
  })

  it("shows the rate limit message", async () => {
    api.post.mockRejectedValueOnce(
      new ApiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many attempts. Please try again in 15 minutes.",
      }),
    )
    renderLogin()
    await fillAndSubmit(userEvent.setup())
    expect(await screen.findByText(/too many attempts/i)).toBeTruthy()
  })

  it("logs in, drops the token from the stored user and follows ?next", async () => {
    api.post.mockResolvedValueOnce({
      data: { data: { id: "u1", name: "Ada", role: "customer", token: "t" } },
    })
    renderLogin("/login?next=/search")
    await fillAndSubmit(userEvent.setup())
    expect(await screen.findByText("Search page")).toBeTruthy()
    expect(useAuthStore.getState().user).toMatchObject({ id: "u1" })
    expect(useAuthStore.getState().user.token).toBeUndefined()
  })

  it("ignores an off-site ?next", async () => {
    api.post.mockResolvedValueOnce({ data: { data: { id: "u1", role: "customer" } } })
    renderLogin("/login?next=//evil.com")
    await fillAndSubmit(userEvent.setup())
    expect(await screen.findByText("Home page")).toBeTruthy()
  })
})
