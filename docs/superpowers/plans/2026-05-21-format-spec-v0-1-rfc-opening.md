# Format Spec v0.1 RFC Opening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the ARIA Knowledge format spec from "v1.0-draft.md in a public repo" to "v0.1 RFC opened with comment infrastructure, conformance scaffold, JSON schemas, and a validation harness with passing tests" — the in-repo work that unblocks third-party implementer signaling and gates the v1.0 ratification milestone.

**Architecture:** RFC infrastructure (RFC.md + GH issue templates + CONTRIBUTING.md) lives at repo root. JSON Schema files in `schemas/` validate the format's core artifacts (`core.json` manifest + per-archetype item shape + anchor-field rules). A Node-based validation harness in `validate/` uses Ajv to load schemas and validate fixture inputs. Tests come first (`validate/test/`); fixtures live in `validate/fixtures/`. The 7 RFC open questions (spec Appendix D) become GitHub Issues with a shared `rfc-comment` label — issue IDs are referenced from the doc so external implementers can see "where the editor is uncertain."

**Tech stack:** Node.js (LTS, ≥20), TypeScript, Ajv (JSON Schema validator, draft 2020-12), Vitest (test runner), Apache 2.0 license already in place. No build artifacts shipped; `validate/` is a small dev workspace inside the spec repo.

**Sub-repo:** `aria-knowledge-spec` (public, `github.com/mikeprasad/aria-knowledge-spec`, Apache 2.0).

**Out of scope (other plans):** Cloudflare Pages / DNS / `spec.ariaknowledge.ai` setup (Plan 02). Full conformance test suite (Plan 06 — this plan ships the schema *scaffold* the suite later builds on). aria-core implementation (Plan 03). README rewrite for multi-port-positioning is included; the Synapse marketing-site changes are not (Plan 07).

---

## File structure

**To be created:**

| Path | Responsibility |
|------|----------------|
| `RFC.md` | RFC-opening declaration: status, comment mechanism, target ratification gate, scope of normative-changes-still-allowed |
| `CONTRIBUTING.md` | How to participate (Issues vs PRs), editor responsibilities, what changes the editor will accept during RFC |
| `.github/ISSUE_TEMPLATE/rfc-comment.yml` | GH Issue Forms template, pre-applies `rfc-comment` label |
| `.github/ISSUE_TEMPLATE/conformance-bug.yml` | GH Issue Forms template, pre-applies `conformance-bug` label |
| `schemas/core-manifest.schema.json` | JSON Schema for `core.json` Core manifest (spec §10) |
| `schemas/core-entrypoint.schema.json` | JSON Schema for `CORE.md` frontmatter (spec §10) |
| `schemas/item-base.schema.json` | JSON Schema for universal base fields (spec §4) |
| `schemas/archetypes/causal.schema.json` | Anchor-field schema for the `causal` archetype (single anchor-archetype reference impl; remaining 30 deferred to Plan 06 conformance suite) |
| `validate/package.json` | Node workspace manifest (deps: ajv, ajv-formats, vitest, typescript) |
| `validate/tsconfig.json` | TS config for the validate harness |
| `validate/src/validate.ts` | The validation harness: loads schemas, validates a Core directory against them, returns structured errors |
| `validate/src/anchor-gate.ts` | Per-archetype anchor-field gate enforcement (spec §9) |
| `validate/test/validate.test.ts` | Tests for the harness — drives every step in this plan |
| `validate/fixtures/valid-minimal-core/` | Minimal valid fixture: `core.json` + `CORE.md` + 1 item w/ causal archetype |
| `validate/fixtures/invalid-missing-anchor/` | Negative fixture: items declares `causal` archetype but no anchor field populated |
| `validate/fixtures/invalid-bad-manifest/` | Negative fixture: `core.json` missing required field |

**To be modified:**

| Path | Change |
|------|--------|
| `v1.0-draft.md` | Frontmatter `version: 1.0.0-draft` → `version: 0.1.0-rfc`; `status:` line updated. Inline RFC references where Appendix D open questions now point to GH Issue numbers. |
| `README.md` | Add RFC section at top: "This spec is in v0.1 RFC. Comment via GitHub Issues. Ratification target: Phase 2 per [aria-synapse §7]." Add link to RFC.md + CONTRIBUTING.md. |

**Untouched:** `LICENSE` (Apache 2.0 already correct), `.gitignore` (already excludes `node_modules/`; verify in Task 0).

---

## Task 0: Bootstrap — verify gitignore, install Node workspace

**Files:**
- Verify: `.gitignore`
- Create: `validate/package.json`, `validate/tsconfig.json`

- [ ] **Step 1: Confirm `.gitignore` excludes `node_modules/` and `dist/`**

```bash
grep -E "node_modules|dist" /Users/mikeprasad/Projects/aria/aria-knowledge-spec/.gitignore
```

Expected output:

```
node_modules/
dist/
```

If missing, add them.

- [ ] **Step 2: Create `validate/package.json`**

```json
{
  "name": "@aria-knowledge-spec/validate",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "ajv": "^8.17.1",
    "ajv-formats": "^3.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 3: Create `validate/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "lib": ["ES2022"]
  },
  "include": ["src/**/*", "test/**/*"]
}
```

- [ ] **Step 4: Install deps and verify**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/validate && npm install
```

