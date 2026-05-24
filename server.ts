import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  handlePlanRoute,
  handleGetSafeSpaces,
} from "./amplify/navigation/handler";
import { handleCrowdMap } from "./amplify/spatialData/handler";
import {
  handleCreateNoiseReport,
  handleGetNoiseReports,
} from "./amplify/spatialData/noiseReportsHandler";

import { handler as geocodeSuggestionsLambdaHandler } from "./amplify/functions/geocode-suggestions/handler";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

const planRouteHandler = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const result = await handlePlanRoute(req.body);

    res.status(result.statusCode).type("application/json").send(result.body);
  } catch (error) {
    console.error("Local plan-route error:", error);
    res.status(500).json({
      error: "Failed to plan route.",
    });
  }
};

const noiseMapHandler = async (
  _req: express.Request,
  res: express.Response,
) => {
  try {
    const result = await handleCrowdMap();

    res.status(result.statusCode).type("application/json").send(result.body);
  } catch (error) {
    console.error("Local noise-map error:", error);
    res.status(500).json({
      error: "Failed to load noise map data.",
    });
  }
};

const safeSpacesHandler = async (
  _req: express.Request,
  res: express.Response,
) => {
  try {
    const result = await handleGetSafeSpaces();

    res.status(result.statusCode).type("application/json").send(result.body);
  } catch (error) {
    console.error("Local safe-spaces error:", error);
    res.status(500).json({
      error: "Failed to load safe spaces.",
    });
  }
};


const getNoiseReportsHandler = async (
  req: express.Request,
  res: express.Response,
) => {
  const result = await handleGetNoiseReports(req.query);

  res
    .status(result.statusCode)
    .type("application/json")
    .send(result.body);
};

const createNoiseReportHandler = async (
  req: express.Request,
  res: express.Response,
) => {
  const result = await handleCreateNoiseReport(req.body);

  res
    .status(result.statusCode)
    .type("application/json")
    .send(result.body);
};
const geocodeSuggestionsHandler = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";

    const result = await geocodeSuggestionsLambdaHandler({
      httpMethod: "GET",
      queryStringParameters: {
        q,
      },
    });

    res
      .status(result.statusCode)
      .set(result.headers ?? {})
      .type("application/json")
      .send(result.body);
  } catch (error) {
    console.error("Local geocode-suggestions error:", error);
    res.status(500).json({
      suggestions: [],
      error: "Failed to load geocode suggestions.",
    });
  }
};

app.post("/api/plan-route", planRouteHandler);
app.post("/plan-route", planRouteHandler);

app.get("/api/noise-map", noiseMapHandler);
app.get("/noise-map", noiseMapHandler);

app.get("/api/safe-spaces", safeSpacesHandler);
app.get("/safe-spaces", safeSpacesHandler);

app.get("/api/noise-reports", getNoiseReportsHandler);
app.get("/noise-reports", getNoiseReportsHandler);

app.post("/api/noise-reports", createNoiseReportHandler);
app.post("/noise-reports", createNoiseReportHandler);


app.get("/api/geocode-suggestions", geocodeSuggestionsHandler);
app.get("/geocode-suggestions", geocodeSuggestionsHandler);

// Always return JSON for unknown API-style routes

app.use((_req, res) => {
  res.status(404).json({
    error: "Route not found.",
  });
});

app.listen(PORT, () => {
  console.log(`Local backend server running at http://localhost:${PORT}`);
});
