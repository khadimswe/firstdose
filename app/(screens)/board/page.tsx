import type { Metadata } from "next";

import { BoardScreen } from "./_components/BoardScreen";

export const metadata: Metadata = { title: "Relay Board · FirstDose" };

export default function BoardPage() {
  return <BoardScreen />;
}
