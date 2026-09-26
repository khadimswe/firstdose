import { describe, expect, it } from "vitest";
import type { FixKey, ReasonKey } from "../components/data/types";
import { routeFix } from "../lib/server/router";

const commercialCases: [ReasonKey, FixKey, FixKey, FixKey][] = [
  ["DECLINED_AT_PRICE", "RESEND_COPAY_CARD", "ACCESS_SUPPORT", "ACCESS_SUPPORT"],
  ["COPAY_NOT_APPLIED", "RESEND_COPAY_CARD", "ACCESS_SUPPORT", "ACCESS_SUPPORT"],
  ["UNABLE_TO_REACH", "BRIDGE_SAMPLE", "ACCESS_SUPPORT", "ACCESS_SUPPORT"],
  ["PA_REQUIRED", "ACCESS_SUPPORT", "ACCESS_SUPPORT", "ACCESS_SUPPORT"],
  ["NOT_COVERED", "ACCESS_SUPPORT", "ACCESS_SUPPORT", "ACCESS_SUPPORT"],
  ["NOT_PICKED_UP_48H", "RESEND_COPAY_CARD", "ACCESS_SUPPORT", "ACCESS_SUPPORT"],
];

describe("routeFix", () => {
  it.each(commercialCases)("routes commercial %s only with explicit eligibility", (reason, eligible, ineligible, missing) => {
    expect(routeFix({ insuranceType: "commercial", reason, copayCardEligible: true, bridgeSampleEligible: true })).toBe(eligible);
    expect(routeFix({ insuranceType: "commercial", reason, copayCardEligible: false, bridgeSampleEligible: false })).toBe(ineligible);
    expect(routeFix({ insuranceType: "commercial", reason })).toBe(missing);
  });

  describe.each(["medicare", "medicaid", "tricare", "other_government", "uninsured", "unknown", "", "other"])("%s coverage", (insuranceType) => {
    it.each(commercialCases)("routes %s to access support regardless of eligibility", (reason) => {
      for (const evidence of [true, false, undefined]) {
        expect(routeFix({ insuranceType, reason, copayCardEligible: evidence, bridgeSampleEligible: evidence })).toBe("ACCESS_SUPPORT");
      }
    });
  });

  it.each(["DECLINED_AT_PRICE", "COPAY_NOT_APPLIED", "NOT_PICKED_UP_48H"] as const)("does not substitute bridge eligibility for card eligibility: %s", (reason) => {
    expect(routeFix({ insuranceType: "commercial", reason, bridgeSampleEligible: true })).toBe("ACCESS_SUPPORT");
  });

  it("does not infer bridge eligibility from James's unable-to-reach reason or card eligibility", () => {
    expect(routeFix({ insuranceType: "commercial", reason: "UNABLE_TO_REACH", copayCardEligible: true })).toBe("ACCESS_SUPPORT");
  });

  it.each([
    ["DECLINED_AT_PRICE", true, false, "RESEND_COPAY_CARD"],
    ["COPAY_NOT_APPLIED", true, false, "RESEND_COPAY_CARD"],
    ["NOT_PICKED_UP_48H", true, false, "RESEND_COPAY_CARD"],
    ["UNABLE_TO_REACH", false, true, "BRIDGE_SAMPLE"],
  ] as const)("does not require unrelated eligibility for %s", (reason, copayCardEligible, bridgeSampleEligible, expected) => {
    expect(routeFix({ insuranceType: "commercial", reason, copayCardEligible, bridgeSampleEligible })).toBe(expected);
  });

  it.each([
    ["  CoMmErCiAl \t", "DECLINED_AT_PRICE", "RESEND_COPAY_CARD"],
    ["  CoMmErCiAl \t", "UNABLE_TO_REACH", "BRIDGE_SAMPLE"],
    [" MEDICARE ", "DECLINED_AT_PRICE", "ACCESS_SUPPORT"],
    [" Medicaid ", "COPAY_NOT_APPLIED", "ACCESS_SUPPORT"],
    [" TRICARE ", "NOT_PICKED_UP_48H", "ACCESS_SUPPORT"],
    [" OTHER_GOVERNMENT ", "UNABLE_TO_REACH", "ACCESS_SUPPORT"],
    [" Uninsured ", "DECLINED_AT_PRICE", "ACCESS_SUPPORT"],
  ] as const)("normalizes coverage %s with reason %s", (insuranceType, reason, expected) => {
    expect(routeFix({ insuranceType, reason, copayCardEligible: true, bridgeSampleEligible: true })).toBe(expected);
  });

  it.each([null, undefined, "UNKNOWN", "", "declined_at_price", " DECLINED_AT_PRICE ", "__proto__", "constructor", "toString", "hasOwnProperty", 42, {}, ["DECLINED_AT_PRICE"]])("fails closed for invalid runtime reason %j", (reason) => {
    expect(routeFix({ insuranceType: "commercial", reason: reason as ReasonKey | null, copayCardEligible: true, bridgeSampleEligible: true })).toBe("ACCESS_SUPPORT");
  });

  it.each(["true", 1, {}, []])("does not accept truthy runtime eligibility %j", (evidence) => {
    expect(routeFix({ insuranceType: "commercial", reason: "DECLINED_AT_PRICE", copayCardEligible: evidence as boolean })).toBe("ACCESS_SUPPORT");
    expect(routeFix({ insuranceType: "commercial", reason: "UNABLE_TO_REACH", bridgeSampleEligible: evidence as boolean })).toBe("ACCESS_SUPPORT");
  });
});
