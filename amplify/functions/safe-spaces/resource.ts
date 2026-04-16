import { defineFunction } from "@aws-amplify/backend";

export const safeSpacesFunction = defineFunction({
  name: "safe-spaces-function",
  entry: "./handler.ts",
  environment: {
    DATABASE_URL: process.env.DATABASE_URL!,
  },
});