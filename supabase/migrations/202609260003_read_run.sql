BEGIN;

-- 002 is reserved for Phase 1 notification delivery on backend/maria-core.
-- One snapshot of durable history, including retained runs after a reset.
-- Return NULL for an unknown run, distinct from an existing empty run.
CREATE FUNCTION public.fd_read_run(p_run_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'run_id', r.id,
    'events', COALESCE((SELECT jsonb_agg(e.payload ORDER BY e.sequence)
                       FROM public.fill_events e WHERE e.run_id = r.id), '[]'::jsonb)
  ) FROM public.demo_runs r WHERE r.id = p_run_id;
$$;

REVOKE ALL ON FUNCTION public.fd_read_run(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fd_read_run(uuid) TO service_role;

COMMIT;