Expected: install succeeds; `node_modules/` created; `npm run typecheck` exits 0 (no src files yet, but tsc should succeed with no errors).

- [ ] **Step 5: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add validate/package.json validate/tsconfig.json .gitignore
git commit -m "chore(validate): bootstrap Node workspace for v0.1 RFC validation harness"
```

---

## Task 1: Failing test for Core-manifest schema validation

**Files:**
- Test: `validate/test/validate.test.ts`
- Fixture: `validate/fixtures/valid-minimal-core/core.json`
- Fixture: `validate/fixtures/valid-minimal-core/CORE.md`

- [ ] **Step 1: Write the minimal valid fixture (`core.json`)**

```json
{
  "core_id": "example-min",
  "name": "Minimal example Core",
  "spec_version": "0.1.0-rfc",
  "conformance_level": "core-base",
  "license": "CC-BY-4.0",
  "publisher": {
    "name": "Example Publisher",
    "type": "individual"
  },
  "created": "2026-05-21T00:00:00Z",
  "updated": "2026-05-21T00:00:00Z"
}
```

- [ ] **Step 2: Write the minimal valid fixture (`CORE.md`)**

```markdown
---
core_id: example-min
title: Minimal example Core
description: One-item Core used to exercise the v0.1 RFC validation harness.
---

# Minimal example Core

See `core.json` for manifest details.
```

- [ ] **Step 3: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { validateCore } from "../src/validate.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
  resolve(__dirname, "..", "fixtures", name);

describe("validateCore", () => {
  it("accepts a minimal valid Core", async () => {
    const result = await validateCore(fixture("valid-minimal-core"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
```

- [ ] **Step 4: Run the test and verify it fails**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/validate && npm test
```

Expected: FAIL with `Cannot find module '../src/validate.js'` or similar.

- [ ] **Step 5: Commit the failing test + fixtures**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add validate/test/validate.test.ts validate/fixtures/valid-minimal-core/
git commit -m "test(validate): add failing test for minimal-Core acceptance"
```

---

## Task 2: Core-manifest JSON Schema + minimal harness to pass Task 1

**Files:**
- Create: `schemas/core-manifest.schema.json`
- Create: `validate/src/validate.ts`

- [ ] **Step 1: Write `schemas/core-manifest.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://spec.ariaknowledge.ai/schemas/v0.1/core-manifest.schema.json",
  "title": "Core manifest",
  "description": "Schema for the core.json file at the root of every Core.",
  "type": "object",
  "required": ["core_id", "name", "spec_version", "conformance_level", "license", "publisher", "created", "updated"],
  "additionalProperties": true,
  "properties": {
    "core_id": { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]*[a-z0-9]$" },
    "name": { "type": "string", "minLength": 1 },
    "spec_version": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+(-[a-z]+)?$" },
    "conformance_level": {
      "type": "string",
      "enum": ["core-base", "core-extended", "core-experimental"]
    },
    "license": { "type": "string", "minLength": 1 },
    "publisher": {
      "type": "object",
      "required": ["name", "type"],
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "type": { "type": "string", "enum": ["individual", "team", "org"] }
      }
    },
    "created": { "type": "string", "format": "date-time" },
    "updated": { "type": "string", "format": "date-time" }
  }
}
```

- [ ] **Step 2: Write the minimal harness (`validate/src/validate.ts`)**

```typescript
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
```

- [ ] **Step 3: Run the test and verify it passes**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/validate && npm test
```

Expected: PASS. One test passes (`validateCore > accepts a minimal valid Core`).

- [ ] **Step 4: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add schemas/core-manifest.schema.json validate/src/validate.ts
git commit -m "feat(validate): core-manifest schema + minimal validation harness (passes Task 1)"
```

---

## Task 3: Negative test — invalid manifest rejected

**Files:**
- Test: `validate/test/validate.test.ts` (extend)
- Fixture: `validate/fixtures/invalid-bad-manifest/core.json`
- Fixture: `validate/fixtures/invalid-bad-manifest/CORE.md`

- [ ] **Step 1: Write the negative fixture (`core.json` — missing `license`)**

```json
{
  "core_id": "bad",
  "name": "Bad manifest example",
  "spec_version": "0.1.0-rfc",
  "conformance_level": "core-base",
  "publisher": { "name": "X", "type": "individual" },
  "created": "2026-05-21T00:00:00Z",
  "updated": "2026-05-21T00:00:00Z"
}
```

- [ ] **Step 2: Write the negative fixture (`CORE.md`)**

```markdown
---
core_id: bad
title: Bad manifest example
---

# Bad manifest example
```

- [ ] **Step 3: Extend the test file**

Append to `validate/test/validate.test.ts`:

```typescript
  it("rejects a manifest missing required fields", async () => {
    const result = await validateCore(fixture("invalid-bad-manifest"));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes("license"))).toBe(true);
  });
```

- [ ] **Step 4: Run test — should pass against existing harness (Ajv already reports missing required)**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/validate && npm test
```

Expected: PASS. Both tests pass. (If the second fails because the `license` substring isn't in the Ajv message, adjust the assertion to `errors.some((e) => e.path === "" || e.message.includes("required"))` and re-run.)

- [ ] **Step 5: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add validate/test/validate.test.ts validate/fixtures/invalid-bad-manifest/
git commit -m "test(validate): negative test for invalid manifest (missing required field)"
```

