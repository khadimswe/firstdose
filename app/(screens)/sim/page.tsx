import type { Metadata } from "next";

import { SimScreen } from "./_components/SimScreen";

export const metadata: Metadata = { title: "Sim · FirstDose" };

export default function SimPage() {
  return <SimScreen />;
}
