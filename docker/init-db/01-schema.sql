-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create node table
CREATE TABLE IF NOT EXISTS node (
    node_id BigInt PRIMARY KEY, 
    lat Float NOT NULL,
    lon Float NOT NULL,
    geom_node GEOMETRY(Point, 4326)  
);

CREATE INDEX IF NOT EXISTS idx_node_geom ON node USING GIST (geom_node);

-- Create edge table
CREATE TABLE IF NOT EXISTS edge (
    edge_id BigInt PRIMARY KEY,
    u BigInt REFERENCES node(node_id), 
    v BigInt REFERENCES node(node_id), 
    length Float NOT NULL,
    is_indoor Boolean DEFAULT FALSE,
    geom_edge GEOMETRY(LineString, 4326)
);

CREATE INDEX IF NOT EXISTS idx_edge_u ON edge(u);
CREATE INDEX IF NOT EXISTS idx_edge_v ON edge(v);
CREATE INDEX IF NOT EXISTS idx_edge_geom ON edge USING GIST (geom_edge);

-- Create noise_sensor table
CREATE TABLE IF NOT EXISTS noise_sensor (
    device_id VARCHAR(50) PRIMARY KEY,
    geom_sensor GEOMETRY(Point, 4326),  
    current_db FLOAT,
    last_updated Timestamp
);

CREATE INDEX IF NOT EXISTS idx_noise_sensor_geom ON noise_sensor USING GIST (geom_sensor);

-- Create Edge_Weight table
CREATE TABLE IF NOT EXISTS Edge_Weight (
    weight_id SERIAL PRIMARY KEY,
    edge_id BigInt REFERENCES edge(edge_id) UNIQUE, 
    final_cost FLOAT,
    observation_time Timestamp, 
    noise_db FLOAT,
    is_high_noise boolean
);

CREATE INDEX IF NOT EXISTS idx_edge_weight_edge_id ON Edge_Weight(edge_id);
CREATE INDEX IF NOT EXISTS idx_edge_weight_observation_time ON Edge_Weight(observation_time DESC);

-- Create pedestrian_sensor table
CREATE TABLE IF NOT EXISTS pedestrian_sensor (
    location_id BigInt PRIMARY KEY,
    geom_sensor GEOMETRY(Point, 4326),  
    current_count BigInt,
    observation_time Timestamp
);

CREATE INDEX IF NOT EXISTS idx_pedestrian_sensor_geom ON pedestrian_sensor USING GIST (geom_sensor);

-- Create Safe_Space table
CREATE TABLE IF NOT EXISTS Safe_Space (
    safe_space_id SERIAL PRIMARY KEY,
    geom_safe_space GEOMETRY(Point, 4326),
    sub_theme VARCHAR(100),
    feature_name VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_safe_space_geom ON Safe_Space USING GIST (geom_safe_space);
CREATE INDEX IF NOT EXISTS idx_safe_space_theme ON Safe_Space(sub_theme);

-- Create noise_report table
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

-- Additional forecast tables for edge weight forecasting
CREATE TABLE IF NOT EXISTS forecast_runs (
  run_id SERIAL PRIMARY KEY,
  run_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  forecast_horizon_hours INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecast_runs_timestamp ON forecast_runs(run_timestamp DESC);

CREATE TABLE IF NOT EXISTS edge_forecasts (
  forecast_id SERIAL PRIMARY KEY,
  run_id INT REFERENCES forecast_runs(run_id) ON DELETE CASCADE,
  edge_id BigInt REFERENCES edge(edge_id),
  predicted_noise_db FLOAT,
  predicted_crowd_count FLOAT,
  forecast_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(run_id, edge_id, forecast_time)
);

CREATE INDEX IF NOT EXISTS idx_edge_forecasts_run_id ON edge_forecasts(run_id);
CREATE INDEX IF NOT EXISTS idx_edge_forecasts_edge_id ON edge_forecasts(edge_id);
CREATE INDEX IF NOT EXISTS idx_edge_forecasts_forecast_time ON edge_forecasts(forecast_time DESC);

-- Log initialization
SELECT NOW() AS schema_initialized;
