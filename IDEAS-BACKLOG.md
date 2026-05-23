# aria-knowledge-spec — Ideas Backlog

Per-project ideas backlog for aria-knowledge-spec (the ARIA Knowledge format specification).

Format: each entry includes date, project tag (always `aria-knowledge-spec`), type, proposal, motivation, and source.

---

### 2026-05-20 — aria-knowledge-spec — ARIA Knowledge format v1.0 conformance test suite — ship alongside ratification

**Type:** feature

**Proposal:** Build the conformance test suite that format spec §18.2 references. Test artifacts under the `aria-knowledge-spec` repo at `tests/`:

- `tests/fixtures/cores/` — sample valid Cores covering common shapes (single-archetype items, multi-archetype items, items at each conformance level)
- `tests/fixtures/shards/` — sample valid Shards (frozen exports + provenance chains)
- `tests/fixtures/invalid/` — items that MUST be rejected (missing required base fields, archetype anchor not satisfied, etc.)
- Schema validators for `core.json` manifest + per-item schema + Shard manifest
- MCP-tool contract tests for all 14 `core.*` tools (request/response shape verification)
- Anchor-gate test cases — positive + negative for each of the 31 archetypes' anchor sets
- Provenance-chain reconstruction tests (round-trip Shard export → import → re-export, verify lineage preserved)

Any implementation can claim v1.0 conformance by running the suite against itself and publishing the results. aria-core (the reference impl) runs the suite as part of its CI.

**Motivation:** Per the format spec §18, the conformance test suite ships alongside v1.0 ratification. Without it, "v1.0 conformance" is a claim implementers can make but consumers can't verify — and the "open standard, multi-implementation" credibility evaporates.

Three audiences:
1. **Implementers** (`rust-core`, `python-core`, future Bun port of aria-core, etc.) — to validate their work against the spec
2. **Consumers** (Synapse + third-party registries) — to gate inclusion on conformance results, not on implementer self-claim
3. **Spec governance** — to ratify changes between v1.0 and v1.1/v2.0 with empirical "what passes now vs. what passes then" diff

Effort estimate: ~2-3 weeks of focused work for v1.0 baseline. Grows incrementally as new archetypes/edge cases are added during the RFC window.

**Source:** Format spec v1.0-draft.md §18.2. Open question Appendix D #4 (multi-archetype validation logic) will need test cases here. Filed 2026-05-20 as `knowledge/intake/ideas/2026-05-20-aria-knowledge-spec-conformance-test-suite.md`; promoted to this backlog via 38th-pass audit (Accept→backlog).

---

### 2026-05-23 — aria-knowledge-spec — Editor-side tracking for v0.1 RFC open questions (D.1–D.7) — pre-announcement state

**Type:** tracking

**Proposal:** Internal-side context on each of the 7 v0.1 RFC open questions (canonical text lives in `v1.0-draft.md` Appendix D, lines 1022-1032). Tracks editor's current leaning + likely v2.0-vs-v1.x routing. Lives here (not as a separate private file) per the 2026-05-23 deferral session: IDEAS-BACKLOG.md is committed eventually and the editor-stance content is "honest but unembarrassing to ship publicly."

| # | Appendix D title | Editor leaning today | Likely v2.0 vs v1.x routing |
|---|------------------|----------------------|-----------------------------|
| D.1 | Archetype vocabulary stability (31 archetypes) | Trim is more likely than expand; will defer pruning until ≥3 adopters report which archetypes they use vs ignore. | v2.0 — needs adoption telemetry that doesn't exist yet |
| D.2 | Anchor field set per archetype (§8 bold rows) | Editor judgment is opinionated; ~5 of 31 archetypes are pressure-test-priority (causal, evaluative, observational, prescriptive, predictive). | v1.x patch acceptable for individual anchor refinements; vocabulary structural changes → v2.0 |
| D.3 | Type vocabulary trim (9 types) | 9 feels right; weak signal so far. Watch for publishers who can't classify their content cleanly. | v2.0 — same adoption-telemetry gate as D.1 |
| D.4 | Multi-archetype validation logic (independent vs aggregate) | Independent gate (current) is the conservative choice. Aggregate scoring (rationale-density metric) is interesting but introduces tuning knobs. | v1.x if needed; aggregate-only path → v2.0 |
| D.5 | Validation event aggregation ([0,1] vs categorical) | Lean toward keeping categorical; numeric scoring invites false precision. Confidence field already covers numeric. | v1.x patch acceptable; design space tight |
| D.6 | Reference type subtype (`reference_paper` / `_url` / `_internal`) | Lean against splitting at v1.0 — `source.kind` already discriminates. Subtypes feel like duplicated optionality. | v2.0 if RFC surfaces concrete pain |
| D.7 | `scenario` as typed-relation target (vs string match in `applies_when`) | Strong lean toward typed relation, but couples format to `core.relate` (Plan 03 v0.1 deferred → v0.2). | v1.x once `core.relate` ships in v0.2 |

**Motivation:** RFC public comment process is **deferred until ARIA family announcement** (per 2026-05-23 deferral decision). Until then, the GH Issues that would normally be the editor's notepad don't exist. This entry replaces that surface for internal review and lets `/audit-share` or `/distill` consume the editor's current stance when planning Plan 06 (conformance suite) or Plan 09 (demo Cores).

When announcement ships: this entry stays (post-Issue-creation it becomes "editor-side context that didn't go into public Issue bodies"). Plan 01a Task 8's `gh issue create` body templates remain the spec-section-anchored public-facing version.

**Source:** Session 2026-05-23 deferral discussion. Plan 01a Task 8 marked DEFERRED in `docs/superpowers/plans/2026-05-21-format-spec-v0-1-rfc-opening.md:1139`. Reactivation checklist greppable via `REACTIVATE AT ANNOUNCEMENT` across RFC.md + README.md + Plan 01a Task 8.
