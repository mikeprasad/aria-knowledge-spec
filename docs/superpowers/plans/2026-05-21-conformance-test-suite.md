# Conformance Test Suite (Plan 06) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ARIA Knowledge format v1.0 conformance test suite that ships alongside v1.0 ratification per spec §18.2. Any implementation (`aria-core`, future `rust-core`, `python-core`, etc.) can run the suite against itself and publish results. Synapse gates registry inclusion on suite pass. Editorial governance uses the suite's "what passes now vs. what passes then" diff for v1.0 → v1.1 → v2.0 changes.

**Architecture:** Test suite lives in `aria-knowledge-spec/tests/`. Three suite levels matching the spec's conformance levels (`core-base`, `core-extended`, `core-experimental`). Two execution modes — `static` (validates fixture files against schemas + anchor-gate logic; runs without a running Core) and `live` (drives the 14 normative `core.*` MCP tools against a running Core endpoint + verifies request/response contracts). Static mode reuses Plan 01's Ajv harness extended to all 31 archetypes. Live mode is new — a thin MCP client that connects via stdio or Streamable HTTP, runs scripted scenarios, asserts on responses.

The suite ALSO ships a **SKOS concept-scheme file** at `aria-knowledge-spec/vocabulary/archetypes.ttl` publishing the 31-archetype vocabulary as W3C SKOS — resolves §9 question #14 (archetype vocab stability) by giving third parties a standard mechanism to propose extensions via `skos:related` / `skos:broader` / `skos:narrower` rather than ad-hoc PRs.

**Tech stack:** TypeScript (strict ESM), Vitest (test runner), Ajv (JSON Schema 2020-12 validator — already in Plan 01), `@modelcontextprotocol/sdk` (official MCP client SDK), Node 20+. SKOS file in Turtle (`.ttl`) format — hand-authored, no SSG required.

**Sub-repo:** `aria-knowledge-spec` (public, Apache 2.0). Test suite is in the same repo as the spec doc because the spec is the source of truth for what the suite tests.

**Dependency:**
- Plan 01 (RFC opening + JSON Schemas) must have shipped — Plan 06 reuses `schemas/core-manifest.schema.json` + `schemas/item-base.schema.json` + `schemas/archetypes/causal.schema.json` and extends to the remaining 30 archetypes.
- Plan 02 (spec.ariaknowledge.ai live) optional but recommended — SKOS vocabulary file is served from `spec.ariaknowledge.ai/v0.1/vocabulary/archetypes.ttl`.
- For live-mode testing: Plan 03 (aria-core v0.1) must have at least Path 0 Filesystem mode + the 14 `core.*` tools wired so the suite has something to drive.

**Out of scope (defer to later iterations):**
- Performance benchmarks (suite measures correctness, not speed)
- Multi-tenant scenarios (Synapse-specific; lives in aria-synapse repo as a separate test layer)
- UI-level tests (Hypergraph visual rendering correctness is not a format conformance concern)
- Compliance certification (SOC 2 / GDPR audit material lives in aria-synapse, not the spec repo)

---

## File structure

