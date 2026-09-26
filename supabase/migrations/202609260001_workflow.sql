-- Practice-side fictional demo state. Browser roles have no access.
BEGIN;

CREATE TABLE public.patients (
  id text PRIMARY KEY, name text NOT NULL, display_short text NOT NULL,
  age integer NOT NULL CHECK (age >= 0), insurance jsonb NOT NULL,
  state text NOT NULL, condition_label text NOT NULL, phone_label text NOT NULL
);
CREATE TABLE public.drugs (
  id text PRIMARY KEY, brand text NOT NULL, generic text NOT NULL,
  strength text NOT NULL, qty_label text NOT NULL, channel text NOT NULL,
  rxcui text NOT NULL, dailymed_setid text NOT NULL, manufacturer text NOT NULL,
  wac_usd numeric NOT NULL, wac_source text NOT NULL, copay_program jsonb NOT NULL,
  demo_quote_usd numeric, demo_quote_label text, has_boxed_warning boolean NOT NULL,
  boxed_warning_title text
);
CREATE TABLE public.rx_cases (
  id text PRIMARY KEY, patient_id text NOT NULL REFERENCES public.patients(id),
  drug_id text NOT NULL REFERENCES public.drugs(id), prescriber_label text NOT NULL,
  prescribed_at timestamptz NOT NULL, status text NOT NULL, reason text, fix text,
  started_at timestamptz, followup_at timestamptz NOT NULL,
  UNIQUE (patient_id, drug_id)
);
CREATE TABLE public.labels (
  drug_id text PRIMARY KEY REFERENCES public.drugs(id), setid text NOT NULL,
  fetched_at timestamptz, byte_exact boolean NOT NULL DEFAULT false,
  sections jsonb NOT NULL CHECK (jsonb_typeof(sections) = 'array')
);

CREATE TABLE public.demo_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE public.active_run (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  run_id uuid NOT NULL REFERENCES public.demo_runs(id),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0)
);
WITH initial AS (INSERT INTO public.demo_runs DEFAULT VALUES RETURNING id)
INSERT INTO public.active_run (run_id) SELECT id FROM initial;

CREATE TABLE public.fill_events (
  run_id uuid NOT NULL REFERENCES public.demo_runs(id),
  script_id text NOT NULL,
  sequence bigint NOT NULL CHECK (sequence > 0),
  case_id text NOT NULL REFERENCES public.rx_cases(id),
  at timestamptz NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  committed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (run_id, script_id),
  UNIQUE (run_id, sequence),
  CHECK (payload->>'id' = script_id AND payload->>'case_id' = case_id AND payload->>'type' = type)
);
CREATE TABLE public.notification_outbox (
  run_id uuid NOT NULL,
  script_id text NOT NULL,
  wrist text NOT NULL CHECK (length(wrist) BETWEEN 1 AND 200),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  accepted_at timestamptz,
  PRIMARY KEY (run_id, script_id),
  FOREIGN KEY (run_id, script_id) REFERENCES public.fill_events(run_id, script_id)
);

-- Single SQL statement: the active identity/revision and rows share one MVCC snapshot.
CREATE FUNCTION public.fd_snapshot() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'run_id', a.run_id, 'revision', a.revision,
    'events', COALESCE((SELECT jsonb_agg(e.payload ORDER BY e.sequence)
                       FROM public.fill_events e WHERE e.run_id = a.run_id), '[]'::jsonb)
  ) FROM public.active_run a WHERE a.singleton;
$$;

