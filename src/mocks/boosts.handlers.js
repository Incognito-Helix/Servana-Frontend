import { http, delay, HttpResponse } from "msw"
import { ok, fail } from "./respond"
import { getSessionUser } from "./auth.handlers"
import { zones } from "./fixtures"

const API = import.meta.env.VITE_API_URL
const PAYMENT_DELAY_MS = 4000
const DECLINED_ZONE = "ikorodu" // test hook: a boost that includes this zone fails payment
const DAY_MS = 24 * 60 * 60 * 1000

const naira = (n) => n * 100 // prices are integer kobo

// Demo prices only, charged per zone.
const PRICES = {
  zone_boost: { daily: naira(500), weekly: naira(2500) },
  top_spot: { daily: naira(1000), weekly: naira(5000) },
}
const DAYS = { daily: 1, weekly: 7 }

const vouchers = [
  {
    code: "WELCOME50",
    type: "percentage",
    value: 50,
    expiresAt: "2026-12-31",
    usageLimit: 500,
    used: 0,
    firstBoostOnly: true,
  },
  {
    code: "LAGOS500",
    type: "flat",
    value: naira(500),
    expiresAt: "2026-12-31",
    usageLimit: 100,
    used: 12,
  },
  {
    code: "FESTIVE20",
    type: "percentage",
    value: 20,
    expiresAt: "2026-12-31",
    usageLimit: 1000,
    used: 40,
  },
  {
    code: "EXPIRED10",
    type: "percentage",
    value: 10,
    expiresAt: "2026-01-01",
    usageLimit: 100,
    used: 3,
  },
  {
    code: "USEDUP",
    type: "flat",
    value: naira(1000),
    expiresAt: "2026-12-31",
    usageLimit: 1,
    used: 1,
  },
]

const boosts = []
const payments = new Map() // reference -> { boostId, status }

const requireVendor = () => {
  const user = getSessionUser()
  if (!user) return { error: fail(401, "UNAUTHORIZED", "Log in to continue.") }
  if (user.role !== "vendor")
    return { error: fail(403, "FORBIDDEN", "Only vendors can buy boosts.") }
  return { user }
}

const statusOf = (b) =>
  b.status === "active" && Date.now() > Date.parse(b.endsAt) ? "expired" : b.status
const publicBoost = (b) => ({ ...b, ownerId: undefined, status: statusOf(b) })

function validateOrder({ type, zones: zoneIds, duration }) {
  const fieldErrors = {}
  if (!PRICES[type]) fieldErrors.type = "Pick a boost type"
  if (!DAYS[duration]) fieldErrors.duration = "Pick daily or weekly"
  if (!Array.isArray(zoneIds) || zoneIds.length === 0) fieldErrors.zones = "Pick at least one zone"
  else if (zoneIds.some((id) => !zones.some((z) => z.id === id)))
    fieldErrors.zones = "One of those zones is not available"
  return fieldErrors
}

function checkVoucher(code, ownerId, subtotalKobo) {
  if (!code) return { voucher: null, discountKobo: 0 }
  const voucher = vouchers.find((v) => v.code === code.trim().toUpperCase())
  if (!voucher) return { error: "That code is not valid" }
  if (new Date(voucher.expiresAt) < new Date()) return { error: "That code has expired" }
  if (voucher.used >= voucher.usageLimit) return { error: "That code has already been fully used" }
  const hadPaidBoost = boosts.some(
    (b) => b.ownerId === ownerId && ["active", "expired"].includes(statusOf(b)),
  )
  if (voucher.firstBoostOnly && hadPaidBoost)
    return { error: "That code is only for your first boost" }
  const raw =
    voucher.type === "percentage" ? Math.round((subtotalKobo * voucher.value) / 100) : voucher.value
  return { voucher, discountKobo: Math.min(raw, subtotalKobo) }
}

// The server owns the price. The frontend only displays totalKobo.
function buildQuote(ownerId, body) {
  const fieldErrors = validateOrder(body)
  if (Object.keys(fieldErrors).length) {
    return { response: fail(400, "VALIDATION", "Check the highlighted fields.", fieldErrors) }
  }
  const subtotalKobo = PRICES[body.type][body.duration] * body.zones.length
  const { voucher, discountKobo, error } = checkVoucher(body.voucherCode, ownerId, subtotalKobo)
  if (error) return { response: fail(400, "VOUCHER_INVALID", error, { voucherCode: error }) }
  return {
    quote: {
      type: body.type,
      zones: body.zones,
      duration: body.duration,
      days: DAYS[body.duration],
      subtotalKobo,
      discountKobo,
      totalKobo: subtotalKobo - discountKobo,
      voucher: voucher ? { code: voucher.code, type: voucher.type, value: voucher.value } : null,
    },
  }
}