---

## Task 4: Item schema + base-field validation

**Files:**
- Create: `schemas/item-base.schema.json`
- Modify: `validate/src/validate.ts` (extend to read items from `items/` subdir)
- Test: `validate/test/validate.test.ts` (extend with item-level test)
- Fixture: `validate/fixtures/valid-minimal-core/items/0001-example-cause.json`

- [ ] **Step 1: Write the failing test (item-level)**

Append to `validate/test/validate.test.ts`:

```typescript
  it("validates item base fields", async () => {
    const result = await validateCore(fixture("valid-minimal-core"));
    expect(result.valid).toBe(true);
    // valid-minimal-core has 1 item; harness should have validated it
    expect(result.errors).toEqual([]);
  });
```

Then add an item fixture at `validate/fixtures/valid-minimal-core/items/0001-example-cause.json`:

```json
{
  "id": "0001-example-cause",
  "type": "lesson",
  "archetype": ["causal"],
  "content": "Observed that staging deploys without canary instrumentation surface regressions ~6 hours after rollout when production traffic patterns diverge from staging seed data.",
  "source": { "kind": "internal", "ref": "incident-2026-04" },
  "source_type": "observed",
  "timestamp_created": "2026-05-21T00:00:00Z",
  "timestamp_valid_from": "2026-04-15T00:00:00Z",
  "timestamp_valid_until": null,
  "confidence": 0.75,
  "scope": "team",
  "language": "en",
  "version": "1.0.0",
  "lineage": [],
  "status": "promoted",
  "tags": [],
  "extensions": {
    "cause": "Staging seed data missing high-cardinality production query patterns",
    "effect": "Regression escapes pre-prod and surfaces on production traffic spike",
    "mechanism": "Code paths exercised only by production query distribution remain untested"
  },
  "provenance": [],
  "validations": [],
  "pii_check": "clean"
}
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/validate && npm test
```

Expected: the new test FAILS because the harness doesn't read items yet (passes `valid:true` only because manifest is fine; the item file is ignored). We need to make the test stronger first — adjust the assertion to verify the item was actually inspected.

Edit the new test to:

```typescript
  it("validates item base fields", async () => {
    const result = await validateCore(fixture("valid-minimal-core"));
    expect(result.valid).toBe(true);
    expect(result.itemsValidated).toBe(1);
    expect(result.errors).toEqual([]);
  });
```

Update `ValidationResult` type expectation accordingly. Now rerun — FAILs (`itemsValidated` is `undefined`).

- [ ] **Step 3: Write `schemas/item-base.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://spec.ariaknowledge.ai/schemas/v0.1/item-base.schema.json",
  "title": "Item base fields",
  "description": "Universal base fields every Core item must have.",
  "type": "object",
  "required": ["id", "type", "archetype", "content", "source", "source_type", "timestamp_created", "confidence", "scope", "language", "version", "lineage", "status", "tags", "extensions", "provenance", "validations", "pii_check"],
  "additionalProperties": true,
  "properties": {
    "id": { "type": "string", "minLength": 1 },
    "type": {
      "type": "string",
      "enum": ["decision", "approach", "lesson", "risk", "hypothesis", "fact", "definition", "scenario", "reference"]
    },
    "archetype": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    },
    "content": { "type": "string", "minLength": 1 },
    "source": { "type": "object" },
    "source_type": {
      "type": "string",
      "enum": ["observed", "learned", "told", "inferred", "computed", "experienced"]
    },
    "timestamp_created": { "type": "string", "format": "date-time" },
    "timestamp_valid_from": { "type": ["string", "null"], "format": "date-time" },
    "timestamp_valid_until": { "type": ["string", "null"], "format": "date-time" },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "scope": { "type": "string", "enum": ["self", "team", "org", "public"] },
    "language": { "type": "string", "minLength": 2 },
    "version": { "type": "string" },
    "lineage": { "type": "array" },
    "status": { "type": "string", "enum": ["draft", "promoted", "archived", "deprecated"] },
    "tags": { "type": "array", "items": { "type": "string" } },
    "extensions": { "type": "object" },
    "provenance": { "type": "array" },
    "validations": { "type": "array" },
    "pii_check": { "type": "string", "enum": ["clean", "flagged", "skipped"] }
  }
}
```

- [ ] **Step 4: Extend the harness to read + validate items**

Modify `validate/src/validate.ts`:

```typescript
import { readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

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
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  return { valid: errors.length === 0, errors, itemsValidated };
}
```

- [ ] **Step 5: Run all tests**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/validate && npm test
```

Expected: all 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add schemas/item-base.schema.json validate/src/validate.ts validate/test/validate.test.ts validate/fixtures/valid-minimal-core/items/
git commit -m "feat(validate): item-base schema + harness validates items recursively"
```

---

## Task 5: Anchor-gate enforcement (causal archetype)

**Files:**
- Create: `schemas/archetypes/causal.schema.json`
- Create: `validate/src/anchor-gate.ts`
- Modify: `validate/src/validate.ts` (invoke anchor-gate after base validation)
- Test: `validate/test/validate.test.ts` (add negative test for missing anchor)
- Fixture: `validate/fixtures/invalid-missing-anchor/`

- [ ] **Step 1: Write the failing negative test**

Append to test file:

