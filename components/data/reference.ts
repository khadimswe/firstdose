// Real public reference data and the synthetic practice identity. Screens read
// numbers and names from here, never from literals in components.
import publicData from "@/data/reference/public-data.json";
import practice from "@/data/synthetic/practice.json";

export const PUBLIC_DATA = publicData;
export const PRACTICE = practice;

export type Prescriber = (typeof practice.prescribers)[number];

export function prescriberRecord(label: string): Prescriber | undefined {
  return practice.prescribers.find((p) => p.label === label);
}

/** "••••••5915": enough to recognize the record, never the whole number on screen. */
export function maskedNpi(npi: string): string {
  return `••••••${npi.slice(-4)}`;
}

export function drugReference(drugId: string) {
  return (publicData.drugs as Record<string, (typeof publicData.drugs)["drug_otezla"] | undefined>)[drugId];
}
