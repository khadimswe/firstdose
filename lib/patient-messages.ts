export type MessageLang = "en" | "es";
export type MessageCommand = { action: "approve"; case_id: "rx_001"; lang: MessageLang }
  | { action: "acknowledge"; case_id: "rx_001" };
export type ApprovedMessage = {
  case_id: "rx_001";
  lang: MessageLang;
  template_id: "patient_message_v1";
  approved_at: string;
  acknowledged_at: string | null;
};
export type MessageSnapshot = { run_id: string; revision: number; messages: ApprovedMessage[] };
export const isMessageRun = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const timestamp = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));

/** Project only the reviewed fields; malformed provider/browser responses fail closed. */
export function parseMessageSnapshot(value: unknown): MessageSnapshot {
  if (!record(value) || !isMessageRun(value.run_id) || !Number.isSafeInteger(value.revision) || Number(value.revision) < 0 || !Array.isArray(value.messages) || value.messages.length > 1) throw new Error("invalid_response");
  const messages = value.messages.map((message: unknown): ApprovedMessage => {
    if (!record(message) || message.case_id !== "rx_001" || (message.lang !== "en" && message.lang !== "es") ||
      message.template_id !== "patient_message_v1" || !timestamp(message.approved_at) ||
      !(message.acknowledged_at === null || timestamp(message.acknowledged_at)) ||
      (message.acknowledged_at !== null && Date.parse(message.acknowledged_at) < Date.parse(message.approved_at))) throw new Error("invalid_response");
    return { case_id: "rx_001", lang: message.lang as MessageLang, template_id: "patient_message_v1", approved_at: message.approved_at, acknowledged_at: message.acknowledged_at };
  });
  return { run_id: value.run_id.toLowerCase(), revision: Number(value.revision), messages };
}
