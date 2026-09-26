export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return <div className="dark min-h-dvh bg-background text-foreground">{children}</div>;
}
