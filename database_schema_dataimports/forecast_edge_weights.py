#!/usr/bin/env python3
"""
Weekly forecast pipeline for future routing edge weights.

This script:
1) Pulls historical microclimate noise + pedestrian counts from Melbourne Open Data APIs.
2) Resamples each sensor series to hourly bins.
3) Builds a weekly profile per sensor (weekday + hour slot) and forecasts 7 days (168 bins).
4) Maps forecasted sensor values to nearest edges and writes edge_forecasts.

Plain-English version of what this means:
- Look at recent history (noise + crowd) for each sensor in the city.
- Convert that history into a regular timeline where each row is one hour.
- Build a simple weekly profile per sensor to estimate "what next week could look like".
- Translate those sensor predictions into edge costs, so future routing can choose paths
  based on expected conditions instead of only current/live conditions.

Forecasting approach in this version:
- Primary model is a weekly profile lookup (weekday + hour slot) per sensor.
- This keeps hourly variation without model-fit instability.
- If a specific profile bucket is missing, a simple fallback chain ensures every slot
  gets a prediction.
"""

from __future__ import annotations

import json
import math
import os
import sys
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, Iterable, List, Optional, Tuple
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd
import psycopg2
import requests
from psycopg2.extras import execute_values


# API endpoint for microclimate sensor readings (used for noise history).
MICROCLIMATE_API = (
    "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/"
    "microclimate-sensors-data/records"
)
# API endpoint for minute-level pedestrian counts.
PED_PAST_HOUR_API = (
    "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/"
    "pedestrian-counting-system-past-hour-counts-per-minute/records"
)
PED_HOURLY_HISTORY_API = (
    "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/"
    "pedestrian-counting-system-2009-to-present-counts-per-hour/records"
)

# 7 days * 24 slots/day
FORECAST_HORIZON_STEPS = 168
FREQ = "1h"
MODEL_VERSION = "weekly-profile-v1"
MELBOURNE_TZ = ZoneInfo("Australia/Melbourne")
MIN_POINTS_FOR_PROFILE = 48


@dataclass
class ForecastPoint:
    # sensor_key is device_id (noise) or location_id (pedestrian), stored as string.
    sensor_key: str
    # The exact hourly slot this prediction belongs to.
    forecast_time: datetime
    # The predicted numeric value for that slot.
    predicted_value: float


def utc_now() -> datetime:
    # Keep storage/comparisons consistent across environments.
    return datetime.now(timezone.utc)


def melbourne_now() -> datetime:
    # Forecast slots should match what users in Melbourne expect.
    return datetime.now(MELBOURNE_TZ)


def next_monday_midnight_melbourne(reference: datetime) -> datetime:
    """
    Return the next Monday 00:00 in Melbourne time.
    If the reference is already Monday, still move to next week's Monday
    so each run targets a clean full week window.
    """
    days_until_monday = (7 - reference.weekday()) % 7
    if days_until_monday == 0:
        days_until_monday = 7

    next_monday = (reference + timedelta(days=days_until_monday)).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    return next_monday


def fetch_dataset_all(
    url: str,
    params: Dict[str, str],
    limit: int = 100,
    max_pages: int = 500,
) -> List[dict]:
    # Generic paginator for Melbourne Open Data API responses.
    rows: List[dict] = []
    offset = 0
    # This API can reject very high offsets, so pagination is capped and stopped safely.
    max_safe_offset = int(os.getenv("MELB_API_MAX_OFFSET", "9900"))

    for _ in range(max_pages):
        if offset > max_safe_offset:
            # Avoid known API offset limits.
            break

        query = dict(params)
        query["limit"] = str(limit)
        query["offset"] = str(offset)
        resp = requests.get(
            url,
            params=query,
            headers={"User-Agent": "hush-nav-forecast/1.0"},
            timeout=30,
        )
        if resp.status_code == 400 and offset > 0:
            # Treat this as end-of-pagination instead of failing the run.
            break
        resp.raise_for_status()
        page_rows = resp.json().get("results", [])
        if not page_rows:
            # No more data.
            break
        rows.extend(page_rows)
        if len(page_rows) < limit:
            # Last page.
            break
        offset += limit

    return rows


