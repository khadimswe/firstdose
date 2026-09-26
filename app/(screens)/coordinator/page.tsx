import type { Metadata } from "next";

import { CoordinatorScreen } from "./_components/CoordinatorScreen";

export const metadata: Metadata = { title: "Coordinator · FirstDose" };

export default function CoordinatorPage() {
  return <CoordinatorScreen />;
}
