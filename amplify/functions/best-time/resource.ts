import { defineFunction } from "@aws-amplify/backend";

export const bestTimeFunction = defineFunction({
  name: "best-time-function",
  entry: "./handler.ts",
  timeoutSeconds: 120,
  memoryMB: 1024,
  environment: {
    DATABASE_URL: process.env.DATABASE_URL!,
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN!,
  },
});
