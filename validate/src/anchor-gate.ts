import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type Ajv from "ajv/dist/2020.js";

const ARCHETYPE_SCHEMA_FILES: Record<string, string> = {
  causal: "causal.schema.json"
};

export async function checkAnchors(
  schemasDir: string,
  ajv: Ajv,
  item: { archetype?: string[] }
): Promise<{ archetype: string; message: string }[]> {
  const failures: { archetype: string; message: string }[] = [];
  const archetypes = item.archetype ?? [];
  for (const arch of archetypes) {
    const schemaFile = ARCHETYPE_SCHEMA_FILES[arch];
    if (!schemaFile) continue; // unknown archetypes silently pass in v0.1 RFC; warnings surface in Plan 06
    const schemaPath = join(schemasDir, "archetypes", schemaFile);
    const schema = JSON.parse(await readFile(schemaPath, "utf8"));
    const validate = ajv.compile(schema);
    if (!validate(item)) {
      failures.push({
        archetype: arch,
        message: `missing anchor field for ${arch} archetype (need ≥1 of declared anchors)`
      });
    }
  }
  return failures;
}
