import { api, unwrap } from "@/lib/api"

export const fetchVendorProfile = async () => unwrap(await api.get("/vendors/profile"))

export const saveVendorStep = async ({ step, data, advance }) =>
  unwrap(await api.patch("/vendors/profile", { step, data, advance }))
