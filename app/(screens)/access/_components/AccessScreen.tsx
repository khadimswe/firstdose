"use client";

import { useChangedAt, useNowSeconds } from "@/components/liveHooks";
import { useEvents } from "@/components/data/useEvents";

import { AccessView } from "./AccessView";

export function AccessScreen() {
  const { access, catalog } = useEvents();
  const now = useNowSeconds();
  const changedAt = useChangedAt(JSON.stringify(access));

  return (
    <AccessView
      summary={access}
      reasons={catalog.reasons}
      updatedAgo={now && changedAt ? Math.max(0, now - changedAt) : null}
    />
  );
}
