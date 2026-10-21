import { useMemo } from "react"
import { ErrorState } from "@/components/ui/error-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import StepForm from "./StepForm"
import { FieldError, controlClass } from "./fields"
import { step1SchemaFor } from "./schemas"
import { useCategories } from "./useCategories"

const MAX_OTHER = 3
const MAX_ABOUT = 500

const toGroups = (categories) =>
  (categories ?? [])
    .filter((c) => c.active !== false)
    .map((c) => ({ id: c.id, name: c.name, services: c.children }))

export default function BusinessInfoStep({ step, profile }) {
  const { data, isPending, isError, error, refetch } = useCategories()
  const groups = useMemo(() => toGroups(data), [data])
  const schema = useMemo(() => step1SchemaFor(groups.flatMap((g) => g.services)), [groups])

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />

  return (
    <StepForm
      step={step}
      title="Business info"
      description="Tell customers who you are and what you do."
      schema={schema}
      defaultValues={{
        businessName: profile.businessName ?? "",
        primaryService: profile.primaryService ?? "",
        otherServices: profile.otherServices ?? [],
        about: profile.about ?? "",
      }}
    >
      {({ register, watch, setValue, formState: { errors } }) => {
        const primary = watch("primaryService")
        const others = watch("otherServices") ?? []
        const about = watch("about") ?? ""

        const toggle = (service) => {
          const next = others.includes(service)
            ? others.filter((s) => s !== service)
            : [...others, service]
          setValue("otherServices", next, { shouldDirty: true, shouldValidate: true })
        }

        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                autoComplete="organization"
                aria-invalid={!!errors.businessName}
                {...register("businessName")}
              />
              <FieldError message={errors.businessName?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="primaryService">Main service</Label>
              <select
                id="primaryService"
                className={controlClass}
                aria-invalid={!!errors.primaryService}
                {...register("primaryService", {
                  onChange: (e) => {
                    if (others.includes(e.target.value)) {
                      setValue(
                        "otherServices",
                        others.filter((s) => s !== e.target.value),
                        { shouldDirty: true },
                      )
                    }
                  },
                })}
              >
                <option value="">Select your main service</option>
                {groups.map((group) => (
                  <optgroup key={group.id} label={group.name}>
                    {group.services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <FieldError message={errors.primaryService?.message} />
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">
                Other services{" "}
                <span className="font-normal text-muted-foreground">
                  (optional, up to {MAX_OTHER})
                </span>
              </legend>
              {groups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <p className="text-xs text-muted-foreground">{group.name}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {group.services.map((service) => {
                      const checked = others.includes(service)
                      const isPrimary = service === primary
                      const full = others.length >= MAX_OTHER && !checked
                      return (
                        <label key={service} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isPrimary || full}
                            onChange={() => toggle(service)}
                          />
                          {service}
                          {isPrimary ? " (main service)" : ""}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                {others.length} of {MAX_OTHER} selected
              </p>
              <FieldError message={errors.otherServices?.message} />
            </fieldset>

            <div className="grid gap-2">
              <Label htmlFor="about">About your business</Label>
              <textarea
                id="about"
                rows={5}
                className={controlClass}
                aria-invalid={!!errors.about}
                {...register("about")}
              />
              <p className="text-xs text-muted-foreground">
                {about.length}/{MAX_ABOUT}. Do not include phone numbers or email addresses.
              </p>
              <FieldError message={errors.about?.message} />
            </div>
          </>
        )
      }}
    </StepForm>
  )
}
