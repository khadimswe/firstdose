import type { Metadata, Viewport } from "next";

import { PhoneShell } from "./_components/PhoneShell";

export const metadata: Metadata = {
  title: "Doctor · FirstDose in DocUpdate (concept)",
  appleWebApp: { capable: true, title: "FirstDose Rx", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#1c2150", viewportFit: "cover" };

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <PhoneShell>{children}</PhoneShell>;
}
