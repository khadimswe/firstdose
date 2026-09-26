import { ModeBadge } from "@/components/ModeBadge";

export default function ScreensLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ModeBadge />
    </>
  );
}
