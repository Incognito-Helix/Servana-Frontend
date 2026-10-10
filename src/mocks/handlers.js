import { authHandlers } from "./auth.handlers"
import { signupHandlers } from "./signup.handlers"
import { dataHandlers } from "./data.handlers"
import { boostHandlers } from "./boosts.handlers"

export const handlers = [...authHandlers, ...signupHandlers, ...dataHandlers, ...boostHandlers]
