"use client";

import { Disclosure } from "@/components/Disclosure";
import { PatientQr, qrCaption, usePatientUrl } from "@/components/PatientQr";

/** The printed table card: one big QR to /patient/rx_001 on this deployment. */
export function QrCard() {
  const { url, local } = usePatientUrl();

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white p-8 text-black">
      {local && (
        <p className="max-w-md rounded-lg border-2 border-stuck p-3 text-center text-sm text-stuck print:hidden">
          This page is on localhost, and phones can&apos;t open localhost. Open /qr on the
          deployed site (or this laptop&apos;s network address) before printing.
        </p>
      )}
      <PatientQr size={360} />
      <h1 className="text-center text-3xl font-semibold sm:text-4xl">{qrCaption()}</h1>
      <p className="font-mono text-sm break-all text-neutral-500">{url}</p>
      <Disclosure className="text-neutral-500" />
    </main>
  );
}
