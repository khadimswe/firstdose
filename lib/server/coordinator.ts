import { WorkflowError } from "./workflow";

export type CoordinatorCommand = {
  action: "invite" | "request" | "approve" | "assign";
  coordinator_id: "coord_demo";
  prescriber_id: "prescriber_demo";
  case_id?: string;
};
export type CoordinatorEvent = {
  id: string;
  type: "coordinator_invited" | "coordinator_link_requested" | "coordinator_linked" | "coordinator_assigned";
  coordinator_id: "coord_demo";
  prescriber_id: "prescriber_demo";
  case_id: string | null;
  actor: "doctor" | "coordinator";
  at: string;
};
export type CoordinatorSnapshot = {
  run_id: string;
  revision: number;
  events: CoordinatorEvent[];
  links: { coordinator_id: "coord_demo"; prescriber_id: "prescriber_demo"; status: "pending" | "linked" }[];
  cases: { case_id: string; coordinator_id: "coord_demo" | null }[];
};
export interface CoordinatorStore {
  snapshot(): Promise<CoordinatorSnapshot>;
  command(runId: string, command: CoordinatorCommand): Promise<CoordinatorSnapshot>;
}

/** Fixed fictional identities; no real NPI, contact details, roles or timestamps from clients. */
export function validateCoordinatorCommand(value: unknown): asserts value is CoordinatorCommand {
  const invalid = () => { throw new WorkflowError("invalid_command", "Invalid coordinator command."); };
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const c = value as Record<string, unknown>;
  if (!["invite", "request", "approve", "assign"].includes(c.action as string) || c.coordinator_id !== "coord_demo" || c.prescriber_id !== "prescriber_demo") return invalid();
  const keys = ["action", "coordinator_id", "prescriber_id"];
  if (c.action === "assign") {
    keys.push("case_id");
    if (typeof c.case_id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(c.case_id)) return invalid();
  }
  if (Object.keys(c).some(key => !keys.includes(key))) return invalid();
}
