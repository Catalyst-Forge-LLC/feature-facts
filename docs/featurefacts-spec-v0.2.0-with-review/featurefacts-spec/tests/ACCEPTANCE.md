# Production acceptance scenarios

**Status: pending implementation.** These are required behavior tests for the future production tool, not claims about the package's synthetic fixture generator. The package's executed validation report is `VALIDATION.md`.

| ID | Scenario | Required result | Gate |
|---|---|---|---|
| FF-A01 | Scan a supported fixture and review its candidates | Maintainer recognizes the capabilities, not a renamed file tree | Phase 1 |
| FF-A02 | One capability spans several routes | One reviewed identity with multiple evidence-backed entry points | Phase 1 |
| FF-A03 | Several capabilities share a route/service | Explicit many-to-many associations, no forced merge | Phase 1 |
| FF-A04 | Product-level meaning is ambiguous | Candidate, not a confirmed capability or count contribution | Phase 1 |
| FF-A05 | Released, experimental, plan-and-role gated capability | All dimensions represented without false exclusivity | Phase 1 |
| FF-A06 | Empty or unsupported repository | Diagnostics and a truthful zero-row label | Phase 1 |
| FF-A07 | Skip or fail a test/document adapter | Partial/unassessed dimension, no negative absence finding | Phase 1 |
| FF-A08 | Current evidence references a moved/deleted file | Stale/unresolved locator, no automatic retirement | Phase 1 |
| FF-A09 | Scan unchanged input twice | Stable IDs, preserved approved curation, no semantic churn or gratuitous timestamp writes | Phase 1 |
| FF-A10 | Test filename resembles a feature name | Proposal only, not broad coverage or a confirmed association | Phase 1 |
| FF-A11 | FeatureFacts-generated docs mention a capability | No self-corroboration from outputs or installed skill examples | Phase 1 |
| FF-A12 | Public projection from a private register | No private rows, paths, links, hashes, or count contributions | Phase 1 |
| FF-A13 | Change only a private record | Public label content and generation metadata remain unchanged | Phase 1 |
| FF-A14 | Revoke public approval on a selected feature | Safe filtered output or removal, non-success diagnostic, no current stale disclosure | Phase 1 |
| FF-A15 | Malicious source instructions, secrets, symlinks, oversized files | No instruction following, unsafe reads, source execution, or unsafe output | Phase 1 |
| FF-A16 | Install only the complete skill bundle, no CLI | Local contract available, bounded assisted draft, honest validation limits | Phase 1 |
| FF-A17 | Run on an owner-provided real repository | Reviewed inventory comparison, documented misses/false assertions/correction effort | Phase 1 |
| FF-A18 | Rename a file but retain reviewed source identity | Preserve the feature ID when unambiguous, otherwise request review | Phase 2 |
| FF-A19 | Duplicate display names or ambiguous identity | No name-only silent merge | Phase 2 |
| FF-A20 | Split or merge reviewed capabilities | Retained history and explicit identity migration | Phase 2 |
| FF-A21 | Conflict with locked intent or publication | Preserve declaration and report observation conflict | Phase 2 |
| FF-A22 | Change code while retaining stale map and label | Projection may agree, full source freshness fails | Phase 2 |
| FF-A23 | Add a new eligible file absent from the old index | Full check detects addition by re-enumerating current scope | Phase 2 |
| FF-A24 | Change config, adapter version, or rules | Freshness invalidated without rewriting the baseline during check | Phase 2 |
| FF-A25 | Edit YAML and run report only | All derived artifacts refreshed, source scan basis not falsely advanced | Phase 2 |
| FF-A26 | Same waived finding after rescan | Same basis stays waived, changed basis requires review | Phase 2 |
| FF-A27 | Two writers edit canonical data concurrently | Digest conflict abort, no overwritten human edit | Phase 2 |
| FF-A28 | Crash between artifact replacements | Mixed generation detected by commit-marker digests, recoverable prior state | Phase 2 |
| FF-A29 | Read-only check finds problems | No file changes or baseline acceptance | Phase 2 |
| FF-A30 | Incremental versus full scan | Same semantic output for the same final inputs | Phase 3 |
| FF-A31 | Highly shared infrastructure capability | Raw relations are not automatically a refactoring prescription | Phase 3 |
| FF-A32 | Unknown versus intentionally undisclosed value | Distinct machine and human-readable representations | Phase 1 |

The implementation brief must identify fixture inputs, expected outputs, comparison methods, and ownership of each test. No production acceptance row becomes “passed” solely because the reference package validator succeeds.
