import { CoordinatorShell } from "./_components/CoordinatorShell";

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  return <CoordinatorShell>{children}</CoordinatorShell>;
}
