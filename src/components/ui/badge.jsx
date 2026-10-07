import { cva } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        verified: "border-transparent bg-verified-soft text-verified",
        sponsored: "border-transparent bg-marigold text-foreground",
        pending: "border-marigold bg-marigold-soft text-foreground",
        rejected: "border-transparent bg-danger-soft text-[#B42318]",
        suspended: "border-transparent bg-border text-[#5A5670]",
        homeService: "border-transparent bg-brand-soft text-primary",
        remote: "border-primary/30 bg-transparent text-primary",
        confirmed: "border-transparent bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { variant: "verified" },
  },
)

export function Badge({ variant, className = "", ...props }) {
  return <span className={`${badgeVariants({ variant })} ${className}`} {...props} />
}
