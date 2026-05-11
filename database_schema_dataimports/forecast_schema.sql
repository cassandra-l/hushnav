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

CREATE INDEX IF NOT EXISTS idx_edge_geom_edge_gist
  ON edge USING GIST (geom_edge);

CREATE INDEX IF NOT EXISTS idx_noise_sensor_geom_gist
  ON noise_sensor USING GIST (geom_sensor);

CREATE INDEX IF NOT EXISTS idx_pedestrian_sensor_geom_gist
  ON pedestrian_sensor USING GIST (geom_sensor);
