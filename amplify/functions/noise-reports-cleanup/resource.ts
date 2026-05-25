import { defineFunction } from "@aws-amplify/backend";

export const noiseReportsCleanupFunction = defineFunction({
  name: "noise-reports-cleanup-function",
  entry: "./handler.ts",
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    DATABASE_URL: process.env.DATABASE_URL!,
  },
});