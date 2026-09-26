import type { Metadata } from "next";

import { PrescribersScreen } from "../_components/PrescribersScreen";

export const metadata: Metadata = { title: "Prescribers · FirstDose" };

export default function PrescribersPage() {
  return <PrescribersScreen />;
}
