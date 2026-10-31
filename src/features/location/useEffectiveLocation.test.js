import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useEffectiveLocation } from "./useEffectiveLocation"
import { useZoneSuggestions } from "./useZoneSuggestions"
import { useLocationStore } from "@/store/locationStore"

vi.mock("./useZoneSuggestions", () => ({ useZoneSuggestions: vi.fn() }))

const zonesResult = (data, extra = {}) => ({
  data,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
  ...extra,
})

describe("useEffectiveLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLocationStore.setState({ location: null, recents: [], pickerOpen: false })
  })

  it("uses the suggested default when nothing was chosen", () => {
    useZoneSuggestions.mockReturnValue(
      zonesResult([{ id: "ikeja" }, { id: "lekki", name: "Lekki" }]),
    )
    const { result } = renderHook(() => useEffectiveLocation())
    expect(result.current.location.id).toBe("lekki")
    expect(result.current.isDefault).toBe(true)
  })

  it("prefers what the person chose", () => {
    useLocationStore.setState({ location: { id: "yaba", name: "Yaba" } })
    useZoneSuggestions.mockReturnValue(zonesResult([{ id: "lekki" }]))
    const { result } = renderHook(() => useEffectiveLocation())
    expect(result.current.location.id).toBe("yaba")
    expect(result.current.isDefault).toBe(false)
  })

  it("falls back to the first area when the default is not in the list", () => {
    useZoneSuggestions.mockReturnValue(zonesResult([{ id: "ikeja" }, { id: "yaba" }]))
    const { result } = renderHook(() => useEffectiveLocation())
    expect(result.current.location.id).toBe("ikeja")
  })

  it("has no area while loading or when the list is empty", () => {
    useZoneSuggestions.mockReturnValue(zonesResult(undefined, { isLoading: true }))
    expect(renderHook(() => useEffectiveLocation()).result.current).toMatchObject({
      location: null,
      isLoading: true,
      isDefault: false,
    })
    useZoneSuggestions.mockReturnValue(zonesResult([]))
    expect(renderHook(() => useEffectiveLocation()).result.current.location).toBeNull()
  })
})
