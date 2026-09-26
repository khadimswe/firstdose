import type { Metadata } from "next";

import { QrCard } from "./_components/QrCard";

export const metadata: Metadata = { title: "QR · FirstDose" };

export default function QrPage() {
  return <QrCard />;
}