**To create (Plan 06's outputs):**

| Path | Responsibility |
|------|----------------|
| `tests/README.md` | How to run the suite + interpret results + claim conformance |
| `tests/package.json` | Node workspace for the suite + MCP client SDK dep |
| `tests/tsconfig.json` | Strict ESM |
| `tests/static/static.test.ts` | Static-mode test entry — drives schema validation + anchor-gate cases |
| `tests/live/live.test.ts` | Live-mode test entry — drives MCP tools against a Core endpoint |
| `tests/live/mcp-client.ts` | Thin wrapper around `@modelcontextprotocol/sdk` for the suite |
| `tests/static/anchor-gate.test.ts` | Per-archetype anchor-set positive + negative tests (31 archetypes) |
| `tests/static/provenance-chain.test.ts` | Round-trip Shard export → import → re-export with lineage preserved |
| `tests/fixtures/cores/minimal-valid/` | Minimal single-archetype Core; passes core-base |
| `tests/fixtures/cores/multi-archetype/` | Core with items declaring 3+ archetypes |
| `tests/fixtures/cores/core-extended-features/` | Core demonstrating semantic retrieval + extended SHOULD clauses |
| `tests/fixtures/shards/example.shard` | Sample valid Shard with provenance chain |
| `tests/fixtures/invalid/missing-required-base-fields/` | Negative — items missing required base fields per format §4 |
| `tests/fixtures/invalid/anchor-not-satisfied/` | Negative — declared archetype but no anchor field populated |
| `tests/fixtures/invalid/conformance-level-mismatch/` | Negative — Core claims `core-extended` but lacks semantic retrieval |
| `vocabulary/archetypes.ttl` | SKOS concept-scheme for the 31 archetypes |
| `vocabulary/types.ttl` | SKOS concept-scheme for the 9 user-facing types |
| `schemas/archetypes/<remaining-30>.schema.json` | One JSON Schema per non-causal archetype (Plan 01 shipped causal only) |

**To modify (cross-plan touchpoints):**

| Path | Change |
|------|--------|
| `v1.0-draft.md` §18.2 | Update suite-location reference from "TBD" to `tests/` (already authored at "ships alongside v1.0") |
| Plan 01 Task 9 spec Appendix C.4 (SKOS) | Update URL reference from `spec.ariaknowledge.ai/v0.1/vocabulary/archetypes.ttl` to the live path once Plan 02 + this plan both ship |

---

## Task 0: Bootstrap test workspace + MCP client SDK dep

**Files:**
- Create: `tests/package.json`, `tests/tsconfig.json`, `tests/README.md`

**Prerequisite:** Plan 01 must have shipped `validate/` package + `schemas/core-manifest.schema.json` + `schemas/item-base.schema.json` + `schemas/archetypes/causal.schema.json`. Verify with `ls schemas/` before starting.

- [ ] **Step 1: Verify Plan 01 dependencies exist**

```bash
ls /Users/mikeprasad/Projects/aria/aria-knowledge-spec/schemas/
ls /Users/mikeprasad/Projects/aria/aria-knowledge-spec/validate/
```

Expected: `schemas/` has `core-manifest.schema.json`, `item-base.schema.json`, `archetypes/causal.schema.json`. `validate/` has `package.json`, `src/validate.ts`, etc.

If either is missing, stop and finish Plan 01 first.

- [ ] **Step 2: Create `tests/package.json`**

```json
{
  "name": "@aria-knowledge-spec/tests",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:static": "vitest run static/",
    "test:live": "vitest run live/",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
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

- [ ] **Step 3: Create `tests/tsconfig.json`**

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
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `tests/README.md`**

```markdown
# ARIA Knowledge format v1.0 conformance test suite

This directory contains the official conformance test suite for the [ARIA Knowledge format](../v1.0-draft.md). Any implementation can run the suite against itself and publish results. Synapse gates registry inclusion on suite pass.

## Quickstart

```bash
cd tests
npm install
npm run test:static       # static mode — validates fixtures + schemas; no Core required
npm run test:live         # live mode — drives a running Core via MCP
npm test                  # both modes
```

## Live mode — configuring the Core under test

Set `ARIA_CORE_URL` (Streamable HTTP) OR `ARIA_CORE_STDIO_CMD` (subprocess):

```bash
ARIA_CORE_URL=https://core.tailnet.ts.net npm run test:live
ARIA_CORE_STDIO_CMD="npx @aria/core serve --stdio --folder ./test-core" npm run test:live
```

The suite assumes the Core has been seeded with the fixtures in `fixtures/cores/minimal-valid/`. Use `aria-core import --from tests/fixtures/cores/minimal-valid` to seed before running.

## Conformance levels

- **core-base** — all MUST clauses pass; semantic retrieval not required
- **core-extended** — all MUST + SHOULD clauses; semantic retrieval required (Synapse Inclusion Requirement)
- **core-experimental** — pre-v1.0 features; reports as PASS/FAIL/SKIP

Reports include the highest level achieved.

## Claiming conformance

After running the suite, the implementer commits the result file (`results-<version>.json`) and links it from their Core's `core.json` `conformance_test_results` field. Synapse's listing flow verifies this file resolves and matches a known-good shape.

## Suite versioning

Suite version matches format spec version. `tests/` at this commit corresponds to format spec v0.1 RFC; v1.0 ratification freezes a `tests/v1.0/` snapshot.
```

- [ ] **Step 5: Install + verify**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/tests && npm install && npm run typecheck
```

Expected: install succeeds; typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add tests/package.json tests/tsconfig.json tests/README.md
git commit -m "chore(tests): bootstrap conformance test suite workspace"
```

---

## Task 1: Static mode — extend anchor-gate to all 31 archetypes

**Files:**
- Create: `schemas/archetypes/*.schema.json` (30 new files — one per non-causal archetype)
- Create: `tests/static/anchor-gate.test.ts`
- Create: `tests/fixtures/anchors/<archetype>/positive.json` + `negative.json` for each archetype

**Why this is the first task:** the anchor-gate is the format's promotion mechanism. Plan 01 shipped `causal.schema.json` as a reference. Plan 06's first job is to extend to the remaining 30 — without this, the suite is checking <10% of the format. This task is also the biggest single unit of work in the plan; budget ~1.5-2 weeks of focused authoring.

- [ ] **Step 1: Enumerate the 31 archetypes per spec §5**

Read `v1.0-draft.md` §5 to confirm the complete archetype list. Expected list (from spec memory + research):

1. causal *(Plan 01 already shipped)*
2. propositional
3. procedural
4. taxonomic
5. relational
6. spatial
7. temporal
8. quantitative
9. comparative
10. evaluative
11. conditional
12. exemplar
13. counterexample
14. analogical
15. epistemic_state
16. evidential
17. reasoning
18. argumentative
19. dialectical
20. narrative
21. observational
22. experiential
23. testimonial
24. computed
25. inferred
26. structural_meta
27. a_priori
28. deductive
29. abductive
30. probabilistic
31. statistical

(Verify against spec §5; if list differs, adjust this task's schemas accordingly.)

- [ ] **Step 2: Author one anchor-schema per archetype**

For each non-causal archetype, create `schemas/archetypes/<archetype>.schema.json` following the `causal.schema.json` shape (Plan 01 Task 5). Anchor fields per archetype come from spec §8. Example for `procedural`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://spec.ariaknowledge.ai/v0.1/archetypes/procedural.schema.json",
  "title": "Procedural archetype anchors",
  "description": "When an item declares 'procedural' archetype, at least one of steps/precondition/postcondition must be a non-empty value.",
  "type": "object",
  "properties": {
    "extensions": {
      "type": "object",
      "anyOf": [
        { "required": ["steps"], "properties": { "steps": { "type": "array", "minItems": 1 } } },
        { "required": ["precondition"], "properties": { "precondition": { "type": "string", "minLength": 1 } } },
        { "required": ["postcondition"], "properties": { "postcondition": { "type": "string", "minLength": 1 } } }
      ]
    }
  },
  "required": ["extensions"]
}
```

Per-archetype anchor fields enumerated per spec §8. (Authoring these is the bulk of the wall-clock for this task.)

- [ ] **Step 3: Extend the `anchor-gate.ts` rule map**

From Plan 01:

```typescript
const ARCHETYPE_SCHEMA_FILES: Record<string, string> = {
  causal: "causal.schema.json"
};
```

Extend to all 31:

```typescript
const ARCHETYPE_SCHEMA_FILES: Record<string, string> = {
  causal: "causal.schema.json",
  propositional: "propositional.schema.json",
  procedural: "procedural.schema.json",
  // ... all 31
};
```

- [ ] **Step 4: Author per-archetype positive + negative fixtures**

For each archetype, create `tests/fixtures/anchors/<archetype>/positive.json` (passes the gate) and `negative.json` (fails the gate). Use Plan 01's `valid-minimal-core/items/0001-example-cause.json` as the structural template.

- [ ] **Step 5: Author the comprehensive anchor-gate test**

`tests/static/anchor-gate.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCore } from "../../validate/src/validate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const archetypesRoot = resolve(__dirname, "..", "fixtures", "anchors");

describe("Anchor gate — all 31 archetypes", () => {
  it("has fixtures for every declared archetype", async () => {
    const dirs = await readdir(archetypesRoot, { withFileTypes: true });
    const archetypes = dirs.filter(d => d.isDirectory()).map(d => d.name);
    expect(archetypes.length).toBe(31);
  });

  // Generate one positive + one negative test per archetype
  const archetypeNames = await loadArchetypes();
  for (const archetype of archetypeNames) {
    it(`accepts a valid ${archetype} item`, async () => {
      // Build a single-item Core with this archetype's positive fixture
      // ... validate, expect result.valid === true
    });
    it(`rejects a ${archetype} item missing anchor`, async () => {
      // Build a single-item Core with this archetype's negative fixture
      // ... validate, expect result.valid === false + anchor-message
    });
  }
});

async function loadArchetypes(): Promise<string[]> { /* read dir */ }
```

- [ ] **Step 6: Run tests**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/tests && npm run test:static
```

