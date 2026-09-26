"use client";

// QR for the judge who plays Maria. It encodes this deployment's own origin, so
// it works on any host without hard-coding a URL, and renders locally as SVG
// (no image API), so it keeps working offline.
import { QRCodeSVG } from "qrcode.react";
import { useSyncExternalStore } from "react";

import { fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import { CATALOG, QR_CASE_ID } from "@/components/data/catalog";
import { cn } from "@/lib/utils";

const PATIENT_PATH = `/patient/${QR_CASE_ID}`;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);

const noSubscribe = () => () => {};
const getLocation = () => window.location;
const getServerLocation = () => null;

/** The patient URL for this origin, or null during server render. */
export function usePatientUrl() {
  const loc = useSyncExternalStore(noSubscribe, getLocation, getServerLocation);
  if (!loc) return { url: null, local: false };
  return {
    url: loc.origin + PATIENT_PATH,
    local: LOCAL_HOSTS.has(loc.hostname) || loc.hostname.endsWith(".localhost"),
  };
}

export function PatientQr({
  size,
  caption,
  className,
}: {
  size: number;
  caption?: string;
  className?: string;
}) {
  const { url } = usePatientUrl();

  return (
    <figure className={cn("flex max-w-full min-w-0 flex-col items-center gap-2", className)}>
      <div className="max-w-full rounded-lg bg-white p-2" style={{ width: size + 16 }}>
        {url ? (
          <QRCodeSVG value={url} size={size} level="M" marginSize={0}
            aria-label={caption ?? qrCaption()} className="block h-auto max-w-full" />
        ) : (
          <div className="aspect-square w-full" />
        )}
      </div>
      {caption && <figcaption className="text-center">{caption}</figcaption>}
    </figure>
  );
}

/** "Scan to open Maria's card.", from the template and the QR case's patient. */
export function qrCaption(): string {
  const rx = CATALOG.cases.find((c) => c.id === QR_CASE_ID);
  const patient = CATALOG.patients.find((p) => p.id === rx?.patient_id);
  return fill(templates.qr.caption, { patient_short: patient?.display_short ?? "" });
}
