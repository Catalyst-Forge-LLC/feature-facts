# Revision decision log

Recorded September 19, 2026. These decisions implement the supplied review while preserving the two-layer, local-first product.

| ID | Decision | Rationale |
|---|---|---|
| FF-D01 | Use draft format version 0.2.0 | The contract changes are breaking, and silent 0.1.0 replacement would be misleading. |
| FF-D02 | Separate lifecycle, availability, maturity, audience, discovery, intent, publication, and observation state | These are independent dimensions, not mutually exclusive statuses. |
| FF-D03 | Bind evidence to a field value and distinguish observation, declaration, and inference | A route citation must not silently justify release, coverage, or publication. |
| FF-D04 | Require attributed confirmation of product-level capabilities | Deterministic extraction need not pretend to solve product naming without review. |
| FF-D05 | Keep unknown distinct from undisclosed | An unperformed assessment is not an intentional disclosure decision. |
| FF-D06 | Replace normalized health scores with scope-bound association assessments | The first release can establish links more reliably than test or documentation adequacy. |
| FF-D07 | Store ordered selection, name overrides, and waivers in config | Regeneration needs a durable editorial source of truth. |
| FF-D08 | Support explicit standalone declaration mode | A label without a register must state its provenance and verification limits. |
| FF-D09 | Permit zero-row labels with a reason | Empty, unsupported, unconfirmed, and uncurated outcomes must not force invention. |
| FF-D10 | Make public output opt-in and whitelist-only | Private rows can leak through counts, links, hashes, and metadata as well as text. |
| FF-D11 | Disable public map links until a sanitized exporter is specified | A supplied URL is not evidence that its destination is safe to publish. |
| FF-D12 | Retire features only by explicit review in this revision | Missing detector evidence is too ambiguous for automatic product retirement. |
| FF-D13 | Separate projection consistency from source freshness | A stale map and stale label can agree while both are out of date. |
| FF-D14 | Use staging plus a manifest commit marker, not an unsupported multi-file atomicity claim | Readers need to detect and recover from mixed generations. |
| FF-D15 | Use `test-index.json`, not `coverage.json` | The artifact records associations, not executed code coverage. |
| FF-D16 | Bundle skill instructions, schemas, references, examples, and validation | The no-CLI path must have local access to its contract. |
| FF-D17 | Keep one ecosystem and move real-repository review into the first useful slice | Capability recognition and edit retention matter more than early adapter breadth. |
| FF-D18 | Keep tests/docs assessment freshness out of editorial locks | A lock cannot preserve a false current assessment after an adapter failure. |
| FF-D19 | Treat example declarations and counts as synthetic | The package does not establish facts about Exec Foundry or any other real product. |
| FF-D20 | Keep the production stack unselected | The Python reference harness is development validation, not implementation architecture. |

## Deliberately not resolved by this package

The owner still chooses the production stack, first ecosystem, release packaging, private dogfood repository, and locally appropriate recognition/correction-effort thresholds. Those choices belong in the implementation brief. They do not block the revised artifact contract or require adding a platform.
