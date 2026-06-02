import { defineFunction } from "@aws-amplify/backend";

export const constructionPipeline = defineFunction({
  name: "construction-pipeline",
  entry: "./handler.ts",
  timeoutSeconds: 300,
});