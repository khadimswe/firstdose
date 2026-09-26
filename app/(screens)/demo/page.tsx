import type { Metadata } from "next";

import { DemoLauncher } from "./_components/DemoLauncher";

export const metadata: Metadata = { title: "Demo setup · FirstDose" };

export default function DemoPage() {
  return <DemoLauncher />;
}
