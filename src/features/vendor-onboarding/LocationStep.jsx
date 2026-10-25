import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLagosDate } from "@/lib/dates"
import StepForm from "./StepForm"
import { FieldError, controlClass } from "./fields"
import {
  baseChanged,
  cooldownEnd,
  insideLagos,
  isLocked,
  isTechCreativeService,
  MAX_RADIUS_KM,
} from "./location"
import { MESSAGES } from "./locationMessages"
import { step3SchemaFor } from "./schemas"
import { useCategories } from "./useCategories"
import { useZones } from "./useZones"

const statesOf = (zones) => [...new Set(zones.map((z) => z.state))]
const citiesOf = (zones, state) => [
  ...new Set(zones.filter((z) => z.state === state).map((z) => z.city)),
]
const zonesOf = (zones, state, city) => zones.filter((z) => z.state === state && z.city === city)
const radiusOf = (value) => (/^\d+$/.test(String(value ?? "").trim()) ? Number(value) : null)

export default function LocationStep({ step, profile }) {
  const zonesQuery = useZones()
  const categoriesQuery = useCategories()
  const [geoMessage, setGeoMessage] = useState("")
  const [locating, setLocating] = useState(false)

  const zones = zonesQuery.data
  const canWorkRemotely = isTechCreativeService(categoriesQuery.data, profile.primaryService)
  const schema = useMemo(
    () => step3SchemaFor({ zoneIds: (zones ?? []).map((z) => z.id), canWorkRemotely }),
    [zones, canWorkRemotely],
  )

  if (zonesQuery.isPending || categoriesQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }
  if (zonesQuery.isError || categoriesQuery.isError) {
    return (
      <ErrorState
        message={(zonesQuery.error ?? categoriesQuery.error).message}
        onRetry={() => {
          zonesQuery.refetch()
          categoriesQuery.refetch()
        }}
      />
    )
  }

  const states = statesOf(zones)
  const state = profile.state || (states.length === 1 ? states[0] : "")
  const cities = citiesOf(zones, state)
  const city = profile.city || (cities.length === 1 ? cities[0] : "")
  const fromDevice = profile.locationSource === "device"
  const defaultValues = {
    state,
    city,
    zone: profile.zone ?? "",
    locationSource: fromDevice ? "device" : "zone",
    latitude: fromDevice ? (profile.latitude ?? null) : null,
    longitude: fromDevice ? (profile.longitude ?? null) : null,
    homeService: profile.homeService ?? false,
    travelRadiusKm: profile.travelRadiusKm != null ? String(profile.travelRadiusKm) : "",
    worksRemotely: canWorkRemotely ? (profile.worksRemotely ?? false) : false,
  }

  // Coordinates come from "use my current location" or, if not used, the zone's centre.
  const toPayload = (values) => {
    const remote = canWorkRemotely && Boolean(values.worksRemotely)
    const centre = zones.find((z) => z.id === values.zone)
    const device =
      values.locationSource === "device" &&
      Number.isFinite(values.latitude) &&
      Number.isFinite(values.longitude)
    return {
      state: values.state,
      city: values.city,
      zone: values.zone,
      locationSource: device ? "device" : "zone",
      latitude: device ? values.latitude : (centre?.lat ?? null),
      longitude: device ? values.longitude : (centre?.lng ?? null),
      worksRemotely: remote,
      homeService: remote ? false : Boolean(values.homeService),
      travelRadiusKm: !remote && values.homeService ? radiusOf(values.travelRadiusKm) : null,
    }
  }

  const locked = isLocked(profile)

  return (
    <StepForm
      step={step}
      title="Location"
      description="Where customers can find you."
      schema={schema}
      toPayload={toPayload}
      defaultValues={defaultValues}
    >
      {({ register, watch, setValue, formState: { errors } }) => {
        const selectedState = watch("state")
        const selectedCity = watch("city")
        const zoneId = watch("zone")
        const source = watch("locationSource")
        const latitude = watch("latitude")
        const longitude = watch("longitude")
        const homeService = watch("homeService")
        const remoteOn = canWorkRemotely && watch("worksRemotely")
        const changing = profile.status !== "draft" && baseChanged(profile, toPayload(watch()))
        const zoneName = zones.find((z) => z.id === zoneId)?.name ?? zoneId

        const resetToZoneCentre = () => {
          setValue("locationSource", "zone", { shouldDirty: true })
          setValue("latitude", null, { shouldDirty: true })
          setValue("longitude", null, { shouldDirty: true })
          setGeoMessage("")
        }

        const locate = () => {
          if (!navigator.geolocation) {
            setGeoMessage(MESSAGES.geoUnsupported)
            return
          }
          setLocating(true)
          setGeoMessage("")
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              setLocating(false)
              if (!insideLagos(coords.latitude, coords.longitude)) {
                setGeoMessage(MESSAGES.geoOutside)
                return
              }
              setValue("latitude", coords.latitude, { shouldDirty: true })
              setValue("longitude", coords.longitude, { shouldDirty: true })
              setValue("locationSource", "device", { shouldDirty: true })
              setGeoMessage(MESSAGES.geoUsing)
            },
            (err) => {
              setLocating(false)
              setGeoMessage(err.code === 1 ? MESSAGES.geoDenied : MESSAGES.geoFailed)
            },
            { enableHighAccuracy: true, timeout: 10000 },
          )
        }

        return (
          <>
            {locked ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Base location</p>
                <p className="rounded-md border border-border px-3 py-2 text-sm">
                  {[selectedState, selectedCity, zoneName].filter(Boolean).join(" > ")}
                </p>
                <p role="status" className="rounded-lg bg-marigold-soft px-3 py-2 text-sm">
                  {MESSAGES.locked(formatLagosDate(cooldownEnd(profile)))}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <select
                    id="state"
                    className={controlClass}
                    aria-invalid={!!errors.state}
                    {...register("state", {
                      onChange: () => {
                        setValue("city", "")
                        setValue("zone", "")
                        resetToZoneCentre()
                      },
                    })}
                  >
                    <option value="">Select your state</option>
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.state?.message} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <select
                    id="city"
                    className={controlClass}
                    aria-invalid={!!errors.city}
                    {...register("city", {
                      onChange: () => {
                        setValue("zone", "")
                        resetToZoneCentre()
                      },
                    })}
                  >
                    <option value="">Select your city</option>
                    {citiesOf(zones, selectedState).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.city?.message} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="zone">Zone</Label>
                  <select
                    id="zone"
                    className={controlClass}
                    aria-invalid={!!errors.zone}
                    {...register("zone")}
                  >
                    <option value="">Select your zone</option>
                    {zonesOf(zones, selectedState, selectedCity).map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.zone?.message} />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={locate} disabled={locating}>
                      {locating ? "Finding you..." : "Use my current location"}
                    </Button>
                    {source === "device" ? (
                      <Button type="button" variant="ghost" onClick={resetToZoneCentre}>
                        Use the zone centre instead
                      </Button>
                    ) : null}
                  </div>
                  <p aria-live="polite" className="text-xs text-muted-foreground">
                    {source === "device" && Number.isFinite(latitude) && Number.isFinite(longitude)
                      ? `Using your current location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}).`
                      : geoMessage ||
                        "If you do not share your location, we use the centre of your zone."}
                  </p>
                  {source === "device" ? null : geoMessage ? (
                    <p aria-live="polite" className="text-xs text-muted-foreground">
                      {geoMessage}
                    </p>
                  ) : null}
                  <FieldError message={errors.latitude?.message} />
                </div>
              </div>
            )}

            {!locked ? (
              <p
                role={changing ? "status" : undefined}
                className={
                  changing
                    ? "rounded-lg bg-marigold-soft px-3 py-2 text-sm font-medium"
                    : "text-xs text-muted-foreground"
                }
              >
                {profile.hasActiveBoost
                  ? MESSAGES.boostActive
                  : changing
                    ? MESSAGES.changing
                    : MESSAGES.info}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">{MESSAGES.boostZones}</p>

            {canWorkRemotely ? (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" {...register("worksRemotely")} />
                <span>
                  I work remotely
                  <span className="block text-xs text-muted-foreground">
                    Customers can hire you from anywhere. Home service and travel radius are hidden.
                  </span>
                </span>
              </label>
            ) : null}
            <FieldError message={errors.worksRemotely?.message} />

            {!remoteOn ? (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("homeService")} />I can come to my customers
                  (home service)
                </label>
                {homeService ? (
                  <div className="grid gap-2">
                    <Label htmlFor="travelRadiusKm">How far will you travel? (km)</Label>
                    <Input
                      id="travelRadiusKm"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_RADIUS_KM}
                      aria-invalid={!!errors.travelRadiusKm}
                      {...register("travelRadiusKm")}
                    />
                    <FieldError message={errors.travelRadiusKm?.message} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )
      }}
    </StepForm>
  )
}
