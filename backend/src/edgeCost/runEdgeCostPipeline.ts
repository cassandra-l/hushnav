import { fetchMicroclimateData, upsertNoiseSensors } from "./fetchNoise.js";
import {
  fetchPedestrianDataFull,
  fetchPedestrianDataIncremental,
  upsertPedestrianSensors,
  type PedestrianCountRecord,
  type PedestrianLocation,
} from "./fetchCrowd.js";
import { updateEdgeWeights } from "./updateEdgeWeights.js";

export async function runEdgeCostPipeline() {
  const skipNoiseFetch =
    process.env.SKIP_NOISE_FETCH === "true" ||
    process.env.SKIP_API_FETCH === "true";

  const skipCrowdFetch = process.env.SKIP_CROWD_FETCH === "true";
  const crowdMode = process.env.CROWD_MODE || "incremental";

  try {
    if (skipNoiseFetch) {
      console.log(
        "Skipping noise API fetch for now. Rebuilding edge_weight from existing noise_sensor data..."
      );
    } else {
      const noiseRecords = await fetchMicroclimateData();
      console.log(`Fetched ${noiseRecords.length} noise records from API.`);
      await upsertNoiseSensors(noiseRecords);
    }

    if (skipCrowdFetch) {
      console.log("Skipping crowd API fetch for now.");
    } else {
      let pedestrianRecords: Array<PedestrianCountRecord & PedestrianLocation>;

      if (crowdMode === "full") {
        console.log("Running crowd FULL refresh...");
        pedestrianRecords = await fetchPedestrianDataFull();
      } else {
        console.log("Running crowd INCREMENTAL refresh...");
        pedestrianRecords = await fetchPedestrianDataIncremental();
      }

      console.log(
        `Fetched ${pedestrianRecords.length} pedestrian records from API.`
      );

      await upsertPedestrianSensors(pedestrianRecords);
    }

    await updateEdgeWeights();
    console.log("Edge cost update complete.");
  } catch (error) {
    console.error("Failed to update edge costs:", error);
  }
}