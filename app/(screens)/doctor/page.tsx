import type { Metadata } from "next";

import { DoctorScreen } from "./_components/DoctorScreen";

export const metadata: Metadata = { title: "Doctor · FirstDose" };

export default function DoctorPage() {
  return <DoctorScreen />;
}
