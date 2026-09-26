// Publish a generated label artifact into data/labels/<drug_id>/label.json
// (task 1.10 / A3). Reruns the offline verifier first; the JSON is generated
// deterministically from the saved source, never hand-typed.
//
// Usage: node --import tsx scripts/labels/publish.ts --drug drug_otezla

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Label } from '@/components/data/types';
import { extractSections } from '@/lib/server/labels/extract';
import { verifyLabel, type LabelProvenance } from '@/lib/server/labels/verify';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function parseArgv(): string {
  const argIndex = process.argv.indexOf('--drug');
  if (argIndex === -1 || argIndex + 1 >= process.argv.length) {
    console.error('Usage: node --import tsx scripts/labels/publish.ts --drug <drug_id>');
    process.exit(2);
  }
  return process.argv[argIndex + 1];
}

async function main(): Promise<void> {
  const drugId = parseArgv();
  const dir = resolve(ROOT, 'data/labels', drugId);

  const sourceXml = await readFile(resolve(dir, 'source.xml'), 'utf8');
  const provenanceRaw = await readFile(resolve(dir, 'provenance.json'), 'utf8');
  const provenance: LabelProvenance = {
    ...(JSON.parse(provenanceRaw) as Record<string, unknown>),
    extraction_method: 'spl-section-text-v1',
    section_sha256: {},
  } as LabelProvenance;

  const bytes = new TextEncoder().encode(sourceXml);
  const results = extractSections(sourceXml);

  const sections: Label['sections'] = [];
  const sectionHashes: Record<string, string | null> = {};
  for (const result of results) {
    if (result.status === 'present') {
      sections.push(result.section);
      sectionHashes[result.section.loinc] = createHash('sha256')
        .update(result.section.text, 'utf8')
        .digest('hex');
    } else if (result.status === 'absent' && result.loinc === '34066-1') {
      sections.push({ loinc: '34066-1', title: 'BOXED WARNING', text: null });
      sectionHashes['34066-1'] = null;
    } else if (result.status === 'absent') {
      console.error(`Mandatory section ${result.loinc} is absent; refusing to publish`);
      process.exit(1);
    } else {
      console.error(`Section ${result.loinc} is invalid: ${result.detail}; refusing to publish`);
      process.exit(1);
    }
  }

  const label: Label = {
    drug_id: drugId,
    setid: provenance.setid,
    fetched_at: provenance.fetched_at,
    byte_exact: true,
    sections,
  };

  const verification = verifyLabel(label, bytes, { ...provenance, section_sha256: sectionHashes });
  if (!verification.ok) {
    console.error('Verification failed; refusing to publish:');
    for (const error of verification.errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const target = resolve(dir, 'label.json');
  await writeFile(target, `${JSON.stringify(label, null, 2)}\n`);
  console.log(`Published ${drugId} label to data/labels/${drugId}/label.json (${sections.length} sections)`);
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});