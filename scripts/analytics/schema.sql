-- Tiger (Timescale) schema for run-scoped fill metrics (task 2.3 / C2).
--
-- One project schema, a small key ledger and one hypertable. The ledger
-- enforces (run_id, script_id) uniqueness independent of time; the hypertable
-- PRIMARY KEY includes the time partition as Tiger/Timescale requires. A
-- continuous aggregate is deliberately outside this first implementation.

CREATE SCHEMA IF NOT EXISTS firstdose;

CREATE TABLE IF NOT EXISTS firstdose.event_keys (
  run_id text NOT NULL,
  script_id text NOT NULL,
  payload_hash text NOT NULL,
  PRIMARY KEY (run_id, script_id)
);

CREATE TABLE IF NOT EXISTS firstdose.fill_events (
  at timestamptz NOT NULL,
  run_id text NOT NULL,
  script_id text NOT NULL,
  case_hash text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('prescribed','reason','dispensed')),
  reason text,
  PRIMARY KEY (at, run_id, script_id)
);

SELECT create_hypertable('firstdose.fill_events', by_range('at'), if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS firstdose_run_case_time
  ON firstdose.fill_events (run_id, case_hash, at);