import express from "express";
import cors from "cors";
import { handlePlanRoute } from "./amplify/navigation/handler";
import { handleNoiseMap } from "./amplify/spatialData/handler";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/api/plan-route", async (req, res) => {
  try {
    const result = await handlePlanRoute(req.body);

    res
      .status(result.statusCode)
      .type("application/json")
      .send(result.body);
  } catch (error) {
    console.error("Local /api/plan-route error:", error);
    res.status(500).json({
      error: "Failed to plan route.",
    });
  }
});

app.get("/api/noise-map", async (_req, res) => {
  try {
    const result = await handleNoiseMap();

    res
      .status(result.statusCode)
      .type("application/json")
      .send(result.body);
  } catch (error) {
    console.error("Local /api/noise-map error:", error);
    res.status(500).json({
      error: "Failed to load noise map data.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Local backend server running at http://localhost:${PORT}`);
});