# ARIA Knowledge Format — v0.1 RFC

**Status:** Draft RFC. The spec at [`v1.0-draft.md`](v1.0-draft.md) is currently versioned `0.1.0-rfc`. Ratification target: Phase 2 of the [aria-synapse build sequence](https://github.com/mikeprasad/aria-synapse/blob/main/docs/superpowers/specs/2026-05-19-aria-synapse-design.md#7-v1-scope-sequencing-deferrals).

<!-- REACTIVATE AT ANNOUNCEMENT: restore the original "How to comment" section (3 bullets: RFC comment Issue template + direct PR for editorial fixes + Conformance bug Issue template). Defer-source: Plan 01a Task 8 — DEFERRED state. -->

## Pre-announcement state

This RFC is in **pre-announcement state** — the public comment process is not yet open. The 7 substantive open questions are listed below for reference; tracking Issues will be created at ARIA family announcement.

For pre-announcement private feedback, contact the editor (see "Editor" section below).

Issue templates (`RFC comment` + `Conformance bug`) are pre-staged in `.github/ISSUE_TEMPLATE/` and will become discoverable when the comment process opens.

## What's open during RFC

- Archetype vocabulary (31 archetypes; trim/expand based on adoption signal)
- Per-archetype anchor sets (editor judgment may differ from RFC consensus)
- Type vocabulary (9 user-facing types; pressure-test welcome)
- Multi-archetype validation logic (aggregate scoring vs independent gate)
- Validation event aggregation
- Reference-type subtypes
- Scenario `applies_when` typing

<!-- REACTIVATE AT ANNOUNCEMENT: restore original line "All 7 are tracked as Issues with the `rfc-open-question` label." Defer-source: Plan 01a Task 8 — DEFERRED state. -->
Tracking Issues will be created at ARIA family announcement (see [Plan 01a Task 8](docs/superpowers/plans/2026-05-21-format-spec-v0-1-rfc-opening.md)).

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
