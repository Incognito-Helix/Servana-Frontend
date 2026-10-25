import { z } from "zod"
import {
  containsContactInfo,
  isHttpUrl,
  isNigerianPhone,
  normalizeNigerianPhone,
} from "./validators"
import { MAX_RADIUS_KM, insideLagos } from "./location"

const PHONE_MESSAGE = "Enter a valid Nigerian number, like 0803 123 4567 or +234 803 123 4567"

export const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourbusiness" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourbusiness" },
  { key: "x", label: "X", placeholder: "https://x.com/yourbusiness" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourbusiness" },
  { key: "other", label: "Other link", placeholder: "https://yourwebsite.com" },
]

export const step1SchemaFor = (allowedServices) =>
  z
    .object({
      businessName: z
        .string()
        .trim()
        .min(2, "Business name must be at least 2 characters")
        .max(80, "Business name must be at most 80 characters"),
      primaryService: z
        .string()
        .min(1, "Pick your main service")
        .refine((v) => v === "" || allowedServices.includes(v), "That service is not available"),
      otherServices: z.array(z.string()).max(3, "Pick up to 3 other services"),
      about: z
        .string()
        .max(500, "Keep it under 500 characters")
        .refine(
          (v) => !containsContactInfo(v),
          "Remove phone numbers and email addresses from your about section",
        ),
    })
    .superRefine((d, ctx) => {
      if (d.otherServices.includes(d.primaryService)) {
        ctx.addIssue({
          code: "custom",
          path: ["otherServices"],
          message: "Your main service cannot be repeated here",
        })
      }
    })

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || isHttpUrl(v), "Enter a full link starting with https://")

export const step2Schema = z
  .object({
    phone: z
      .string()
      .trim()
      .min(1, "Enter your phone number")
      .refine((v) => v === "" || isNigerianPhone(v), PHONE_MESSAGE),
    whatsappSame: z.boolean(),
    whatsapp: z.string().trim(),
    socials: z.object({
      instagram: optionalUrl,
      tiktok: optionalUrl,
      x: optionalUrl,
      facebook: optionalUrl,
      other: optionalUrl,
    }),
  })
  .superRefine((d, ctx) => {
    if (!d.whatsappSame && !isNigerianPhone(d.whatsapp)) {
      ctx.addIssue({
        code: "custom",
        path: ["whatsapp"],
        message: "Enter a valid Nigerian WhatsApp number",
      })
    }
  })
export const step3SchemaFor = ({ zoneIds, canWorkRemotely }) =>
  z
    .object({
      state: z.string().min(1, "Pick your state"),
      city: z.string().min(1, "Pick your city"),
      zone: z
        .string()
        .min(1, "Pick your zone")
        .refine((v) => v === "" || zoneIds.includes(v), "That zone is not available"),
      locationSource: z.enum(["zone", "device"]),
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
      homeService: z.boolean(),
      travelRadiusKm: z.string().trim(),
      worksRemotely: z.boolean(),
    })
    .superRefine((d, ctx) => {
      if (d.locationSource === "device" && !insideLagos(d.latitude, d.longitude)) {
        ctx.addIssue({
          code: "custom",
          path: ["latitude"],
          message: "Your location must be inside Lagos. Use your zone's centre instead.",
        })
      }
      if (d.worksRemotely && !canWorkRemotely) {
        ctx.addIssue({
          code: "custom",
          path: ["worksRemotely"],
          message: "Works remotely is only for Tech and creative services",
        })
      }
      const remote = canWorkRemotely && d.worksRemotely
      if (d.homeService && !remote) {
        const radius = Number(d.travelRadiusKm)
        if (!/^\d+$/.test(d.travelRadiusKm) || radius < 1 || radius > MAX_RADIUS_KM) {
          ctx.addIssue({
            code: "custom",
            path: ["travelRadiusKm"],
            message: `Enter how far you will travel, from 1 to ${MAX_RADIUS_KM} km`,
          })
        }
      }
    })

// What gets saved: WhatsApp defaults to the phone number, numbers are stored as +234...
export function step2Payload(values) {
  const tidy = (value) => normalizeNigerianPhone(value) ?? String(value ?? "").trim()
  const phone = tidy(values.phone)
  const socials = Object.fromEntries(
    SOCIAL_FIELDS.map(({ key }) => [key, String(values.socials?.[key] ?? "").trim()]),
  )
  return { phone, whatsapp: values.whatsappSame ? phone : tidy(values.whatsapp), socials }
}
