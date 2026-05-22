# spec.ariaknowledge.ai DNS + Cloudflare Pages + Visual Template — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `spec.ariaknowledge.ai` live with (a) the v0.1 RFC spec rendered at `/v0.1/`, (b) the canonical JSON-LD context document at `/v0.1/context.jsonld`, (c) a governance-distinct visual template, (d) an `/about` page framing the spec as independent of the Synapse platform, and (e) a per-page governance footer — unblocking Plan 01 Task 9 (which gates on this URL resolving) and opening the RFC publicly.

**Architecture:** Pure static HTML + tiny custom CSS (no SSG framework, no React, no Designframe) for v0.1 RFC. A small Node build script using `marked` renders `v1.0-draft.md` to `dist/v0.1/index.html`; landing + `/about` pages are hand-authored HTML files with a shared `_footer.html` fragment injected at build time. Cloudflare Pages auto-builds from `mikeprasad/aria-knowledge-spec` on push to `main`. Cloudflare DNS CNAME `spec.ariaknowledge.ai` → Pages project. The visual template references W3C-spec-page aesthetic (serif type, restrained palette, governance footer per page, no marketing chrome) so it reads as "open standard," not "platform marketing."

**Tech stack:** Node.js (≥20), TypeScript, `marked` (markdown-to-HTML), Cloudflare DNS, Cloudflare Pages (build command + output directory configured in dashboard, no `wrangler.toml` needed). Apache 2.0 license already in place.

**Sub-repo:** `aria-knowledge-spec` (same repo as Plan 01 — new `site/` folder added at repo root).

**Out of scope (other plans / future passes):**
- Search functionality (defer to v2.0 — Postgres FTS or Typesense as outlined in synapse spec §5)
- Versioned spec rendering for v0.2+ RFC iterations (handled when v0.2 RFC opens; v0.1 lives at fixed `/v0.1/` path)
- Visual template iteration past v0.1 RFC aesthetic (revisit when v1.0 ratifies)
- Migration to an SSG framework like Astro or VitePress (revisit only if v0.1 RFC content scales beyond what a 50-line build script handles cleanly)

**Pre-execution decisions (revise if needed before Task 0):**

- **Visual stack:** plain HTML + custom CSS. Smallest dependency surface; W3C-spec-page aesthetic reference. **Revisit** if Mike prefers claude.ai/design React handoff (would expand Tasks 4 + 5 to handle a Babel-compiled React shell) OR Designframe utility classes (would couple the spec site to DF version + reduce visual distinctness from future Synapse product chrome).
- **Markdown renderer:** `marked` ≥12. Stable, widely deployed, supports GFM + heading-id auto-generation. Alternatives (markdown-it, remark) ruled out as heavier without meaningful benefit for a flat-structure spec document.
- **CSS approach:** single hand-authored `styles.css` (~150-200 LOC). Tailwind / utility frameworks ruled out as overkill for a 3-page site.

---

## File structure

**To be created (in repo):**

| Path | Responsibility |
|------|----------------|
| `site/package.json` | Node workspace for the build script (dev workspace, separate from `validate/`) |
| `site/tsconfig.json` | TS config for the build script |
| `site/build.ts` | Markdown→HTML build script; copies static assets to `dist/` |
| `site/src/index.html` | Landing page (RFC announcement + spec link + comment vehicle + repo link) |
| `site/src/about.html` | Governance / `/about` page framing spec as independent of platform |
| `site/src/_shell.html` | HTML shell template used to wrap the rendered spec document |
| `site/src/_footer.html` | Shared governance footer fragment (injected into every page at build) |
| `site/src/styles.css` | Custom CSS — distinct visual template (serif type, restrained palette, governance layout) |
| `site/src/v0.1/context.jsonld` | Canonical JSON-LD context — maps ARIA fields to W3C terms |
| `site/dist/` | Build output (gitignored) — what Cloudflare Pages serves |
| `site/README.md` | Build commands + Cloudflare Pages config reference |

**To be modified (in repo):**

| Path | Change |
|------|--------|
| `.gitignore` | Add `site/dist/`, `site/node_modules/` |

**Untouched:** `LICENSE`, `README.md` (top-level), `v1.0-draft.md`, `schemas/`, `validate/`, `RFC.md`, `CONTRIBUTING.md`, `.github/` (all from Plan 01).

**Cloudflare-side configuration (not in repo):**

| Surface | Configured via |
|---------|----------------|
| Pages project | `dash.cloudflare.com` → Workers & Pages → Create application → Pages → Connect to Git |
| DNS CNAME `spec.ariaknowledge.ai` | `dash.cloudflare.com` → `ariaknowledge.ai` zone → DNS → Records |
| Custom domain on Pages project | `dash.cloudflare.com` → Pages project → Custom domains |
| SSL certificate | Auto-provisioned by Cloudflare on Custom Domain add |

---

## Task 0: Bootstrap site workspace

**Files:**
- Create: `site/package.json`, `site/tsconfig.json`
- Modify: `.gitignore`

- [ ] **Step 1: Update `.gitignore` to exclude site build artifacts**

Append to `/Users/mikeprasad/Projects/aria/aria-knowledge-spec/.gitignore`:

```
site/dist/
site/node_modules/
```

