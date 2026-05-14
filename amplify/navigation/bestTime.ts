import { pool } from "./db";
import { geocodePlace } from "./geocode";
import { getSafeSpaceById } from "./safeSpaces";
import {
    findQuietestRouteCostInTopology,
    getBlockedEdgeIdsForRouting,
    getGraphTopologyCache,
    snapToNearestNode,
    type AvoidMode,
    type ForecastEdgeCost,
} from "./route";
import type { Coordinate } from "./planRoute";

export type BestTimeRequest = {
    start?: Coordinate;
    end?: Coordinate;
    startQuery?: string;
    endQuery?: string;
    avoidMode?: AvoidMode;
    routeTimes: string[];
    stopSafeSpaceIds?: number[];
};

export type BestTimeResponse = {
    bestRouteTime: string;
    bestCost: number;
    costs: {
        routeTime: string;
        cost: number | null;
    }[];
};

type ForecastCostRow = {
    route_time: Date | string;
    edge_id: number;
    final_cost: number | null;
    predicted_noise_db: number | null;
    predicted_crowd_count: number | null;
    is_high_crowd: boolean | null;
};

function isValidCoordinate(value: unknown): value is Coordinate {
    if (!value || typeof value !== "object") return false;
    const coord = value as Record<string, unknown>;
    return typeof coord.lat === "number" && typeof coord.lng === "number";
}

async function resolveCoordinate(
    coordinate: unknown,
    query: unknown,
    label: "start" | "end",
): Promise<Coordinate> {
    if (isValidCoordinate(coordinate)) {
        return coordinate;
    }

    if (typeof query === "string" && query.trim()) {
        const geocoded = await geocodePlace(query);
        return {
            lat: geocoded.lat,
            lng: geocoded.lng,
        };
    }

    throw new Error(
        `Invalid request body. Expected either ${label} coordinates or ${label}Query.`,
    );
}

async function loadForecastCostsForTimes(
    routeTimes: string[],
): Promise<Map<string, Map<number, ForecastEdgeCost>>> {
    const client = await pool.connect();

    try {
        const result = await client.query<ForecastCostRow>(
            `
      WITH requested_times AS (
  SELECT UNNEST($1::timestamptz[]) AS route_time
),
latest_succeeded_run AS (
  SELECT
    fr.run_id,
    fr.horizon_start,
    fr.horizon_end
  FROM forecast_runs fr
  WHERE fr.status = 'succeeded'
  ORDER BY fr.generated_at DESC
  LIMIT 1
),
forecast_slots AS (
  SELECT generate_series(
    date_trunc('hour', lsr.horizon_start),
    date_trunc('hour', lsr.horizon_end),
    interval '1 hour'
  ) AS forecast_time
  FROM latest_succeeded_run lsr
),
resolved_times AS (
  SELECT
    rt.route_time,
    COALESCE(
      (
        SELECT fs.forecast_time
        FROM forecast_slots fs
        WHERE fs.forecast_time = rt.route_time
        LIMIT 1
      ),
      (
        SELECT fs.forecast_time
        FROM forecast_slots fs
        WHERE EXTRACT(ISODOW FROM (fs.forecast_time AT TIME ZONE 'Australia/Melbourne')) =
              EXTRACT(ISODOW FROM (rt.route_time AT TIME ZONE 'Australia/Melbourne'))
          AND EXTRACT(HOUR FROM (fs.forecast_time AT TIME ZONE 'Australia/Melbourne')) =
              EXTRACT(HOUR FROM (rt.route_time AT TIME ZONE 'Australia/Melbourne'))
        ORDER BY fs.forecast_time DESC
        LIMIT 1
      )
    ) AS resolved_forecast_time
  FROM requested_times rt
)
SELECT
  rt.route_time,
  f.edge_id,
  f.final_cost,
  f.predicted_noise_db,
  f.predicted_crowd_count,
  f.is_high_crowd
FROM resolved_times rt
JOIN latest_succeeded_run lsr
  ON TRUE
JOIN edge_forecasts f
  ON f.run_id = lsr.run_id
  AND f.forecast_time = rt.resolved_forecast_time

      `,
            [routeTimes],
        );

        const costsByTime = new Map<string, Map<number, ForecastEdgeCost>>();

        for (const routeTime of routeTimes) {
            costsByTime.set(routeTime, new Map<number, ForecastEdgeCost>());
        }

        for (const row of result.rows) {
            const routeTimeKey = new Date(row.route_time).toISOString();

            if (!costsByTime.has(routeTimeKey)) {
                costsByTime.set(routeTimeKey, new Map<number, ForecastEdgeCost>());
            }

            costsByTime.get(routeTimeKey)!.set(Number(row.edge_id), {
                finalCost:
                    row.final_cost !== null && row.final_cost !== undefined
                        ? Number(row.final_cost)
                        : null,
                noiseDb:
                    row.predicted_noise_db !== null &&
                        row.predicted_noise_db !== undefined
                        ? Number(row.predicted_noise_db)
                        : null,
                crowdCount:
                    row.predicted_crowd_count !== null &&
                        row.predicted_crowd_count !== undefined
                        ? Number(row.predicted_crowd_count)
                        : null,
                isHighCrowd: Boolean(row.is_high_crowd),
            });
        }

        return costsByTime;
    } finally {
        client.release();
    }
}

