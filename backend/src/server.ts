import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { testConnection, closePool } from "./db";
import { startScheduler, stopScheduler } from "./scheduler";
import {
  handlePlanRoute,
  handleGetSafeSpaces,
} from "./services/handler";
import { handleCrowdMap } from "./spatialData/handler";
import {
  handleCreateNoiseReport,
  handleGetNoiseReports,
} from "./spatialData/noiseReportsHandler";

// Dynamically import geocode handler
import { handler as geocodeSuggestionsLambdaHandler } from "./functions/geocode-suggestions/handler";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ HEALTH & STATUS ROUTES ============

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============ PLAN ROUTE ENDPOINT ============

const planRouteHandler = async (req: Request, res: Response) => {
  try {
    const result = await handlePlanRoute(req.body);
    res.status(result.statusCode).type("application/json").send(result.body);
  } catch (error) {
    console.error("Plan route error:", error);
    res.status(500).json({
      error: "Failed to plan route.",
    });
  }
};

app.post("/api/plan-route", planRouteHandler);

// ============ NOISE MAP ENDPOINT ============

const noiseMapHandler = async (_req: Request, res: Response) => {
  try {
    const result = await handleCrowdMap();
    res.status(result.statusCode).type("application/json").send(result.body);
  } catch (error) {
    console.error("Noise map error:", error);
    res.status(500).json({
      error: "Failed to load noise map data.",
    });
  }
};

app.get("/api/noise-map", noiseMapHandler);

// ============ SAFE SPACES ENDPOINT ============

const safeSpacesHandler = async (_req: Request, res: Response) => {
  try {
    const result = await handleGetSafeSpaces();
    res.status(result.statusCode).type("application/json").send(result.body);
  } catch (error) {
    console.error("Safe spaces error:", error);
    res.status(500).json({
      error: "Failed to load safe spaces.",
    });
  }
};

app.get("/api/safe-spaces", safeSpacesHandler);

// ============ NOISE REPORTS ENDPOINTS ============

const getNoiseReportsHandler = async (req: Request, res: Response) => {
  try {
    const result = await handleGetNoiseReports(req.query);
    res.status(result.statusCode).type("application/json").send(result.body);
  } catch (error) {
    console.error("Get noise reports error:", error);
    res.status(500).json({
      error: "Failed to load noise reports.",
    });
  }
};

const createNoiseReportHandler = async (req: Request, res: Response) => {
  try {
    const result = await handleCreateNoiseReport(req.body);
    res.status(result.statusCode).type("application/json").send(result.body);
  } catch (error) {
    console.error("Create noise report error:", error);
    res.status(500).json({
      error: "Failed to create noise report.",
    });
  }
};

app.get("/api/noise-reports", getNoiseReportsHandler);
app.post("/api/noise-reports", createNoiseReportHandler);

// ============ GEOCODE SUGGESTIONS ENDPOINT ============

const geocodeSuggestionsHandler = async (req: Request, res: Response) => {
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
    console.error("Geocode suggestions error:", error);
    res.status(500).json({
      suggestions: [],
      error: "Failed to load geocode suggestions.",
    });
  }
};

app.get("/api/geocode-suggestions", geocodeSuggestionsHandler);

// ============ ERROR HANDLING ============

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found.",
  });
});

// ============ SERVER STARTUP ============

async function startServer() {
  try {
    // Test database connection
    console.log("Testing database connection...");
    const connected = await testConnection();

    if (!connected) {
      console.error("Failed to connect to database. Exiting.");
      process.exit(1);
    }

    // Start scheduler for background jobs
    startScheduler();

    // Start Express server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `🚀 Server running on http://0.0.0.0:${PORT} at ${new Date().toISOString()}`,
      );
      console.log(`API endpoints:`);
      console.log(`  POST  /api/plan-route`);
      console.log(`  GET   /api/noise-map`);
      console.log(`  GET   /api/safe-spaces`);
      console.log(`  GET   /api/noise-reports`);
      console.log(`  POST  /api/noise-reports`);
      console.log(`  GET   /api/geocode-suggestions`);
      console.log(`  GET   /api/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// ============ GRACEFUL SHUTDOWN ============

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  stopScheduler();
  await closePool();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  stopScheduler();
  await closePool();
  process.exit(0);
});

// Start the server
startServer();
