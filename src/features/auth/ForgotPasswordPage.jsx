import { useState } from "react"
import { Link } from "react-router-dom"
import { z } from "zod"
import { api } from "@/lib/api"
import { applyApiErrors, useZodForm } from "@/lib/forms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email"),
})

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useZodForm(schema, { defaultValues: { email: "" } })

  const onSubmit = async (values) => {
    try {
      await api.post("/auth/forgot-password", values)
      setSent(true) // same message for every email, on purpose
    } catch (error) {
      applyApiErrors(error, setError)
    }
  }

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-10">
      <h1 className="font-heading text-3xl font-bold text-primary">Forgot password</h1>
      {sent ? (
        <div className="mt-6 space-y-4">
          <p role="status" className="rounded-lg bg-brand-soft px-3 py-2 text-sm">
            If an account exists for that email, we have sent a link to reset your password.
          </p>
          <Link to="/login" className="text-sm font-medium text-primary underline">
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your email and we will send you a reset link.
          </p>
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
              <p role="alert" className="text-sm text-[#B42318]">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          {errors.root?.serverError ? (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-[#B42318]">
              {errors.root.serverError.message}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
          <Link to="/login" className="block text-center text-sm text-primary underline">
            Back to log in
          </Link>
        </form>
      )}
    </main>
  )
}