def load_noise_history(days_back: int) -> pd.DataFrame:
    # Build a "from this time onward" boundary.
    start_ts = (
        (utc_now() - timedelta(days=days_back))
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )
    # Only fetch fields needed by this pipeline.
    rows = fetch_dataset_all(
        MICROCLIMATE_API,
        params={
            "select": "device_id,received_at,noise",
            "where": f"noise is not null AND received_at >= '{start_ts}'",
            "order_by": "received_at asc",
        },
    )
    if not rows:
        # Keep a stable empty schema so downstream code is simpler.
        return pd.DataFrame(columns=["sensor_key", "timestamp", "value"])

    # Normalize and clean into our internal shape.
    df = pd.DataFrame(rows)
    df = df.dropna(subset=["device_id", "received_at", "noise"]).copy()
    df["timestamp"] = pd.to_datetime(df["received_at"], utc=True, errors="coerce")
    df["value"] = pd.to_numeric(df["noise"], errors="coerce")
    df = df.dropna(subset=["timestamp", "value"])
    df["sensor_key"] = df["device_id"].astype(str)
    return df[["sensor_key", "timestamp", "value"]]


def load_pedestrian_history(days_back: int) -> pd.DataFrame:
    # Same fetch pattern, but for pedestrian counts.
    start_ts = (
        (utc_now() - timedelta(days=days_back))
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )
    rows = fetch_dataset_all(
        PED_PAST_HOUR_API,
        params={
            "select": "location_id,sensing_datetime,total_of_directions",
            "where": f"sensing_datetime >= '{start_ts}'",
            "order_by": "sensing_datetime asc",
        },
    )
    if not rows:
        return pd.DataFrame(columns=["sensor_key", "timestamp", "value"])

    # Normalize to the same columns as noise history.
    df = pd.DataFrame(rows)
    df = df.dropna(subset=["location_id", "sensing_datetime", "total_of_directions"]).copy()
    df["timestamp"] = pd.to_datetime(df["sensing_datetime"], utc=True, errors="coerce")
    df["value"] = pd.to_numeric(df["total_of_directions"], errors="coerce")
    df = df.dropna(subset=["timestamp", "value"])
    df["sensor_key"] = df["location_id"].astype(str)
    return df[["sensor_key", "timestamp", "value"]]


def load_pedestrian_history_hourly(days_back: int) -> pd.DataFrame:
    # Preferred source: longer hourly history gives better weekly patterns.
    start_ts = (
        (utc_now() - timedelta(days=days_back))
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )
    rows = fetch_dataset_all(
        PED_HOURLY_HISTORY_API,
        params={
            "select": "sensor_id,date_time,hourly_counts",
            "where": f"date_time >= '{start_ts}'",
            "order_by": "date_time asc",
        },
    )
    if not rows:
        return pd.DataFrame(columns=["sensor_key", "timestamp", "value"])

    df = pd.DataFrame(rows)
    df = df.dropna(subset=["sensor_id", "date_time", "hourly_counts"]).copy()
    df["timestamp"] = pd.to_datetime(df["date_time"], utc=True, errors="coerce")
    df["value"] = pd.to_numeric(df["hourly_counts"], errors="coerce")
    df = df.dropna(subset=["timestamp", "value"])
    df["sensor_key"] = df["sensor_id"].astype(str)
    return df[["sensor_key", "timestamp", "value"]]


def load_pedestrian_history_with_fallback(
    days_back: int, preferred_source: str
) -> Tuple[pd.DataFrame, str]:
    """
    Try the richer hourly source first (by default), then fallback to past-hour source.
    Returns both dataframe and the source name actually used.
    """
    preferred = preferred_source.strip().lower()

    if preferred == "past_hour":
        df = load_pedestrian_history(days_back=days_back)
        return df, "past_hour"

    # Default path: use hourly history.
    try:
        hourly_df = load_pedestrian_history_hourly(days_back=days_back)
        if not hourly_df.empty:
            return hourly_df, "hourly"
    except Exception:
        # If hourly fails, keep the run alive with fallback data.
        pass

    fallback_df = load_pedestrian_history(days_back=days_back)
    return fallback_df, "past_hour"


def aggregate_to_hourly(df: pd.DataFrame) -> pd.DataFrame:
    # Convert irregular readings into regular hourly buckets.
    if df.empty:
        return df
    out_frames: List[pd.DataFrame] = []
    for sensor_key, group in df.groupby("sensor_key"):
        g = group.set_index("timestamp").sort_index()
        # If multiple readings land in the same hour, average them.
        rolled = g["value"].resample(FREQ).mean().to_frame(name="value")
        rolled["sensor_key"] = sensor_key
        out_frames.append(rolled.reset_index())
    return pd.concat(out_frames, ignore_index=True) if out_frames else pd.DataFrame()


