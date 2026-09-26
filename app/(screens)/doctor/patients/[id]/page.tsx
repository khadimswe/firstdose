import { notFound } from "next/navigation";

import { CATALOG } from "@/components/data/catalog";

import { PatientDetails } from "../../_components/PatientDetails";

// Only the demo patients exist; any other id is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return CATALOG.patients.map((p) => ({ id: p.id }));
}

export default async function PatientDetailsPage({ params }: PageProps<"/doctor/patients/[id]">) {
  const { id } = await params;
  if (!CATALOG.patients.some((p) => p.id === id)) notFound();
  return <PatientDetails patientId={id} />;
}
