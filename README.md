# FeatureFacts

Know what a product can do, where the evidence lives, and which capabilities still need review.

FeatureFacts is the Terrain layer of [xFacts](https://xfacts.dev). The public heading is **xFacts label**. The root file is `FEATURE_FACTS.md`. The register is `.featurefacts/`.

This is a sibling of AppFacts, not an AppFacts field. A folder is not a feature. A candidate is not a confirmed capability. Zero rows is a valid label.

Current scope: TypeScript/Node repositories. Run the CLI from a FeatureFacts checkout. It is not published on npm and does not become a runtime dependency of the app you scan.

## Install

```bash
git clone https://github.com/Catalyst-Forge-LLC/feature-facts
cd feature-facts
pnpm install
pnpm featurefacts --help
```

## First scan

```bash
pnpm featurefacts init  --root ../my-app
pnpm featurefacts scan  --root ../my-app
pnpm featurefacts show  --root ../my-app
```

Default scan does not execute target code, use the network, or call a model.

## From candidates to a label

There is no approve command. After scanning, inspect the candidates in `.featurefacts/features.yaml`. Confirm only supported capabilities.

Set `recognition: confirmed` on a feature only when you can attach a declared evidence item: `actor`, `source`, and `recorded_at`. See [docs/CONTRACT.md](docs/CONTRACT.md). A candidate stays a candidate until that declaration exists.

Then edit `.featurefacts/config.yaml`:

- `curation.selected_ids`: up to 12 confirmed, non-retired IDs, in the order you want on the label. See [docs/LABEL.md](docs/LABEL.md).
- `curation.approval`: `actor`, `source`, and `recorded_at` for that selection.
- `publication.target`: `internal` until you intend a public file.

An empty selection is a valid label. `pnpm featurefacts report --root ../my-app` refreshes `FEATURE_FACTS.md` from those files. `pnpm featurefacts check --root ../my-app` checks the projection.

The internal label can link to `.featurefacts/FEATURES.md`. A public label is a separate target. Each public row needs `publication.scope: public` with its own attributed permission. The public label contains only approved fields and does not expose the private register or source locators. Do not upload `.featurefacts/` and do not add a public map link. See [docs/PUBLICATION_AND_SAFETY.md](docs/PUBLICATION_AND_SAFETY.md).

## Development

Static Worker site in `site/`, same shape as toolfacts.dev.

```bash
pnpm preview    # LocalSlip-claimed local port
pnpm ship       # wrangler deploy --config site/wrangler.jsonc
```

## LocalHelm

```bash
localhelm enroll ../feature-facts --apply
```

The plugin lists repos that already have a register. **Add repos** scans a folder the way Fleet and FilePress do. Init writes an empty `FEATURE_FACTS.md` and `.featurefacts/` into each ticked repo and skips one that already has a register. Scan, Check, and Report then run in that repo.

## Spec

See [SPEC.md](SPEC.md). Schemas are CC0. Tooling is MIT.

[See the rest of the Catalyst Forge shelf.](https://catalystforge.com/tools/)
