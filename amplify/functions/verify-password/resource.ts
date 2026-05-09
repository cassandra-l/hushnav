import { defineFunction } from "@aws-amplify/backend";

export const verifyPasswordFunction = defineFunction({
  name: "verify-password-function",
  entry: "./handler.ts",
  environment: {
    LOCK_PASSWORD: process.env.LOCK_PASSWORD!,
  },
});