- [ ] **Step 2: Create `site/package.json`**

```json
{
  "name": "@aria-knowledge-spec/site",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsx build.ts",
    "watch": "tsx watch build.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "marked": "^12.0.0",
    "marked-gfm-heading-id": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 3: Create `site/tsconfig.json`**

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
  "include": ["build.ts"]
}
```

- [ ] **Step 4: Install dependencies and verify**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/site && npm install
```

Expected: install succeeds; `node_modules/` created; `npm run typecheck` exits 0 (no build.ts yet so tsc has nothing to check — should still exit clean).

- [ ] **Step 5: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add .gitignore site/package.json site/tsconfig.json
git commit -m "chore(site): bootstrap Node workspace for spec.ariaknowledge.ai build"
```

---

## Task 1: Author the v0.1 JSON-LD context document

**Files:**
- Create: `site/src/v0.1/context.jsonld`

**Why this task matters:** The canonical `@context` URL referenced from every Core's `core.json` (per Plan 01 Task 9) is exactly this file. It must be valid JSON-LD, must declare every ARIA universal base field's mapping to W3C terms (PROV-O, Schema.org, Dublin Core, SKOS, FOAF, DCAT — per the standards-alignment decisions from 2026-05-21), and must serve at HTTP `Content-Type: application/ld+json` when fetched.

- [ ] **Step 1: Create the directory + author the context document**

```bash
mkdir -p /Users/mikeprasad/Projects/aria/aria-knowledge-spec/site/src/v0.1
```

Then write `site/src/v0.1/context.jsonld`:

```json
{
  "@context": {
    "@version": 1.1,
    "@vocab": "https://spec.ariaknowledge.ai/v0.1/vocab#",
    "schema": "https://schema.org/",
    "prov": "http://www.w3.org/ns/prov#",
    "dct": "http://purl.org/dc/terms/",
    "dcat": "http://www.w3.org/ns/dcat#",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "foaf": "http://xmlns.com/foaf/0.1/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",

    "id": "@id",
    "type": "@type",
    "content": "schema:text",
    "language": "dct:language",
    "license": "dct:license",

    "archetype": {
      "@id": "https://spec.ariaknowledge.ai/v0.1/vocab#archetype",
      "@container": "@set"
    },

    "source": "dct:source",
    "source_type": "https://spec.ariaknowledge.ai/v0.1/vocab#sourceType",

    "timestamp_created": {
      "@id": "prov:generatedAtTime",
      "@type": "xsd:dateTime"
    },
    "timestamp_valid_from": {
      "@id": "https://spec.ariaknowledge.ai/v0.1/vocab#validFrom",
      "@type": "xsd:dateTime"
    },
    "timestamp_valid_until": {
      "@id": "https://spec.ariaknowledge.ai/v0.1/vocab#validUntil",
      "@type": "xsd:dateTime"
    },

    "confidence": "https://spec.ariaknowledge.ai/v0.1/vocab#confidence",
    "scope": "https://spec.ariaknowledge.ai/v0.1/vocab#scope",
    "status": "https://spec.ariaknowledge.ai/v0.1/vocab#status",
    "version": "dct:hasVersion",

    "lineage": {
      "@id": "prov:wasDerivedFrom",
      "@type": "@id",
      "@container": "@set"
    },

    "provenance": {
      "@id": "https://spec.ariaknowledge.ai/v0.1/vocab#provenance",
      "@container": "@set"
    },

    "validations": {
      "@id": "https://spec.ariaknowledge.ai/v0.1/vocab#validations",
      "@container": "@set"
    },

    "tags": {
      "@id": "schema:keywords",
      "@container": "@set"
    },

    "pii_check": "https://spec.ariaknowledge.ai/v0.1/vocab#piiCheckStatus",
    "extensions": "@nest",

    "publisher": "dct:publisher",
    "core_id": "@id",
    "name": "schema:name",
    "spec_version": "https://spec.ariaknowledge.ai/v0.1/vocab#specVersion",
    "conformance_level": "https://spec.ariaknowledge.ai/v0.1/vocab#conformanceLevel",
    "created": {
      "@id": "dct:created",
      "@type": "xsd:dateTime"
    },
    "updated": {
      "@id": "dct:modified",
      "@type": "xsd:dateTime"
    }
  }
}
```

- [ ] **Step 2: Validate as syntactically valid JSON**

```bash
python3 -c "import json; json.load(open('/Users/mikeprasad/Projects/aria/aria-knowledge-spec/site/src/v0.1/context.jsonld'))" && echo "valid JSON"
```

Expected: prints `valid JSON`. (Full JSON-LD-semantic validation runs in Task 9 against the deployed URL — at this step we only verify JSON syntax.)

- [ ] **Step 3: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add site/src/v0.1/context.jsonld
git commit -m "feat(site): v0.1 JSON-LD context — ARIA universal base fields → W3C terms"
```

---

## Task 2: Custom CSS — distinct visual template

**Files:**
- Create: `site/src/styles.css`

**Why this task matters:** Synapse §5 mitigation principles require visually distinct chrome so the spec doesn't read as "Synapse's docs." Approach: W3C-spec-page aesthetic — serif typography (Times-family or Charter), restrained 3-color palette, single-column reading layout, ample whitespace, no marketing-style components.

- [ ] **Step 1: Create `site/src/styles.css`**

```css
:root {
  --color-ink: #1a1a1a;
  --color-paper: #fdfdf9;
  --color-accent: #6b3410;
  --color-muted: #707070;
  --color-rule: #d8d6c8;

  --font-serif: Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;

  --measure: 38rem;
  --leading: 1.55;
}

