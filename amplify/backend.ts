import { defineBackend } from "@aws-amplify/backend";
import { Duration, Stack } from "aws-cdk-lib";
import {
  Cors,
  EndpointType,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";

import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { planRouteFunction } from "./functions/plan-route/resource";
import { noiseMapFunction } from "./functions/noise-map/resource";
import { safeSpacesFunction } from "./functions/safe-spaces/resource";
import { constructionPipeline } from "./functions/construction-pipeline/resource";
import { noiseReportsFunction } from "./functions/noise-reports/resource";
import { geocodeSuggestions } from "./functions/geocode-suggestions/resource";
import { noiseReportsCleanupFunction } from "./functions/noise-reports-cleanup/resource";

const backend = defineBackend({
  auth,
  data,
  planRouteFunction,
  noiseMapFunction,
  safeSpacesFunction,
  constructionPipeline,
  noiseReportsFunction,
  geocodeSuggestions,
  noiseReportsCleanupFunction,
});

const apiStack = backend.createStack("api-stack");

const myRestApi = new RestApi(apiStack, "NavigationRestApi", {
  restApiName: "navigationRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  endpointConfiguration: {
    types: [EndpointType.REGIONAL],
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
});

const noiseReportsCleanupRule = new Rule(
  apiStack,
  "NoiseReportsCleanupRule",
  {
    schedule: Schedule.rate(Duration.minutes(5)),
  },
);

noiseReportsCleanupRule.addTarget(
  new LambdaFunction(backend.noiseReportsCleanupFunction.resources.lambda),
);

const planRouteIntegration = new LambdaIntegration(
  backend.planRouteFunction.resources.lambda
);

const noiseMapIntegration = new LambdaIntegration(
  backend.noiseMapFunction.resources.lambda
);

const safeSpacesIntegration = new LambdaIntegration(
  backend.safeSpacesFunction.resources.lambda
);

const geocodeSuggestionsIntegration = new LambdaIntegration(
  backend.geocodeSuggestions.resources.lambda,
);

const noiseReportsIntegration = new LambdaIntegration(
  backend.noiseReportsFunction.resources.lambda
);

const planRoutePath = myRestApi.root.addResource("plan-route");
planRoutePath.addMethod("POST", planRouteIntegration);

const noiseMapPath = myRestApi.root.addResource("noise-map");
noiseMapPath.addMethod("GET", noiseMapIntegration);

const safeSpacesPath = myRestApi.root.addResource("safe-spaces");
safeSpacesPath.addMethod("GET", safeSpacesIntegration);

const geocodeSuggestionsPath = myRestApi.root.addResource("geocode-suggestions");
geocodeSuggestionsPath.addMethod("GET", geocodeSuggestionsIntegration);


const noiseReportsPath = myRestApi.root.addResource("noise-reports");
noiseReportsPath.addMethod("GET", noiseReportsIntegration);
noiseReportsPath.addMethod("POST", noiseReportsIntegration);


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
