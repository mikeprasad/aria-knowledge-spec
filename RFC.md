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