def seasonal_naive_forecast(series: pd.Series, steps: int, season_len: int = 24) -> np.ndarray:
    # Fallback model: repeat the last daily pattern (24 hourly slots).
    # Not fancy, but very reliable when data is sparse.
    values = series.to_numpy(dtype=float)
    if len(values) == 0:
        return np.zeros(steps, dtype=float)
    if len(values) < season_len:
        return np.repeat(values[-1], steps)
    base = values[-season_len:]
    reps = math.ceil(steps / season_len)
    return np.tile(base, reps)[:steps]


def weekly_profile_forecast_with_meta(
    series: pd.Series, steps: int
) -> Tuple[np.ndarray, bool, str]:
    """
    Primary model: per-sensor weekly profile using average of daily maxima.
    For each (weekday, hour slot):
    1) take max value for each historical date
    2) average those date-level maxima

    Fallback chain for each future slot:
    1) exact weekday+slot profile
    2) slot-only profile (all weekdays combined)
    3) global series max
    """
    series = series.astype(float).ffill().bfill()
    if len(series) < MIN_POINTS_FOR_PROFILE:
        return seasonal_naive_forecast(series, steps), True, "seasonal_naive"

    series_df = series.to_frame(name="value").reset_index(names="timestamp")
    series_df["date"] = series_df["timestamp"].dt.date
    series_df["weekday"] = series_df["timestamp"].dt.weekday
    series_df["slot"] = series_df["timestamp"].dt.hour

    # Step 1: for each date, take the max seen in that weekday/hour slot.
    per_date_max = (
        series_df.groupby(["weekday", "slot", "date"])["value"].max().reset_index()
    )

    # Step 2: average those date-level maxima.
    weekly_profile = (
        per_date_max.groupby(["weekday", "slot"])["value"].mean().to_dict()
    )
    slot_profile = per_date_max.groupby("slot")["value"].mean().to_dict()
    global_max = float(series_df["value"].max())

    if math.isnan(global_max):
        return seasonal_naive_forecast(series, steps), True, "seasonal_naive"

    start_ts = series.index[-1] + pd.Timedelta(hours=1)
    horizon = pd.date_range(start=start_ts, periods=steps, freq=FREQ)

    preds: List[float] = []
    used_fallback = False
    for ts in horizon:
        key = (int(ts.weekday()), int(ts.hour))
        if key in weekly_profile:
            preds.append(float(weekly_profile[key]))
            continue

        used_fallback = True
        slot = key[1]
        if slot in slot_profile:
            preds.append(float(slot_profile[slot]))
        else:
            preds.append(global_max)

    return np.asarray(preds, dtype=float), used_fallback, "weekly_profile_avg_daily_max"


def weekly_profile_forecast(series: pd.Series, steps: int) -> np.ndarray:
    pred, _fallback_used, _model_type = weekly_profile_forecast_with_meta(
        series, steps
    )
    return pred


def make_sensor_forecasts(df_hourly: pd.DataFrame, steps: int) -> List[ForecastPoint]:
    # Build per-sensor forecast rows for the next N hours.
    #
    # Output shape:
    # - one row per (sensor, future_time_slot)
    # - for 168 steps, each sensor gets one week of hourly predictions.
    if df_hourly.empty:
        return []

    # Forecast always covers one full Melbourne week:
    # Monday 00:00 through Sunday 23:00.
    start_time_local = next_monday_midnight_melbourne(melbourne_now())
    horizon_local = pd.date_range(
        start=start_time_local,
        periods=steps,
        freq=FREQ,
        tz=str(MELBOURNE_TZ),
    )

    points: List[ForecastPoint] = []
    for sensor_key, group in df_hourly.groupby("sensor_key"):
        group = group.sort_values("timestamp")
        # asfreq makes the index regular; then fill short gaps.
        series = group.set_index("timestamp")["value"].asfreq(FREQ).ffill().bfill()
        pred = weekly_profile_forecast(series, steps=steps)
        for ts_local, value in zip(horizon_local, pred):
            # Store timestamps in UTC for consistent DB joins.
            ts_utc = ts_local.tz_convert("UTC")
            points.append(
                ForecastPoint(
                    sensor_key=sensor_key,
                    forecast_time=ts_utc.to_pydatetime(),
                    # Negative values are not meaningful here.
                    predicted_value=max(float(value), 0.0),
                )
            )
    return points


def crowd_count_to_penalty(count: float) -> float:
    # Keep this in sync with the routing penalty tiers.
    if count < 20:
        return 0.0
    if count < 50:
        return 0.05
    if count < 100:
        return 0.1
    if count < 200:
        return 0.2
    return 0.35


