import { describeFilters } from "./filters"

export default function ActiveFilters({ filters, onRemove, onClear }) {
  const items = describeFilters(filters)
  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul className="flex flex-wrap gap-2" aria-label="Active filters">
        {items.map(({ key, label }) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => onRemove(key)}
              aria-label={`Remove filter: ${label}`}
              className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
            >
              {label} <span aria-hidden>×</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClear} className="text-xs underline">
        Clear all
      </button>
    </div>
  )
}
