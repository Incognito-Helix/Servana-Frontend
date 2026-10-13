import { useState } from "react"
import { z } from "zod"
import { api } from "@/lib/api"
import { applyApiErrors, useZodForm } from "@/lib/forms"
import { Button } from "@/components/ui/button"
import { passwordSchema } from "./schemas"
import PasswordField from "./PasswordField"
import PasswordChecklist from "./PasswordChecklist"

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

export default function ChangePasswordPage() {
  const [changed, setChanged] = useState(false)

  const {
    register,
    watch,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useZodForm(schema, {
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const newPassword = watch("newPassword")

  const onSubmit = async (values) => {
    setChanged(false)

    try {
      await api.post("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      reset()
      setChanged(true)
    } catch (error) {
      applyApiErrors(error, setError)
    }
  }

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-10">
      <h1 className="font-heading text-3xl font-bold text-primary">Change password</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <PasswordField
          id="currentPassword"
          label="Current password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          registration={register("currentPassword")}
        />

        <div className="space-y-2">
          <PasswordField
            id="newPassword"
            label="New password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            registration={register("newPassword")}
          />

          <PasswordChecklist value={newPassword} />
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

        {changed ? (
          <p role="status" className="rounded-lg bg-verified-soft px-3 py-2 text-sm text-verified">
            Password changed.
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Change password"}
        </Button>
      </form>
    </main>
  )
}
