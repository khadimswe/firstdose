import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CATALOG } from "@/components/data/catalog";

import { PatientScreen } from "./_components/PatientScreen";

export const metadata: Metadata = { title: "Savings card · FirstDose" };

// Only the demo cases exist; any other id is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return CATALOG.cases.map((c) => ({ id: c.id }));
}

export default async function PatientPage({ params }: PageProps<"/patient/[id]">) {
  const { id } = await params;
  if (!CATALOG.cases.some((c) => c.id === id)) notFound();
  return <PatientScreen caseId={id} />;
}
