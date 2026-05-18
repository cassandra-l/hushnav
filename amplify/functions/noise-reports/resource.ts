import { defineFunction } from "@aws-amplify/backend";

export const noiseReportsFunction = defineFunction({
  name: "noise-reports-function",
  entry: "./handler.ts",
  environment: {
    DATABASE_URL: process.env.DATABASE_URL!,
  },
});