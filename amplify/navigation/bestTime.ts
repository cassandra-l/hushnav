import { pool } from "./db";
import { geocodePlace } from "./geocode";
import {
    findLowestCostRouteInTopology,
    getGraphTopologyCache,
    snapToNearestNode,
} from "./route";
import type { Coordinate } from "./planRoute";

export type BestTimeRequest = {
    start?: Coordinate;
    end?: Coordinate;
    startQuery?: string;
    endQuery?: string;
    routeTimes: string[];
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
    cost: number | null;
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
): Promise<Map<string, Map<number, number>>> {
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
              COALESCE(NULLIF(f.final_cost, 0), e.length) AS cost
            FROM resolved_times rt
            JOIN latest_succeeded_run lsr
              ON TRUE
            JOIN edge_forecasts f
              ON f.run_id = lsr.run_id
              AND f.forecast_time = rt.resolved_forecast_time
            JOIN edge e
              ON e.edge_id = f.edge_id
            `,
            [routeTimes],
        );

        const costsByTime = new Map<string, Map<number, number>>();

        for (const routeTime of routeTimes) {
            costsByTime.set(routeTime, new Map<number, number>());
        }

        for (const row of result.rows) {
            const routeTimeKey = new Date(row.route_time).toISOString();

            if (!costsByTime.has(routeTimeKey)) {
                costsByTime.set(routeTimeKey, new Map<number, number>());
            }

            if (row.cost !== null && row.cost !== undefined) {
                costsByTime
                    .get(routeTimeKey)!
                    .set(Number(row.edge_id), Number(row.cost));
            }
        }

        return costsByTime;
    } finally {
        client.release();
    }
}

export async function findBestRouteTime(
    body: BestTimeRequest,
): Promise<BestTimeResponse> {
    const bestTimeStartMs = Date.now();

    const {
        start,
        end,
        startQuery,
        endQuery,
        routeTimes,
    } = body;

    if (!Array.isArray(routeTimes) || routeTimes.length === 0) {
        throw new Error("Expected routeTimes to contain at least one ISO time.");
    }

    const normalizedRouteTimes = routeTimes.map((routeTime) =>
        new Date(routeTime).toISOString(),
    );

    console.log("best-time timing: start", {
        routeTimesCount: normalizedRouteTimes.length,
        first: normalizedRouteTimes[0],
        last: normalizedRouteTimes[normalizedRouteTimes.length - 1],
    });

    const resolveStartMs = Date.now();

    const startCoordinate = await resolveCoordinate(start, startQuery, "start");
    const endCoordinate = await resolveCoordinate(end, endQuery, "end");

    console.log("best-time timing: coordinates resolved", {
        ms: Date.now() - resolveStartMs,
    });

    const snapStartMs = Date.now();

    const startNode = await snapToNearestNode(startCoordinate);
    const endNode = await snapToNearestNode(endCoordinate);

    console.log("best-time timing: snapped start and end", {
        startNodeId: startNode.node_id,
        endNodeId: endNode.node_id,
        ms: Date.now() - snapStartMs,
    });

    const topologyStartMs = Date.now();

    const topologyGraph = await getGraphTopologyCache();

    console.log("best-time timing: topology graph loaded", {
        nodes: topologyGraph.size,
        ms: Date.now() - topologyStartMs,
    });

    const forecastCostsStartMs = Date.now();

    const costsByTime = await loadForecastCostsForTimes(normalizedRouteTimes);

    console.log("best-time timing: forecast costs loaded", {
        routeTimesCount: normalizedRouteTimes.length,
        costMaps: costsByTime.size,
        ms: Date.now() - forecastCostsStartMs,
    });

    const costs: BestTimeResponse["costs"] = [];

    for (const routeTime of normalizedRouteTimes) {
        const candidateStartMs = Date.now();

        try {
            const edgeCosts = costsByTime.get(routeTime);

            if (!edgeCosts) {
                throw new Error(`Forecast costs not found for ${routeTime}.`);
            }

            const totalCost = await findLowestCostRouteInTopology(
                Number(startNode.node_id),
                Number(endNode.node_id),
                topologyGraph,
                edgeCosts,
            );

            console.log("best-time timing: candidate complete", {
                routeTime,
                cost: totalCost,
                ms: Date.now() - candidateStartMs,
            });

            costs.push({ routeTime, cost: totalCost });
        } catch (error) {
            console.error("Best time candidate failed:", {
                routeTime,
                ms: Date.now() - candidateStartMs,
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

    console.log("best-time timing: complete", {
        routeTimesCount: normalizedRouteTimes.length,
        validCount: validCosts.length,
        bestRouteTime: best.routeTime,
        bestCost: best.cost,
        totalMs: Date.now() - bestTimeStartMs,
    });

    return {
        bestRouteTime: best.routeTime,
        bestCost: best.cost,
        costs,
    };
}