def is_high_crowd(count: float) -> bool:
    # Same threshold used in live routing.
    return count >= 30


def create_run(conn, run_id: str, horizon_start: datetime, horizon_end: datetime) -> None:
    # Write run metadata first for easier traceability.
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO forecast_runs (
              run_id, generated_at, horizon_start, horizon_end, model_version, status
            )
            VALUES (%s, NOW(), %s, %s, %s, %s)
            """,
            (run_id, horizon_start, horizon_end, MODEL_VERSION, "running"),
        )
    conn.commit()


def mark_run(conn, run_id: str, status: str, error_message: Optional[str] = None) -> None:
    # Mark final run status for quick monitoring.
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE forecast_runs
            SET status = %s, error_message = %s
            WHERE run_id = %s
            """,
            (status, error_message, run_id),
        )
    conn.commit()


def ensure_edge_sensor_maps(conn) -> None:
    """
    Build and cache edge->nearest sensor mapping.
    This geometric step is expensive, so only run it when cache tables are empty.
    """
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM edge_noise_map")
        noise_count = int(cur.fetchone()[0])
        cur.execute("SELECT COUNT(*) FROM edge_crowd_map")
        crowd_count = int(cur.fetchone()[0])

        if noise_count == 0:
            cur.execute(
                """
                INSERT INTO edge_noise_map (edge_id, sensor_key)
                SELECT
                  e.edge_id,
                  nearest.device_id::text
                FROM edge e
                CROSS JOIN LATERAL (
                  SELECT device_id
                  FROM noise_sensor
                  ORDER BY geom_sensor <-> ST_LineInterpolatePoint(e.geom_edge, 0.5)
                  LIMIT 1
                ) nearest
                ON CONFLICT (edge_id) DO UPDATE SET sensor_key = EXCLUDED.sensor_key
                """
            )

        if crowd_count == 0:
            cur.execute(
                """
                INSERT INTO edge_crowd_map (edge_id, sensor_key)
                SELECT
                  e.edge_id,
                  nearest.location_id::text
                FROM edge e
                CROSS JOIN LATERAL (
                  SELECT location_id
                  FROM pedestrian_sensor
                  ORDER BY geom_sensor <-> ST_LineInterpolatePoint(e.geom_edge, 0.5)
                  LIMIT 1
                ) nearest
                ON CONFLICT (edge_id) DO UPDATE SET sensor_key = EXCLUDED.sensor_key
                """
            )
    conn.commit()


def load_edge_base_and_maps(
    conn,
) -> List[Tuple[int, float, Optional[str], Optional[str]]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
              e.edge_id,
              e.length,
              nm.sensor_key AS noise_sensor_key,
              cm.sensor_key AS crowd_sensor_key
            FROM edge e
            LEFT JOIN edge_noise_map nm ON nm.edge_id = e.edge_id
            LEFT JOIN edge_crowd_map cm ON cm.edge_id = e.edge_id
            """
        )
        return [
            (
                int(r[0]),
                float(r[1]),
                str(r[2]) if r[2] is not None else None,
                str(r[3]) if r[3] is not None else None,
            )
            for r in cur.fetchall()
        ]


def index_forecasts(points: List[ForecastPoint]) -> Dict[Tuple[str, datetime], float]:
    # Dict lookup keeps edge materialization fast.
    return {(p.sensor_key, p.forecast_time): p.predicted_value for p in points}


def build_edge_forecasts(
    edge_base_and_maps: List[Tuple[int, float, Optional[str], Optional[str]]],
    noise_idx: Dict[Tuple[str, datetime], float],
    ped_idx: Dict[Tuple[str, datetime], float],
    forecast_times: Iterable[datetime],
    run_id: str,
) -> List[Tuple[int, datetime, float, float, float, bool, str]]:
    # Build edge-level forecast rows for each edge and future hour.
    # Read predicted sensor values, apply crowd penalty tiers,
    # and then reuse the same final-cost formula as live routing.
    rows: List[Tuple[int, datetime, float, float, float, bool, str]] = []
    for edge_id, edge_len, noise_key, crowd_key in edge_base_and_maps:
        for ts in forecast_times:
            noise_db = noise_idx.get((noise_key, ts), 0.0) if noise_key else 0.0
            crowd_count = ped_idx.get((crowd_key, ts), 0.0) if crowd_key else 0.0
            crowd_penalty = crowd_count_to_penalty(crowd_count)
            # Keep this formula identical to live edge-weight logic.
            final_cost = edge_len * (1 + noise_db / 100.0 + crowd_penalty)
            rows.append(
                (
                    edge_id,
                    ts,
                    float(final_cost),
                    float(noise_db),
                    float(crowd_count),
                    bool(is_high_crowd(crowd_count)),
                    run_id,
                )
            )
    return rows


def write_edge_forecasts(
    conn,
    rows: List[Tuple[int, datetime, float, float, float, bool, str]],
) -> None:
    # Upsert keeps reruns idempotent for same run/time/edge.
    if not rows:
        return
    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO edge_forecasts (
              edge_id,
              forecast_time,
              final_cost,
              predicted_noise_db,
              predicted_crowd_count,
              is_high_crowd,
              run_id
            ) VALUES %s
            ON CONFLICT (edge_id, forecast_time, run_id)
            DO UPDATE SET
              final_cost = EXCLUDED.final_cost,
              predicted_noise_db = EXCLUDED.predicted_noise_db,
              predicted_crowd_count = EXCLUDED.predicted_crowd_count,
              is_high_crowd = EXCLUDED.is_high_crowd
            """,
            rows,
            page_size=1000,
        )
    conn.commit()


