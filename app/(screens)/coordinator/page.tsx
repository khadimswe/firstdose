import type { Metadata } from "next";

import { QueueScreen } from "./_components/QueueScreen";

export const metadata: Metadata = { title: "Access queue · FirstDose" };

export default function CoordinatorPage() {
  return <QueueScreen />;
}