* { box-sizing: border-box; }

html, body {
  background: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: 17px;
  line-height: var(--leading);
  margin: 0;
  padding: 0;
}

main {
  max-width: var(--measure);
  margin: 4rem auto;
  padding: 0 1.5rem;
}

h1, h2, h3, h4 {
  font-weight: 600;
  line-height: 1.25;
  margin: 2.5rem 0 1rem;
}

h1 { font-size: 1.85rem; margin-top: 0; }
h2 { font-size: 1.4rem; border-bottom: 1px solid var(--color-rule); padding-bottom: 0.4rem; }
h3 { font-size: 1.15rem; }
h4 { font-size: 1rem; }

p { margin: 0 0 1.2rem; }

a {
  color: var(--color-accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}
a:hover { text-decoration-thickness: 2px; }

code, pre {
  font-family: var(--font-mono);
  font-size: 0.9em;
}
code {
  background: rgba(107, 52, 16, 0.08);
  padding: 0.1em 0.35em;
  border-radius: 2px;
}
pre {
  background: rgba(107, 52, 16, 0.05);
  border-left: 3px solid var(--color-accent);
  padding: 1rem 1.25rem;
  overflow-x: auto;
  line-height: 1.45;
}
pre code { background: none; padding: 0; }

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5rem 0;
  font-size: 0.95em;
}
th, td {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-rule);
  text-align: left;
  vertical-align: top;
}
th {
  background: rgba(107, 52, 16, 0.06);
  font-weight: 600;
}

blockquote {
  border-left: 3px solid var(--color-rule);
  margin: 1.5rem 0;
  padding: 0.25rem 1.25rem;
  color: var(--color-muted);
}

ul, ol { margin: 0 0 1.2rem 1.5rem; padding: 0; }
li { margin: 0.25rem 0; }

hr {
  border: none;
  border-top: 1px solid var(--color-rule);
  margin: 2.5rem 0;
}

header.spec-header {
  border-bottom: 1px solid var(--color-rule);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}
header.spec-header .eyebrow {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted);
}

footer.governance {
  max-width: var(--measure);
  margin: 5rem auto 3rem;
  padding: 1.5rem 1.5rem 0;
  border-top: 1px solid var(--color-rule);
  font-size: 0.85rem;
  color: var(--color-muted);
  line-height: 1.5;
}
footer.governance a { color: var(--color-muted); }
footer.governance .row { margin: 0.4rem 0; }
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add site/src/styles.css
git commit -m "feat(site): custom CSS — W3C-spec-page aesthetic, distinct from Synapse chrome"
```

---

## Task 3: Shared HTML shell + governance footer fragment

**Files:**
- Create: `site/src/_shell.html`, `site/src/_footer.html`

- [ ] **Step 1: Create `site/src/_shell.html`** (used by build.ts to wrap rendered spec)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{TITLE}}</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="canonical" href="{{CANONICAL_URL}}">
  <meta name="robots" content="index, follow">
</head>
<body>
  <main>
    <header class="spec-header">
      <div class="eyebrow">ARIA Knowledge format spec · v0.1 RFC</div>
      <nav><a href="/">Home</a> · <a href="/about">About</a> · <a href="/v0.1/">Spec v0.1</a> · <a href="https://github.com/mikeprasad/aria-knowledge-spec">GitHub</a></nav>
    </header>
    {{CONTENT}}
  </main>
  {{FOOTER}}
</body>
</html>
```

- [ ] **Step 2: Create `site/src/_footer.html`** (governance footer per §5 mitigation)

```html
<footer class="governance">
  <div class="row"><strong>ARIA Knowledge format spec</strong> · Apache 2.0 · Editor: Mike Prasad · Editorial body planned for v2.0</div>
  <div class="row">Spec repo: <a href="https://github.com/mikeprasad/aria-knowledge-spec">github.com/mikeprasad/aria-knowledge-spec</a> · RFC tracker: <a href="https://github.com/mikeprasad/aria-knowledge-spec/issues?q=label%3Arfc-open-question">7 open questions</a></div>
  <div class="row">This spec is independent of the <a href="https://ariaknowledge.com">Synapse</a> platform that publishes Cores conforming to it. Other implementations are welcome and encouraged.</div>
</footer>
```

