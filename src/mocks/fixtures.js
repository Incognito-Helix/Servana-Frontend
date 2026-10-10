const naira = (n) => n * 100 // prices are integer kobo

export const zones = [
  { id: "lekki", name: "Lekki", city: "Lagos", lat: 6.4474, lng: 3.4723 },
  { id: "ikeja", name: "Ikeja", city: "Lagos", lat: 6.6018, lng: 3.3515 },
  { id: "yaba", name: "Yaba", city: "Lagos", lat: 6.5095, lng: 3.3711 },
  { id: "surulere", name: "Surulere", city: "Lagos", lat: 6.5, lng: 3.35 },
  { id: "victoria-island", name: "Victoria Island", city: "Lagos", lat: 6.4281, lng: 3.4219 },
  { id: "ikorodu", name: "Ikorodu", city: "Lagos", lat: 6.6194, lng: 3.5105 },
]

export const categories = [
  { id: "beauty", name: "Beauty", children: ["Hair", "Barbing", "Makeup", "Nails", "Lashes"] },
  {
    id: "events",
    name: "Events",
    children: ["Planners", "Decorators", "DJs", "MCs", "Photographers", "Rentals"],
  },
  { id: "food", name: "Food", children: ["Caterers", "Small chops", "Cakes"] },
  { id: "home", name: "Home", children: ["Cleaning", "Laundry"] },
]

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
const fakePhone = (n) => `+23480000000${String(n).padStart(2, "0")}`

const vendor = (
  n,
  name,
  categoryId,
  subcategory,
  zoneId,
  rating,
  reviewCount,
  services,
  extra = {},
) => ({
  id: `v_${n}`,
  slug: slugify(name),
  name,
  bio: `${name} serves customers in ${zones.find((z) => z.id === zoneId).name} and nearby areas.`,
  categoryId,
  subcategory,
  zoneId,
  rating,
  reviewCount,
  verified: true,
  homeService: false,
  boost: null,
  phone: fakePhone(n),
  whatsapp: fakePhone(n),
  hours: "Mon-Sat, 9am-6pm",
  services: services.map(([label, price], i) => ({
    id: `s_${n}_${i + 1}`,
    name: label,
    priceFromKobo: naira(price),
  })),
  ...extra,
})

export const vendors = [
  vendor(
    1,
    "Bisi Makeovers",
    "beauty",
    "Makeup",
    "lekki",
    4.8,
    126,
    [
      ["Bridal makeup", 40000],
      ["Event makeup", 15000],
    ],
    {
      homeService: true,
      boost: { type: "top_spot", zones: ["lekki", "victoria-island"] },
    },
  ),
  vendor(
    2,
    "Tola Cuts Barbing",
    "beauty",
    "Barbing",
    "yaba",
    4.6,
    84,
    [
      ["Haircut", 3000],
      ["Haircut and beard", 5000],
    ],
    { homeService: true },
  ),
  vendor(
    3,
    "Mama Ngozi Small Chops",
    "food",
    "Small chops",
    "surulere",
    4.9,
    210,
    [
      ["Small chops platter", 25000],
      ["Party pack (50)", 90000],
    ],
    {
      boost: { type: "zone_boost", zones: ["surulere", "yaba"] },
    },
  ),
  vendor(4, "Eko Events and Decor", "events", "Decorators", "ikeja", 4.5, 57, [
    ["Wedding decor", 150000],
    ["Birthday setup", 60000],
  ]),
  vendor(
    5,
    "Sparkle Home Cleaning",
    "home",
    "Cleaning",
    "lekki",
    4.3,
    41,
    [["Apartment deep clean", 15000]],
    { homeService: true },
  ),
  vendor(6, "DJ Kayode", "events", "DJs", "victoria-island", 4.7, 73, [
    ["4-hour set", 80000],
    ["Full night", 150000],
  ]),
  vendor(
    7,
    "Nails by Amaka",
    "beauty",
    "Nails",
    "ikeja",
    4.4,
    38,
    [
      ["Gel manicure", 8000],
      ["Acrylic set", 12000],
    ],
    { homeService: true },
  ),
  vendor(8, "Lash Lounge by Dami", "beauty", "Lashes", "yaba", 4.7, 66, [
    ["Classic lashes", 12000],
    ["Volume lashes", 18000],
  ]),
]

const review = (n, vendorId, authorName, rating, comment, createdAt) => ({
  id: `r_${n}`,
  vendorId,
  userId: `seed_${n}`,
  authorName,
  rating,
  comment,
  createdAt,
})

export const reviews = [
  review(
    1,
    "v_1",
    "Chioma A.",
    5,
    "Did my bridal makeup and it lasted all day.",
    "2026-09-12T10:00:00Z",
  ),
  review(2, "v_1", "Funke O.", 5, "On time and so professional.", "2026-09-30T15:30:00Z"),
  review(3, "v_2", "Emeka N.", 4, "Clean cut, fair price.", "2026-10-02T09:15:00Z"),
  review(
    4,
    "v_3",
    "Hauwa B.",
    5,
    "The small chops were the hit of the party.",
    "2026-09-20T18:45:00Z",
  ),
  review(5, "v_4", "Seun K.", 4, "Beautiful decor, arrived a bit late.", "2026-08-28T12:00:00Z"),
  review(6, "v_6", "Tunde L.", 5, "Kept the dance floor full all night.", "2026-09-05T22:10:00Z"),
]