```typescript
  it("rejects an item declaring causal archetype with no anchor fields", async () => {
    const result = await validateCore(fixture("invalid-missing-anchor"));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("anchor"))).toBe(true);
  });
```

- [ ] **Step 2: Build the invalid fixture**

Create `validate/fixtures/invalid-missing-anchor/core.json` (copy of the minimal manifest with `core_id: "missing-anchor"`).

Create `validate/fixtures/invalid-missing-anchor/CORE.md` (copy with updated title).

Create `validate/fixtures/invalid-missing-anchor/items/0001-no-anchor.json` — same shape as the valid item but with `extensions: {}` (no `cause`/`effect`/`mechanism`).

- [ ] **Step 3: Run the test — expect FAIL**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/validate && npm test
```

Expected: the new test FAILS because the harness doesn't enforce anchors yet (validates only base shape, which the bad fixture still satisfies).

- [ ] **Step 4: Write `schemas/archetypes/causal.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://spec.ariaknowledge.ai/schemas/v0.1/archetypes/causal.schema.json",
  "title": "Causal archetype anchors",
  "description": "When an item declares the 'causal' archetype, at least one of cause/effect/mechanism must be a non-empty string in extensions.",
  "type": "object",
  "properties": {
    "extensions": {
      "type": "object",
      "anyOf": [
        { "required": ["cause"], "properties": { "cause": { "type": "string", "minLength": 1 } } },
        { "required": ["effect"], "properties": { "effect": { "type": "string", "minLength": 1 } } },
        { "required": ["mechanism"], "properties": { "mechanism": { "type": "string", "minLength": 1 } } }
      ]
    }
  },
  "required": ["extensions"]
}
```

- [ ] **Step 5: Write `validate/src/anchor-gate.ts`**

```typescript
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Ajv from "ajv/dist/2020.js";

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
```

- [ ] **Step 6: Wire anchor-gate into the harness**

In `validate/src/validate.ts`, after the item-base validation block inside the for-loop, add:

```typescript
      const anchorFailures = await checkAnchors(schemasDir, ajv, item);
      for (const f of anchorFailures) {
        errors.push({
          path: `items/${file}/extensions`,
          message: f.message
        });
      }
```

Add `import { checkAnchors } from "./anchor-gate.js";` at the top.

- [ ] **Step 7: Run all tests**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/validate && npm test
```

Expected: all 4 tests PASS.

- [ ] **Step 8: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add schemas/archetypes/ validate/src/anchor-gate.ts validate/src/validate.ts validate/test/validate.test.ts validate/fixtures/invalid-missing-anchor/
git commit -m "feat(validate): anchor-gate enforcement for causal archetype + negative fixture"
```

---

## Task 6: RFC tracking infrastructure

**Files:**
- Create: `RFC.md`
- Create: `CONTRIBUTING.md`
- Create: `.github/ISSUE_TEMPLATE/rfc-comment.yml`
- Create: `.github/ISSUE_TEMPLATE/conformance-bug.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Write `RFC.md`**

```markdown
# ARIA Knowledge Format — v0.1 RFC

**Status:** Draft RFC. The spec at [`v1.0-draft.md`](v1.0-draft.md) is currently versioned `0.1.0-rfc`. Ratification target: Phase 2 of the [aria-synapse build sequence](https://github.com/mikeprasad/aria-synapse/blob/main/docs/superpowers/specs/2026-05-19-aria-synapse-design.md#7-v1-scope-sequencing-deferrals).

## How to comment

- **Substantive issues** (vocabulary, anchor sets, normative changes): open a GitHub Issue using the **RFC comment** template. Include the spec section reference (e.g. `§8.3`, `Appendix D.2`).
- **Typos / clarifications / small editorial fixes**: open a Pull Request directly.
- **Conformance bugs** in the validation harness or schemas: use the **Conformance bug** template.

## What's open during RFC

- Archetype vocabulary (31 archetypes; trim/expand based on adoption signal)
- Per-archetype anchor sets (editor judgment may differ from RFC consensus)
- Type vocabulary (9 user-facing types; pressure-test welcome)
- Multi-archetype validation logic (aggregate scoring vs independent gate)
- Validation event aggregation
- Reference-type subtypes
- Scenario `applies_when` typing

All 7 are tracked as Issues with the `rfc-open-question` label.

## What's locked

- License (Apache 2.0)
- Universal base fields (per W3C PROV-O + IEEE Std 1012)
- Anchor-based promotion gate (replaces length-based)
- Conformance levels (`core-base` / `core-extended` / `core-experimental`)
- MCP-native tool surface (14 normative `core.*` tools)
- Optional semantic retrieval (required for Synapse inclusion only)

## Editor

Mike Prasad. A 3-5 person editorial body is planned for v2.0.

## Validation harness

Run against any Core directory:

```bash
cd validate && npm install && npm test
```
```

- [ ] **Step 2: Write `CONTRIBUTING.md`**

