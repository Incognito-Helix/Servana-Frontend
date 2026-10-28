import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useImpressions } from "./useImpressions"
import { api } from "@/lib/api"

vi.mock("@/lib/api", () => ({ api: { post: vi.fn(() => Promise.resolve({})) } }))

let io
class FakeObserver {
  constructor(callback) {
    this.callback = callback
    io = this
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  see(el) {
    this.callback([{ isIntersecting: true, target: el }])
  }
}
const card = (id, sponsored = false) => {
  const el = document.createElement("li")
  el.dataset.vendorId = id
  el.dataset.sponsored = String(sponsored)
  return el
}
const setup = () =>
  renderHook((props) => useImpressions(props), {
    initialProps: { resetKey: "a", zoneId: "lekki" },
  })

describe("useImpressions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.stubGlobal("IntersectionObserver", FakeObserver)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("sends nothing while tracking is off", () => {
    const { result } = setup()
    const el = card("v1")
    act(() => result.current.watchRef(el))
    act(() => io.see(el))
    act(() => vi.advanceTimersByTime(3000))
    expect(api.post).not.toHaveBeenCalled()
  })

  it("counts a card once and sends it in a batch", () => {
    vi.stubEnv("VITE_IMPRESSIONS_ENABLED", "true")
    const { result } = setup()
    const el = card("v1", true)
    act(() => result.current.watchRef(el))
    act(() => io.see(el))
    act(() => io.see(el))
    act(() => vi.advanceTimersByTime(2000))
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith(
      "/events/impressions",
      { events: [{ vendorId: "v1", sponsored: true, zoneId: "lekki" }] },
      { silent: true },
    )
  })

  it("sends what is left when the page is left", () => {
    vi.stubEnv("VITE_IMPRESSIONS_ENABLED", "true")
    const { result, unmount } = setup()
    const el = card("v2")
    act(() => result.current.watchRef(el))
    act(() => io.see(el))
    unmount()
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it("counts the same card again after a new search", () => {
    vi.stubEnv("VITE_IMPRESSIONS_ENABLED", "true")
    const { result, rerender } = setup()
    const el = card("v1")
    act(() => result.current.watchRef(el))
    act(() => io.see(el))
    act(() => vi.advanceTimersByTime(2000))
    rerender({ resetKey: "b", zoneId: "lekki" })
    act(() => io.see(el))
    act(() => vi.advanceTimersByTime(2000))
    expect(api.post).toHaveBeenCalledTimes(2)
  })
})
