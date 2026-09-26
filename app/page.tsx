import Link from "next/link";

import { DATA_MODE } from "@/components/data/mode";

const SCREENS = [
  { href: "/sim", who: "Operator", what: "Fire pharmacy and hub events by hand" },
  { href: "/doctor", who: "Doctor (iPad)", what: "Prescribe, label card, alert, send to coordinator" },
  { href: "/coordinator", who: "Access coordinator (phone)", what: "Queue, reason, the one fix" },
  { href: "/patient/rx_001", who: "Maria (phone, via QR)", what: "Wallet copay card stand-in, use at pharmacy" },
  { href: "/patient/rx_002", who: "James (phone)", what: "Status" },
  { href: "/board", who: "Big screen", what: "Relay Board and price counter" },
  { href: "/access", who: "Market Access", what: "Patients recovered, time to first fill, reasons" },
  { href: "/qr", who: "Table card (print)", what: "Big QR to /patient/rx_001 on this deployment" },
] as const;

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">FirstDose</h1>
        <p className="text-sm text-muted-foreground">
          Data source: <span className="font-mono">{DATA_MODE}</span>
        </p>
      </header>
      <ul className="divide-y rounded-lg border">
        {SCREENS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="block p-4 hover:bg-muted">
              <div className="font-mono text-sm">{s.href}</div>
              <div className="text-sm">
                {s.who} · <span className="text-muted-foreground">{s.what}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
