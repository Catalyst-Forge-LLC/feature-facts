# Skill distribution and validation

## Build from the spec package

Run `python tools/package_skill.py --output /tmp/featurefacts-skill` from the spec package. The output folder is a self-contained skill bundle:

```text
featurefacts-skill/
  SKILL.md
  FEATUREFACTS_LITE.md
  requirements-validation.txt
  references/
  schemas/
  examples/
  tests/
  tools/
```

Copy the whole folder to the agent harness's supported skill location, such as `.agents/skills/featurefacts/` when that harness uses this convention. Do not assume every agent uses the same install path. No external skill installation service is required for this package operation.

Schemas, references, and examples are local resources. The skill must not fetch schema IDs over the network or require the FeatureFacts CLI to read the contract.

## Validate an installed bundle

```sh
python -m pip install -r /path/to/featurefacts-skill/requirements-validation.txt
python /path/to/featurefacts-skill/tools/validate_package.py
```

The command validates the bundled synthetic examples. It does **not** validate a target application merely because it was run from that application's directory.

For a target that already contains a complete 0.2.0 artifact set, run:

```sh
python /path/to/featurefacts-skill/tools/validate_package.py --target /path/to/target-repository
```

This validates target artifact structures, supported semantic reference checks, existing indexed source hashes, and artifact digests. It does not discover new unindexed files, implement all production finding rules, or replace the production `featurefacts check` full source-freshness pass. The command's output must preserve this distinction.

Installing dependencies requires the user's normal development-environment authorization and may use a package index. Validation itself is offline. A clean skill-only environment with missing Python or dependencies has an unvalidated fallback, not an assumed pass.

## Packaging safety

The bundle includes synthetic examples only, no user repository data. Output is confined to a newly created or explicitly replaceable destination chosen by the user. The packager refuses a nonempty destination unless explicitly told to replace it, and does not overwrite source package directories.
