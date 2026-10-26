import { useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPriceFrom } from "@/lib/money"
import StepForm from "./StepForm"
import { FieldError } from "./fields"
import { step4Schema } from "./schemas"
import {
  MAX_SERVICES,
  emptyRow,
  lowestPriceKobo,
  servicesPayload,
  servicesToDefaults,
} from "./services"

// A separate component, so the hook is not called inside StepForm's render callback.
function ServiceRows({ form }) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form
  const { fields, append, remove } = useFieldArray({ control, name: "services" })
  const rows = watch("services") ?? []
  const lowest = lowestPriceKobo(servicesPayload({ services: rows }).services)
  const listError = errors.services?.root?.message ?? errors.services?.message

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {fields.map((field, index) => {
          const rowErrors = errors.services?.[index]
          return (
            <li key={field.id} className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Service {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={fields.length === 1}
                  aria-label={`Remove service ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`service-name-${index}`}>Service name</Label>
                <Input
                  id={`service-name-${index}`}
                  placeholder="Bridal makeup"
                  aria-invalid={!!rowErrors?.name}
                  {...register(`services.${index}.name`)}
                />
                <FieldError message={rowErrors?.name?.message} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor={`service-start-${index}`}>Starting price (₦)</Label>
                  <Input
                    id={`service-start-${index}`}
                    inputMode="decimal"
                    placeholder="40000"
                    aria-invalid={!!rowErrors?.startPrice}
                    {...register(`services.${index}.startPrice`)}
                  />
                  <FieldError message={rowErrors?.startPrice?.message} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`service-max-${index}`}>Max price (₦), optional</Label>
                  <Input
                    id={`service-max-${index}`}
                    inputMode="decimal"
                    placeholder="80000"
                    aria-invalid={!!rowErrors?.maxPrice}
                    {...register(`services.${index}.maxPrice`)}
                  />
                  <FieldError message={rowErrors?.maxPrice?.message} />
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <FieldError message={listError} />

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={fields.length >= MAX_SERVICES}
          onClick={() => append(emptyRow())}
        >
          Add another service
        </Button>
        <p className="text-xs text-muted-foreground">
          {fields.length} of {MAX_SERVICES}
        </p>
      </div>

      <div className="rounded-lg bg-brand-soft px-3 py-2">
        <p className="text-xs text-muted-foreground">How your price shows on your card</p>
        <p className="text-sm font-medium">
          {lowest ? formatPriceFrom(lowest) : "Add a starting price to see this"}
        </p>
      </div>
    </div>
  )
}

export default function ServicesStep({ step, profile }) {
  return (
    <StepForm
      step={step}
      title="Services and pricing"
      description="List what you offer and what it costs. Customers see the lowest starting price on your card."
      schema={step4Schema}
      toPayload={servicesPayload}
      defaultValues={{ services: servicesToDefaults(profile.services) }}
    >
      {(form) => <ServiceRows form={form} />}
    </StepForm>
  )
}
