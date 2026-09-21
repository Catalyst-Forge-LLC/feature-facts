# Synthetic examples

All product names, feature claims, declarations, adapters, gaps, and counts in this directory are **synthetic**. They illustrate the data contract. They are not a scan, audit, or evaluation of Exec Foundry or any real application. Source descriptors are read as text, never executed.

| Example | What it demonstrates |
|---|---|
| `demo-repository/` | Complete artifact set, confirmed and candidate records, released experimental gated capability, internal-only admin capability, approved curation, and a waiver |
| `partial-scan-repository/` | Failed test adapter, stale retained test evidence, unassessed current tests, and no fabricated no-test finding |
| `empty-repository/` | Unsupported product extraction and a valid zero-row label |
| `FEATURE_FACTS.md` | Main label with the map link adapted to this package's directory layout |
| `PUBLIC_FEATURE_FACTS.md` | Filtered public label with no private names, map link, or private count contributions |
| `STANDALONE_FEATURE_FACTS.md` | Attributed declaration-only mode without registry-wide counts or source-freshness claims |
| `sample-feature.yaml` | One complete feature record |
| `sample-registry.yaml` | Versioned canonical registry envelope |
| `sample-config.yaml` | Complete target config, including root README and entry-point include examples |
| `sample-gaps.yaml` | Scope-bound findings with stable rule identity and projected waiver |
| `sample-detector-result.json` | Typed adapter boundary |

The complete repository examples are the canonical cross-file validation fixtures. Locator paths resolve relative to each example repository root. The small `sample-*` excerpts use the same source root as `demo-repository/`. The top-level label's link is adapted for navigation, while `demo-repository/FEATURE_FACTS.md` has the exact target-root form.

To regenerate synthetic artifacts after intentional contract changes:

```sh
python tools/build_fixtures.py
python tools/validate_package.py
```

The generator has hard-coded synthetic observations. It does not discover capabilities or establish that a real scanner works.
