export const STEPS = [
  { number: 1, label: "Business info" },
  { number: 2, label: "Contact and socials" },
  { number: 3, label: "Location" },
  { number: 4, label: "Services and pricing" },
  { number: 5, label: "Photos and hours" },
  { number: 6, label: "NIN verification" },
]

export const TOTAL_STEPS = STEPS.length
export const REVIEW_PATH = "/vendor/onboarding/review"
export const stepPath = (number) => `/vendor/onboarding/${number}`

// The API field comes from the Trello card (onboarding_step). Change it here if the backend differs.
export const currentStepOf = (profile) => profile?.onboarding_step ?? 1

export const parseStep = (value) => {
  const number = Number(value)
  return Number.isInteger(number) && number >= 1 && number <= TOTAL_STEPS ? number : null
}

export const resumePath = (profile) => {
  const number = currentStepOf(profile)
  return number > TOTAL_STEPS ? REVIEW_PATH : stepPath(number)
}
