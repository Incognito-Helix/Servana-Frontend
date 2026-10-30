// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { PROFILE_KEY } from "./hooks"
import { verifyNin } from "./ninApi"
import NinStep from "./NinStep"

vi.mock("./ninApi", () => ({ verifyNin: vi.fn() }))

const NIN = "12345678901"
let queryClient

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

function renderStep(profile = {}) {
  queryClient = new QueryClient()
  const full = { id: "p1", onboarding_step: 6, ...profile }
  queryClient.setQueryData(PROFILE_KEY, full)
  const view = () => queryClient.getQueryData(PROFILE_KEY)
  const ui = (current) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NinStep step={6} profile={current} />
      </MemoryRouter>
    </QueryClientProvider>
  )
  const result = render(ui(full))
  return { ...result, view, rerenderWith: () => result.rerender(ui(view())) }
}

const field = () => screen.getByLabelText(/NIN \(11 digits\)/)
const verify = () => userEvent.click(screen.getByRole("button", { name: /verify nin|try again/i }))

describe("NinStep", () => {
  it("blocks wrong length and non-digits before any request", async () => {
    renderStep()
    await userEvent.type(field(), "1234567890")
    await verify()
    expect(await screen.findByText(/exactly 11 digits/)).toBeTruthy()
    await userEvent.clear(field())
    await userEvent.type(field(), "1234567890a")
    await verify()
    expect(await screen.findByText(/numbers only/)).toBeTruthy()
    expect(verifyNin).not.toHaveBeenCalled()
  })

  it("clears the field as soon as the request leaves, and keeps only the last 4 digits", async () => {
    let finish
    verifyNin.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
    const { view, rerenderWith } = renderStep()
    await userEvent.type(field(), NIN)
    await verify()
    expect(verifyNin).toHaveBeenCalledWith(NIN)
    expect(screen.getByText("Checking your NIN...")).toBeTruthy()

    finish({ kind: "result", status: "passed", lastFour: "8901", reason: null })

    await waitFor(() => {
      expect(view().ninVerification?.status).toBe("passed")
    })

    rerenderWith()

    await screen.findByText(/NIN ending in 8901/)

    expect(screen.queryByLabelText(/NIN \(11 digits\)/)).toBeNull()
    expect(JSON.stringify(view())).not.toContain(NIN)
    expect(screen.getByRole("button", { name: "Save and review" })).toBeTruthy()
  })

  it("shows the reason for a failure and lets the vendor try again", async () => {
    verifyNin.mockResolvedValueOnce({
      kind: "result",
      status: "failed",
      lastFour: "",
      reason: "NIN_NOT_FOUND",
    })
    const { rerenderWith } = renderStep()
    await userEvent.type(field(), "12345670000")
    await verify()
    rerenderWith()
    await screen.findByText("NIN not found. You can try again.")

    expect(field().value).toBe("")
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy()
  })

  it("shows the name mismatch reason", async () => {
    verifyNin.mockResolvedValueOnce({
      kind: "result",
      status: "failed",
      lastFour: "",
      reason: "name does not match",
    })
    const { rerenderWith } = renderStep()

    await userEvent.type(field(), "12345671111")
    await verify()
    rerenderWith()
    expect(
      await screen.findByText("Name does not match your account. You can try again."),
    ).toBeTruthy()
  })

  it("stops the vendor after the attempt limit (429)", async () => {
    verifyNin.mockResolvedValueOnce({ kind: "rate_limited" })
    renderStep()
    await userEvent.type(field(), NIN)
    await verify()
    expect(await screen.findByText(/used all 3 verification attempts/)).toBeTruthy()
    expect(field().disabled).toBe(true)
  })

  it("clears the field and asks again after a network problem", async () => {
    verifyNin.mockResolvedValueOnce({ kind: "network" })
    renderStep()
    await userEvent.type(field(), NIN)
    await verify()
    expect(await screen.findByText(/enter your NIN again/)).toBeTruthy()
    expect(field().value).toBe("")
  })

  it("shows the locked result for a vendor who already passed", () => {
    renderStep({ ninVerification: { status: "passed", lastFour: "8901" } })
    expect(screen.getByText(/NIN ending in 8901/)).toBeTruthy()
    expect(screen.queryByLabelText(/NIN \(11 digits\)/)).toBeNull()
  })
})
