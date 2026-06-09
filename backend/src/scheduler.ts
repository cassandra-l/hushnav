import * as cron from "node-cron";
import { runEdgeCostPipeline } from "./edgeCost/runEdgeCostPipeline.js";
import { runConstructionPipeline } from "./construction/runConstructionPipeline.js";
import { cleanupNoiseReports } from "./spatialData/noiseReports.js";

let jobs: cron.ScheduledTask[] = [];

export function startScheduler() {
  console.log("Starting scheduler...");

  // Run edge cost pipeline every 5 minutes
  const edgeCostJob = cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("[Scheduler] Running edge cost pipeline...");
      await runEdgeCostPipeline();
      console.log("[Scheduler] Edge cost pipeline completed");
    } catch (error) {
      console.error("[Scheduler] Edge cost pipeline error:", error);
    }
  });
  jobs.push(edgeCostJob);

  // Run construction pipeline every 5 minutes
  const constructionJob = cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("[Scheduler] Running construction pipeline...");
      await runConstructionPipeline();
      console.log("[Scheduler] Construction pipeline completed");
    } catch (error) {
      console.error("[Scheduler] Construction pipeline error:", error);
    }
  });
  jobs.push(constructionJob);

  // Cleanup noise reports every 5 minutes (removes reports older than 30 minutes)
  const cleanupJob = cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("[Scheduler] Cleaning up old noise reports...");
      await cleanupNoiseReports();
      console.log("[Scheduler] Noise report cleanup completed");
    } catch (error) {
      console.error("[Scheduler] Noise report cleanup error:", error);
    }
  });
  jobs.push(cleanupJob);

  console.log("Scheduler started with 3 background jobs");
}

export function stopScheduler() {
  console.log("Stopping scheduler...");
  jobs.forEach((job) => {
    job.stop();
  });
  jobs = [];
  console.log("Scheduler stopped");
}
