import axios from "axios"
import { useAuthStore } from "@/store/authStore"
import { getToken, setToken, clearToken } from "./token"

export class ApiError extends Error {
  constructor({ status, code, message, fieldErrors }) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors || {}
  }
}

// A 401 on these just means "wrong details", not "session expired".
const CREDENTIAL_CHECKS = [
  "/auth/login",
  "/auth/register",
  "/auth/google",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
]
// Never redirect to /login from these.
const NO_REDIRECT = [...CREDENTIAL_CHECKS, "/auth/me"]

let unauthorizedHandler = () => {}
let networkErrorHandler = () => {}
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn
}
export const setNetworkErrorHandler = (fn) => {
  networkErrorHandler = fn
}

export const unwrap = (res) => res.data?.data ?? res.data

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  if (!config.baseURL && !/^https?:\/\//i.test(config.url || "")) {
    return Promise.reject(new Error("VITE_API_URL is not configured"))
  }
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => {
    // Any /auth/ response that carries a token (login, Google, verify) saves it.
    if ((res.config?.url || "").startsWith("/auth/")) {
      const body = unwrap(res)
      if (body && typeof body.token === "string") setToken(body.token)
    }
    return res
  },
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error)

    if (!error.response) {
      const apiError = new ApiError({
        status: 0,
        code: "NETWORK_ERROR",
        message: "Network problem. Check your connection and try again.",
      })
      networkErrorHandler(apiError)
      return Promise.reject(apiError)
    }

    const { status, data } = error.response
    const e = data?.error || {}
    const apiError = new ApiError({
      status,
      code: e.code || "UNKNOWN_ERROR",
      message: e.message || "Something went wrong. Please try again.",
      fieldErrors: e.fieldErrors,
    })

    const url = error.config?.url || ""
    if (status === 401) {
      if (!CREDENTIAL_CHECKS.some((p) => url.startsWith(p))) {
        clearToken()
        useAuthStore.getState().clearUser()
      }
      if (!NO_REDIRECT.some((p) => url.startsWith(p))) unauthorizedHandler()
    }
    return Promise.reject(apiError)
  },
)
