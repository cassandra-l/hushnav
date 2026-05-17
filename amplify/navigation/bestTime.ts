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
    forecast_time: Date | string;
    edge_id: number;
    cost: number | string | null;
};

type ForecastRunTimeRow = {
    run_id: string;
    forecast_time: Date | string;
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

function getMelbourneTimeKey(value: Date): string {
    const parts = new Intl.DateTimeFormat("en-AU", {
        timeZone: "Australia/Melbourne",
        weekday: "short",
        hour: "2-digit",
        hourCycle: "h23",
    }).formatToParts(value);

    const weekday =
        parts.find((part) => part.type === "weekday")?.value ?? "unknown";

    const hour =
        parts.find((part) => part.type === "hour")?.value ?? "00";

    return `${weekday}-${hour}`;
}

function resolveForecastTimes(
    routeTimes: string[],
    availableForecastTimes: string[],
): Map<string, string> {
    const exactByIso = new Map<string, string>();
    const latestByMelbourneKey = new Map<string, string>();

    for (const forecastTime of availableForecastTimes) {
        const forecastDate = new Date(forecastTime);
        const forecastIso = forecastDate.toISOString();

        exactByIso.set(forecastIso, forecastIso);

        const key = getMelbourneTimeKey(forecastDate);
        const existing = latestByMelbourneKey.get(key);

        if (!existing || forecastDate.getTime() > new Date(existing).getTime()) {
            latestByMelbourneKey.set(key, forecastIso);
        }
    }

    const resolved = new Map<string, string>();

    for (const routeTime of routeTimes) {
        const routeIso = new Date(routeTime).toISOString();

        const exactMatch = exactByIso.get(routeIso);

        if (exactMatch) {
            resolved.set(routeIso, exactMatch);
            continue;
        }

        const key = getMelbourneTimeKey(new Date(routeIso));
        const fallbackMatch = latestByMelbourneKey.get(key);

        if (!fallbackMatch) {
            throw new Error(`No forecast time found for ${routeIso}.`);
        }

        resolved.set(routeIso, fallbackMatch);
    }

    return resolved;
}

async function loadForecastCostsForTimes(
    routeTimes: string[],
): Promise<Map<string, Map<number, number>>> {
    const client = await pool.connect();

    try {
        const forecastTimesStartMs = Date.now();

        const timeResult = await client.query<ForecastRunTimeRow>(
            `
            WITH latest_succeeded_run AS (
              SELECT fr.run_id
              FROM forecast_runs fr
              WHERE fr.status = 'succeeded'
              ORDER BY fr.generated_at DESC
              LIMIT 1
            )
            SELECT DISTINCT
              lsr.run_id,
              f.forecast_time
            FROM latest_succeeded_run lsr
            JOIN edge_forecasts f
              ON f.run_id = lsr.run_id
            ORDER BY f.forecast_time
            `,
        );

        if (timeResult.rows.length === 0) {
            throw new Error("No forecast times found for the latest succeeded run.");
        }

        const runId = String(timeResult.rows[0].run_id);

        const availableForecastTimes = timeResult.rows.map((row) =>
            new Date(row.forecast_time).toISOString(),
        );

        console.log("best-time timing: available forecast times loaded", {
            runId,
            count: availableForecastTimes.length,
            ms: Date.now() - forecastTimesStartMs,
        });

        const routeTimeToForecastTime = resolveForecastTimes(
            routeTimes,
            availableForecastTimes,
        );

        const selectedForecastTimes = Array.from(
            new Set(routeTimeToForecastTime.values()),
        );

        console.log("best-time timing: forecast times resolved", {
            routeTimesCount: routeTimes.length,
            selectedForecastTimesCount: selectedForecastTimes.length,
            selectedForecastTimes,
        });

        const costQueryStartMs = Date.now();

        const result = await client.query<ForecastCostRow>(
            `
            SELECT
              f.forecast_time AS forecast_time,
              f.edge_id,
              COALESCE(NULLIF(f.final_cost, 0), e.length) AS cost
            FROM edge_forecasts f
            JOIN edge e
              ON e.edge_id = f.edge_id
            WHERE f.run_id = $1
              AND f.forecast_time = ANY($2::timestamptz[])
            `,
            [runId, selectedForecastTimes],
        );

        console.log("best-time timing: forecast edge costs query complete", {
            rows: result.rows.length,
            ms: Date.now() - costQueryStartMs,
        });

        const costsByForecastTime = new Map<string, Map<number, number>>();

        for (const row of result.rows) {
            const forecastTimeKey = new Date(row.forecast_time).toISOString();

            if (!costsByForecastTime.has(forecastTimeKey)) {
                costsByForecastTime.set(forecastTimeKey, new Map<number, number>());
            }

            if (row.cost !== null && row.cost !== undefined) {
                costsByForecastTime
                    .get(forecastTimeKey)!
                    .set(Number(row.edge_id), Number(row.cost));
            }
        }

        const costsByRouteTime = new Map<string, Map<number, number>>();

        for (const routeTime of routeTimes) {
            const routeTimeKey = new Date(routeTime).toISOString();
            const forecastTimeKey = routeTimeToForecastTime.get(routeTimeKey);

            if (!forecastTimeKey) {
                throw new Error(`Could not resolve forecast time for ${routeTimeKey}.`);
            }

            const edgeCosts = costsByForecastTime.get(forecastTimeKey);

            if (!edgeCosts) {
                throw new Error(
                    `Forecast edge costs not found for resolved time ${forecastTimeKey}.`,
                );
            }

            costsByRouteTime.set(routeTimeKey, edgeCosts);
        }

        return costsByRouteTime;
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
