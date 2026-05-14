import { defineFunction } from "@aws-amplify/backend";

export const bestTimeFunction = defineFunction({
  name: "best-time-function",
  entry: "./handler.ts",
  environment: {
    DATABASE_URL: process.env.DATABASE_URL!,
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN!,
  },
});
