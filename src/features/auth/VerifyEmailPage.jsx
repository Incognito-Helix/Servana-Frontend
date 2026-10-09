import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { api, unwrap } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  normalizeOtp,
  isCompleteOtp,
  formatCountdown,
  OTP_EXPIRY_SECONDS,
  RESEND_COOLDOWN_SECONDS,
} from "./otp"
import { useCountdown } from "./useCountdown"

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const sessionUser = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const email = state?.email ?? sessionUser?.email
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [expiresIn, resetExpiry] = useCountdown(OTP_EXPIRY_SECONDS)
  const [cooldown, resetCooldown] = useCountdown(RESEND_COOLDOWN_SECONDS)

  if (!email) return <Navigate to="/signup" replace />

  const verify = async (e) => {
    e.preventDefault()
    if (!isCompleteOtp(otp) || submitting) return
    setError("")
    setInfo("")
    setSubmitting(true)

    try {
      await api.post("/auth/verify-email", { email, otp }) // CONFIRM body with backend
    } catch (err) {
      setSubmitting(false)
      if (err.status === 429)
        setError("Too many attempts. Please wait a few minutes and try again.")
      else if (err.status === 400)
        setError("That code is wrong or has expired. Check it or request a new one.")
      else setError(err.message)
      return
    }

    try {
      const me = unwrap(await api.get("/auth/me"))
      const user = me.user ?? me
      setUser(user)
      // Customers set their location next (home page opens the picker, built on D08).
      navigate(user.role === "vendor" ? "/vendor/onboarding/1" : "/", { replace: true })
    } catch {
      navigate("/login", { replace: true, state: { message: "Email verified. Please log in." } })
    }
  }

  const resend = async () => {
    if (cooldown > 0 || resending) return
    setError("")
    setInfo("")
    setResending(true)
    try {
      await api.post("/auth/resend-otp", { email }) // CONFIRM endpoint with backend
      setOtp("")
      resetExpiry(OTP_EXPIRY_SECONDS)
      resetCooldown(RESEND_COOLDOWN_SECONDS)
      setInfo("A new code has been sent to your email.")
    } catch (err) {
      if (err.status === 429) {
        resetCooldown(RESEND_COOLDOWN_SECONDS)
        setError("Too many requests. Please wait before asking for another code.")
      } else {
        setError(err.message)
      }
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Verify your email</h1>
      <p className="mt-1 text-sm text-gray-600">
        We sent a 6-digit code to <strong>{email}</strong>.
      </p>

      <form onSubmit={verify} noValidate className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(normalizeOtp(e.target.value))}
            aria-invalid={!!error}
            aria-describedby="otp-help"
            style={{
              height: "3rem",
              fontSize: "1.5rem",
              letterSpacing: "0.4em",
              textAlign: "center",
            }}
          />
          <p id="otp-help" className="text-xs text-gray-500">
            {expiresIn > 0
              ? `This code expires in ${formatCountdown(expiresIn)}.`
              : "This code has expired. Request a new one below."}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="text-sm text-green-700">
            {info}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!isCompleteOtp(otp) || submitting}
        >
          {submitting ? "Verifying..." : "Verify email"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Button
            type="button"
            variant="link"
            className="px-0"
            onClick={resend}
            disabled={cooldown > 0 || resending}
          >
            {cooldown > 0
              ? `Resend code in ${cooldown}s`
              : resending
                ? "Sending..."
                : "Resend code"}
          </Button>
          <Link to="/signup" className="underline">
            Wrong email?
          </Link>
        </div>
      </form>
    </div>
  )
}
