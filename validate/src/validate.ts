import { readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { checkAnchors } from "./anchor-gate.js";

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  itemsValidated: number;
}

export async function validateCore(coreDir: string): Promise<ValidationResult> {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const schemasDir = resolve(coreDir, "..", "..", "..", "schemas");
  const manifestSchema = JSON.parse(await readFile(join(schemasDir, "core-manifest.schema.json"), "utf8"));
  const itemSchema = JSON.parse(await readFile(join(schemasDir, "item-base.schema.json"), "utf8"));

  const manifest = JSON.parse(await readFile(join(coreDir, "core.json"), "utf8"));
  const validateManifest = ajv.compile(manifestSchema);
  const validateItem = ajv.compile(itemSchema);

  const errors: ValidationError[] = [];

  if (!validateManifest(manifest)) {
    for (const e of validateManifest.errors ?? []) {
      errors.push({ path: `core.json${e.instancePath}`, message: e.message ?? "invalid" });
    }
  }

  let itemsValidated = 0;
  const itemsDir = join(coreDir, "items");
  try {
    const itemFiles = await readdir(itemsDir);
    for (const file of itemFiles.filter((f) => f.endsWith(".json"))) {
      const item = JSON.parse(await readFile(join(itemsDir, file), "utf8"));
      itemsValidated++;
      if (!validateItem(item)) {
        for (const e of validateItem.errors ?? []) {
          errors.push({ path: `items/${file}${e.instancePath}`, message: e.message ?? "invalid" });
        }
      }
      const anchorFailures = await checkAnchors(schemasDir, ajv, item);
      for (const f of anchorFailures) {
        errors.push({
          path: `items/${file}/extensions`,
          message: f.message
        });
      }
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  return { valid: errors.length === 0, errors, itemsValidated };
}
