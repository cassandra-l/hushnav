-- Hushnav database schema
-- Apply with: psql "$DATABASE_URL" -f schema.sql

CREATE EXTENSION IF NOT EXISTS postgis;

-- Routing graph
CREATE TABLE IF NOT EXISTS node (
    node_id BIGINT PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    geom_node GEOMETRY(Point, 4326)
);

CREATE INDEX IF NOT EXISTS idx_node_geom ON node USING GIST (geom_node);

CREATE TABLE IF NOT EXISTS edge (
    edge_id BIGINT PRIMARY KEY,
    u BIGINT REFERENCES node(node_id),
    v BIGINT REFERENCES node(node_id),
    length DOUBLE PRECISION NOT NULL,
    is_indoor BOOLEAN DEFAULT FALSE,
    geom_edge GEOMETRY(LineString, 4326)
);

CREATE INDEX IF NOT EXISTS idx_edge_u ON edge(u);
CREATE INDEX IF NOT EXISTS idx_edge_v ON edge(v);
CREATE INDEX IF NOT EXISTS idx_edge_geom ON edge USING GIST (geom_edge);

-- Live sensor readings
CREATE TABLE IF NOT EXISTS noise_sensor (
    device_id VARCHAR(50) PRIMARY KEY,
    geom_sensor GEOMETRY(Point, 4326),
    current_db DOUBLE PRECISION,
    last_updated TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_noise_sensor_geom ON noise_sensor USING GIST (geom_sensor);

CREATE TABLE IF NOT EXISTS pedestrian_sensor (
    location_id BIGINT PRIMARY KEY,
    geom_sensor GEOMETRY(Point, 4326),
    current_count BIGINT,
    observation_time TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pedestrian_sensor_geom ON pedestrian_sensor USING GIST (geom_sensor);

-- Edge routing costs (updated from live sensor data)
CREATE TABLE IF NOT EXISTS edge_weight (
    edge_id BIGINT PRIMARY KEY REFERENCES edge(edge_id) ON DELETE CASCADE,
    final_cost DOUBLE PRECISION,
    observation_time TIMESTAMPTZ,
    noise_db DOUBLE PRECISION,
    crowd_count BIGINT,
    is_high_crowd BOOLEAN
);

CREATE INDEX IF NOT EXISTS idx_edge_weight_observation_time ON edge_weight (observation_time DESC);

-- Safe spaces along routes
CREATE TABLE IF NOT EXISTS safe_space (
    safe_space_id SERIAL PRIMARY KEY,
    geom_safe_space GEOMETRY(Point, 4326),
    sub_theme VARCHAR(100),
    feature_name VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_safe_space_geom ON safe_space USING GIST (geom_safe_space);
CREATE INDEX IF NOT EXISTS idx_safe_space_theme ON safe_space (sub_theme);

-- User-submitted noise reports
CREATE TABLE IF NOT EXISTS noise_report (
  report_id SERIAL PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  noise_level DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_noise_report_created_at
  ON noise_report (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_noise_report_geom
  ON noise_report USING GIST (geom);

-- Construction closures
CREATE TABLE IF NOT EXISTS construction_event (
  source_id TEXT PRIMARY KEY,
  geom GEOMETRY(Geometry, 4326) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  last_updated TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_construction_event_geom ON construction_event USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_construction_event_is_active ON construction_event (is_active);

CREATE TABLE IF NOT EXISTS construction_blocked_edge (
  edge_id BIGINT PRIMARY KEY REFERENCES edge(edge_id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_construction_blocked_edge_updated_at ON construction_blocked_edge (updated_at DESC);

-- Forecast runs and edge-level predictions
CREATE TABLE IF NOT EXISTS forecast_runs (
  run_id UUID PRIMARY KEY,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  horizon_start TIMESTAMPTZ NOT NULL,
  horizon_end TIMESTAMPTZ NOT NULL,
  model_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_forecast_runs_generated_at
  ON forecast_runs (generated_at DESC);

CREATE TABLE IF NOT EXISTS edge_forecasts (
  edge_id BIGINT NOT NULL REFERENCES edge(edge_id) ON DELETE CASCADE,
  forecast_time TIMESTAMPTZ NOT NULL,
  final_cost DOUBLE PRECISION NOT NULL,
  predicted_noise_db DOUBLE PRECISION NOT NULL,
  predicted_crowd_count DOUBLE PRECISION NOT NULL,
  is_high_crowd BOOLEAN NOT NULL DEFAULT FALSE,
  run_id UUID NOT NULL REFERENCES forecast_runs(run_id) ON DELETE CASCADE,
  PRIMARY KEY (edge_id, forecast_time, run_id)
);

CREATE INDEX IF NOT EXISTS idx_edge_forecasts_time
  ON edge_forecasts (forecast_time);

CREATE INDEX IF NOT EXISTS idx_edge_forecasts_edge_time
  ON edge_forecasts (edge_id, forecast_time);

-- Cached nearest-sensor mappings used by the forecast job
CREATE TABLE IF NOT EXISTS edge_noise_map (
  edge_id BIGINT PRIMARY KEY REFERENCES edge(edge_id) ON DELETE CASCADE,
  sensor_key TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edge_noise_map_sensor
  ON edge_noise_map (sensor_key);

CREATE TABLE IF NOT EXISTS edge_crowd_map (
  edge_id BIGINT PRIMARY KEY REFERENCES edge(edge_id) ON DELETE CASCADE,
  sensor_key TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edge_crowd_map_sensor
  ON edge_crowd_map (sensor_key);
