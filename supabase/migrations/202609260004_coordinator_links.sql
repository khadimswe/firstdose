-- Additive practice-side demo linkage. No real staff identity/NPI verification.
BEGIN;

CREATE TABLE public.coordinator_events (
  run_id uuid NOT NULL REFERENCES public.demo_runs(id),
  id text NOT NULL,
  type text NOT NULL CHECK (type IN ('coordinator_invited', 'coordinator_link_requested', 'coordinator_linked', 'coordinator_assigned')),
  coordinator_id text NOT NULL CHECK (coordinator_id = 'coord_demo'),
  prescriber_id text NOT NULL CHECK (prescriber_id = 'prescriber_demo'),
  case_id text REFERENCES public.rx_cases(id),
  actor text NOT NULL CHECK (actor IN ('doctor', 'coordinator')),
  at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (run_id, id),
  CHECK ((type = 'coordinator_assigned') = (case_id IS NOT NULL))
);
CREATE TABLE public.case_coordinators (
  run_id uuid NOT NULL REFERENCES public.demo_runs(id),
  case_id text NOT NULL REFERENCES public.rx_cases(id),
  coordinator_id text NOT NULL CHECK (coordinator_id = 'coord_demo'),
  prescriber_id text NOT NULL CHECK (prescriber_id = 'prescriber_demo'),
  PRIMARY KEY (run_id, case_id)
);
ALTER TABLE public.coordinator_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_coordinators ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coordinator_events, public.case_coordinators FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.coordinator_events, public.case_coordinators TO service_role;

-- One statement yields a consistent active-run view. Fill-event shape is unchanged.
CREATE FUNCTION public.fd_coordinator_snapshot() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'run_id', a.run_id, 'revision', a.revision,
    'events', COALESCE((SELECT jsonb_agg(to_jsonb(e) - 'run_id' ORDER BY e.at, e.id)
      FROM public.coordinator_events e WHERE e.run_id = a.run_id), '[]'::jsonb),
    'links', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'coordinator_id', r.coordinator_id, 'prescriber_id', r.prescriber_id,
      'status', CASE WHEN EXISTS (SELECT 1 FROM public.coordinator_events l WHERE l.run_id = r.run_id
        AND l.type = 'coordinator_linked' AND l.prescriber_id = r.prescriber_id AND l.coordinator_id = r.coordinator_id)
        THEN 'linked' ELSE 'pending' END))
      FROM public.coordinator_events r WHERE r.run_id = a.run_id AND r.type = 'coordinator_link_requested'), '[]'::jsonb),
    'cases', COALESCE((SELECT jsonb_agg(jsonb_build_object('case_id', c.id, 'coordinator_id', cc.coordinator_id) ORDER BY c.id)
      FROM public.rx_cases c LEFT JOIN public.case_coordinators cc ON cc.case_id = c.id AND cc.run_id = a.run_id), '[]'::jsonb)
  ) FROM public.active_run a WHERE a.singleton;
$$;

-- All state transitions are checked under the same lock used by fd_commit/fd_reset.
-- Clients supply intent only: no event, actor, timestamp or arbitrary identity input.
CREATE FUNCTION public.fd_coordinator_command(
  p_run_id uuid, p_action text, p_coordinator_id text, p_prescriber_id text, p_case_id text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  current_run uuid;
  was_changed boolean := false;
  event_time timestamptz;
BEGIN
  SELECT run_id INTO STRICT current_run FROM public.active_run WHERE singleton FOR UPDATE;
  IF p_run_id IS DISTINCT FROM current_run THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'stale_run';
  END IF;
  IF p_action IS NULL OR p_action NOT IN ('invite', 'request', 'approve', 'assign')
    OR p_coordinator_id IS DISTINCT FROM 'coord_demo' OR p_prescriber_id IS DISTINCT FROM 'prescriber_demo'
    OR (p_action <> 'assign' AND p_case_id IS NOT NULL)
    OR (p_action = 'assign' AND (p_case_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.rx_cases WHERE id = p_case_id AND prescriber_label = 'Dr. Demo (judge 1)'
    ))) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_command';
  END IF;
  SELECT GREATEST(clock_timestamp(), COALESCE(max(at) + interval '1 millisecond', '-infinity'::timestamptz))
    INTO event_time FROM public.coordinator_events WHERE run_id = current_run;

  IF p_action IN ('invite', 'request') THEN
    IF NOT EXISTS (SELECT 1 FROM public.coordinator_events WHERE run_id = current_run AND id = 'coord_invited') THEN
      INSERT INTO public.coordinator_events (run_id, id, type, coordinator_id, prescriber_id, actor, at)
        VALUES (current_run, 'coord_invited', 'coordinator_invited', p_coordinator_id, p_prescriber_id,
          CASE WHEN p_action = 'invite' THEN 'doctor' ELSE 'coordinator' END, event_time);
      INSERT INTO public.coordinator_events (run_id, id, type, coordinator_id, prescriber_id, actor, at)
        VALUES (current_run, 'coord_requested', 'coordinator_link_requested', p_coordinator_id, p_prescriber_id,
          CASE WHEN p_action = 'invite' THEN 'doctor' ELSE 'coordinator' END, event_time + interval '1 millisecond');
      was_changed := true;
    END IF;
  ELSIF p_action = 'approve' THEN
    IF NOT EXISTS (SELECT 1 FROM public.coordinator_events WHERE run_id = current_run AND id = 'coord_requested') THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_transition';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.coordinator_events WHERE run_id = current_run AND id = 'coord_linked') THEN
      INSERT INTO public.coordinator_events (run_id, id, type, coordinator_id, prescriber_id, actor, at)
        VALUES (current_run, 'coord_linked', 'coordinator_linked', p_coordinator_id, p_prescriber_id, 'doctor', event_time);
      was_changed := true;
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.coordinator_events WHERE run_id = current_run AND id = 'coord_linked')
      OR NOT EXISTS (SELECT 1 FROM public.fill_events WHERE run_id = current_run AND case_id = p_case_id AND type = 'prescribed') THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_transition';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.case_coordinators WHERE run_id = current_run AND case_id = p_case_id) THEN
      INSERT INTO public.case_coordinators (run_id, case_id, coordinator_id, prescriber_id)
        VALUES (current_run, p_case_id, p_coordinator_id, p_prescriber_id);
      INSERT INTO public.coordinator_events (run_id, id, type, coordinator_id, prescriber_id, case_id, actor, at)
        VALUES (current_run, 'coord_assigned:' || p_case_id, 'coordinator_assigned', p_coordinator_id, p_prescriber_id, p_case_id, 'doctor', event_time);
      was_changed := true;
    END IF;
  END IF;
  IF was_changed THEN UPDATE public.active_run SET revision = revision + 1 WHERE singleton; END IF;
  RETURN public.fd_coordinator_snapshot();
END;
$$;

REVOKE ALL ON FUNCTION public.fd_coordinator_snapshot() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fd_coordinator_command(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fd_coordinator_snapshot() TO service_role;
GRANT EXECUTE ON FUNCTION public.fd_coordinator_command(uuid, text, text, text, text) TO service_role;

COMMIT;
