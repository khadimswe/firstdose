import { existsSync } from "node:fs";
import path from "node:path";

import type { NextConfig } from "next";

// Until Vinh's lib/realtime.ts lands, point the lazy live-source import at a
// stand-in that rejects every call, so every build (mock or supabase) still
// compiles. Once lib/realtime.ts exists, this alias switches itself off.
// Types: components/data/realtime-fallback.d.ts does the same for TypeScript.
const hasRealtime = existsSync(path.join(process.cwd(), "lib/realtime.ts"));

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: hasRealtime
      ? {}
      : { "@/lib/realtime": "./components/data/realtime-missing.ts" },
  },
};

export default nextConfig;
