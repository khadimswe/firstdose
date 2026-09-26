"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, MessagesSquare, UserRound } from "lucide-react";

import { standInLabel } from "@/components/copy/standins";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/doctor", label: "Prescriber", icon: ClipboardList, match: (p: string) => p === "/doctor" || p.startsWith("/doctor/patients") || p === "/doctor/new" },
  { href: "/doctor/concierge", label: "Concierge", icon: MessagesSquare, match: (p: string) => p === "/doctor/concierge" },
  { href: "/doctor/profile", label: "Profile", icon: UserRound, match: (p: string) => p === "/doctor/profile" },
];

/**
 * The doctor's phone: FirstDose shown inside a DocUpdate-style app (PLAN D9).
 * Structure only: navy, a purple primary, white cards, a bottom tab bar.
 * No DocUpdate logo or wordmark; every screen carries the concept label.
 */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh bg-du-navy text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
        <p
          data-standin="docupdate"
          className="px-4 pt-[max(1.5rem,calc(env(safe-area-inset-top)+0.5rem))] pb-1 text-center text-[11px] text-white/55"
        >
          {standInLabel("docupdate")}
        </p>
        <main className="flex-1 px-4 pt-2 pb-44">{children}</main>
      </div>
      <nav
        aria-label="DocUpdate"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-du-navy"
      >
        <ul className="mx-auto flex w-full max-w-[430px] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center gap-1 pt-3 pb-1 text-[11px]",
                    active ? "text-white" : "text-white/50",
                  )}
                >
                  {active && <span className="absolute top-0 size-1.5 rounded-full bg-du-purple" />}
                  <Icon className="size-5" />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
