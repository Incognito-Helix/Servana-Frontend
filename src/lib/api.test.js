import { describe, it, expect } from "vitest"
import { api } from "./api"
import { useAuthStore } from "@/store/authStore"

const fail = (status, body) => (config) =>
  Promise.reject({ config, response: { status, data: body } })

describe("api client", () => {
  it("maps the API error shape", async () => {
    api.defaults.baseURL = "https://api.example.test"
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
    api.defaults.baseURL = "https://api.example.test"
    api.defaults.adapter = (config) => Promise.reject({ config })
    await expect(api.get("/search")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 })
  })

  it("clears the user on 401", async () => {
    api.defaults.baseURL = "https://api.example.test"
    useAuthStore.getState().setUser({ role: "customer" })
    api.defaults.adapter = fail(401, { error: { code: "UNAUTHORIZED", message: "Log in" } })
    await expect(api.get("/vendors/profile")).rejects.toBeTruthy()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
