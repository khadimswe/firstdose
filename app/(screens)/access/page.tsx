import type { Metadata } from "next";

import { AccessScreen } from "./_components/AccessScreen";

export const metadata: Metadata = { title: "Market Access · FirstDose" };

export default function AccessPage() {
  return <AccessScreen />;
}
