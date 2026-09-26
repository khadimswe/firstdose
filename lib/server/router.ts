import type { FixKey, ReasonKey } from "../../components/data/types";
import reasons from "../../mock/reasons.json";

/** Selects an administrative next step from the frozen, first-match table. */
export function routeFix(input: {
  insuranceType: string;
  reason: ReasonKey | null;
  copayCardEligible?: boolean;
  bridgeSampleEligible?: boolean;
}): FixKey {
  if (typeof input.reason !== "string" || !Object.hasOwn(reasons.reasons, input.reason)) {
    return "ACCESS_SUPPORT";
  }

  const insuranceType = input.insuranceType.trim().toLowerCase();
  const row = reasons.router.rows.find(
    (candidate) =>
      candidate.insurance.includes(insuranceType) &&
      (candidate.reason === "*" || candidate.reason === input.reason),
  );

  if (
    row?.fix === "RESEND_COPAY_CARD" &&
    insuranceType === "commercial" &&
    input.copayCardEligible === true
  ) {
    return "RESEND_COPAY_CARD";
  }
  if (row?.fix === "BRIDGE_SAMPLE" && input.bridgeSampleEligible === true) {
    return "BRIDGE_SAMPLE";
  }
  return "ACCESS_SUPPORT";
}