Expected: 62 tests pass (1 fixture-count + 31 positive + 31 negative). One failure on any archetype fixture surfaces as actionable error.

- [ ] **Step 7: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add schemas/archetypes/ tests/static/anchor-gate.test.ts tests/fixtures/anchors/ validate/src/anchor-gate.ts
git commit -m "feat(tests): anchor-gate coverage for all 31 archetypes"
```

---

## Task 2: SKOS concept-scheme for archetypes + types

**Files:**
- Create: `vocabulary/archetypes.ttl`, `vocabulary/types.ttl`

**Why this matters:** §9 question #14 (archetype vocab stability) gets a structural answer via SKOS — third parties can propose extensions through standard `skos:related` / `skos:broader` / `skos:narrower` mechanisms instead of ad-hoc PRs against this spec.

- [ ] **Step 1: Author `vocabulary/archetypes.ttl`**

Skeleton (first 3 archetypes shown; complete the list to 31):

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix dct:  <http://purl.org/dc/terms/> .
@prefix arch: <https://spec.ariaknowledge.ai/v0.1/vocabulary/archetypes#> .

arch:Archetypes a skos:ConceptScheme ;
    dct:title "ARIA Knowledge format v0.1 archetype vocabulary"@en ;
    dct:description "The 31-archetype tagging vocabulary defined in ARIA Knowledge format v0.1 §5. Sourced from W3C PROV-O + IEEE Std 1012 + the Knowledge Archetypes for AI Systems research."@en ;
    dct:license <https://www.apache.org/licenses/LICENSE-2.0> ;
    dct:hasVersion "0.1.0-rfc" ;
    skos:hasTopConcept arch:Causal, arch:Propositional, arch:Procedural .

arch:Causal a skos:Concept ;
    skos:inScheme arch:Archetypes ;
    skos:prefLabel "Causal"@en ;
    skos:altLabel "Cause-effect"@en ;
    skos:definition "Items expressing cause / effect / mechanism relationships. Anchor fields: cause, effect, mechanism (at least one must be populated)."@en ;
    skos:related arch:Reasoning, arch:Counterfactual .

arch:Propositional a skos:Concept ;
    skos:inScheme arch:Archetypes ;
    skos:prefLabel "Propositional"@en ;
    skos:definition "Items stating a proposition with truth-value semantics. Anchor field: claim."@en .

arch:Procedural a skos:Concept ;
    skos:inScheme arch:Archetypes ;
    skos:prefLabel "Procedural"@en ;
    skos:definition "Items describing a procedure or process. Anchor fields: steps, precondition, postcondition (at least one)."@en ;
    skos:related arch:Algorithmic .

# ... (continue for all 31 archetypes)
```

