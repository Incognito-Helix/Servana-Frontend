import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PasswordField({ id, label, autoComplete, error, registration }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={!!error}
        {...registration}
      />
      {error ? (
        <p role="alert" className="text-sm text-[#B42318]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
