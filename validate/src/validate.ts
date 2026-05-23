import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export async function validateCore(coreDir: string): Promise<ValidationResult> {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const manifestSchemaPath = resolve(coreDir, "..", "..", "..", "schemas", "core-manifest.schema.json");
  const manifestSchema = JSON.parse(await readFile(manifestSchemaPath, "utf8"));

  const manifestPath = resolve(coreDir, "core.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  const validate = ajv.compile(manifestSchema);
  const ok = validate(manifest);

  if (!ok) {
    return {
      valid: false,
      errors: (validate.errors ?? []).map((e) => ({
        path: e.instancePath || "/",
        message: e.message ?? "validation failed"
      }))
    };
  }

  return { valid: true, errors: [] };
}
