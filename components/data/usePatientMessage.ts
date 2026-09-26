"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createMessageClient, EMPTY_MESSAGES } from "@/lib/patient-message-client";
import type { ApprovedMessage, MessageLang } from "@/lib/patient-messages";
import { DATA_MODE } from "./mode";
import { local, useLocal } from "./local";
import { useEvents } from "./useEvents";

const client = createMessageClient();
const empty = () => EMPTY_MESSAGES;
const noopSubscribe = () => () => {};
const live = DATA_MODE === "supabase";

export function usePatientMessage(caseId: string | undefined) {
  const state = useSyncExternalStore(live ? client.subscribe : noopSubscribe, live ? client.getSnapshot : empty, empty);
  useEffect(() => {
    if (!live) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void import("@/lib/realtime").then(({ default: source }) => {
      if (!active) return;
      unsubscribe = source.subscribe(() => {}, runId => {
        client.observeRun(runId);
        void client.refresh();
      });
    });
    return () => { active = false; unsubscribe?.(); };
  }, []);
  const offline = useLocal();
  const workflow = useEvents();
  const c = workflow.cases.find(row => row.id === caseId);
  const eligible = c?.id === "rx_001" && c.drug.id === "drug_otezla" && c.fix === "RESEND_COPAY_CARD"
    && c.events.some(e => e.type === "fix_sent" && e.fix === "RESEND_COPAY_CARD");
  const saved = caseId ? offline.messages[caseId] : undefined;
  const ready = workflow.ready && (live ? state.ready && state.data?.run_id === state.observedRun : true);
  const message: ApprovedMessage | undefined = !ready || !eligible ? undefined : live
    ? state.data?.messages.find(row => row.case_id === caseId)
    : saved ? { case_id: "rx_001", lang: saved.lang, template_id: "patient_message_v1", approved_at: new Date(saved.at).toISOString(), acknowledged_at: saved.acknowledgedAt === undefined ? null : new Date(saved.acknowledgedAt).toISOString() } : undefined;
  return {
    message, eligible, ready, pending: live && state.pending,
    error: live ? state.actionError ?? state.syncError : null,
    refresh: client.retry,
    approve: async (lang: MessageLang) => {
      if (!eligible || !ready || message) return;
      if (live) await client.command({ action: "approve", case_id: "rx_001", lang });
      else local.sendMessage("rx_001", lang);
    },
    acknowledge: async () => {
      if (!message || message.acknowledged_at !== null) return;
      if (live) await client.command({ action: "acknowledge", case_id: "rx_001" });
      else local.acknowledgeMessage("rx_001");
    },
  };
}
