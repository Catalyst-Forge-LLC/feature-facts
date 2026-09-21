# Identity, merge, freshness, and safe output

## Identity and merge

Match by the immutable feature ID or an explicitly approved alias. A unique reviewed entry-point identity or stable source annotation can help preserve identity across a path move. Display names and path adjacency alone cannot authorize a merge. If several matches remain plausible, keep the prior record and report an identity conflict rather than guessing.

Keep candidates separate from confirmed features. A grouping change, split, or merge requires an explicit reviewed migration. Retain old records and, for a merged identity, a redirect from the retired source to the retained target. A split retains the original retired record plus explicitly reviewed successor records. Do not reuse retired IDs for unrelated capabilities.

The scanner can add current source observations, refresh assessment states, propose candidates, and mark old evidence stale. It cannot invent a maintainer declaration, overwrite approved publication permission, rename IDs, silently replace selected rows, or erase reviewed distinctions.

Preserve supported editorial locks. A current observation that conflicts with a locked declaration produces a conflict for review. The lock does not make the observation disappear or turn a stale locator into a current one. Automated evidence freshness and adapter outcomes are not lockable.

## Missing evidence and retirement

Loss of a locator first affects evidence freshness. A parser failure, changed include pattern, unsupported file type, disabled adapter, or out-of-scope move cannot establish that the capability no longer exists.

Retirement is **explicitly reviewed only** in 0.2.0. Require `lifecycle: retired`, a declared lifecycle assertion, and `editorial.retirement` containing an actor, reason, and evidence IDs. Preserve the record, aliases, and history. A completed scan can suggest retirement, but cannot apply it automatically.

A stale feature can retain a prior lifecycle declaration while visibly showing stale or unresolved evidence. Never rephrase a historical assertion as a new observation merely to keep its value in sync. Historical stale assertions can retain old values and cannot support a different current field value.

## Two separate checks

**Projection consistency:** Regenerate expected logical projections from the canonical registry and config. Compare label frontmatter, label body, `features.json`, both association indexes, findings, the readable register, and manifest artifact digests. This can detect an edited YAML registry whose generated siblings were not refreshed.

**Source freshness:** Re-enumerate safe scoped inputs using the effective inclusion and exclusion rules. Recompute path/byte/hash records and exclusion outcomes. Compare source, scan-config, adapter-version, and rule-set fingerprints to the stored manifest. Do not run application code. Freshness must detect changed, added, removed, or renamed eligible inputs, not merely compare the hashes of files that happened to be in the old manifest.

Default `check` performs both. `check --projection` explicitly performs only consistency. The latter may pass for a stale label and stale map, so its output must not say the register is current with source.

Standalone labels have no automatic map-to-source check. Report source freshness as unavailable or not applicable, with the declaration's stated verification limits.

## Fingerprint domains

Use SHA-256 and the canonical JSON profile in `LABEL.md`.

| Manifest fingerprint | Inputs |
|---|---|
| `source` | Sorted admitted `{path, sha256, bytes}` records and sorted exclusion outcomes |
| `config` | Effective include/exclude settings, adapter configuration, externals, and safety settings |
| `adapters` | Sorted adapter IDs, versions, and kinds |
| `rules` | Deterministic declared rule-set identity/version in this draft, with a version bump for any behavior change |
| `registry` | The complete canonical registry data |
| `projection` | Label frontmatter excluding `generated` |

For rules, the default core identity is `{"rule_set":"featurefacts-core","version":"0.2.0"}`. A production implementation must version behavior-changing rule or adapter updates, not leave this constant while changing extraction semantics. A future digest-of-binary/cache identity can strengthen this without pretending the current draft specifies it.

Curation, publication target, and policies are not scan inputs. They can be changed and rendered without claiming a new extraction. Their effects are detected by projection comparison and current policy evaluation. The source/config/adapter/rule scan fingerprints remain unchanged during report-only rendering, unless they have actually been verified by a new scan. Do not rewrite them to make a stale map appear fresh.

