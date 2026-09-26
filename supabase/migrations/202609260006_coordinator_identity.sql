-- The fixed prescriber_demo identity owns the two interactive cases, independent
-- of their synthetic display names. Background/new cases require an explicit
-- future identity mapping; copying a prescriber label must never grant access.
-- Replace the deployed RPC in place; do not rewrite migration 004 or its history.
BEGIN;
CREATE OR REPLACE FUNCTION public.fd_coordinator_command(
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
      SELECT 1 FROM public.rx_cases WHERE id = p_case_id AND id IN ('rx_001', 'rx_002')
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
REVOKE ALL ON FUNCTION public.fd_coordinator_command(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fd_coordinator_command(uuid, text, text, text, text) TO service_role;
COMMIT;