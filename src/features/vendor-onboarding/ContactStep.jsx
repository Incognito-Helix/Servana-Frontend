import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import StepForm from "./StepForm"
import { FieldError } from "./fields"
import { SOCIAL_FIELDS, step2Payload, step2Schema } from "./schemas"

const defaultsFor = (profile) => ({
  phone: profile.phone ?? "",
  whatsappSame: !profile.whatsapp || profile.whatsapp === profile.phone,
  whatsapp: profile.whatsapp ?? "",
  socials: Object.fromEntries(SOCIAL_FIELDS.map(({ key }) => [key, profile.socials?.[key] ?? ""])),
})

export default function ContactStep({ step, profile }) {
  return (
    <StepForm
      step={step}
      title="Contact and socials"
      description="How customers reach you. Phone numbers are only shown to logged-in customers who tap Show contact."
      schema={step2Schema}
      toPayload={step2Payload}
      defaultValues={defaultsFor(profile)}
    >
      {({ register, watch, formState: { errors } }) => {
        const same = watch("whatsappSame")
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0803 123 4567"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              <FieldError message={errors.phone?.message} />
            </div>

            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("whatsappSame")} />
                My WhatsApp number is the same as my phone number
              </label>
              {!same ? (
                <>
                  <Label htmlFor="whatsapp">WhatsApp number</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    inputMode="tel"
                    placeholder="0803 123 4567"
                    aria-invalid={!!errors.whatsapp}
                    {...register("whatsapp")}
                  />
                  <FieldError message={errors.whatsapp?.message} />
                </>
              ) : null}
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">
                Social links <span className="font-normal text-muted-foreground">(optional)</span>
              </legend>
              {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key} className="grid gap-2">
                  <Label htmlFor={`social-${key}`}>{label}</Label>
                  <Input
                    id={`social-${key}`}
                    type="url"
                    inputMode="url"
                    placeholder={placeholder}
                    aria-invalid={!!errors.socials?.[key]}
                    {...register(`socials.${key}`)}
                  />
                  <FieldError message={errors.socials?.[key]?.message} />
                </div>
              ))}
            </fieldset>
          </>
        )
      }}
    </StepForm>
  )
}
