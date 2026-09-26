import { ErrorBanner } from "@/components/ErrorBanner";

export default function ScreensLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ErrorBanner />
    </>
  );
}
