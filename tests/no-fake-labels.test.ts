import { describe, expect, it } from "vitest";
import patients from "@/mock/patients.json";
import reasons from "@/mock/reasons.json";
import templates from "@/mock/templates.json";
import week from "@/data/demo-week.json";
import { CODE_STANDINS } from "@/components/copy/standins";

// PLAN D3 (revised): product screens carry no "mock / demo / stand-in" wording.
// One footer line discloses synthetic data; the DocUpdate concept line stays.
// Operator-only simulator labels (/sim) are exempt.
const FORBIDDEN = /\b(mock|demo|stand-in|fictional|judge)\b/i;
const OPERATOR_ONLY = new Set(["standin_labels.pharmacy", "standin_labels.hub"]);

function strings(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([k, v]) => (k === "_comment" ? [] : strings(v, path ? `${path}.${k}` : k)));
  return [];
}

describe("no fake-data wording on product screens", () => {
  it.each([
    ["templates", templates],
    ["patients", patients],
    ["reasons", reasons],
    ["seeded week", week],
    ["code labels", CODE_STANDINS],
  ])("%s", (_name, source) => {
    const hits = strings(source).filter(([path, text]) => !OPERATOR_ONLY.has(path) && FORBIDDEN.test(text));
    expect(hits).toEqual([]);
  });
});
