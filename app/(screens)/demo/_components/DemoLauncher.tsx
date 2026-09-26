"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ChartColumn, Monitor, QrCode, SlidersHorizontal, Smartphone, Tv, Watch } from "lucide-react";

import { PatientQr } from "@/components/PatientQr";
import { ModeBadge } from "@/components/ModeBadge";
import { SideBadge } from "@/components/SideBadge";
import { CATALOG, QR_CASE_ID } from "@/components/data/catalog";
import { WristMirror } from "@/components/WristMirror";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/components/data/useEvents";
import type { Side } from "@/components/data/types";

type Device = {
  icon: typeof Monitor;
  device: string;
  who: string;
  href: string | null;
  how: string;
  side: Side | null;
  qr?: boolean;
};

// The patient the QR opens, from the data.
const QR_PATIENT =
  CATALOG.patients.find((p) => p.id === CATALOG.cases.find((c) => c.id === QR_CASE_ID)?.patient_id)?.display_short ??
  "Patient";

const DEVICES: Device[] = [
  {
    icon: Monitor,
    device: "Laptop or big screen",
    who: "Access coordinator",
    href: "/coordinator",
    how: "The product's home. Start the demo here.",
    side: "practice",
  },
  {
    icon: Smartphone,
    device: "iPhone",
    who: "Doctor · DocUpdate view",
    href: "/doctor",
    how: "Open in Safari, then Share → Add to Home Screen so it runs full screen.",
    side: "practice",
  },
  {
    icon: Watch,
    device: "Apple Watch",
    who: "Doctor's wrist",
    href: null,
    how: "Paired to the doctor's iPhone with the ntfy app subscribed. It buzzes only while the phone is locked, so set the phone down after Sign and send.",
    side: "practice",
  },
  {
    icon: QrCode,
    device: "Judge's own phone",
    who: `${QR_PATIENT} (patient)`,
    href: `/patient/${QR_CASE_ID}`,
    how: `Anyone at the table scans this QR (or the printed card at /qr) and opens ${QR_PATIENT}'s card. A phone with no session signs in first.`,
    side: "practice",
    qr: true,
  },
  {
    icon: SlidersHorizontal,
    device: "Operator laptop",
    who: "Simulated pharmacy and hub",
    href: "/sim",
    how: "Fires the pharmacy and hub events. Reset lives here.",
    side: null,
  },
  {
    icon: ChartColumn,
    device: "Slide or laptop",
    who: "Market Access (pharma)",
    href: "/access",
    how: "Counts only, on the other side of the privacy line.",
    side: "ascend",
  },
  {
    icon: Tv,
    device: "Second monitor (optional)",
    who: "Audience",
    href: "/board",
    how: "Each prescription's route, the price drop and the chime.",
    side: null,
  },
];

const noop = () => () => {};

/** Team setup page: which screen goes on which device. Operator tool, not a product screen. */
export function DemoLauncher() {
  const { mode, fired } = useEvents();
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const wrist = fired.findLast((e) => e.wrist !== null)?.wrist ?? null;

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-5xl space-y-8 p-6 md:p-10">
      <ModeBadge />
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">FirstDose demo setup</h1>
        <p className="text-muted-foreground">
          One laptop, one iPhone, one Apple Watch. Data:{" "}
          <span className="font-mono">{mode === "mock" ? "offline (this browser only)" : "live"}</span>
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_220px]">
        <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
          {DEVICES.map((d) => {
            const Icon = d.icon;
            return (
              <li key={d.device} className="flex min-w-0 flex-col gap-3 rounded-xl border p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{d.who}</div>
                    <div className="text-sm text-muted-foreground">{d.device}</div>
                  </div>
                  {d.side && <SideBadge side={d.side} />}
                </div>
                <p className="text-sm">{d.how}</p>
                {d.qr && (
                  <div className="flex flex-wrap items-center gap-3">
                    <PatientQr size={112} />
                    <Button asChild size="sm" variant="outline">
                      <Link href="/qr">Printable card</Link>
                    </Button>
                  </div>
                )}
                {d.href && (
                  <div className="mt-auto flex min-w-0 items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                      {origin}
                      {d.href}
                    </span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={d.href}>Open</Link>
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <aside className="space-y-3">
          <WristMirror text={wrist} />
          <p className="text-center text-xs text-muted-foreground">
            The last watch message, from the templates. Receipt on the real watch is checked by hand.
          </p>
        </aside>
      </div>
    </main>
  );
}
