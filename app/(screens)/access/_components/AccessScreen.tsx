"use client";

import { useEvents } from "@/components/data/useEvents";

import { AccessView } from "./AccessView";

export function AccessScreen() {
  const { access, catalog } = useEvents();
  return <AccessView summary={access} reasons={catalog.reasons} />;
}
