"use client";

import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function MessageDeliveryStatus({ ready, pending, error, refresh }: {
  ready: boolean; pending: boolean; error: string | null; refresh: () => Promise<void>;
}) {
  const pathname = usePathname();
  const description = error === "unauthorized" ? "Sign in to load messages."
    : error === "stale_run" ? "This case was reset. Reload to see the latest."
    : error === "invalid_transition" ? "This message was already sent."
    : error ? "Couldn't load the message. Try again."
    : pending ? "Sending…" : !ready ? "Loading…" : "";
  return <div className="space-y-2">
    <p role="status" aria-atomic="true" className="text-sm text-muted-foreground">{description}</p>
    {error && (error === "unauthorized"
      ? <a className="text-sm underline" href={`/api/demo-login?next=${encodeURIComponent(pathname)}`}>Sign in</a>
      : <Button variant="outline" size="sm" onClick={() => { void refresh(); }}>Try again</Button>)}
  </div>;
}
