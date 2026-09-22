# FeatureFacts

Know what a product can do, where the evidence lives, and which capabilities still need review.

FeatureFacts is the Terrain layer of [xFacts](https://xfacts.dev). The public heading is **xFacts label**. The root file is `FEATURE_FACTS.md`. The register is `.featurefacts/`.

This is a sibling of AppFacts, not an AppFacts field. A folder is not a feature. A candidate is not a confirmed capability. Zero rows is a valid label.

## Status

Phase 1 vertical slice: TypeScript/Node scanner, sibling Worker site at [featurefacts.dev](https://featurefacts.dev), LocalHelm plugin, LocalSlip preview claim.

## Install

```bash
pnpm install
pnpm featurefacts --help
```

## Commands

```bash
pnpm featurefacts init --root ./my-app
pnpm featurefacts scan --root ./my-app
pnpm featurefacts show --root ./my-app
pnpm featurefacts report --root ./my-app
pnpm featurefacts check --root ./my-app
```

Default scan does not execute target code, use the network, or call a model. It never adds a runtime dependency to the target app.

## Site

Static Worker site in `site/`, same shape as toolfacts.dev.

```bash
pnpm preview    # LocalSlip-claimed local port
pnpm ship       # wrangler deploy --config site/wrangler.jsonc
```

## LocalHelm

```bash
localhelm enroll ../feature-facts --apply
```

The plugin exposes scan / check / report on the Sites board.

## Spec

See [SPEC.md](SPEC.md). Schemas are CC0. Tooling is MIT.