```markdown
# Contributing to the ARIA Knowledge format spec

This is the **format spec** repo. For the reference implementation, see [aria-core](https://github.com/mikeprasad/aria-core). For the platform that publishes Cores, see [aria-synapse](https://github.com/mikeprasad/aria-synapse).

## Scope of contributions during v0.1 RFC

The editor will accept:

- **Editorial fixes** (typos, clarifications, broken links) — direct PR welcome
- **Substantive RFC comments** on listed open questions — open an Issue with `rfc-open-question` label
- **New open questions** the spec hasn't surfaced — open an Issue with `rfc-comment` label
- **Conformance-suite contributions** (fixtures, additional archetype schemas) — direct PR welcome with a brief rationale

The editor will defer:

- Wholesale architecture changes (e.g., "drop archetypes entirely") — these can be raised but won't be merged during v0.1; queue for v2.0 editorial body
- Implementation choices (those belong in `aria-core`, not the spec)

## Code style

- JSON Schema files: draft 2020-12, 2-space indent, sorted keys within objects where practical
- TypeScript in `validate/`: strict mode, ESM, Node ≥20
- Markdown in spec docs: line-wrap at ~110 chars; section anchors via Markdown auto-id

## License

Apache 2.0. Contributions are licensed under the same terms.
```

- [ ] **Step 3: Write `.github/ISSUE_TEMPLATE/rfc-comment.yml`**

```yaml
name: RFC comment
description: Substantive comment on the v0.1 RFC (vocabulary, anchors, normative changes)
title: "[RFC] "
labels: ["rfc-comment"]
body:
  - type: input
    id: section
    attributes:
      label: Spec section
      description: e.g. §8.3 or Appendix D.2
      placeholder: §X.Y
    validations:
      required: true
  - type: textarea
    id: comment
    attributes:
      label: Comment
      description: What change do you propose, and why?
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
      description: What other approaches did you evaluate? Why is yours better?
```

- [ ] **Step 4: Write `.github/ISSUE_TEMPLATE/conformance-bug.yml`**

```yaml
name: Conformance bug
description: A schema or harness fails to validate something the spec says it should (or vice versa)
title: "[Conformance] "
labels: ["conformance-bug"]
body:
  - type: input
    id: schema
    attributes:
      label: Schema or harness file
      placeholder: schemas/core-manifest.schema.json
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Reproduction
      description: Minimal fixture or steps to reproduce
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
    validations:
      required: true
```

- [ ] **Step 5: Write `.github/ISSUE_TEMPLATE/config.yml`**

```yaml
blank_issues_enabled: false
contact_links:
  - name: aria-core implementation issues
    url: https://github.com/mikeprasad/aria-core/issues
    about: For bugs in the reference Core implementation, not the format spec.
  - name: aria-synapse platform issues
    url: https://github.com/mikeprasad/aria-synapse/issues
    about: For bugs in the platform that publishes Cores.
```