// Stands in for Paystack calling the backend webhook. Only this makes a boost go live.
function settle(reference) {
  const payment = payments.get(reference)
  if (!payment || payment.status !== "pending") return
  const boost = boosts.find((b) => b.id === payment.boostId)
  if (!boost) return
  if (boost.zones.includes(DECLINED_ZONE)) {
    payment.status = "failed"
    boost.status = "failed"
    return
  }
  const now = Date.now()
  payment.status = "success"
  boost.status = "active"
  boost.startsAt = new Date(now).toISOString()
  boost.endsAt = new Date(now + boost.days * DAY_MS).toISOString()
  // Demo numbers for the dashboard: during the boost vs the week before.
  boost.stats = { views: 128, contactTaps: 17, previousViews: 71, previousContactTaps: 9 }
  const voucher = vouchers.find((v) => v.code === boost.voucher?.code)
  if (voucher) voucher.used += 1
}

// ASSUMED endpoints and shapes: confirm with the backend lead.
export const boostHandlers = [
  http.post(`${API}/boosts/quote`, async ({ request }) => {
    await delay(300)
    const { user, error } = requireVendor()
    if (error) return error
    const { quote, response } = buildQuote(user.id, await request.json())
    return response ?? ok(quote)
  }),

  http.post(`${API}/boosts`, async ({ request }) => {
    await delay(400)
    const { user, error } = requireVendor()
    if (error) return error
    const body = await request.json()
    const { quote, response } = buildQuote(user.id, body)
    if (response) return response
    const boost = {
      id: `b_${Date.now()}`,
      ownerId: user.id,
      ...quote,
      status: "pending",
      reference: null,
      startsAt: null,
      endsAt: null,
      stats: null,
      createdAt: new Date().toISOString(),
    }
    boosts.push(boost)
    return ok(publicBoost(boost), 201)
  }),

  http.get(`${API}/boosts`, async () => {
    await delay(300)
    const { user, error } = requireVendor()
    if (error) return error
    const items = boosts
      .filter((b) => b.ownerId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(publicBoost)
    return ok({ items })
  }),

  http.get(`${API}/boosts/:id`, async ({ params }) => {
    await delay(200)
    const { user, error } = requireVendor()
    if (error) return error
    const boost = boosts.find((b) => b.id === params.id && b.ownerId === user.id)
    return boost ? ok(publicBoost(boost)) : fail(404, "NOT_FOUND", "Boost not found.")
  }),

  http.post(`${API}/payments/initialize`, async ({ request }) => {
    await delay(400)
    const { user, error } = requireVendor()
    if (error) return error
    const { boostId } = await request.json()
    const boost = boosts.find((b) => b.id === boostId && b.ownerId === user.id)
    if (!boost) return fail(404, "NOT_FOUND", "Boost not found.")
    if (boost.status !== "pending")
      return fail(409, "BOOST_NOT_PENDING", "This boost has already been paid for.")

    const reference = `ps_${Date.now()}`
    boost.reference = reference
    payments.set(reference, { boostId: boost.id, status: "pending" })
    setTimeout(() => settle(reference), boost.totalKobo === 0 ? 0 : PAYMENT_DELAY_MS)
    return ok({
      reference,
      amountKobo: boost.totalKobo,
      authorizationUrl: `${window.location.origin}/payments/callback?reference=${reference}`,
    })
  }),

  // The callback page polls this until the payment settles.
  http.get(`${API}/payments/:reference`, async ({ params }) => {
    await delay(200)
    const payment = payments.get(params.reference)
    if (!payment) return fail(404, "NOT_FOUND", "Payment not found.")
    const boost = boosts.find((b) => b.id === payment.boostId)
    return ok({
      reference: params.reference,
      status: payment.status, // pending | success | failed
      boostId: payment.boostId,
      boostStatus: boost ? statusOf(boost) : null,
    })
  }),

  // Paystack-style webhook. Nothing in the app calls this. It can be hit by hand.
  http.post(`${API}/payments/webhook`, async ({ request }) => {
    const body = await request.json()
    if (body.event === "charge.success") settle(body.data?.reference)
    return HttpResponse.json({ received: true })
  }),
]
