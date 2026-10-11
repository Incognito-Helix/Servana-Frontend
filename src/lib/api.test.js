// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { api } from "./api"
import { getToken, setToken } from "./token"
import { useAuthStore } from "@/store/authStore"

api.defaults.baseURL = "http://api.test"

const fail = (status, body) => (config) =>
  Promise.reject({ config, response: { status, data: body } })
const ok = (body) => (config) =>
  Promise.resolve({ data: body, status: 200, statusText: "OK", headers: {}, config })

describe("api client", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().clearUser()
  })

  it("maps the API error shape", async () => {
    api.defaults.adapter = fail(400, {
      success: false,
      error: { code: "VALIDATION", message: "Bad input", fieldErrors: { email: "Invalid email" } },
    })
    await expect(api.post("/auth/register", {})).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION",
      fieldErrors: { email: "Invalid email" },
    })
  })

  it("maps network errors", async () => {
    api.defaults.adapter = (config) => Promise.reject({ config })
    await expect(api.get("/search")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 })
  })

  it("saves the token from a login response", async () => {
    api.defaults.adapter = ok({ success: true, data: { token: "abc123" } })
    await api.post("/auth/login", {})
    expect(getToken()).toBe("abc123")
  })

  it("sends the saved token as a Bearer header", async () => {
    setToken("abc123")
    let seen
    api.defaults.adapter = (config) => {
      seen = config.headers.Authorization
      return ok({})(config)
    }
    await api.get("/vendors/profile")
    expect(seen).toBe("Bearer abc123")
  })

  it("clears the token and user on a 401 from a protected route", async () => {
    setToken("abc123")
    useAuthStore.getState().setUser({ role: "customer" })
    api.defaults.adapter = fail(401, { error: { code: "UNAUTHORIZED", message: "Log in" } })
    await expect(api.get("/vendors/profile")).rejects.toBeTruthy()
    expect(getToken()).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it("keeps the token on a wrong-password 401", async () => {
    setToken("abc123")
    api.defaults.adapter = fail(401, { error: { code: "INVALID", message: "Invalid credentials" } })
    await expect(api.post("/auth/login", {})).rejects.toBeTruthy()
    expect(getToken()).toBe("abc123")
  })
})
