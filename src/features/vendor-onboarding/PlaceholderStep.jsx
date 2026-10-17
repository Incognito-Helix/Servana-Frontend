import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import StepForm from "./StepForm"
import { STEPS } from "./steps"

const fieldName = (step) => `note${step}`
const SCHEMAS = Object.fromEntries(
  STEPS.map(({ number }) => [
    number,
    z.object({ [fieldName(number)]: z.string().max(200, "Keep it under 200 characters") }),
  ]),
)

export default function PlaceholderStep({ step, profile }) {
  const name = fieldName(step)
  const meta = STEPS.find((s) => s.number === step)
  return (
    <StepForm
      step={step}
      title={meta.label}
      description="The real form for this step arrives with its own card. The field below only proves autosave and resume."
      schema={SCHEMAS[step]}
      defaultValues={{ [name]: profile[name] ?? "" }}
    >
      {({ register, formState: { errors } }) => (
        <div className="grid gap-2">
          <Label htmlFor={name}>Placeholder note</Label>
          <Input id={name} aria-invalid={!!errors[name]} {...register(name)} />
          {errors[name] ? (
            <p role="alert" className="text-sm text-[#B42318]">
              {errors[name].message}
            </p>
          ) : null}
        </div>
      )}
    </StepForm>
  )
}
