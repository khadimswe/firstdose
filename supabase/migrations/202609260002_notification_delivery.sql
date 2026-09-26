-- Claim once: neither ambiguous delivery nor a dead worker permits an automatic resend.
BEGIN;

ALTER TABLE public.notification_outbox
  DROP CONSTRAINT notification_outbox_status_check,
  ADD CONSTRAINT notification_outbox_status_check
    CHECK (status IN ('pending', 'claimed', 'accepted', 'unknown', 'failed')),
  ADD COLUMN claim_id uuid UNIQUE,
  ADD COLUMN claimed_at timestamptz;
-- Keep legacy failed/accepted rows and their audit data untouched.
CREATE INDEX notification_outbox_pending ON public.notification_outbox (run_id, created_at, script_id)
  WHERE status = 'pending';

CREATE FUNCTION public.fd_claim_notification() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = '' AS $$
DECLARE current_run uuid; selected_script text; result jsonb;
BEGIN
  -- Use the same lock order as commits/reset, then lock only an eligible outbox row.
  SELECT run_id INTO STRICT current_run FROM public.active_run WHERE singleton FOR UPDATE;
  SELECT script_id INTO selected_script FROM public.notification_outbox
    WHERE run_id = current_run AND status = 'pending'
    ORDER BY created_at, script_id LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN RETURN 'null'::jsonb; END IF;

  UPDATE public.notification_outbox
    SET status = 'claimed', claim_id = gen_random_uuid(), claimed_at = clock_timestamp(), attempts = attempts + 1
    WHERE run_id = current_run AND script_id = selected_script
    RETURNING jsonb_build_object('run_id', run_id, 'script_id', script_id, 'wrist', wrist, 'claim_id', claim_id)
      INTO result;
  RETURN result;
END;
$$;

CREATE FUNCTION public.fd_finish_notification(p_run_id uuid, p_script_id text, p_claim_id uuid, p_status text)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('accepted', 'unknown') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_notification_status';
  END IF;
  -- Acceptance means HTTP acceptance, never physical receipt. Reset cannot recall a
  -- send already in flight; retain its eventual outcome on the original run.
  UPDATE public.notification_outbox
    SET status = p_status, accepted_at = CASE WHEN p_status = 'accepted' THEN clock_timestamp() ELSE NULL END
    WHERE run_id = p_run_id AND script_id = p_script_id AND claim_id = p_claim_id AND status = 'claimed';
  RETURN FOUND;
END;
$$;

-- Existing table RLS and service-role grants remain in force.
REVOKE ALL ON FUNCTION public.fd_claim_notification(), public.fd_finish_notification(uuid,text,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fd_claim_notification(), public.fd_finish_notification(uuid,text,uuid,text)
  TO service_role;
COMMIT;
