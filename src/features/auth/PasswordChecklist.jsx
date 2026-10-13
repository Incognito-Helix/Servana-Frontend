import { passwordRules } from "./schemas"

export default function PasswordChecklist({ value = "" }) {
  return (
    <ul className="space-y-1 text-xs text-muted-foreground">
      {passwordRules.map((rule) => {
        const met = rule.test(value)
        return (
          <li key={rule.id} className={met ? "text-verified" : ""}>
            {met ? "✓" : "•"} {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
