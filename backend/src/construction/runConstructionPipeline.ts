import {
  refreshConstructionBlockedEdges,
  runConstructionIngestion,
} from "./fetchConstruction";

export async function runConstructionPipeline(): Promise<{
  blockedEdges: number;
}> {
  console.log("Starting construction pipeline...");

  await runConstructionIngestion();

  const blockedEdges = await refreshConstructionBlockedEdges();

  console.log("Construction pipeline complete.");
  console.log(`Blocked edges refreshed: ${blockedEdges}`);

  return {
    blockedEdges,
  };
}