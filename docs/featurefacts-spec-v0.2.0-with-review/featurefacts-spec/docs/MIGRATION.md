# Migration from 0.1.0 to 0.2.0

This is a breaking draft revision. Back up the original artifacts before migrating. No production migration executable is included. The old package remains separate from this updated ZIP.

## Do not invent information to satisfy the new schema

An old value can be retained as an attributed historical declaration only when its original source is known. Do not fabricate a maintainer, a release decision, a confidence value, or a publication approval. Unresolved values become unknown, or remain stale historical evidence with an explicit limitation. Candidates can remain unconfirmed while evidence is gathered.

| Old contract | New contract | Migration rule |
|---|---|---|
| Record-only `features.yaml` without a wrapper | `registry.schema.json` envelope | Add version, scan ID, product, features, and redirects. |
| `status: shipped` | `lifecycle: released` | Requires a release declaration. Otherwise use unknown or retain a flagged historical claim. |
| `status: gated` | `availability.state: conditional` | Supply declared conditions. Do not guess the lifecycle. |
| `status: experimental` | `maturity: experimental` | Establish lifecycle and availability separately. |
| `status: stub` | `lifecycle: stub` | Attach supporting implementation evidence. |
| `status: dead` | `lifecycle: retired` only with review | Otherwise retain the identity as stale/unresolved, not automatically retired. |
| `status: orphaned` | `observation.state: stale` or `unresolved` | This was an evidence association problem, not a product lifecycle. |
| `visibility: landing/in-app` | `discovery.surfaces` with scope and evidence | Do not assert global absence of other surfaces. |
| `visibility: admin` | Known admin audience, and separately observed discovery | Audience is not publication permission. |
| `visibility: hidden` | Scoped unobserved discovery plus intent, where known | Do not treat hidden as defective or publicly disclosable. |
| `intent: public` | `intent: public-discovery` | This does not become `publication.scope: public`. |
| `intent: intentional-hidden` | `intent: limited-discovery` | Preserve the attributed owner's reason. |
| `intent: tribal-knowledge` | Config waiver for a documentation finding | Never use discovery intent to waive unrelated docs/tests rules. |
| Arbitrary locks | Closed supported editorial field names | Remap or flag obsolete names. No silent typo acceptance. |
| Route locator with no filename | Surface semantic ref plus source locator | Resolve the source path and exact byte hash. Mark unresolved when unavailable. |
| Generic evidence string | Field-bound observed, declared, or inferred evidence | A route citation is not automatically reused for unrelated claims. |
| Optional 0-to-1 scores | Assessment states and linked-evidence rollups | Do not convert a score into a claim of adequacy or zero tests. |
| `covers: broad/happy-path/failures` | Accepted test associations, with reviewed evidence where available | Breadth is no longer inferred from a filename or link. |
| Independently edited `depended_by` | Derived reverse edges | Outgoing dependencies remain authoritative. |
| `coverage.json` | `test-index.json` | Explicitly record associations, not code coverage. |
| Generated `gaps.yaml` edited for dismissal | Canonical config waiver plus generated disposition | Preserve reason, actor, rule/feature identity, and basis. |
| Label-owned and map-owned facts mixed | Explicit map-backed or standalone mode | Keep one clear ownership model. |
| Missing curation contract | Approved ordered `selected_ids` and name-only overrides | Preserve selection order. Do not fill rows automatically. |
| Private map-wide counts in labels | Publication-filtered denominators | Recompute from eligible confirmed active capabilities. |
| 16-character label-only fingerprint | 64-character SHA-256 projection plus source/config/adapter/rule/registry fingerprints | Projection agreement is not source freshness. |
| Public link to private map | No public map link in 0.2.0 | A sanitized exporter is deferred. |

## Migration sequence

1. Preserve an untouched snapshot of the 0.1.0 files.
2. Create versioned registry/config envelopes and inventory unresolved fields.
3. Resolve source locators and provenance where supported. Keep unknowns explicit.
4. Separate candidate grouping from maintainer-confirmed capability identity.
5. Record curation, publication decisions, aliases, locks, and waivers with their real provenance.
6. Generate the label, association indexes, and findings from one assembled state.
7. Run structural, semantic, projection, and source-freshness checks separately. Review all unresolved or stale items before publishing.

The schema endpoints and field layout are draft. A future format revision must provide its own migration notes instead of silently accepting incompatible records.
