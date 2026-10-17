import { useNavigate } from "react-router-dom"
import { applyApiErrors, useZodForm } from "@/lib/forms"
import { Button } from "@/components/ui/button"
import { useSaveStep } from "./hooks"
import { useAutosave } from "./useAutosave"
import { REVIEW_PATH, TOTAL_STEPS, stepPath } from "./steps"

const STATUS_TEXT = {
  saving: "Saving...",
  saved: "All changes saved",
  error: "Could not save. We will try again when you change something.",
}

// Shared by every step: autosave, Back, and "Save and continue".
export default function StepForm({ step, title, description, schema, defaultValues, children }) {
  const navigate = useNavigate()
  const saveStep = useSaveStep()
  const form = useZodForm(schema, { defaultValues })
  const {
    handleSubmit,
    setError,
    watch,
    formState: { isSubmitting, errors },
  } = form
  const { status, cancel } = useAutosave({ step, watch })
  const isLast = step === TOTAL_STEPS

  const onSubmit = async (values) => {
    cancel()
    try {
      await saveStep.mutateAsync({ step, data: values, advance: true })
      navigate(isLast ? REVIEW_PATH : stepPath(step + 1))
    } catch (error) {
      applyApiErrors(error, setError)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 className="font-heading text-2xl font-bold text-primary">{title}</h1>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}

      <div className="mt-6 space-y-4">{children(form)}</div>

      {errors.root?.serverError ? (
        <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-[#B42318]">
          {errors.root.serverError.message}
        </p>
      ) : null}

      <p aria-live="polite" className="mt-4 min-h-5 text-xs text-muted-foreground">
        {STATUS_TEXT[status] ?? ""}
      </p>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={() => navigate(stepPath(step - 1))}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isLast ? "Save and review" : "Save and continue"}
        </Button>
      </div>
    </form>
  )
}
