import { expect, it } from "vitest";
import { CATALOG } from "@/components/data/catalog";
import otezla from "@/data/labels/drug_otezla/label.json";
import provenance from "@/data/labels/drug_otezla/provenance.json";
import humiraArtifact from "@/data/labels/drug_humira/label.json";
import humiraProvenance from "@/data/labels/drug_humira/provenance.json";

it("uses the reviewed Otezla artifact and matching identity in both screen modes", () => {
  expect(CATALOG.labels.find(label => label.drug_id === "drug_otezla")).toEqual(otezla);
  const drug = CATALOG.drugs.find(drug => drug.id === "drug_otezla");
  expect(drug?.rxcui).toBe(provenance.rxcui);
  expect(drug?.dailymed_setid).toBe(otezla.setid);
});

it("uses the reviewed Humira artifact and matching identity in both screen modes", () => {
  const humira = CATALOG.labels.find(label => label.drug_id === "drug_humira");
  expect(humira).toEqual(humiraArtifact);
  const drug = CATALOG.drugs.find(drug => drug.id === "drug_humira");
  expect(drug?.rxcui).toBe(humiraProvenance.rxcui);
  expect(drug?.dailymed_setid).toBe(humiraArtifact.setid);
  // The Humira label is a KIT with several presentations; the committed
  // artifact proves the selected 40 mg / 0.4 mL pen presentation.
  expect(humira?.byte_exact).toBe(true);
  expect(humira?.sections[0]?.text).toContain("Patients treated with HUMIRA are at increased risk for developing serious infections");
});