def parse_args() -> dict:
    # Minimal env-driven config.
    options = {
        "days_back": int(os.getenv("FORECAST_HISTORY_DAYS", "28")),
        "ped_source": os.getenv("PEDESTRIAN_HISTORY_SOURCE", "hourly"),
    }
    return options


def main() -> int:
    # Full pipeline orchestration in one place.
    # Steps:
    # A) read config
    # B) fetch + clean history
    # C) build one-week hourly forecasts
    # D) map forecasts to edges and compute costs
    # E) write rows + mark run status
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is required.", file=sys.stderr)
        return 1

    opts = parse_args()
    # run_id links every row written by this run.
    run_id = str(uuid.uuid4())
    try:
        # 1) Fetch + clean history from both sources.
        noise_hist = load_noise_history(days_back=opts["days_back"])
        ped_hist, ped_source_used = load_pedestrian_history_with_fallback(
            days_back=opts["days_back"],
            preferred_source=opts["ped_source"],
        )
        # 2) Regularize to hourly inputs.
        noise_hourly = aggregate_to_hourly(noise_hist)
        ped_hourly = aggregate_to_hourly(ped_hist)

        # 3) Forecast each sensor one week ahead (168 slots).
        noise_forecast = make_sensor_forecasts(
            noise_hourly, steps=FORECAST_HORIZON_STEPS
        )
        ped_forecast = make_sensor_forecasts(
            ped_hourly, steps=FORECAST_HORIZON_STEPS
        )

        if not noise_forecast and not ped_forecast:
            print("No usable historical data was fetched. Exiting.", file=sys.stderr)
            return 1

        forecast_times = sorted(
            {p.forecast_time for p in (noise_forecast if noise_forecast else ped_forecast)}
        )
        horizon_start = forecast_times[0]
        horizon_end = forecast_times[-1]

        # 4) Persist run metadata and edge forecasts.
        conn = psycopg2.connect(database_url, sslmode="require")
        create_run(conn, run_id=run_id, horizon_start=horizon_start, horizon_end=horizon_end)

        noise_idx = index_forecasts(noise_forecast)
        ped_idx = index_forecasts(ped_forecast)

        ensure_edge_sensor_maps(conn)
        edge_base_and_maps = load_edge_base_and_maps(conn)

        edge_rows = build_edge_forecasts(
            edge_base_and_maps=edge_base_and_maps,
            noise_idx=noise_idx,
            ped_idx=ped_idx,
            forecast_times=forecast_times,
            run_id=run_id,
        )
        write_edge_forecasts(conn, edge_rows)
        # 5) Mark run as succeeded.
        mark_run(conn, run_id=run_id, status="succeeded")
        conn.close()

        # Machine-readable summary for logs/CI.
        print(
            json.dumps(
                {
                    "run_id": run_id,
                    "noise_points": len(noise_forecast),
                    "ped_points": len(ped_forecast),
                    "edge_rows": len(edge_rows),
                    "pedestrian_source_used": ped_source_used,
                    "horizon_start": horizon_start.isoformat(),
                    "horizon_end": horizon_end.isoformat(),
                    "forecast_model": "weekly_profile",
                }
            )
        )
        return 0
    except Exception as exc:
        try:
            # Best effort: mark run as failed for visibility.
            conn = psycopg2.connect(database_url, sslmode="require")
            mark_run(conn, run_id=run_id, status="failed", error_message=str(exc))
            conn.close()
        except Exception:
            pass
        print(f"Forecast pipeline failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