- [ ] **Step 3: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add site/src/_shell.html site/src/_footer.html
git commit -m "feat(site): HTML shell + governance footer fragments"
```

---

## Task 4: Landing page + /about page

**Files:**
- Create: `site/src/index.html`, `site/src/about.html`

- [ ] **Step 1: Create `site/src/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ARIA Knowledge format spec · v0.1 RFC</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="canonical" href="https://spec.ariaknowledge.ai/">
</head>
<body>
  <main>
    <header class="spec-header">
      <div class="eyebrow">ARIA Knowledge format spec · v0.1 RFC</div>
      <nav><a href="/">Home</a> · <a href="/about">About</a> · <a href="/v0.1/">Spec v0.1</a> · <a href="https://github.com/mikeprasad/aria-knowledge-spec">GitHub</a></nav>
    </header>
    <h1>ARIA Knowledge — open, MCP-native, multi-archetype format</h1>
    <p>An open specification for typed, validated, structured knowledge that AI agents and humans can both read, write, and reason over. <strong>v0.1 is open for comment.</strong></p>

    <h2>Read the spec</h2>
    <p><a href="/v0.1/">ARIA Knowledge format v0.1 (RFC)</a> — universal base fields per W3C PROV-O + IEEE 1012; 9 user-facing types + 31-archetype tagging vocabulary; anchor-based promotion gate; 14 normative <code>core.*</code> MCP tools; conformance levels (<code>core-base</code> / <code>core-extended</code> / <code>core-experimental</code>).</p>
    <p>Machine-readable JSON-LD context: <a href="/v0.1/context.jsonld"><code>/v0.1/context.jsonld</code></a></p>

    <h2>Comment on the RFC</h2>
    <p>Substantive comments and proposed normative changes: <a href="https://github.com/mikeprasad/aria-knowledge-spec/issues/new?template=rfc-comment.yml">open an RFC comment</a>. Editorial fixes: open a PR directly.</p>
    <p>The 7 open questions the editor wants RFC input on: <a href="https://github.com/mikeprasad/aria-knowledge-spec/issues?q=label%3Arfc-open-question">issue tracker</a>.</p>

    <h2>Build a Core</h2>
    <p>The reference implementation is <a href="https://github.com/mikeprasad/aria-core"><code>aria-core</code></a> (CC BY-NC-SA 4.0). Third-party implementations in any language are welcome — the spec is editor-led but implementation-neutral.</p>

    <h2>License</h2>
    <p>This specification is licensed under <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache 2.0</a>. Implementers receive a perpetual, worldwide, royalty-free patent license to any claims embodied here.</p>
  </main>
  {{FOOTER}}
</body>
</html>
```

- [ ] **Step 2: Create `site/src/about.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>About · ARIA Knowledge format spec</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="canonical" href="https://spec.ariaknowledge.ai/about">
</head>
<body>
  <main>
    <header class="spec-header">
      <div class="eyebrow">ARIA Knowledge format spec · About</div>
      <nav><a href="/">Home</a> · <a href="/about">About</a> · <a href="/v0.1/">Spec v0.1</a> · <a href="https://github.com/mikeprasad/aria-knowledge-spec">GitHub</a></nav>
    </header>
    <h1>About this specification</h1>

    <h2>What this is</h2>
    <p>The ARIA Knowledge format is an open specification for a portable, MCP-native data shape that AI agents and humans can both read, write, and reason over. It describes what makes a <strong>Core</strong> (a structured knowledge repository) conformant. It is independent of any single implementation.</p>

    <h2>How it relates to Synapse</h2>
    <p><a href="https://ariaknowledge.com">Synapse</a> is a platform that publishes Cores conforming to this specification. <strong>This specification is not Synapse's docs.</strong> Synapse is one implementer of the spec; other implementations (in any language, hosted anywhere) are welcome and encouraged. This subdomain (<code>spec.ariaknowledge.ai</code>) is intentionally separate from <code>docs.ariaknowledge.com</code> (Synapse product docs) to signal that separation.</p>

    <h2>How it relates to aria-core</h2>
    <p><a href="https://github.com/mikeprasad/aria-core"><code>aria-core</code></a> is the editor's reference implementation of this specification. It is licensed CC BY-NC-SA 4.0 (a more restrictive license than this spec's Apache 2.0). Third-party implementations are unrestricted by the reference implementation's license — they only need to conform to this spec.</p>

    <h2>Governance</h2>
    <p>This spec is editor-led (Mike Prasad) for v1.0. A 3–5 person editorial body is planned for v2.0, drawn from RFC participants and active implementers. RFC consolidation pass closes the v0.1 → v1.0 ratification window.</p>
    <p>To participate: see <a href="https://github.com/mikeprasad/aria-knowledge-spec/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</a> and the <a href="https://github.com/mikeprasad/aria-knowledge-spec/blob/main/RFC.md">RFC.md</a> in the spec repo.</p>

    <h2>Foundational references</h2>
    <ul>
      <li>W3C PROV-O (Provenance Ontology) — universal base fields + provenance model</li>
      <li>IEEE Std 1012 (System, Software, and Hardware Verification and Validation) — anchor-based promotion gate discipline</li>
      <li>"Knowledge Archetypes for AI Systems: Taxonomy with Validation Data Requirements" — 31-archetype tagging vocabulary</li>
      <li>MPAI-MMC V2.5 Theory of Mind data model — subsumed by ARIA's multi-archetype model (see spec Appendix C.2)</li>
    </ul>
  </main>
  {{FOOTER}}
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add site/src/index.html site/src/about.html
git commit -m "feat(site): landing page + /about governance page"
```

---

## Task 5: Build script — markdown→HTML pipeline + static asset copy

**Files:**
- Create: `site/build.ts`

- [ ] **Step 1: Author `site/build.ts`**

```typescript
import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, "src");
const distDir = resolve(__dirname, "dist");
const repoRoot = resolve(__dirname, "..");

