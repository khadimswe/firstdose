"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, UsersRound } from "lucide-react";

import { SideBadge } from "@/components/SideBadge";
import { StandIn } from "@/components/StandIn";
import { prescribers, queueBucket } from "@/components/data/derive";
import { inQueue } from "@/components/data/links";
import { useCoordinatorLinks } from "@/components/data/useCoordinatorLinks";
import { useEvents } from "@/components/data/useEvents";
import { cn } from "@/lib/utils";

/** The coordinator's desktop app: a work-queue shell with Queue and Prescribers. Practice side. */
export function CoordinatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { cases } = useEvents();
  const links = useCoordinatorLinks();

  const linked = new Set(prescribers(cases).filter((p) => links.linked(p)));
  const needsYou = cases.filter(
    (c) => inQueue(c, linked) && queueBucket(c) === "needs_you",
  ).length;
  const pending = prescribers(cases).length - linked.size;

  const nav = [
    { href: "/coordinator", label: "Queue", icon: Inbox, count: needsYou, tone: "stuck" as const },
    { href: "/coordinator/prescribers", label: "Prescribers", icon: UsersRound, count: pending, tone: "muted" as const },
  ];

  return (
    <div className="flex min-h-dvh bg-muted/30">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-background md:flex">
        <div className="px-5 pt-6 pb-4">
          <div className="text-lg font-semibold tracking-tight">FirstDose</div>
          <div className="text-sm text-muted-foreground">Access coordinator</div>
        </div>
        <nav className="flex flex-col gap-1 px-3" aria-label="Coordinator">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {item.count > 0 && (
                  <span
                    className={cn(
                      "min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums",
                      item.tone === "stuck" ? "bg-stuck text-white" : "bg-muted-foreground/15 text-foreground",
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2 p-4">
          <StandIn kind="ascend_skill" className="h-auto whitespace-normal text-left" />
          <div className="flex flex-wrap gap-2">
            <SideBadge side="practice" />
            <StandIn kind="patients" className="h-auto whitespace-normal text-left" />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3 md:hidden">
          <div>
            <div className="font-semibold">FirstDose</div>
            <div className="text-xs text-muted-foreground">Access coordinator</div>
          </div>
          <nav className="flex gap-1" aria-label="Coordinator">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground",
                  pathname === item.href && "bg-muted text-foreground",
                )}
              >
                {item.label}
                {item.count > 0 && <span className="ml-1 tabular-nums">({item.count})</span>}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
