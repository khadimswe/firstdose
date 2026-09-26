// The only module that imports mock data (templates.json is copy, see components/copy).
import eventsJson from "@/mock/events.json";
import labelsJson from "@/mock/labels.json";
import patientsJson from "@/mock/patients.json";
import reasonsJson from "@/mock/reasons.json";

import type { Catalog, FillEvent } from "./types";

export const SCRIPT = eventsJson.events as FillEvent[];

export const CATALOG = {
  patients: patientsJson.patients,
  drugs: patientsJson.drugs,
  cases: patientsJson.cases,
  labels: labelsJson.labels,
  reasons: reasonsJson.reasons,
  fixes: reasonsJson.fixes,
  rejectCodes: reasonsJson.status_vocabulary.ncpdp_reject_codes,
} as Catalog;