The manifest stores exact-byte hashes of committed artifacts separately. Those detect mixed generations, even when a semantic projection comparison excludes timestamps.

## Reports, snapshots, and diffs

`report` reads canonical config and registry plus retained surfaces and scan metadata, then refreshes every dependent artifact from one assembled state. It does not claim a rescan. If scan settings changed, retain the old scan fingerprint and report stale configuration until scanning occurs. A report may refresh registry and label fingerprints without changing the recorded source scan basis.

Compare full previous registry/surface/config snapshots for semantic diffs. A manifest alone does not contain prior feature records. Git-backed baselines are optional, read-only inputs, not a license to run repository hooks. Keep snapshots or use a named existing revision without assuming the user has committed all editorial changes.

An unchanged rescan must preserve IDs, curation, declarations, and output semantic content. Do not update generation timestamps or write output files solely because time has passed. Compare semantic data before writing. A public projection must remain byte-stable across private-only changes when its public content did not change.

## Check results and exit semantics

Findings and validity are separate. Policy is disabled by default, but structural validation, reference integrity, source freshness, and operational errors are not disabled by policy.

| Exit | Meaning |
|---|---|
| `0` | Checks performed for the requested mode passed, with optional explicitly reported warnings |
| `1` | Stale inputs/projections or a configured failing policy finding |
| `2` | Invalid schema, references, curation, or contract state |
| `3` | Operational failure or inability to complete the required inspection/check |

When multiple categories apply, choose `3`, then `2`, then `1`, then `0`, and report all diagnostics. An unsupported required surface scan is not a successful full check. A deliberately disabled optional assessment can remain unassessed, with policy controlling warn/fail/ignore for that condition. A failed configured required parser is operational failure regardless of warn-only policy.

`check` is read-only. It must not update baselines, accept waivers, rewrite files, or “fix” fingerprints. Any repair belongs to an explicit write command.

Starter policy rules are `released-test-links`, `locked-locators-resolve`, and `unconfirmed-selection`. A released-test-links rule applies only to released confirmed features. A fully assessed no-linked-evidence result can violate it. An unassessed result is handled by `policy.unassessed`, not converted to zero tests.

## Findings and durable waivers

The first fixture rules are `docs-linked-evidence` and `tests-linked-evidence`. They generate scope-bound no-linked findings for confirmed non-retired features only. A stable finding ID is `gap-` plus the first 24 hex characters of the canonical hash of `[feature_id, rule_id]`.

A basis fingerprint includes feature ID, rule ID/version, the relevant assessment, its evidence, and the named relevant adapter results. Waivers are stored in config, not in the generated gaps file. The same basis preserves a waiver. A changed basis projects `needs-review`, rather than silently renewing the waiver. A no-longer-applicable rule emits no active finding, but the waiver record remains available.

Evidence of partial coverage is not a no-tests finding. Documentation exceptions do not belong in discovery intent. A specific failure-path action requires evidence of that failure condition. Otherwise ask for assessment or association review, not an invented missing test.

## Safe write protocol

Do not claim that several independent filesystem renames are collectively atomic. Use a single-writer lock, stage files on the same filesystem, validate the entire staged state, and compare the initial canonical registry/config byte digests immediately before commit. Abort and reconcile on a concurrent edit.

Commit artifacts with atomic single-file replacement, then write the manifest **last** as a commit marker containing exact-byte artifact hashes. Readers verify those hashes and reject mixed generations. Preserve a recovery snapshot or transaction journal until the commit marker is safely written. A crash must be detectable and recoverable, not mislabeled a successful scan.

Do not overwrite unrelated files. No-op generations do not write. Publication-safety cleanup can remove or replace a now-disallowed public label even when invalid curation prevents normal completion, but must leave an explicit diagnostic and cannot expose the previous unsafe label as the current result.

The production implementation must test these behaviors. The package validator does not implement concurrent writers, filesystem transactions, arbitrary-repository enumeration, or an actual scan/merge engine.