-- The server plans from fd_snapshot, then retries planning on revision_conflict.
-- The pointer lock serializes all commits/reset operations; a batch is one transaction.
CREATE FUNCTION public.fd_commit(p_run_id uuid, p_revision bigint, p_events jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  current_run uuid;
  current_revision bigint;
  next_sequence bigint;
  item jsonb;
  field text;
  event_time timestamptz;
  fields constant text[] := ARRAY['id','case_id','at','actor','type','status_text','reject_code','note','reason','fix','amount_usd','wrist','side'];
BEGIN
  SELECT run_id, revision INTO STRICT current_run, current_revision
    FROM public.active_run WHERE singleton FOR UPDATE;
  IF p_run_id IS DISTINCT FROM current_run THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'stale_run';
  END IF;
  IF p_revision IS DISTINCT FROM current_revision THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'revision_conflict';
  END IF;
  IF p_events IS NULL OR jsonb_typeof(p_events) <> 'array' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_events';
  END IF;
  IF jsonb_array_length(p_events) > 100 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_events';
  END IF;
  SELECT COALESCE(max(sequence), 0) INTO next_sequence
    FROM public.fill_events WHERE run_id = current_run;
  FOR item IN SELECT value FROM jsonb_array_elements(p_events) LOOP
    IF jsonb_typeof(item) <> 'object' OR NOT item ?& fields OR item - fields <> '{}'::jsonb THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_event';
    END IF;
    FOREACH field IN ARRAY ARRAY['id','case_id','at','actor','type','note','side'] LOOP
      IF jsonb_typeof(item->field) <> 'string' THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_event';
      END IF;
    END LOOP;
    FOREACH field IN ARRAY ARRAY['status_text','reject_code','reason','fix','wrist'] LOOP
      IF jsonb_typeof(item->field) NOT IN ('string','null') THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_event';
      END IF;
    END LOOP;
    IF jsonb_typeof(item->'amount_usd') NOT IN ('number','null')
       OR item->>'id' !~ '^ev_[A-Za-z0-9_]+$'
       OR item->>'actor' NOT IN ('pharmacy','hub','system','doctor','coordinator','patient','ascend')
       OR item->>'type' NOT IN ('prescribed','label_shown','copay_card_sent','claim_run','status','reason_classified','alert_sent','handoff','fix_chosen','fix_sent','copay_card_used','dispensed','started','before_visit_card','recovered')
       OR item->>'side' <> 'practice'
       OR (item->>'reason' IS NOT NULL AND item->>'reason' NOT IN ('DECLINED_AT_PRICE','COPAY_NOT_APPLIED','UNABLE_TO_REACH','PA_REQUIRED','NOT_COVERED','NOT_PICKED_UP_48H'))
       OR (item->>'fix' IS NOT NULL AND item->>'fix' NOT IN ('RESEND_COPAY_CARD','BRIDGE_SAMPLE','ACCESS_SUPPORT'))
       OR (item->>'wrist' IS NOT NULL AND length(item->>'wrist') NOT BETWEEN 1 AND 200)
       OR item->>'at' !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_event';
    END IF;
    -- Casting additionally rejects impossible dates; the JSON preserves the original ISO value.
    event_time := (item->>'at')::timestamptz;
    next_sequence := next_sequence + 1;
    INSERT INTO public.fill_events (run_id, script_id, sequence, case_id, at, type, payload)
      VALUES (current_run, item->>'id', next_sequence, item->>'case_id', event_time, item->>'type', item);
    IF item->>'wrist' IS NOT NULL THEN
      INSERT INTO public.notification_outbox (run_id, script_id, wrist)
        VALUES (current_run, item->>'id', item->>'wrist');
    END IF;
  END LOOP;
  IF jsonb_array_length(p_events) > 0 THEN
    UPDATE public.active_run SET revision = revision + 1 WHERE singleton;
  END IF;
  RETURN public.fd_snapshot();
END;
$$;

CREATE FUNCTION public.fd_reset(p_run_id uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = '' AS $$
DECLARE current_run uuid; new_run uuid;
BEGIN
  SELECT run_id INTO STRICT current_run FROM public.active_run WHERE singleton FOR UPDATE;
  IF p_run_id IS DISTINCT FROM current_run THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'stale_run';
  END IF;
  INSERT INTO public.demo_runs DEFAULT VALUES RETURNING id INTO new_run;
  UPDATE public.active_run SET run_id = new_run, revision = 0 WHERE singleton;
  RETURN public.fd_snapshot();
END;
$$;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rx_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fill_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.patients, public.drugs, public.rx_cases, public.labels,
  public.demo_runs, public.active_run, public.fill_events, public.notification_outbox
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.patients, public.drugs, public.rx_cases, public.labels,
  public.demo_runs, public.active_run, public.fill_events, public.notification_outbox TO service_role;
REVOKE ALL ON FUNCTION public.fd_snapshot(), public.fd_commit(uuid,bigint,jsonb), public.fd_reset(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fd_snapshot(), public.fd_commit(uuid,bigint,jsonb), public.fd_reset(uuid)
  TO service_role;
COMMIT;
