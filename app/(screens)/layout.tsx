import { ScreenNavigation } from "@/components/ScreenNavigation";
import { ErrorBanner } from "@/components/ErrorBanner";

export default function ScreensLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScreenNavigation />
      {children}
      <ErrorBanner />
    </>
  );
}
