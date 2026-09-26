import type { MessageCommand, MessageSnapshot } from "../patient-messages";
import { WorkflowError } from "./workflow";

export interface MessageStore {
  snapshot(): Promise<MessageSnapshot>;
  command(runId: string, command: MessageCommand): Promise<MessageSnapshot>;
}
export function validateMessageCommand(value: unknown): asserts value is MessageCommand {
  const invalid = () => { throw new WorkflowError("invalid_command", "Invalid patient message command."); };
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const c = value as Record<string, unknown>;
  if (c.case_id !== "rx_001" || (c.action !== "approve" && c.action !== "acknowledge")) return invalid();
  const keys = ["action", "case_id"];
  if (c.action === "approve") {
    keys.push("lang");
    if (c.lang !== "en" && c.lang !== "es") return invalid();
  }
  if (Object.keys(c).some(key => !keys.includes(key))) return invalid();
}
