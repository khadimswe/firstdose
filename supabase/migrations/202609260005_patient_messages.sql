-- Fictional practice-to-patient message receipts, separate from pharmacy events.
BEGIN;
CREATE TABLE public.patient_messages (
  run_id uuid NOT NULL REFERENCES public.demo_runs(id),
  case_id text NOT NULL REFERENCES public.rx_cases(id) CHECK (case_id = 'rx_001'),
  lang text NOT NULL CHECK (lang IN ('en', 'es')),
  template_id text NOT NULL DEFAULT 'patient_message_v1' CHECK (template_id = 'patient_message_v1'),
  approved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (run_id, case_id)
);
CREATE TABLE public.patient_message_acknowledgments (
  run_id uuid NOT NULL,
  case_id text NOT NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (run_id, case_id),
  FOREIGN KEY (run_id, case_id) REFERENCES public.patient_messages(run_id, case_id)
);
ALTER TABLE public.patient_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_message_acknowledgments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.patient_messages, public.patient_message_acknowledgments FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.patient_messages, public.patient_message_acknowledgments TO service_role;

CREATE FUNCTION public.fd_patient_message_snapshot() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT jsonb_build_object('run_id', a.run_id, 'revision', a.revision,
    'messages', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'case_id', m.case_id, 'lang', m.lang, 'template_id', m.template_id,
      'approved_at', m.approved_at, 'acknowledged_at', r.acknowledged_at) ORDER BY m.case_id)
      FROM public.patient_messages m LEFT JOIN public.patient_message_acknowledgments r
        ON r.run_id = m.run_id AND r.case_id = m.case_id WHERE m.run_id = a.run_id), '[]'::jsonb)
  ) FROM public.active_run a WHERE a.singleton;
$$;

CREATE FUNCTION public.fd_patient_message_command(p_run_id uuid, p_action text, p_case_id text, p_lang text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  current_run uuid;
  approval public.patient_messages%ROWTYPE;
  changed boolean := false;
BEGIN
  SELECT run_id INTO STRICT current_run FROM public.active_run WHERE singleton FOR UPDATE;
  IF p_run_id IS DISTINCT FROM current_run THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'stale_run';
  END IF;
  IF p_action IS NULL OR p_action NOT IN ('approve', 'acknowledge') OR p_case_id IS DISTINCT FROM 'rx_001'
    OR (p_action = 'approve' AND (p_lang IS NULL OR p_lang NOT IN ('en', 'es')))
    OR (p_action = 'acknowledge' AND p_lang IS NOT NULL) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_command';
  END IF;
  SELECT * INTO approval FROM public.patient_messages WHERE run_id = current_run AND case_id = p_case_id;
  IF p_action = 'approve' THEN
    IF approval.case_id IS NOT NULL THEN
      IF approval.lang IS DISTINCT FROM p_lang THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_transition';
      END IF;
    ELSE
      IF NOT EXISTS (SELECT 1 FROM public.rx_cases WHERE id = p_case_id AND drug_id = 'drug_otezla')
        OR NOT EXISTS (SELECT 1 FROM public.fill_events WHERE run_id = current_run AND case_id = p_case_id
          AND type = 'fix_sent' AND payload->>'fix' = 'RESEND_COPAY_CARD') THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_transition';
      END IF;
      INSERT INTO public.patient_messages (run_id, case_id, lang) VALUES (current_run, p_case_id, p_lang);
      changed := true;
    END IF;
  ELSE
    IF approval.case_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_transition';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.patient_message_acknowledgments WHERE run_id = current_run AND case_id = p_case_id) THEN
      INSERT INTO public.patient_message_acknowledgments (run_id, case_id, acknowledged_at)
        VALUES (current_run, p_case_id, GREATEST(clock_timestamp(), approval.approved_at));
      changed := true;
    END IF;
  END IF;
  IF changed THEN UPDATE public.active_run SET revision = revision + 1 WHERE singleton; END IF;
  RETURN public.fd_patient_message_snapshot();
END;
$$;
REVOKE ALL ON FUNCTION public.fd_patient_message_snapshot(), public.fd_patient_message_command(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fd_patient_message_snapshot(), public.fd_patient_message_command(uuid, text, text, text) TO service_role;
COMMIT;
