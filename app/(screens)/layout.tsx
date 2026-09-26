import { DATA_MODE } from "@/components/data/mode";

export default function ScreensLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="pointer-events-none fixed top-0 left-1/2 z-50 -translate-x-1/2 rounded-b bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
        {DATA_MODE === "mock" ? "mock data" : "live"}
      </div>
    </>
  );
}
