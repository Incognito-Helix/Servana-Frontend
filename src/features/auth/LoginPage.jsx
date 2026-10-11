import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { z } from "zod"
import { api, unwrap } from "@/lib/api"
import { applyApiErrors, useZodForm } from "@/lib/forms"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import GoogleSignIn from "./GoogleSignIn"

const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
})

const ERROR_TEXT = "text-sm text-[#B42318]"

// Only allow same-site paths, so ?next= cannot send people to another website.
const safeNext = (value) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/"

function RoleTermsForm({ profile, error, onSubmit, onCancel }) {
  const [role, setRole] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [touched, setTouched] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (role && accepted) onSubmit({ role, acceptedTerms: true })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Welcome{profile?.name ? `, ${profile.name}` : ""}. Two quick things before you start.
      </p>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">I want to</legend>
        {[
          ["customer", "Find services near me"],
          ["vendor", "Offer my services"],
        ].map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value={value}
              checked={role === value}
              onChange={() => setRole(value)}
            />
            {label}
          </label>
        ))}
        {touched && !role ? (
          <p role="alert" className={ERROR_TEXT}>
            Pick how you will use Servana
          </p>
        ) : null}
      </fieldset>
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>I accept the Terms of Service and Privacy Policy</span>
        </label>
        {touched && !accepted ? (
          <p role="alert" className={ERROR_TEXT}>
            You must accept the terms to continue
          </p>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className={ERROR_TEXT}>
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit">Continue</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get("next"))
  const setUser = useAuthStore((s) => s.setUser)
  const [googleError, setGoogleError] = useState("")
  const [pendingGoogle, setPendingGoogle] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useZodForm(loginSchema, { defaultValues: { email: "", password: "" } })

  const finishLogin = (data) => {
    const user = { ...(data.user ?? data) }
    delete user.token // where the token is stored follows the team's decision
    setUser(user)
    navigate(next, { replace: true })
  }

  const onSubmit = async (values) => {
    clearErrors("root.serverError")
    try {
      finishLogin(unwrap(await api.post("/auth/login", values)))
    } catch (error) {
      applyApiErrors(error, setError)
    }
  }

  const handleGoogleCredential = async (credential) => {
    setGoogleError("")
    try {
      const data = unwrap(await api.post("/auth/google", { credential }))
      if (data?.needsOnboarding) {
        setPendingGoogle({ credential, profile: data.profile })
        return
      }
      finishLogin(data)
    } catch (error) {
      setGoogleError(error.message)
    }
  }

  const completeGoogleSignup = async ({ role, acceptedTerms }) => {
    setGoogleError("")
    try {
      finishLogin(
        unwrap(
          await api.post("/auth/google", {
            credential: pendingGoogle.credential,
            role,
            acceptedTerms,
          }),
        ),
      )
    } catch (error) {
      setGoogleError(error.message)
    }
  }

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-10">
      <h1 className="font-heading text-3xl font-bold text-primary">Log in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back to Servana.</p>

      {pendingGoogle ? (
        <div className="mt-6">
          <RoleTermsForm
            profile={pendingGoogle.profile}
            error={googleError}
            onSubmit={completeGoogleSignup}
            onCancel={() => {
              setPendingGoogle(null)
              setGoogleError("")
            }}
          />
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email ? (
                <p role="alert" className={ERROR_TEXT}>
                  {errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password ? (
                <p role="alert" className={ERROR_TEXT}>
                  {errors.password.message}
                </p>
              ) : null}
            </div>
            {errors.root?.serverError ? (
              <p role="alert" className={`rounded-lg bg-danger-soft px-3 py-2 ${ERROR_TEXT}`}>
                {errors.root.serverError.message}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleSignIn onCredential={handleGoogleCredential} />
          {googleError ? (
            <p role="alert" className={`mt-3 ${ERROR_TEXT}`}>
              {googleError}
            </p>
          ) : null}

          <p className="mt-6 text-center text-sm">
            New here?{" "}
            <Link to="/signup" className="font-medium text-primary underline">
              Create an account
            </Link>
          </p>
        </>
      )}
    </main>
  )
}
