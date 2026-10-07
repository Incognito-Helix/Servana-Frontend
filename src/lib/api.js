import axios from "axios"
import { useAuthStore } from "@/store/authStore"

export class ApiError extends Error {
  constructor({ status, code, message, fieldErrors }) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors || {}
  }
}

// CONFIRM with the backend lead (see the end of this message)
const CSRF_HEADER = "X-CSRF-Token"
const CSRF_COOKIE = "csrf_token"

const SAFE_METHODS = ["get", "head", "options"]
const NO_REDIRECT = [
  "/auth/login",
  "/auth/register",
  "/auth/google",
  "/auth/me",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
]

let unauthorizedHandler = () => {}
let networkErrorHandler = () => {}
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn
}
export const setNetworkErrorHandler = (fn) => {
  networkErrorHandler = fn
}

function readCookie(name) {
  if (typeof document === "undefined") return null
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

export const unwrap = (res) => res.data?.data ?? res.data

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  if (!config.baseURL && !/^https?:\/\//i.test(config.url || "")) {
    return Promise.reject(new Error("VITE_API_URL is not configured"))
  }

  if (!SAFE_METHODS.includes((config.method || "get").toLowerCase())) {
    config.headers["X-Requested-With"] = "XMLHttpRequest"
    const token = readCookie(CSRF_COOKIE)
    if (token) config.headers[CSRF_HEADER] = token
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
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
    if (status === 401 && !NO_REDIRECT.some((p) => url.startsWith(p))) {
      useAuthStore.getState().clearUser()
      unauthorizedHandler()
    }
    return Promise.reject(apiError)
  },
)
