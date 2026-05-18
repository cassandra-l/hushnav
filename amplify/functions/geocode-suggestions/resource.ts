import { defineFunction } from "@aws-amplify/backend";

export const geocodeSuggestions = defineFunction({
  name: "geocode-suggestions",
  entry: "./handler.ts",
  timeoutSeconds: 15,
});