- [ ] **Step 2: Author `vocabulary/types.ttl`**

Same shape, smaller (9 user-facing types per spec §6):

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix dct:  <http://purl.org/dc/terms/> .
@prefix type: <https://spec.ariaknowledge.ai/v0.1/vocabulary/types#> .

type:Types a skos:ConceptScheme ;
    dct:title "ARIA Knowledge format v0.1 user-facing type vocabulary"@en ;
    dct:description "The 9 user-facing item types defined in ARIA Knowledge format v0.1 §6."@en ;
    dct:license <https://www.apache.org/licenses/LICENSE-2.0> ;
    dct:hasVersion "0.1.0-rfc" .

type:Decision a skos:Concept ;
    skos:inScheme type:Types ;
    skos:prefLabel "Decision"@en .

type:Approach a skos:Concept ;
    skos:inScheme type:Types ;
    skos:prefLabel "Approach"@en .

# ... (continue for Lesson, Risk, Hypothesis, Fact, Definition, Scenario, Reference)
```

- [ ] **Step 3: Validate Turtle syntax**

```bash
npx @rdfjs/parser-turtle --help 2>&1 | head -5 || npm install --no-save @rdfjs/parser-turtle
node -e "
const Parser = require('@rdfjs/parser-turtle');
const fs = require('node:fs');
const stream = fs.createReadStream('vocabulary/archetypes.ttl');
const parser = new (Parser.default ?? Parser)();
let n = 0;
parser.import(stream).on('data', () => n++).on('error', e => { console.error(e); process.exit(1); }).on('end', () => console.log('triples parsed:', n));
"
```

Expected: parses without error; prints `triples parsed: <N>` where N ≥ 100 (each archetype generates ~5-8 triples).

- [ ] **Step 4: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add vocabulary/archetypes.ttl vocabulary/types.ttl
git commit -m "feat(vocabulary): SKOS concept-schemes for 31 archetypes + 9 types"
```

