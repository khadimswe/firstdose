"use client";

import { useEvents } from "@/components/data/useEvents";

import { AccessView } from "./AccessView";

export function AccessScreen() {
  const { access, catalog, accessSource, accessError } = useEvents();
  return <AccessView summary={access} reasons={catalog.reasons} source={accessSource} error={accessError} />;
}
