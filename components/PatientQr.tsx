"use client";

// QR for the judge who plays Maria. It encodes this deployment's own origin, so
// it works on any host without hard-coding a URL, and renders locally as SVG
// (no image API), so it keeps working offline.
import { QRCodeSVG } from "qrcode.react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const PATIENT_PATH = "/patient/rx_001";
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
    <figure className={cn("flex flex-col items-center gap-2", className)}>
      <div className="rounded-lg bg-white p-2">
        {url ? (
          <QRCodeSVG value={url} size={size} level="M" marginSize={0} />
        ) : (
          <div style={{ width: size, height: size }} />
        )}
      </div>
      {caption && <figcaption className="text-center">{caption}</figcaption>}
    </figure>
  );
}
