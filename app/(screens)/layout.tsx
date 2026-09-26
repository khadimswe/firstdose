import { DATA_MODE } from "@/components/data/mode";

export default function ScreensLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="pointer-events-none fixed right-2 bottom-2 z-50 rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
        {DATA_MODE === "mock" ? "mock data" : "live"}
      </div>
    </>
  );
}