marked.use(gfmHeadingId());

async function readFragment(name: string): Promise<string> {
  return readFile(join(srcDir, name), "utf8");
}

function stripFrontmatter(md: string): string {
  return md.replace(/^---\n[\s\S]*?\n---\n/, "");
}

async function renderSpec(): Promise<void> {
  const md = await readFile(join(repoRoot, "v1.0-draft.md"), "utf8");
  const body = stripFrontmatter(md);
  const html = await marked.parse(body, { gfm: true });
  const shell = await readFragment("_shell.html");
  const footer = await readFragment("_footer.html");
  const out = shell
    .replaceAll("{{TITLE}}", "ARIA Knowledge format v0.1 (RFC)")
    .replaceAll("{{CANONICAL_URL}}", "https://spec.ariaknowledge.ai/v0.1/")
    .replaceAll("{{CONTENT}}", html)
    .replaceAll("{{FOOTER}}", footer);
  await mkdir(join(distDir, "v0.1"), { recursive: true });
  await writeFile(join(distDir, "v0.1", "index.html"), out);
}

async function renderHandAuthoredPage(name: string): Promise<void> {
  const src = await readFile(join(srcDir, `${name}.html`), "utf8");
  const footer = await readFragment("_footer.html");
  const out = src.replaceAll("{{FOOTER}}", footer);
  await writeFile(join(distDir, `${name}.html`), out);
}

async function copyStatic(): Promise<void> {
  await mkdir(distDir, { recursive: true });
  await copyFile(join(srcDir, "styles.css"), join(distDir, "styles.css"));
  await mkdir(join(distDir, "v0.1"), { recursive: true });
  await copyFile(
    join(srcDir, "v0.1", "context.jsonld"),
    join(distDir, "v0.1", "context.jsonld")
  );
}

