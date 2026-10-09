import { authHandlers } from "./auth.handlers"
import { signupHandlers } from "./signup.handlers"

export const handlers = [...authHandlers, ...signupHandlers]
