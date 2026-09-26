// Regenerate one complete artifact directory offline; failure preserves the preceding cache.
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Label } from '@/components/data/types';
import { extractSections, SECTION_TITLES } from '@/lib/server/labels/extract';
import { labelContext } from '@/lib/server/labels/artifacts';
import { sha256Hex, type LabelProvenance } from '@/lib/server/labels/verify';
import { createVerificationReceipt } from '@/lib/server/labels/receipt';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
async function main() {
  const args = process.argv.slice(2);
  const SUPPORTED_DRUGS = ['drug_otezla', 'drug_humira'] as const;
  if (args.length !== 2 || args[0] !== '--drug' || !SUPPORTED_DRUGS.includes(args[1] as (typeof SUPPORTED_DRUGS)[number])) throw new Error('Usage: publish.ts --drug <drug_otezla|drug_humira>');
  const drugId = args[1];
  const base = resolve(root, 'data/labels');
  const dir = resolve(base, drugId);
  const [bytes, rxnormBytes, raw] = await Promise.all([
    readFile(resolve(dir, 'source.xml')), readFile(resolve(dir, 'rxnorm.json')), readFile(resolve(dir, 'provenance.json'), 'utf8'),
  ]);
  const provenance: LabelProvenance = { ...JSON.parse(raw), extraction_method: 'spl-section-text-v1', section_sha256: {} };
  // Never repair a failed original-byte hash by recording the changed bytes instead.
  if (sha256Hex(bytes) !== provenance.source_sha256) throw new Error('Original source bytes do not match recorded source hash');
  const sections: Label['sections'] = extractSections(new TextDecoder('utf-8', { fatal: true }).decode(bytes)).map(result => {
    if (result.status === 'present') return result.section;
    if (result.status === 'absent' && result.loinc === '34066-1') return { loinc: result.loinc, title: SECTION_TITLES[result.loinc], text: null };
    throw new Error(`Cannot publish missing or invalid section ${'loinc' in result ? result.loinc : ''}`);
  });
  provenance.section_sha256 = Object.fromEntries(sections.map(section => [section.loinc, section.text === null ? null : sha256Hex(new TextEncoder().encode(section.text))]));
  const label: Label = { drug_id: drugId, setid: provenance.setid, fetched_at: provenance.fetched_at, byte_exact: true, sections };
  const rxnorm = JSON.parse(rxnormBytes.toString('utf8'));
  const receipt = createVerificationReceipt(label, bytes, provenance, labelContext(drugId, rxnorm));
  const suffix = randomUUID();
  const staged = resolve(base, `.staging-${drugId}-${suffix}`);
  const backup = resolve(base, `.backup-${drugId}-${suffix}`);
  // Both recursive-cleanup targets are fixed siblings inside the known artifact directory.
  if ([staged, backup].some(path => dirname(path) !== base)) throw new Error('Invalid artifact staging path');
  let backedUp = false;
  let installed = false;
  try {
    await mkdir(staged);
    const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
    await Promise.all([
      writeFile(resolve(staged, 'source.xml'), bytes), writeFile(resolve(staged, 'rxnorm.json'), rxnormBytes),
      writeFile(resolve(staged, 'label.json'), json(label)), writeFile(resolve(staged, 'provenance.json'), json(provenance)),
      writeFile(resolve(staged, 'verification.json'), json(receipt)),
    ]);
    await rename(dir, backup); backedUp = true;
    await rename(staged, dir); installed = true;
  } catch (error) {
    if (backedUp && !installed) await rename(backup, dir);
    throw error;
  } finally {
    await rm(staged, { recursive: true, force: true });
    if (installed) await rm(backup, { recursive: true, force: true });
  }
  console.log(`Published verified full-section artifact and receipt for ${drugId}; fixture publication is separate.`);
}
main().catch(error => { console.error(`Publication failed: ${error instanceof Error ? error.message : 'invalid artifacts'}`); process.exitCode = 1; });