async function main(): Promise<void> {
  await copyStatic();
  await renderHandAuthoredPage("index");
  await renderHandAuthoredPage("about");
  await renderSpec();
  console.log("Build complete:");
  console.log("  - dist/index.html");
  console.log("  - dist/about.html");
  console.log("  - dist/styles.css");
  console.log("  - dist/v0.1/index.html (rendered from ../v1.0-draft.md)");
  console.log("  - dist/v0.1/context.jsonld");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the build + verify outputs**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec/site && npm run build
```

Expected stdout:

```
Build complete:
  - dist/index.html
  - dist/about.html
  - dist/styles.css
  - dist/v0.1/index.html (rendered from ../v1.0-draft.md)
  - dist/v0.1/context.jsonld
```

Verify the spec rendered with content:

```bash
wc -l dist/v0.1/index.html
```

Expected: ≥800 lines (the spec is 854 source lines + shell wrapping).

Open in a browser to spot-check rendering:

```bash
open dist/index.html
```

Expected: landing page renders with serif type, restrained palette, governance footer at bottom.

- [ ] **Step 3: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add site/build.ts
git commit -m "feat(site): build script — marked-based spec rendering + static asset copy"
```

---

## Task 6: site/README.md — build commands + Cloudflare Pages config reference

**Files:**
- Create: `site/README.md`

- [ ] **Step 1: Author `site/README.md`**

```markdown
# site/

Build pipeline for `spec.ariaknowledge.ai`.

## Local dev

```bash
cd site
npm install
npm run build      # → dist/
npm run watch      # rebuild on save (uses tsx watch)
```

Then `open dist/index.html` to preview locally.

## Cloudflare Pages configuration

The Pages project is connected to `mikeprasad/aria-knowledge-spec` and configured in the Cloudflare dashboard. Settings:

| Setting | Value |
|---------|-------|
| Production branch | `main` |
| Build command | `cd site && npm install && npm run build` |
| Build output directory | `site/dist` |
| Root directory | `/` (repo root) |
| Node version | `20` (set via `NODE_VERSION` environment variable in Pages settings) |

Custom domain `spec.ariaknowledge.ai` is added in Pages project → Custom domains. DNS CNAME points to the Pages project's `*.pages.dev` URL.

## Source layout

| Path | What it is |
|------|------------|
| `src/index.html` | Landing page (hand-authored) |
| `src/about.html` | Governance / About page (hand-authored) |
| `src/_shell.html` | HTML shell used to wrap the rendered spec markdown |
| `src/_footer.html` | Shared governance footer fragment |
| `src/styles.css` | Custom CSS — distinct visual template |
| `src/v0.1/context.jsonld` | Canonical JSON-LD context — copied verbatim to dist |
| `build.ts` | Build script — markdown → HTML for the spec, static copy for the rest |
| `dist/` | Build output (gitignored) — served by Cloudflare Pages |
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add site/README.md
git commit -m "docs(site): build commands + Cloudflare Pages config reference"
```

---

## Task 7: Cloudflare Pages project setup (dashboard work)

**Files:** none modified (Cloudflare-side configuration)

**Prerequisite:** Tasks 0-6 must be committed AND pushed to `origin/main`. Cloudflare Pages reads from the remote, not local.

- [ ] **Step 1: Push current commits to remote**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git push origin main
```

Expected: push succeeds; all 6 Plan 02 commits visible on GitHub.

- [ ] **Step 2: Create the Cloudflare Pages project**

In a browser:

1. Navigate to `https://dash.cloudflare.com/`
2. Select the account that owns the `ariaknowledge.ai` zone
3. Sidebar → **Workers & Pages**
4. Click **Create application** → **Pages** tab → **Connect to Git**
5. Authorize the GitHub app for `mikeprasad` if not already authorized
6. Select repository: `mikeprasad/aria-knowledge-spec`
7. Click **Begin setup**

- [ ] **Step 3: Configure build settings**

In the **Set up builds and deployments** screen:

| Field | Value |
|-------|-------|
| Project name | `aria-knowledge-spec` (or accept default) |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `cd site && npm install && npm run build` |
| Build output directory | `site/dist` |
| Root directory | (leave blank — defaults to repo root) |

Click **Environment variables** → Add:

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | `20` |

Click **Save and Deploy**.

- [ ] **Step 4: Verify first deploy succeeds**

Cloudflare Pages will run the build immediately. Watch the build log in the dashboard.

Expected: build completes in ~30-60 seconds; deploy URL appears as `https://aria-knowledge-spec.pages.dev` (or similar — Cloudflare auto-assigns).

Verify the preview URL:

```bash
curl -I https://aria-knowledge-spec.pages.dev/
```

Expected: HTTP 200, `Content-Type: text/html`.

```bash
curl -I https://aria-knowledge-spec.pages.dev/v0.1/context.jsonld
```

Expected: HTTP 200. (Content-Type may be `application/json` at this stage — see Task 8 for the JSON-LD content-type override, OR accept the default since `application/json` is a valid JSON-LD content-type per spec.)

- [ ] **Step 5: Document the Pages project URL for Task 8**

Record the Pages preview URL (e.g., `aria-knowledge-spec.pages.dev`) in a scratch note. Task 8 needs this for the CNAME target.

No commit required for this task — all changes are Cloudflare-side dashboard state.

---

## Task 8: Cloudflare DNS CNAME + Custom Domain setup

**Files:** none modified (Cloudflare-side configuration)

- [ ] **Step 1: Add Custom Domain on the Pages project**

In Cloudflare dashboard:

1. Workers & Pages → `aria-knowledge-spec` (the Pages project from Task 7)
2. **Custom domains** tab → **Set up a custom domain**
3. Enter: `spec.ariaknowledge.ai`
4. Click **Continue** → Cloudflare confirms the domain is in the `ariaknowledge.ai` zone you own
5. Click **Activate domain**

Cloudflare will:
- Auto-create the DNS CNAME record `spec.ariaknowledge.ai` → Pages project
- Provision an SSL certificate (~30-60 seconds)
- Configure HTTPS redirects

- [ ] **Step 2: Verify DNS record was created**

In Cloudflare dashboard → DNS → `ariaknowledge.ai` zone → Records, confirm a new CNAME record:

| Type | Name | Target | Proxy status |
|------|------|--------|--------------|
| CNAME | `spec` | `aria-knowledge-spec.pages.dev` (or similar) | Proxied (orange cloud) |

If the record isn't there, add manually:

| Field | Value |
|-------|-------|
| Type | CNAME |
| Name | `spec` |
| Target | `<Pages project URL from Task 7 Step 5>` |
| Proxy status | Proxied |
| TTL | Auto |

- [ ] **Step 3: Wait for DNS propagation + SSL cert**

DNS propagation through Cloudflare's edge is typically <60 seconds. SSL cert provisioning is ~1-2 minutes. Verify both:

```bash
dig +short spec.ariaknowledge.ai
```

Expected: returns Cloudflare IPs (proxied).

```bash
curl -I https://spec.ariaknowledge.ai/
```

Expected: HTTP 200, `Content-Type: text/html`, no SSL warnings. If SSL handshake fails or cert isn't ready, wait 2 more minutes and retry.

- [ ] **Step 4: Configure `_headers` file for JSON-LD content type (optional but recommended)**

JSON-LD spec requires `application/ld+json` content-type for proper consumer behavior. Cloudflare Pages defaults `.jsonld` files to `application/json`, which JSON-LD-aware processors accept but isn't ideal.

Create `site/src/_headers` (Cloudflare Pages reads this convention):

```
/v0.1/context.jsonld
  Content-Type: application/ld+json
```

Add to `site/build.ts` `copyStatic()`:

```typescript
  // Copy _headers if present (Cloudflare Pages convention)
  try {
    await copyFile(join(srcDir, "_headers"), join(distDir, "_headers"));
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
```

Run `npm run build`, verify `dist/_headers` exists.

- [ ] **Step 5: Commit + push**

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add site/src/_headers site/build.ts
git commit -m "feat(site): _headers — set application/ld+json on context.jsonld"
git push origin main
```

Cloudflare Pages will auto-build + auto-deploy the new commit (~30-60 seconds).

Re-verify:

```bash
curl -I https://spec.ariaknowledge.ai/v0.1/context.jsonld
```

Expected: HTTP 200, `Content-Type: application/ld+json`.

---

## Task 9: Acceptance probe verification

**Files:** none (verification only)

**Why this task matters:** This is the gate that unblocks Plan 01 Task 9. Plan 01 Task 9's prerequisite block explicitly says: *"`curl -I https://spec.ariaknowledge.ai/v0.1/context.jsonld` returns 200 with `Content-Type: application/ld+json`"*. This task confirms that gate is passed.

- [ ] **Step 1: Run the 4 acceptance probes**

```bash
echo "=== Landing page ==="
curl -sI https://spec.ariaknowledge.ai/ | head -5

echo ""
echo "=== About page ==="
curl -sI https://spec.ariaknowledge.ai/about | head -5

echo ""
echo "=== Rendered spec ==="
curl -sI https://spec.ariaknowledge.ai/v0.1/ | head -5

echo ""
echo "=== JSON-LD context (Plan 01 Task 9 gate) ==="
curl -sI https://spec.ariaknowledge.ai/v0.1/context.jsonld | head -5
```

Expected output (each probe):

```
HTTP/2 200
content-type: text/html; charset=utf-8       (first 3 probes)
content-type: application/ld+json             (4th probe)
```

- [ ] **Step 2: Verify content integrity**

```bash
curl -s https://spec.ariaknowledge.ai/v0.1/context.jsonld | python3 -c "import sys,json; d=json.load(sys.stdin); ctx=d['@context']; print('context keys:', len(ctx)); print('has prov mapping:', 'timestamp_created' in ctx); print('has dct mapping:', 'license' in ctx); print('@vocab:', ctx.get('@vocab'))"
```

Expected:

```
context keys: ~30
has prov mapping: True
has dct mapping: True
@vocab: https://spec.ariaknowledge.ai/v0.1/vocab#
```

- [ ] **Step 3: Spot-check the rendered spec**

```bash
curl -s https://spec.ariaknowledge.ai/v0.1/ | grep -c "<h2"
```

Expected: ≥15 (spec has many sections; each rendered as `<h2>` after marked processing).

- [ ] **Step 4: Verify visual distinctness (manual)**

Open `https://spec.ariaknowledge.ai/` in a browser. Confirm:

- [ ] Serif typography (not the sans-serif that future Synapse product chrome will use)
- [ ] Restrained 3-color palette (paper / ink / accent-amber)
- [ ] Governance footer renders at bottom of every page
- [ ] No marketing CTAs ("Start free trial", "Sign up", etc.)
- [ ] No third-party trackers in network panel (DevTools → Network → filter "google-analytics" / "segment" / etc.)
- [ ] `/about` page text explicitly frames spec as independent of Synapse

If any check fails, capture the failure mode and address before Plan 02 closes.

- [ ] **Step 5: Plan 02 done — Plan 01 Task 9 unblocked**

No commit. The completion signal is the 4 probes passing + visual checks green.

---

## Task 9a: Sibling-surface sync — Plan 02 go-live ripple

> **Pattern:** `parallel-release-version-staleness` (canonical, `~/Projects/knowledge/rules/retrospect-patterns.md`). Same template as Plan 01 Task 7a — applied to a different ripple. This is the **first reuse** of the Task Na convention established in Plan 01 (2026-05-21 prospect outcome); if this task reads as a verbatim swap of Task 7a's structure with only surface-content differences, the convention is working.

**Why this task exists:** Plan 02 going live changes 3 sibling surfaces' descriptions of the spec subdomain — they currently say "DNS/Pages setup pending" or omit the live URL entirely. Once `spec.ariaknowledge.ai` resolves, those become stale.

**Files:**
- Modify: `/Users/mikeprasad/Projects/aria/aria-knowledge-spec/README.md` (top-level, currently doesn't mention the live URL)
- Modify: `/Users/mikeprasad/Projects/aria/CLAUDE.md` (row 19 in the Layout table)
- Modify: `/Users/mikeprasad/.claude/projects/-Users-mikeprasad-Projects/memory/project_aria_knowledge_spec.md` (status sentence about DNS/Pages)
- Modify: `/Users/mikeprasad/Projects/aria/docs/superpowers/plans/2026-05-21-phase-1-sequencing.md` (Plan 02 row in the Phase 1 plans table — flip status to "DONE")

- [ ] **Step 1: Update `aria-knowledge-spec/README.md`**

Add to the top of the README (just below the title), a one-line live-URL declaration:

```markdown
**Live at <https://spec.ariaknowledge.ai/>** (v0.1 RFC open). Spec rendered at [`/v0.1/`](https://spec.ariaknowledge.ai/v0.1/); canonical JSON-LD context at [`/v0.1/context.jsonld`](https://spec.ariaknowledge.ai/v0.1/context.jsonld).
```

- [ ] **Step 2: Update `aria/CLAUDE.md` row 19**

Find row 19's `Context` cell (rightmost) — currently reads `aria-knowledge-spec/v1.0-draft.md`.

Replace with:

```
`aria-knowledge-spec/v1.0-draft.md`; live at <https://spec.ariaknowledge.ai/>
```

- [ ] **Step 3: Update memory file**

Open `~/.claude/projects/-Users-mikeprasad-Projects/memory/project_aria_knowledge_spec.md`. Find the sentence:

```
To be hosted at `spec.ariaknowledge.ai` (DNS/Pages setup pending; spec text is published via the GitHub repo URL meanwhile).
```

Replace with:

```
Hosted at <https://spec.ariaknowledge.ai/> (DNS + Cloudflare Pages went live YYYY-MM-DD per Plan 02; v0.1 RFC publicly open for comment).
```

(Replace `YYYY-MM-DD` with the actual go-live date.)

- [ ] **Step 4: Update sequencing doc Plan 02 row**

Open `/Users/mikeprasad/Projects/aria/docs/superpowers/plans/2026-05-21-phase-1-sequencing.md`. Find the Plan 02 row in the Phase 1 plans table. Flip the dependency-status text from `Plan 01 (repo must have RFC infra)` to `Plan 01 (repo must have RFC infra) — DONE YYYY-MM-DD`.

- [ ] **Step 5: Verify all edits landed**

```bash
grep "spec.ariaknowledge.ai" /Users/mikeprasad/Projects/aria/aria-knowledge-spec/README.md
grep "Live at <https://spec.ariaknowledge.ai" /Users/mikeprasad/Projects/aria/CLAUDE.md
grep "DNS + Cloudflare Pages went live" /Users/mikeprasad/.claude/projects/-Users-mikeprasad-Projects/memory/project_aria_knowledge_spec.md
grep "Plan 02.*DONE" /Users/mikeprasad/Projects/aria/docs/superpowers/plans/2026-05-21-phase-1-sequencing.md
```

Expected: each grep returns exactly 1 matching line.

- [ ] **Step 6: Commit (where applicable)**

`aria-knowledge-spec/README.md` is in the spec repo:

```bash
cd /Users/mikeprasad/Projects/aria/aria-knowledge-spec
git add README.md
git commit -m "docs: link live spec.ariaknowledge.ai from README"
git push origin main
```

The other 3 files (`aria/CLAUDE.md`, the memory file, the sequencing doc in `aria/docs/`) live outside any git repo — verification via grep is the persistence signal per the Task 7a convention.

---

## Self-review

**Goal coverage:**
- `spec.ariaknowledge.ai` live → Tasks 7, 8, 9 ✅
- Spec rendered at `/v0.1/` → Tasks 3, 4, 5 (shell + build + render) ✅
- JSON-LD context at `/v0.1/context.jsonld` with `application/ld+json` → Tasks 1, 8 (content-type via _headers) ✅
- Governance-distinct visual template → Tasks 2 (CSS) + 4 (footer) ✅
- `/about` page framing as independent → Task 4 (`about.html`) ✅
- Per-page governance footer → Task 3 (`_footer.html`) + build script injection ✅
- Plan 01 Task 9 gate (4 probes) → Task 9 ✅
- Sibling-surface sync → Task 9a ✅

**Placeholder scan:** no "TBD", "TODO", "implement later", "appropriate", "handle edge cases". One placeholder pattern is `YYYY-MM-DD` in Task 9a Steps 3-4 — that's intentional (filled at execution time with the actual go-live date) and explicitly noted in the task body.

**Type consistency:** build script's `renderSpec` / `renderHandAuthoredPage` / `copyStatic` functions defined once in Task 5, signatures stable. `_headers` file extension addition in Task 8 Step 4 modifies `copyStatic` with a single ENOENT-tolerant copy — consistent with existing pattern.

**Cloudflare-side tasks bounded:** Tasks 7 + 8 are explicitly Cloudflare-dashboard work with step-by-step UI checklists. No code-tool can execute these; they're documented for whoever runs the plan. Verification probes (Task 9) are CLI-executable so completion can be checked from any shell.

**Prospect-equivalent risks surfaced:**
- DNS propagation may take >60s on first add → Task 8 Step 3 notes "wait 2 more minutes and retry"
- SSL cert provisioning may take 1-2 min → same step
- `application/ld+json` content-type isn't default in Cloudflare Pages → Task 8 Step 4 ships `_headers` fix
- First Cloudflare Pages build may fail if Node version mismatched → Task 7 Step 3 sets `NODE_VERSION=20` env var

**Open §9 questions touched:** none directly (Plan 02 is infrastructure; §9 questions are content/governance).

---

## Execution handoff

Plan complete and saved to `aria-knowledge-spec/docs/superpowers/plans/2026-05-21-spec-dns-pages-visual-template.md`.

Two execution options when you're ready:

1. **Inline execution** (recommended for Plan 02) — `superpowers:executing-plans`. Plan 02's in-repo tasks (0-6) form a continuous build-pipeline chain that benefits from warm context; Cloudflare-side tasks (7-8) are step-by-step dashboard checklists where context drift isn't a risk; final acceptance probes (9, 9a) are mechanical. One session likely sufficient.
2. **Subagent-driven** — `superpowers:subagent-driven-development`. Defensible but adds orchestration overhead with no obvious precision win for Plan 02's shape.

Tasks 0-6 are sequential (build pipeline assembly). Task 7 must come after 0-6 are pushed. Task 8 must come after 7. Task 9 must come after 8. Task 9a runs after 9 passes.

Estimated wall-clock: ~3-6 hours for in-repo work + ~30 minutes Cloudflare dashboard + DNS propagation wait + ~15 minutes acceptance probes + Task 9a sibling sync. Half-day to one-day total, matching the prospect's estimate.
