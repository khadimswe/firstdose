import { readFileSync, writeFileSync } from "node:fs";

// Generates reviewable SQL only. It does not read .env or connect to any database.
const catalog = JSON.parse(readFileSync(new URL("../mock/patients.json", import.meta.url), "utf8"));
const { labels } = JSON.parse(readFileSync(new URL("../mock/labels.json", import.meta.url), "utf8"));
const statements = ["-- Generated from mock/patients.json and mock/labels.json. Fictional records only.", "BEGIN;", "SET LOCAL standard_conforming_strings = on;"];

function upsert(table: string, rows: Record<string, unknown>[], key: string, preserveExisting = false) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  // All identifiers are repository-owned; JSON strings are escaped as SQL literals.
  for (const column of [...columns, table, key]) {
    if (!/^[a-z_]+$/.test(column)) throw new Error("Invalid catalog identifier");
  }
  const json = JSON.stringify(rows).replaceAll("'", "''");
  const updates = columns.filter((column) => column !== key).map((column) => `${column} = EXCLUDED.${column}`);
  statements.push(
    `INSERT INTO public.${table} (${columns.join(", ")})`,
    `SELECT ${columns.join(", ")} FROM jsonb_populate_recordset(NULL::public.${table}, '${json}'::jsonb)`,
    `ON CONFLICT (${key}) DO ${preserveExisting ? "NOTHING" : `UPDATE SET ${updates.join(", ")}`};`,
  );
}

upsert("patients", catalog.patients, "id");
upsert("drugs", catalog.drugs, "id");
upsert("rx_cases", catalog.cases, "id");
// A repeated seed must never overwrite Minh's subsequently verified label cache.
upsert("labels", labels, "drug_id", true);
statements.push("COMMIT;", "");
const sql = statements.join("\n");
const args = process.argv.slice(2);
if (args.length === 0) process.stdout.write(sql);
else if (args.length === 2 && args[0] === "--output" && args[1]) writeFileSync(args[1], sql, "utf8");
else throw new Error("Usage: node --import tsx scripts/seed.ts [--output path.sql]");
