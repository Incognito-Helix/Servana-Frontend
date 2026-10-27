// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import PhotoSlot from "./PhotoSlot"
import { MAX_BYTES } from "./uploads"

afterEach(cleanup)

const renderSlot = (props = {}) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PhotoSlot profileId="p1" kind="cover" label="Cover image" {...props} />
    </QueryClientProvider>,
  )

// applyAccept: false lets a wrong file type reach our own check, as it can in some browsers.
const pick = (file) =>
  userEvent.setup({ applyAccept: false }).upload(screen.getByTestId("cover-input"), file)

describe("PhotoSlot", () => {
  it("rejects a wrong file type with a message", async () => {
    renderSlot()
    await pick(new File(["x"], "doc.gif", { type: "image/gif" }))
    expect(await screen.findByText("Only JPEG, PNG or WebP images are allowed.")).toBeTruthy()
  })

  it("rejects an oversize image with a message", async () => {
    renderSlot()
    await pick(new File([new Uint8Array(MAX_BYTES + 1)], "big.jpg", { type: "image/jpeg" }))
    expect(await screen.findByText(/larger than 5 MB/)).toBeTruthy()
  })

  it("shows the saved photo and offers to replace it", () => {
    renderSlot({ url: "https://example.test/cover.jpg" })
    expect(screen.getByRole("img").getAttribute("src")).toBe("https://example.test/cover.jpg")
    expect(screen.getByRole("button", { name: "Replace photo" })).toBeTruthy()
  })
})
