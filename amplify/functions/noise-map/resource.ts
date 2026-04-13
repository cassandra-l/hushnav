import { defineFunction } from "@aws-amplify/backend";

export const noiseMapFunction = defineFunction({
  name: "noise-map-function",
  entry: "./handler.ts",
});