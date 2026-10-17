import { Link } from "react-router-dom"
import { STEPS, stepPath } from "./steps"

const circle = "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"

export default function Stepper({ active, reached }) {
  const activeLabel = STEPS.find((s) => s.number === active)?.label

  return (
    <nav aria-label="Onboarding progress">
      <p className="text-sm text-muted-foreground md:hidden">
        Step {active} of {STEPS.length}:{" "}
        <span className="font-medium text-foreground">{activeLabel}</span>
      </p>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border md:hidden"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={active}
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(active / STEPS.length) * 100}%` }}
        />
      </div>

      <ol className="hidden items-center gap-2 md:flex">
        {STEPS.map(({ number, label }) => {
          const reachable = number <= reached
          const done = number < reached
          const isActive = number === active
          const tone = isActive
            ? "bg-primary text-primary-foreground"
            : done
              ? "bg-verified-soft text-verified"
              : "bg-border text-muted-foreground"
          const content = (
            <>
              <span className={`${circle} ${tone}`}>{done && !isActive ? "✓" : number}</span>
              <span className="hidden text-sm xl:inline">{label}</span>
            </>
          )
          return (
            <li key={number} className="flex items-center gap-2">
              {reachable ? (
                <Link
                  to={stepPath(number)}
                  title={label}
                  aria-current={isActive ? "step" : undefined}
                  className="flex items-center gap-2"
                >
                  {content}
                </Link>
              ) : (
                <span title={label} className="flex items-center gap-2 text-muted-foreground">
                  {content}
                </span>
              )}
              {number < STEPS.length ? (
                <span className="h-px w-4 bg-border" aria-hidden="true" />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
