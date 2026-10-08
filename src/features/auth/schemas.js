import { z } from "zod"

export const TERMS_VERSION = "1.0" // CONFIRM with the backend lead

export const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /[0-9]/.test(v) },
  { id: "special", label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
]

const name = (label) =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} must be at most 50 characters`)

const mustBeTrue = (message) => z.boolean().refine((v) => v === true, { message })

const base = z.object({
  role: z.enum(["customer", "vendor"]), // admin is rejected here
  firstName: name("First name"),
  lastName: name("Last name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password needs one uppercase letter")
    .regex(/[0-9]/, "Password needs one number")
    .regex(/[^A-Za-z0-9]/, "Password needs one special character"),
  confirmPassword: z.string().min(1, "Confirm your password"),
  acceptedTerms: mustBeTrue("You must agree to the Terms of Service and Privacy Policy"),
})

export function signupSchemaFor(role) {
  const schema =
    role === "vendor"
      ? base.extend({
          acceptedVendorPolicy: mustBeTrue("Please agree to the Vendor Policy and Guidelines"),
        })
      : base
  return schema.superRefine((d, ctx) => {
    if (d.password !== d.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" })
    }
  })
}
