# ARIA Knowledge Format Specification

> **v0.1 RFC open.** This spec is in its open-comment window. See [RFC.md](RFC.md) for how to comment, [CONTRIBUTING.md](CONTRIBUTING.md) for scope rules, and the [7 open questions tracked as Issues](https://github.com/mikeprasad/aria-knowledge-spec/issues?q=label%3Arfc-open-question). Ratification target: aria-synapse Phase 2.

The **ARIA Knowledge format** is an open, MCP-native specification for typed, validated, structured knowledge that AI agents and humans can both read, write, and reason over.

A **Core** is a structured knowledge repository conforming to this format. Cores can be self-hosted on a filesystem, SQLite, or Postgres backend; they can be published to registries; they can be composed via portable Shards and live Exocore subscriptions.

This is the canonical specification. Multiple implementations are welcome and encouraged.

## Current version

- **v1.0 (draft)** — see [`v1.0-draft.md`](./v1.0-draft.md)
- Status: Draft pending RFC consolidation
- To be ratified after community feedback window

## License

This specification is licensed under the [Apache License 2.0](./LICENSE).

This matches the MCP-adjacent license posture (MCP SDKs use Apache 2.0). Implementers are granted a perpetual, worldwide, royalty-free patent license to use any claims embodied in this specification.

## Implementations

- **[`aria-core`](https://github.com/mikeprasad/aria-core)** — Reference implementation (CC BY-NC-SA 4.0)
- Third-party implementations welcome — `rust-core`, `python-core`, etc. Build to v1.0 conformance using this spec + the conformance test suite (ships alongside v1.0 ratification).

## Related projects

- **`aria-synapse`** — Open platform that hosts and publishes Cores conforming to this format
- **`aria-knowledge`** — Claude Code plugin (conversational client on a Core)
- **`aria-cowork`** — Claude Cowork plugin (conversational client on a Core)
- **`aria-hypergraph`** — Visual client (proprietary; protocol-aligned)

## Governance

Editor: Mike Prasad. A 3–5 person editorial body is planned for v2.0, drawn from RFC participants and active implementers.

Discussion happens at this repo's GitHub Issues. RFC submissions follow the v0.1 RFC process (described in v1.0-draft Appendix D).

## Why this exists

Adjacent registries cover adjacent artifacts: GitHub for code, Hugging Face for models, npm/PyPI for packages, the MCP Registry for servers. No open, MCP-native, agent-readable, validation-rich format for structured knowledge currently exists. ARIA Knowledge fills that gap.

The format's core proposition: **a Core captures not only WHAT but WHY**. Knowledge structured for AI agent reuse needs alternatives considered, criteria applied, causal mechanisms, validation outcomes — all as first-class fields, not afterthought prose.
