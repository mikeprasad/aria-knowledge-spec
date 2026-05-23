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
