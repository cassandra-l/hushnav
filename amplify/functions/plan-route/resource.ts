import { defineFunction } from "@aws-amplify/backend";

export const planRouteFunction = defineFunction({
  name: "plan-route-function",
  entry: "./handler.ts",
});