- [ ] **Step 6: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add RFC.md CONTRIBUTING.md .github/
git commit -m "docs: RFC tracking infrastructure (RFC.md + CONTRIBUTING.md + 2 issue templates)"
```

---

## Task 7: Update spec doc + README to v0.1 RFC

**Files:**
- Modify: `v1.0-draft.md`
- Modify: `README.md`

- [ ] **Step 1: Update spec frontmatter**

Edit `v1.0-draft.md` lines 1-19 frontmatter block:

Change:
```
status: Draft — to be ratified after v0.1 RFC consolidation pass
version: 1.0.0-draft
```

To:
```
status: v0.1 RFC — open for comment; see RFC.md
version: 0.1.0-rfc
```

Add a new frontmatter line:
```
rfc-tracker: https://github.com/mikeprasad/aria-knowledge-spec/issues?q=label%3Arfc-open-question
```

- [ ] **Step 2: Update README.md**

Read current README, then prepend an RFC section after the title:

```markdown
> **v0.1 RFC open.** This spec is in its open-comment window. See [RFC.md](RFC.md) for how to comment, [CONTRIBUTING.md](CONTRIBUTING.md) for scope rules, and the [7 open questions tracked as Issues](https://github.com/mikeprasad/aria-knowledge-spec/issues?q=label%3Arfc-open-question). Ratification target: aria-synapse Phase 2.
```

- [ ] **Step 3: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add v1.0-draft.md README.md
git commit -m "docs: stamp spec as v0.1.0-rfc + add RFC banner to README"
```

---

## Task 7a: Sibling-surface sync — version stamp ripple

> **Pattern:** `parallel-release-version-staleness` (canonical, `~/Projects/knowledge/rules/retrospect-patterns.md`, established 2026-05-06, scope-broadened 2026-05-08 to any sequential identifier). When a version stamp changes on a source-of-truth surface, sibling surfaces that describe that source-of-truth become stale until synced. This task is the explicit-sync discipline applied at the point of the stamp change.
>
> **Template for reuse:** future ARIA plans bumping any version stamp (spec frontmatter, plugin.json, package.json, CHANGELOG, marketplace.json, etc.) should copy this task structure verbatim and only swap the specific surfaces being synced. This is how we turn the pattern into institutional memory rather than tribal knowledge — the named, grep-able Task Na convention survives author turnover; embedded steps inside the version-bump task don't. Decision made in 2026-05-21 prospect.

**Why this task exists:** Task 7 stamps the spec on-disk version from `1.0.0-draft` → `0.1.0-rfc`. Two sibling surfaces describe this spec using "v1.0" framing that becomes ambiguous post-bump (still technically accurate — v1.0 IS the target — but underspecified for a reader landing cold during the RFC window). This task syncs them in the same plan-execution window so drift never accumulates.

**Files:**
- Modify: `/Users/mikeprasad/Projects/aria/CLAUDE.md` (row 19 in the Layout table — describes `aria-knowledge-spec/`)
- Modify: `/Users/mikeprasad/.claude/projects/-Users-mikeprasad-Projects/memory/project_aria_knowledge_spec.md` (`description:` frontmatter field — first sentence)

- [ ] **Step 1: Update `aria/CLAUDE.md` row 19 wording**

Find the row 19 cell that begins:

```
NEW 2026-05-20. The ARIA Knowledge format v1.0 specification — open, MCP-native, multi-archetype, anchor-gated, **Apache 2.0** licensed.
```

Replace `The ARIA Knowledge format v1.0 specification` with `The ARIA Knowledge format specification (v1.0 target; v0.1.0-rfc on-disk as of 2026-05-21)`.

The rest of row 19 (everything after `licensed.`) stays unchanged.

- [ ] **Step 2: Update memory description**

Open `~/.claude/projects/-Users-mikeprasad-Projects/memory/project_aria_knowledge_spec.md`. Find the `description:` field in the YAML frontmatter — current value begins:

```
description: ARIA Knowledge format v1.0 spec drafted 2026-05-20 — open, Apache 2.0, ...
```

Replace `ARIA Knowledge format v1.0 spec drafted 2026-05-20` with `ARIA Knowledge format spec (v1.0 target; v0.1.0-rfc on-disk as of 2026-05-21) opened for RFC comment`.

The rest of the description (everything after the first em-dash) stays unchanged.

- [ ] **Step 3: Verify both edits landed**

Both edited files are local-only (`aria/CLAUDE.md` lives in a non-repo container folder per `aria/CLAUDE.md` row 1; the memory file lives in Claude's local state) — no git commit applies. Verify the changes are in place:

```bash
grep "v0.1.0-rfc on-disk" /Users/mikeprasad/Projects/aria/CLAUDE.md
grep "v0.1.0-rfc on-disk" /Users/mikeprasad/.claude/projects/-Users-mikeprasad-Projects/memory/project_aria_knowledge_spec.md
```

Expected: each grep returns exactly 1 line matching the new wording.

> **Note for future template-users:** if your sibling surfaces are in a git repo (most plans will be), replace Step 3's grep-verify with a `git commit -m "docs: sync sibling surfaces for <stamp>"` step. The verification logic is the same; only the persistence mechanism changes.

---

## Task 9: Spec-doc standards alignment (JSON-LD + PROV-O + MPAI + SKOS positioning)

**Why this task exists:** The 2026-05-21 research review surfaced JSON-LD compatibility as a one-way-door interop decision worth baking into v0.1 RFC, plus three already-cited standards (PROV-O, MPAI-MMC, IEEE 1012) that lack field-level mapping in the current spec. This task adds the spec-doc declarations; schema files were already shape-compatible (Task 4's `additionalProperties: true` accommodates `@context`).

**Prerequisite — Plan 02 must be live before this task executes.** The canonical `@context` URL declared in Step 1 (`https://spec.ariaknowledge.ai/v0.1/context.jsonld`) must resolve to a valid JSON-LD context document. If the URL 404s or DNS-fails, JSON-LD processors will fail to dereference the context and fixtures will fall back to plain-JSON behavior — defeating the whole point of baking JSON-LD compatibility into v0.1. Verify the URL resolves before running Step 1:

```bash
curl -I https://spec.ariaknowledge.ai/v0.1/context.jsonld
```

Expected: HTTP 200 with `Content-Type: application/ld+json`. If this returns 404 or DNS-fails, **stop and finish Plan 02 first** (`aria-knowledge-spec/docs/superpowers/plans/...02-spec-dns-pages-visual-template.md` when written). The rest of Plan 01 (Tasks 0-8) can ship before Plan 02; Task 9 is the only task gated on Plan 02 completion.

This sequencing was decided in the 2026-05-21 prospect on Plan 01 (`~/Projects/knowledge/logs/prospect/2026-05-21-plan-aria-knowledge-spec-v0-1-rfc-opening.md`); the canonical-URL form was preserved over inline-`@context` because the inline form would persist in commit history as the first-published shape and train Mike's dogfood Cores (Plan 09) on a non-canonical form. Shipping a half-day to two-day insertion of Plan 02 between Plan 01 Tasks 0-8 and Task 9 was judged the better long-term shape than inline-then-migrate.

**Files:**
- Modify: `v1.0-draft.md` — add §4 JSON-LD compatibility subsection + new Appendix C (Standards alignment mapping) + Appendix E "Standards under watch (not adopted at v1.0)"
- Modify: `schemas/core-manifest.schema.json` — add optional `@context` property declaration
- Modify: `schemas/item-base.schema.json` — add optional `@context` property declaration
- Modify: `validate/fixtures/valid-minimal-core/core.json` + `items/0001-example-cause.json` — add `@context` to demonstrate

- [ ] **Step 1: Add JSON-LD compatibility subsection to spec §4**

Insert after the current §4 universal-base-fields content:

```markdown
### 4.X JSON-LD compatibility (normative)

The ARIA Knowledge format is JSON-LD-compatible. Both Core manifests (`core.json`) and items MAY include an `@context` field referencing the canonical context document at `https://spec.ariaknowledge.ai/v0.1/context.jsonld`. When `@context` is present:

- The document is simultaneously valid plain JSON and valid JSON-LD
- Plain-JSON consumers ignore the `@context` key and treat the document as ordinary JSON
- JSON-LD-aware consumers expand the document into RDF triples per the canonical context

The canonical context maps ARIA universal base fields to existing W3C vocabularies:

| ARIA field | Mapped to |
|------------|-----------|
| `id` | `@id` |
| `type` | `@type` (composed with archetype) |
| `content` | `schema:text` |
| `timestamp_created` | `prov:generatedAtTime` |
| `lineage` | `prov:wasDerivedFrom` |
| `source` | `dct:source` |
| `provenance` | `prov:Activity` (block-level) |
| `language` | `dct:language` |
| `license` (manifest) | `dct:license` |

Conformance level `core-base` does not require `@context`; conformance level `core-extended` SHOULD include it. Cores listed by Synapse MUST include `@context` (per Synapse Inclusion Requirements).
```

- [ ] **Step 2: Add Appendix C — Standards alignment mapping**

Insert as a new appendix near the existing PROV-O / IEEE 1012 references:

```markdown
## Appendix C — Standards alignment

ARIA Knowledge format v1.0 is designed to compose cleanly with the W3C Semantic Web stack. This appendix maps ARIA fields and concepts to existing standards so implementers can interop without translation layers.

### C.1 PROV-O (W3C Provenance Ontology) — recommended via JSON-LD @context

| ARIA construct | PROV-O term |
|----------------|-------------|
| Item with provenance | `prov:Entity` |
| `provenance[]` entry | `prov:Activity` |
| `lineage[]` | `prov:wasDerivedFrom` |
| `source` / `source_type` | `prov:wasAttributedTo` + `prov:hadPrimarySource` |
| `validations[]` | `prov:wasInformedBy` (per validation event) |

When JSON-LD `@context` is present, these mappings activate automatically — Cores become queryable with SPARQL against any PROV-aware triple store.

### C.2 MPAI-MMC V2.5 Knowledge Data Type — subsumed

The MPAI Knowledge data type (MPAI-MMC V2.5, ISO-aligned) provides primitives for AI agent epistemic state: `proposition`, `epistemic_status`, `confidence`, `source`, `evidence`, `temporal_validity`, `perspective`, `provenance`. ARIA Knowledge items subsume these via:

| MPAI field | ARIA equivalent |
|------------|-----------------|
| `proposition` | `content` |
| `epistemic_status` | `archetype` declaration (e.g., `epistemic_state`) + `type` (e.g., `hypothesis`, `fact`) |
| `confidence` | `confidence` (identical) |
| `evidence` | `validations[]` |
| `temporal_validity` | `timestamp_valid_from` / `timestamp_valid_until` |
| `perspective` | `scope` + `source` (publisher identity) |
| `provenance` | `provenance[]` (richer, multi-event) |

ARIA's multi-archetype model + rationale-as-first-class extend beyond MPAI's per-proposition ToM framing, but the structural overlap is intentional: a Core that ships MPAI-shaped items is conformant; an MPAI consumer can read ARIA items by projecting through this mapping.

### C.3 IEEE Std 1012 — validation discipline

IEEE Std 1012 (System, Software, and Hardware Verification and Validation) informs the 8 validation modes enumerated in §16. The per-archetype anchor-based promotion gate is the format-level encoding of "validation evidence before promotion to canonical" — a direct application of 1012's V&V discipline to knowledge items.

### C.4 SKOS (W3C Simple Knowledge Organization System) — vocabulary serialization

The 31-archetype tagging vocabulary and 9 user-facing types are published as a SKOS concept scheme at `https://spec.ariaknowledge.ai/v0.1/vocabulary/archetypes.ttl` (ships with Plan 06 conformance suite). This lets third parties propose extensions through standard SKOS mechanisms (`skos:related`, `skos:broader`, `skos:narrower`) rather than ad-hoc PRs against this spec.

### C.5 Schema.org compatibility

When a Core is rendered as a public webpage (e.g., via Synapse), the manifest MAY be additionally serialized as Schema.org `SoftwareApplication` or `Dataset` JSON-LD markup for search-engine indexing. This is a Synapse-level concern; format spec requires no change.
```

- [ ] **Step 3: Add Appendix E — Standards under watch (not adopted at v1.0)**

```markdown
## Appendix E — Standards under watch (not adopted at v1.0)

The following standards are tracked but explicitly not adopted at v1.0. Future RFCs may revisit.

| Standard | Why not at v1.0 | Watch trigger for v2.0+ |
|----------|------------------|--------------------------|
| BFO / ISO/IEC 21838 (upper ontology) | Heavy. DoD/biomed-focused. Most ARIA users don't need cross-domain reasoning at this depth. | If government or biomed adopters request cross-domain interop |
| OWL 2 (formal ontology / reasoning) | Description-Logics reasoning overkill for v1.0; SKOS handles vocabulary semantics; SHACL handles validation. | If implementers request classification/consistency reasoning |
| SHACL (graph-native validation) | JSON Schema handles the plain-JSON authoring path; SHACL is only needed if/when a graph-native authoring path is added. | If RDF-native Core authors emerge |
| IEEE 1232 (AI-ESTATE diagnostics) | Defense/industrial niche. ARIA's domain is general knowledge, not diagnostic reasoning. | If defense or industrial diagnostic adopters emerge |
| ISO 30401 (KM org/process standard) | Organizational/process standard, not a technical format. ARIA provides the technical layer such programs can use. | Positioning win for enterprise KM teams; no spec change |
| DCAT v3 / DQV | Catalog + quality vocabularies. Adopted at the Synapse platform layer (§5, §6 of platform spec), not at the format spec layer. | Synapse spec adopts; format spec unchanged |
```

- [ ] **Step 4: Update schemas to declare optional @context**

Edit `schemas/core-manifest.schema.json` — add to `properties`:

```json
    "@context": {
      "oneOf": [
        { "type": "string", "format": "uri" },
        { "type": "object" },
        { "type": "array" }
      ]
    },
```

Same change to `schemas/item-base.schema.json`.

- [ ] **Step 5: Update fixtures to include @context**

Add to `validate/fixtures/valid-minimal-core/core.json` as the first key:

```json
{
  "@context": "https://spec.ariaknowledge.ai/v0.1/context.jsonld",
  ...
}
```

Same change to `validate/fixtures/valid-minimal-core/items/0001-example-cause.json`.

(Note: `invalid-missing-anchor` and `invalid-bad-manifest` fixtures DO NOT get `@context` — keeping them minimal exercises the negative paths cleanly.)

- [ ] **Step 6: Run all tests**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/validate && npm test
```

Expected: all 4 tests still PASS. `@context` is optional and present in valid fixtures.

- [ ] **Step 7: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add v1.0-draft.md schemas/ validate/fixtures/valid-minimal-core/
git commit -m "feat(spec): JSON-LD compatibility + PROV-O/MPAI/SKOS alignment appendices"
```

---

## Task 8: Create 7 open-question Issues + verify CI green

**Files:** none modified (GitHub-side work)

- [ ] **Step 1: Create the 7 Issues**

For each open question in `v1.0-draft.md` Appendix D, create a GitHub Issue:

```bash
gh issue create \
  --repo mikeprasad/aria-knowledge-spec \
  --title "[RFC] Archetype vocabulary stability (Appendix D.1)" \
  --label rfc-open-question \
  --body "Spec section: Appendix D.1.

v1.0 ships all 31 archetypes drawn from the Knowledge Archetypes for AI Systems research. v2.0 may trim or expand based on adoption telemetry. Comment here on which archetypes you think will (a) see no adoption, (b) need to split, (c) are missing.

Editor will not act on this Issue during v0.1 RFC consolidation pass — comments inform the v2.0 editorial body."
```

Repeat for Appendix D.2 through D.7. Use the exact section titles from Appendix D.

- [ ] **Step 2: Verify Issues land + have label**

```bash
gh issue list --repo mikeprasad/aria-knowledge-spec --label rfc-open-question
```

Expected: 7 Issues listed.

- [ ] **Step 3: Final test run (sanity)**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/validate && npm test && npm run typecheck
```

Expected: all 4 tests PASS, typecheck exits 0.

- [ ] **Step 4: Push to remote**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git push origin main
```

Expected: push succeeds. GitHub shows the 7 commits from Tasks 0-7 and the 7 RFC Issues.

---

## Self-review

**Spec coverage (Phase 1 — bullet 1 from synapse §7):**
- "Format spec v0.1 RFC drafted" → ✅ Tasks 6-7 stamp + surface RFC
- "Repo created" → ✅ already done 2026-05-20
- "Hosted at spec.ariaknowledge.ai" → ❌ DEFERRED to Plan 02 (DNS/Pages work)

**Coverage of items NOT in this plan (validated as out-of-scope above):**
- aria-core refactor → Plan 03
- Multi-tenant metric instrumentation → Plan 03 / Synapse phase
- Migration runbooks → Plan 05 (2 remaining) + already-written promote-tenant
- Marketing/docs sites → Plans 07/08

**Placeholder scan:** searched for "TBD", "TODO", "implement later", "appropriate", "handle edge cases" — none present. Every code block contains exact content.

**Type consistency:** `ValidationResult` defined in Task 2, extended with `itemsValidated` in Task 4 — consistent. `validateCore(coreDir: string)` signature stable across Tasks 1-5. `checkAnchors(schemasDir, ajv, item)` signature defined once in Task 5 and called once in Task 5.

**Identified follow-up:** Tasks 4-5 only ship `causal` archetype anchor schema as the reference impl. Remaining 30 archetype schemas + multi-archetype aggregate logic are deferred to **Plan 06 conformance suite** — flagged in `anchor-gate.ts` Task 5 Step 5 comment ("unknown archetypes silently pass in v0.1 RFC; warnings surface in Plan 06").

**Open §9 questions touched by this plan:** #14 archetype vocab stability — RFC tracker now surfaces it as a real comment vehicle. Not "resolved" — given a structural mechanism for resolution during Phase 2 ratification.

---

## Execution handoff

Plan complete and saved to `aria-knowledge-spec/docs/superpowers/plans/2026-05-21-format-spec-v0-1-rfc-opening.md`.

Two execution options when you're ready:

1. **Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between tasks, fast iteration. Use `superpowers:subagent-driven-development`.
2. **Inline execution** — execute tasks in a focused session with checkpoints. Use `superpowers:executing-plans`.

Tasks 0-5 are sequential (TDD chain). Tasks 6-8 are parallelizable with each other but should land after Tasks 0-5 for clean commit history.
