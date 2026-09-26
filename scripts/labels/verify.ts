// Offline verification of a committed label artifact (task 1.10 / A2).
//
// Usage: node --import tsx scripts/labels/verify.ts --drug drug_otezla
//
// No network access. Exit 0 only when the saved source bytes, provenance
// identity and generated label all verify together.

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Label } from '@/components/data/types';
import { extractSections } from '@/lib/server/labels/extract';
import { verifyLabel, type LabelProvenance } from '@/lib/server/labels/verify';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function parseArgv(): string {
  const argIndex = process.argv.indexOf('--drug');
  if (argIndex === -1 || argIndex + 1 >= process.argv.length) {
    console.error('Usage: node --import tsx scripts/labels/verify.ts --drug <drug_id>');
    process.exit(2);
  }
  return process.argv[argIndex + 1];
}

async function main(): Promise<void> {
  const drugId = parseArgv();
  const dir = resolve(ROOT, 'data/labels', drugId);

  let sourceXml: string;
  let provenanceRaw: string;
  try {
    sourceXml = await readFile(resolve(dir, 'source.xml'), 'utf8');
    provenanceRaw = await readFile(resolve(dir, 'provenance.json'), 'utf8');
  } catch {
    console.error(`No committed artifacts for ${drugId} under data/labels/${drugId}/`);
    process.exit(2);
  }

  const provenance: LabelProvenance = {
    ...(JSON.parse(provenanceRaw) as Record<string, unknown>),
    extraction_method: 'spl-section-text-v1',
    section_sha256: {},
  } as LabelProvenance;

  // Rebuild the label from the saved source, deterministically.
  const results = extractSections(sourceXml);
  const errors: string[] = [];
  const sections: Label['sections'] = [];
  for (const result of results) {
    if (result.status === 'present') sections.push(result.section);
    else if (result.status === 'absent' && result.loinc === '34066-1') {
      sections.push({ loinc: '34066-1', title: 'BOXED WARNING', text: null });
    } else if (result.status === 'absent') {
      errors.push(`mandatory section ${result.loinc} is absent from the saved source`);
    } else if (result.status === 'invalid') {
      errors.push(`section ${result.loinc} is invalid: ${result.detail}`);
    }
  }
  if (errors.length > 0) {
    console.error(`Offline verification failed for ${drugId}:`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const bytes = new TextEncoder().encode(sourceXml);
  const sourceHash = createHash('sha256').update(bytes).digest('hex');
  if (sourceHash !== provenance.source_sha256) {
    console.error(
      `Offline verification failed for ${drugId}: saved bytes hash ${sourceHash} != provenance ${provenance.source_sha256}`,
    );
    process.exit(1);
  }

  const label: Label = {
    drug_id: drugId,
    setid: provenance.setid,
    fetched_at: provenance.fetched_at,
    byte_exact: true,
    sections,
  };

  const result = verifyLabel(label, bytes, provenance);
  if (!result.ok) {
    console.error(`Offline verification failed for ${drugId}:`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Offline verification OK for ${drugId}`);
  for (const section of sections) {
    const length = section.text === null ? 'absent' : `${section.text.length} chars`;
    console.log(`- ${section.loinc} ${section.title}: ${length}`);
  }
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});