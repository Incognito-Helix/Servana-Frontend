import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { signupSchemaFor, passwordRules, TERMS_VERSION } from "./schemas"

function Field({ label, htmlFor, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      role: "customer",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
      acceptedVendorPolicy: false,
    },
    resolver: (values, context, options) =>
      zodResolver(signupSchemaFor(values.role))(values, context, options),
  })

  const role = watch("role")
  const password = watch("password") || ""
  const confirm = watch("confirmPassword") || ""
  const mismatch = confirm && password !== confirm ? "Passwords do not match" : ""

  const onSubmit = async (values) => {
    setFormError("")
    const payload = {
      role: values.role,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      confirmPassword: values.confirmPassword,
      acceptedTerms: true,
      termsVersion: TERMS_VERSION,
      ...(values.role === "vendor" ? { acceptedVendorPolicy: true } : {}),
    }
    try {
      await api.post("/auth/register", payload)
      navigate("/verify-email", { state: { email: payload.email } })
    } catch (err) {
      const fe = err.fieldErrors || {}
      const keys = Object.keys(fe)
      keys.forEach((k) => setError(k, { message: Array.isArray(fe[k]) ? fe[k][0] : fe[k] }))
      if (err.status === 409 && !keys.length) {
        setError("email", { message: "An account with this email already exists" })
      } else if (!keys.length) {
        setFormError(err.message || "Something went wrong. Please try again.")
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-md p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="underline">
          Log in
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-1 text-sm font-medium">I am a</legend>
          {[
            ["customer", "Customer"],
            ["vendor", "Vendor"],
          ].map(([value, label]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-md border p-3 text-center text-sm ${
                role === value ? "border-black font-semibold" : ""
              }`}
            >
              <input type="radio" value={value} className="sr-only" {...register("role")} />
              {label}
            </label>
          ))}
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="firstName" error={errors.firstName?.message}>
            <Input
              id="firstName"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
              {...register("firstName")}
            />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
            <Input
              id="lastName"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              {...register("lastName")}
            />
          </Field>
        </div>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="flex gap-2">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <Button type="button" variant="outline" onClick={() => setShowPassword((s) => !s)}>
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            {passwordRules.map((r) => (
              <li key={r.id} className={r.test(password) ? "text-green-700" : "text-gray-500"}>
                {r.test(password) ? "✓" : "•"} {r.label}
              </li>
            ))}
          </ul>
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          error={mismatch || errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={!!(mismatch || errors.confirmPassword)}
            {...register("confirmPassword")}
          />
        </Field>

        <div className="space-y-3">
          <div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" {...register("acceptedTerms")} />
              <span>
                I agree to the{" "}
                <Link to="/terms" target="_blank" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" target="_blank" className="underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.acceptedTerms && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.acceptedTerms.message}
              </p>
            )}
          </div>

          {role === "vendor" && (
            <div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" {...register("acceptedVendorPolicy")} />
                <span>
                  I agree to the{" "}
                  <Link to="/vendor-policy" target="_blank" className="underline">
                    Vendor Policy and Guidelines
                  </Link>
                </span>
              </label>
              {errors.acceptedVendorPolicy && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.acceptedVendorPolicy.message}
                </p>
              )}
            </div>
          )}
        </div>

        {formError && (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </div>
  )
}
