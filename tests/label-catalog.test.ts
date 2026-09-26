import { expect, it } from "vitest";
import { CATALOG } from "@/components/data/catalog";
import otezla from "@/data/labels/drug_otezla/label.json";
import provenance from "@/data/labels/drug_otezla/provenance.json";

it("uses the reviewed Otezla artifact and matching identity in both screen modes", () => {
  expect(CATALOG.labels.find(label => label.drug_id === "drug_otezla")).toEqual(otezla);
  const drug = CATALOG.drugs.find(drug => drug.id === "drug_otezla");
  expect(drug?.rxcui).toBe(provenance.rxcui);
  expect(drug?.dailymed_setid).toBe(otezla.setid);
});

it("keeps Humira visibly unverified until its own artifact is reviewed", () => {
  expect(CATALOG.labels.find(label => label.drug_id === "drug_humira")?.byte_exact).toBe(false);
});
