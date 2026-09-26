import { expect, it } from "vitest";
import { createPollingEventSource } from "@/lib/realtime";
import { seedWeekEvents } from "@/lib/demo-week";

it("seeds the observed run with the existing cookie session and reloads committed history", async () => {
  const run = "63d4b651-0eb5-440d-a523-e8daf82f36ca";
  const events = seedWeekEvents("2026-09-26T16:00:00.000Z");
  let seeded = false;
  const requests: RequestInit[] = [];
  const source = createPollingEventSource({ fetch: async (url, init) => {
    if (String(url) === "/api/events") return Response.json({ run_id: run, revision: seeded ? 1 : 0, events: seeded ? events : [] });
    expect(String(url)).toBe("/api/sim/seed");
    requests.push(init!);
    seeded = true;
    return Response.json(events);
  } });
  expect(await source.load()).toEqual([]);
  await source.seedWeek();
  expect(await source.load()).toHaveLength(38);
  expect(requests).toHaveLength(1);
  expect(requests[0].method).toBe("POST");
  expect(requests[0].body).toBe("{}");
  expect(requests[0].credentials).toBe("same-origin");
  expect(new Headers(requests[0].headers).get("x-firstdose-run")).toBe(run);
});
