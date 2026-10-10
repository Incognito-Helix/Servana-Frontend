import { HttpResponse } from "msw"

export const ok = (data, status = 200) => HttpResponse.json({ success: true, data }, { status })

export const fail = (status, code, message, fieldErrors) =>
  HttpResponse.json({ success: false, error: { code, message, fieldErrors } }, { status })
