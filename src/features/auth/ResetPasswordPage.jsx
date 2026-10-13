import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { z } from "zod"
import { api } from "@/lib/api"
import { applyApiErrors, useZodForm } from "@/lib/forms"
import { Button } from "@/components/ui/button"
import { passwordSchema } from "./schemas"
import PasswordField from "./PasswordField"
import PasswordChecklist from "./PasswordChecklist"

const schema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

const TOKEN_CODES = ["TOKEN_EXPIRED", "TOKEN_USED", "TOKEN_INVALID"]

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const [done, setDone] = useState(false)
  const [tokenProblem, setTokenProblem] = useState(
    token ? "" : "This reset link is not valid. Request a new one.",
  )

  const {
    register,
    watch,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useZodForm(schema, {
    defaultValues: { password: "", confirmPassword: "" },
  })

  const password = watch("password")

  const onSubmit = async (values) => {
    try {
      await api.post("/auth/reset-password", {
        token,
        password: values.password,
      })
      setDone(true)
    } catch (error) {
      if (TOKEN_CODES.includes(error.code)) {
        setTokenProblem(error.message)
      } else {
        applyApiErrors(error, setError)
      }
    }
  }

  if (done) {
    return (
      <main className="mx-auto w-full max-w-sm px-4 py-10">
        <h1 className="font-heading text-3xl font-bold text-primary">Password updated</h1>
        <p role="status" className="mt-4 text-sm">
          Your password has been changed. You can log in with it now.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/login">Log in</Link>
        </Button>
      </main>
    )
  }

  if (tokenProblem) {
    return (
      <main className="mx-auto w-full max-w-sm px-4 py-10">
        <h1 className="font-heading text-3xl font-bold text-primary">Link problem</h1>
        <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-[#B42318]">
          {tokenProblem}
        </p>
        <Link
          to="/forgot-password"
          className="mt-4 inline-block text-sm font-medium text-primary underline"
        >
          Request a new link
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-10">
      <h1 className="font-heading text-3xl font-bold text-primary">Set a new password</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <div className="space-y-2">
          <PasswordField
            id="password"
            label="New password"
            autoComplete="new-password"
            error={errors.password?.message}
            registration={register("password")}
          />

          <PasswordChecklist value={password} />
        </div>

        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />

        {errors.root?.serverError ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-[#B42318]">
            {errors.root.serverError.message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Reset password"}
        </Button>
      </form>
    </main>
  )
}