export async function findBestRouteTime(
    body: BestTimeRequest,
): Promise<BestTimeResponse> {
    const {
        start,
        end,
        startQuery,
        endQuery,
        avoidMode = "both",
        routeTimes,
        stopSafeSpaceIds = [],
    } = body;

    if (!Array.isArray(routeTimes) || routeTimes.length === 0) {
        throw new Error("Expected routeTimes to contain at least one ISO time.");
    }

    const normalizedRouteTimes = routeTimes.map((routeTime) =>
        new Date(routeTime).toISOString(),
    );

    const startCoordinate = await resolveCoordinate(start, startQuery, "start");
    const endCoordinate = await resolveCoordinate(end, endQuery, "end");

    const selectedSafeSpaces = await Promise.all(
        Array.from(new Set(stopSafeSpaceIds)).map(async (id) => {
            const safeSpace = await getSafeSpaceById(id);

            if (!safeSpace) {
                throw new Error(`Safe space ${id} not found.`);
            }

            return safeSpace;
        }),
    );

    const waypointCoordinates: Coordinate[] = [
        startCoordinate,
        ...selectedSafeSpaces.map((safeSpace) => ({
            lat: safeSpace.lat,
            lng: safeSpace.lng,
        })),
        endCoordinate,
    ];

    const waypointNodes = await Promise.all(
        waypointCoordinates.map((coordinate) => snapToNearestNode(coordinate)),
    );

    const waypointNodeIds = waypointNodes.map((node) => node.node_id);

    const topologyGraph = await getGraphTopologyCache();
    const costsByTime = await loadForecastCostsForTimes(normalizedRouteTimes);

    const blockedEdgeIds =
        avoidMode === "construction" || avoidMode === "both"
            ? await getBlockedEdgeIdsForRouting()
            : new Set<number>();

    const costs: BestTimeResponse["costs"] = [];

    for (const routeTime of normalizedRouteTimes) {
        try {
            const forecastCosts = costsByTime.get(routeTime);

            if (!forecastCosts) {
                throw new Error(`Forecast costs not found for ${routeTime}.`);
            }

            let totalCost = 0;

            for (let i = 0; i < waypointNodeIds.length - 1; i++) {
                totalCost += await findQuietestRouteCostInTopology(
                    waypointNodeIds[i],
                    waypointNodeIds[i + 1],
                    avoidMode,
                    topologyGraph,
                    forecastCosts,
                    blockedEdgeIds,
                );
            }

            costs.push({ routeTime, cost: totalCost });
        } catch (error) {
            console.error("Best time candidate failed:", {
                routeTime,
                error,
            });

            costs.push({ routeTime, cost: null });
        }
    }

    const validCosts = costs.filter(
        (item): item is { routeTime: string; cost: number } =>
            typeof item.cost === "number",
    );

    if (validCosts.length === 0) {
        throw new Error("Could not calculate any candidate route times.");
    }

    const best = validCosts.reduce((currentBest, item) =>
        item.cost < currentBest.cost ? item : currentBest,
    );

    return {
        bestRouteTime: best.routeTime,
        bestCost: best.cost,
        costs,
    };
}