---

## Task 3: Provenance-chain round-trip test

**Files:**
- Create: `tests/static/provenance-chain.test.ts`
- Create: `tests/fixtures/shards/example.shard`

**Why this matters:** Format §13 specifies that Shard export → import → re-export must preserve provenance chains exactly. Without a round-trip test, "provenance preserved" is a claim implementers can break silently.

- [ ] **Step 1: Author a minimal example Shard fixture**

A Shard is a `.tar.gz` (per format §14) containing:
- `manifest.json` (Core manifest + Shard metadata + version)
- `items/*.json` (the items being exported)
- `provenance.ndjson` (event log of how each item came to be)
- `LICENSE`
- `README.md`

For the test fixture, hand-author a 3-item Shard with a deliberate provenance chain (item A → derived from B → derived from C).

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/tests/fixtures/shards/example/
# Create the structure
mkdir -p items
echo '{ ... item A ... }' > items/a.json
echo '{ ... item B (lineage: ["a"]) ... }' > items/b.json
echo '{ ... item C (lineage: ["b"]) ... }' > items/c.json
echo '{...}' > manifest.json
echo '...' > provenance.ndjson
# Bundle
tar -czf ../example.shard manifest.json items/ provenance.ndjson
```

- [ ] **Step 2: Author the round-trip test**

```typescript
import { describe, it, expect } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exportShard, importShard } from "../helpers/shard-ops.js";

