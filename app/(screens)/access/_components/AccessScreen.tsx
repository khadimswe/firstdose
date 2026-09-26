"use client";

import { useChangedAt, useNowSeconds } from "@/components/liveHooks";
import { PUBLIC_DATA } from "@/components/data/reference";
import { useEvents } from "@/components/data/useEvents";

import { AccessView } from "./AccessView";

export function AccessScreen() {
  const { access, catalog, accessSource, accessError } = useEvents();
  const now = useNowSeconds();
  const changedAt = useChangedAt(JSON.stringify(access));

  return (
    <AccessView
      summary={access}
      reasons={catalog.reasons}
      source={accessSource}
      error={accessError}
      updatedAgo={now && changedAt ? Math.max(0, now - changedAt) : null}
      market={{
        state: PUBLIC_DATA.market.state,
        prescribing: PUBLIC_DATA.market.part_d_prescribing,
        formulary: PUBLIC_DATA.market.formulary,
      }}
    />
  );
}
