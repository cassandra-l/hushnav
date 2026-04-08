import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";

import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { planRouteFunction } from "./functions/plan-route/resource";

const backend = defineBackend({
  auth,
  data,
  planRouteFunction,
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

const lambdaIntegration = new LambdaIntegration(
  backend.planRouteFunction.resources.lambda
);

const planRoutePath = myRestApi.root.addResource("plan-route");
planRoutePath.addMethod("POST", lambdaIntegration);

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