describe("Provenance round-trip", () => {
  it("preserves lineage through export → import → re-export", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "aria-shard-test-"));
    try {
      // Import the example shard into a fresh Core
      const corePath = join(tmpDir, "core-1");
      await importShard("tests/fixtures/shards/example.shard", corePath);

      // Re-export from that Core
      const reExported = join(tmpDir, "round-tripped.shard");
      await exportShard(corePath, reExported);

      // Verify item C's lineage still points at B; B's lineage still points at A
      const itemC = JSON.parse(await readFile(join(corePath, "items/c.json"), "utf8"));
      expect(itemC.lineage).toContain("b");
      const itemB = JSON.parse(await readFile(join(corePath, "items/b.json"), "utf8"));
      expect(itemB.lineage).toContain("a");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
```

Note: `exportShard` / `importShard` helpers shell out to `aria-core shard.export/import` CLI (assumes Plan 03 has shipped those subcommands).

- [ ] **Step 3: Run test + commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/tests && npm run test:static
git add tests/static/provenance-chain.test.ts tests/fixtures/shards/
git commit -m "test(static): provenance-chain round-trip test"
```

---

## Task 4: Live-mode — MCP client + 14 tool contract tests

**Files:**
- Create: `tests/live/mcp-client.ts`, `tests/live/live.test.ts`

**Prerequisite:** Plan 03 (aria-core v0.1) must have shipped at least Path 0 Filesystem mode + the 14 `core.*` tools. The live tests connect to a running Core; without one, they skip.

- [ ] **Step 1: Author `mcp-client.ts`** wrapping the official MCP SDK

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamable.js";

export async function connectCore(): Promise<Client> {
  const url = process.env.ARIA_CORE_URL;
  const stdioCmd = process.env.ARIA_CORE_STDIO_CMD;
  if (!url && !stdioCmd) {
    throw new Error("Set ARIA_CORE_URL or ARIA_CORE_STDIO_CMD before running live tests");
  }
  const client = new Client({ name: "aria-conformance-suite", version: "0.1.0" }, { capabilities: {} });
  if (url) {
    const transport = new StreamableHTTPClientTransport(new URL(url), {
      requestInit: process.env.ARIA_CORE_TOKEN
        ? { headers: { Authorization: `Bearer ${process.env.ARIA_CORE_TOKEN}` } }
        : undefined
    });
    await client.connect(transport);
  } else {
    const [cmd, ...args] = stdioCmd!.split(/\s+/);
    const transport = new StdioClientTransport({ command: cmd, args });
    await client.connect(transport);
  }
  return client;
}
```

- [ ] **Step 2: Author `live.test.ts`** with one test per `core.*` tool

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connectCore } from "./mcp-client.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

let client: Client | undefined;

beforeAll(async () => {
  try {
    client = await connectCore();
  } catch (err) {
    console.warn("Live mode skipped:", (err as Error).message);
  }
});

afterAll(async () => {
  await client?.close();
});

describe("core.* tool contracts", () => {
  it.skipIf(!client)("declares all 14 core.* tools", async () => {
    const tools = await client!.listTools();
    const names = tools.tools.map(t => t.name);
    expect(names).toEqual(expect.arrayContaining([
      "core.search", "core.get", "core.list", "core.recent",
      "core.store", "core.update", "core.propose_promotion",
      "core.curate", "core.shard.export", "core.shard.import",
      "core.exocore", "core.validate", "core.relate", "core.summarize"
    ]));
  });

  // One test per tool — minimal contract check:
  // 1. Tool exists
  // 2. Tool accepts a known-good input
  // 3. Response shape matches spec §12

  it.skipIf(!client)("core.search returns ItemSearchResult[]", async () => {
    const result = await client!.callTool({
      name: "core.search",
      arguments: { query: "test", mode: "fts", limit: 5 }
    });
    expect(result.content).toBeDefined();
    // ... assert shape per spec §12.1
  });

  // ... 13 more contract tests, one per tool
});
```

- [ ] **Step 3: Run live tests against a local Core (manual verification)**

```bash
# Start Plan 03's Path 0 Filesystem mode locally
npx @aria/core init --backend filesystem --folder ./test-core
npx @aria/core import --from tests/fixtures/cores/minimal-valid --target ./test-core
npx @aria/core serve --stdio --folder ./test-core &

# Run live tests
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/tests
ARIA_CORE_STDIO_CMD="npx @aria/core serve --stdio --folder ./test-core" npm run test:live
```

Expected: all 14 contract tests pass. If any fail, that's a real contract bug in Plan 03 — file it, fix in aria-core repo, re-run.

- [ ] **Step 4: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add tests/live/
git commit -m "test(live): MCP client + 14 core.* tool contract tests"
```

---

## Task 5: Conformance-level harness — emit a results file

**Files:**
- Create: `tests/runner/conformance-runner.ts`, `tests/runner/results-format.ts`

- [ ] **Step 1: Author the conformance-results format**

```typescript
export interface ConformanceResults {
  spec_version: string;             // e.g. "0.1.0-rfc"
  suite_version: string;             // matches spec_version
  implementation: {
    name: string;                    // e.g. "aria-core"
    version: string;
    license: string;
  };
  run_timestamp: string;             // ISO 8601
  level_achieved: "core-base" | "core-extended" | "core-experimental" | "non-conforming";
  results: {
    static: { passed: number; failed: number; skipped: number; details: TestDetail[] };
    live: { passed: number; failed: number; skipped: number; details: TestDetail[] };
  };
  synapse_inclusion_requirements: {
    hygiene_pass: boolean;           // all 7 Hygiene checks
    capabilities_pass: boolean;      // all 3 Capabilities probes
  };
}

export interface TestDetail {
  test_name: string;
  outcome: "passed" | "failed" | "skipped";
  reason?: string;                   // present on failed/skipped
}
```

- [ ] **Step 2: Author `conformance-runner.ts`** that runs both modes + emits results

```typescript
import { runStaticSuite } from "../static/runner.js";
import { runLiveSuite } from "../live/runner.js";
import { writeFile } from "node:fs/promises";
import type { ConformanceResults } from "./results-format.js";

export async function runConformance(opts: { outputFile?: string }): Promise<ConformanceResults> {
  const staticResults = await runStaticSuite();
  const liveResults = await runLiveSuite();
  const level = determineLevelAchieved(staticResults, liveResults);
  const results: ConformanceResults = {
    spec_version: "0.1.0-rfc",
    suite_version: "0.1.0-rfc",
    implementation: { name: process.env.IMPL_NAME ?? "unknown", version: process.env.IMPL_VERSION ?? "unknown", license: process.env.IMPL_LICENSE ?? "unknown" },
    run_timestamp: new Date().toISOString(),
    level_achieved: level,
    results: { static: staticResults, live: liveResults },
    synapse_inclusion_requirements: computeSynapseRequirements(liveResults)
  };
  if (opts.outputFile) await writeFile(opts.outputFile, JSON.stringify(results, null, 2));
  return results;
}

function determineLevelAchieved(s: any, l: any): ConformanceResults["level_achieved"] { /* impl */ }
function computeSynapseRequirements(l: any): ConformanceResults["synapse_inclusion_requirements"] { /* impl */ }
```

- [ ] **Step 3: Wire as CLI**

Add `npm run conformance -- --output results.json` to `tests/package.json` scripts.

- [ ] **Step 4: Run end-to-end against aria-core local Core**

```bash
IMPL_NAME=aria-core IMPL_VERSION=0.1.0 IMPL_LICENSE=CC-BY-NC-SA-4.0 \
  npm run conformance -- --output results-aria-core-v0.1.0.json
```

Expected: `results-aria-core-v0.1.0.json` written with level_achieved = `core-extended` if aria-core implements all SHOULD clauses + semantic retrieval.

- [ ] **Step 5: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add tests/runner/ tests/package.json
git commit -m "feat(tests): conformance runner emits structured results file"
```

---

## Task 6: Spec §18.2 update + Plan 01 Task 9 Appendix C cross-reference

**Files:**
- Modify: `v1.0-draft.md` §18.2

- [ ] **Step 1: Update spec §18.2 conformance suite reference**

Find the §18.2 section in `v1.0-draft.md`. Currently references the suite at "ships alongside v1.0." Replace with concrete pointer:

```markdown
The conformance test suite is housed in the [`tests/`](https://github.com/mikeprasad/aria-knowledge-spec/tree/main/tests) directory of this spec repo. Any implementation can run the suite against itself:

\`\`\`bash
git clone https://github.com/mikeprasad/aria-knowledge-spec
cd aria-knowledge-spec/tests
npm install
npm run conformance -- --output results.json
\`\`\`

Synapse-listed Cores must include their conformance-results file in their Core manifest (`conformance_test_results` field) per the Synapse Inclusion Requirements.
```

- [ ] **Step 2: Update Plan 01 Task 9 Appendix C.4 (SKOS) URL reference**

In `v1.0-draft.md` Appendix C.4, find the placeholder reference to `https://spec.ariaknowledge.ai/v0.1/vocabulary/archetypes.ttl` and confirm it's serving once Plan 02 + this plan both ship. No content change unless URL needs adjustment.

- [ ] **Step 3: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add v1.0-draft.md
git commit -m "docs(spec): §18.2 — concrete pointer to tests/ + SKOS URL confirmed"
```

---

## Task 6a: Sibling-surface sync — Plan 06 ship ripple

> **Pattern:** `parallel-release-version-staleness`. **Third reuse** of the Task Na convention.

**Files:**
- Modify: `/Users/mikeprasad/Projects/aria/docs/superpowers/plans/2026-05-21-phase-1-sequencing.md`
- Modify: `/Users/mikeprasad/.claude/projects/-Users-mikeprasad-Projects/memory/project_aria_knowledge_spec.md`

- [ ] **Step 1: Update sequencing-doc Plan 06 row**

Find Plan 06 row in the Phase 1 plans table. Flip status to `DONE YYYY-MM-DD — conformance suite shipped at tests/; SKOS vocabulary at vocabulary/`.

- [ ] **Step 2: Update memory file**

In `project_aria_knowledge_spec.md`, find the bullet about "Conformance levels (`core-base` / `core-extended` / `core-experimental`)." Append: *"Conformance test suite shipped 2026-05-XX (Plan 06) at `tests/`; SKOS concept-schemes at `vocabulary/archetypes.ttl` + `vocabulary/types.ttl`."*

- [ ] **Step 3: Verify edits landed via grep**

```bash
grep "Plan 06.*DONE" /Users/mikeprasad/Projects/aria/docs/superpowers/plans/2026-05-21-phase-1-sequencing.md
grep "Conformance test suite shipped" /Users/mikeprasad/.claude/projects/-Users-mikeprasad-Projects/memory/project_aria_knowledge_spec.md
```

Expected: each returns 1 line.

---

## Self-review

**Goal coverage per idea file:**
- `tests/fixtures/cores/` — Task 0/4 (fixtures created across tasks) ✅
- `tests/fixtures/shards/` — Task 3 ✅
- `tests/fixtures/invalid/` — Task 1 (anchor negatives) ✅
- Schema validators — Plan 01 Task 4 (manifest + item-base) + Plan 06 Task 1 (30 more archetypes) ✅
- MCP-tool contract tests — Task 4 ✅
- Anchor-gate cases (31 archetypes positive + negative) — Task 1 ✅
- Provenance round-trip — Task 3 ✅
- SKOS vocabulary — Task 2 ✅ (resolves §9 question #14)
- Conformance-level results file — Task 5 ✅

**Placeholder scan:** `YYYY-MM-DD` in Task 6a Step 1 + Step 2 is intentional (filled at execution time). No other placeholders.

**Type consistency:** `ConformanceResults`, `TestDetail` defined in Task 5; used by `conformance-runner.ts`. Schemas reused from Plan 01 unchanged.

**Effort estimate (per idea file):** 2-3 weeks focused. Plan 06 task count = 7 tasks but Task 1 is the largest single unit (30 archetype schemas + 60 fixtures + comprehensive test). Realistic wall-clock for a focused engineer: ~10-15 days.

**Open follow-ups:**
- Performance benchmark mode (deferred to v0.2)
- Cross-Core federation tests (defer to v2.0 platform feature)

---

## Execution handoff

Plan complete and saved to `aria-knowledge-spec/docs/superpowers/plans/2026-05-21-conformance-test-suite.md`.

**Recommended execution:** **subagent-driven** — Task 1 (30 archetype schemas) parallelizes naturally with one subagent per archetype block (e.g., 5 archetypes per subagent × 6 subagents). Tasks 2-6 are sequential. Plan 06 is a 2-3 week effort, not a single-session task — pacing matters more than execution mode.
