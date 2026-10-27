import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError } from "./fields"
import { DAYS, copyDay } from "./hours"

export default function HoursEditor({ form }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form
  const hours = watch("hours") ?? {}

  const copyMondayToAll = () => {
    const source = copyDay(hours.mon)
    DAYS.forEach(({ key }) => {
      if (key === "mon") return
      for (const field of ["closed", "open", "close"]) {
        setValue(`hours.${key}.${field}`, source[field], {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
    })
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">
        Working hours <span className="text-[#B42318]">*</span>
      </legend>
      <p className="text-xs text-muted-foreground">
        Lagos time. Customers use these for the &quot;open now&quot; filter. Tick Closed on days you
        do not work.
      </p>

      <ul className="space-y-3">
        {DAYS.map(({ key, label }) => {
          const closed = Boolean(hours[key]?.closed)
          const message = errors.hours?.[key]?.close?.message
          return (
            <li key={key} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{label}</p>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register(`hours.${key}.closed`)} />
                  Closed
                </label>
              </div>
              {closed ? null : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor={`hours-${key}-open`} className="text-xs text-muted-foreground">
                      Opens
                    </Label>
                    <Input
                      id={`hours-${key}-open`}
                      type="time"
                      aria-label={`${label} opening time`}
                      aria-invalid={!!message}
                      {...register(`hours.${key}.open`)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`hours-${key}-close`} className="text-xs text-muted-foreground">
                      Closes
                    </Label>
                    <Input
                      id={`hours-${key}-close`}
                      type="time"
                      aria-label={`${label} closing time`}
                      aria-invalid={!!message}
                      {...register(`hours.${key}.close`)}
                    />
                  </div>
                </div>
              )}
              <FieldError message={message} />
            </li>
          )
        })}
      </ul>

      <Button type="button" variant="outline" onClick={copyMondayToAll}>
        Copy Monday to all days
      </Button>
    </fieldset>
  )
}
