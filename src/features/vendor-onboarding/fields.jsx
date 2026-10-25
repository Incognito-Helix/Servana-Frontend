export const controlClass =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"

export function FieldError({ message }) {
  return message ? (
    <p role="alert" className="text-sm text-[#B42318]">
      {message}
    </p>
  ) : null
}
