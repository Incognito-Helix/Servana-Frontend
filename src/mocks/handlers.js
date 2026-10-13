import { authHandlers } from "./auth.handlers"
import { signupHandlers } from "./signup.handlers"
import { passwordHandlers } from "./password.handlers"
import { dataHandlers } from "./data.handlers"
import { boostHandlers } from "./boosts.handlers"

export const handlers = [
  ...authHandlers,
  ...signupHandlers,
  ...passwordHandlers,
  ...dataHandlers,
  ...boostHandlers,
]
