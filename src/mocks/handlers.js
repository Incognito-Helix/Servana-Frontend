import { authHandlers } from "./auth.handlers"
import { signupHandlers } from "./signup.handlers"
import { dataHandlers } from "./data.handlers"

export const handlers = [...authHandlers, ...signupHandlers, ...dataHandlers]
