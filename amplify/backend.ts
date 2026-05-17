import { defineBackend } from "@aws-amplify/backend";
import { Duration, Stack } from "aws-cdk-lib";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";

import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { planRouteFunction } from "./functions/plan-route/resource";
import { noiseMapFunction } from "./functions/noise-map/resource";
import { safeSpacesFunction } from "./functions/safe-spaces/resource";
import { verifyPasswordFunction } from "./functions/verify-password/resource";
import { constructionPipeline } from "./functions/construction-pipeline/resource";
import { bestTimeFunction } from "./functions/best-time/resource";
import { geocodeSuggestions } from "./functions/geocode-suggestions/resource";


const backend = defineBackend({
  auth,
  data,
  planRouteFunction,
  noiseMapFunction,
  safeSpacesFunction,
  verifyPasswordFunction,
  constructionPipeline,
  bestTimeFunction,
  geocodeSuggestions,
});

const apiStack = backend.createStack("api-stack");

const myRestApi = new RestApi(apiStack, "NavigationRestApi", {
  restApiName: "navigationRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
});

const planRouteIntegration = new LambdaIntegration(
  backend.planRouteFunction.resources.lambda
);

const noiseMapIntegration = new LambdaIntegration(
  backend.noiseMapFunction.resources.lambda
);

const safeSpacesIntegration = new LambdaIntegration(
  backend.safeSpacesFunction.resources.lambda
);

const verifyPasswordIntegration = new LambdaIntegration(
  backend.verifyPasswordFunction.resources.lambda
);

const bestTimeIntegration = new LambdaIntegration(
  backend.bestTimeFunction.resources.lambda,
  {
    timeout: Duration.seconds(100),
  },
);

const geocodeSuggestionsIntegration = new LambdaIntegration(
  backend.geocodeSuggestions.resources.lambda,
);

const planRoutePath = myRestApi.root.addResource("plan-route");
planRoutePath.addMethod("POST", planRouteIntegration);

const noiseMapPath = myRestApi.root.addResource("noise-map");
noiseMapPath.addMethod("GET", noiseMapIntegration);

const safeSpacesPath = myRestApi.root.addResource("safe-spaces");
safeSpacesPath.addMethod("GET", safeSpacesIntegration);

const verifyPasswordPath = myRestApi.root.addResource("verify-password");
verifyPasswordPath.addMethod("POST", verifyPasswordIntegration);

const bestTimePath = myRestApi.root.addResource("best-time");
bestTimePath.addMethod("POST", bestTimeIntegration);

const geocodeSuggestionsPath = myRestApi.root.addResource("geocode-suggestions");
geocodeSuggestionsPath.addMethod("GET", geocodeSuggestionsIntegration);

backend.addOutput({
  custom: {
    API: {
      [myRestApi.restApiName]: {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName: myRestApi.restApiName,
      },
    },
  },
});