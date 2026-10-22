# FeatureFacts

Know what a product can do, where the evidence lives, and which capabilities still need review.

FeatureFacts is the Terrain layer of [xFacts](https://xfacts.dev). The public heading is **xFacts label**. The root file is `FEATURE_FACTS.md`. The register is `.featurefacts/`.

This is a sibling of AppFacts, not an AppFacts field. A folder is not a feature. A candidate is not a confirmed capability. `FEATURE_FACTS.md` is written only when at least one capability is selected. An empty selection stays in the register and does not publish a label.

Current scope: TypeScript/Node repositories. Install `@xfacts/featurefacts` (Node 22.18 or newer). It does not become a runtime dependency of the app you scan.

## Install

```bash
npx @xfacts/featurefacts --help
```

## First scan

```bash
npx @xfacts/featurefacts init  --root ../my-app
npx @xfacts/featurefacts scan  --root ../my-app
npx @xfacts/featurefacts show  --root ../my-app
npx @xfacts/featurefacts review --root ../my-app
```

Default scan does not execute target code, use the network, or call a model. It records CLI subcommands (`.command()` calls, plus `cmd === 'x'` checks and `case 'x':` labels of a `switch` on an argv value in files that read `process.argv`; a `switch (method)` in an MCP or JSON-RPC handler is not a command), HTTP routes whose path starts with `/`, and SvelteKit `routes` files. A header lookup such as `.get('accept')` is not a route. Generated trees (`.svelte-kit`, `.next`, coverage) are skipped. The package `bin` is not its own capability when subcommands are visible.

## From candidates to a label

After scanning, inspect the candidates. `review` prints them as JSON (ID, name, recognition, docs and test signs, and whether each is on the label). Confirm only supported capabilities.

`review --apply` is the approve step. Name the IDs for the label, in order, and who approved them:

```bash
npx @xfacts/featurefacts review --apply --root ../my-app --actor "Your Name" --id cmd-scan --id cmd-serve
```

It marks each named capability `confirmed` (and `implemented` if its lifecycle was unknown) with a declared evidence item, sets `curation.selected_ids` (up to 12) and `curation.approval`, then refreshes `FEATURE_FACTS.md`. `--actor` defaults to `git config user.name`; FeatureFacts will not invent an approver. `--source` records where the review happened (default `featurefacts review`; the LocalHelm plugin passes its own name). Running it with no `--id` clears the selection and removes the label. Unnamed capabilities stay candidates in the register.

To do the same by hand, set `recognition: confirmed` on a feature only when you can attach a declared evidence item: `actor`, `source`, and `recorded_at`. See [docs/CONTRACT.md](docs/CONTRACT.md). A candidate stays a candidate until that declaration exists.

Then edit `.featurefacts/config.yaml`:

- `curation.selected_ids`: up to 12 confirmed, non-retired IDs, in the order you want on the label. See [docs/LABEL.md](docs/LABEL.md).
- `curation.approval`: `actor`, `source`, and `recorded_at` for that selection.
- `publication.target`: `internal` until you intend a public file.

`npx @xfacts/featurefacts report --root ../my-app` refreshes `FEATURE_FACTS.md` when a selection exists, and removes that file when nothing is selected. `npx @xfacts/featurefacts check --root ../my-app` checks that the label matches the register and config, and that the register is fresh against source (`check --projection` skips the source part).

The internal label can link to `.featurefacts/FEATURES.md`. A public label is a separate target. Each public row needs `publication.scope: public` with its own attributed permission. The public label contains only approved fields and does not expose the private register or source locators. Do not upload `.featurefacts/` and do not add a public map link. See [docs/PUBLICATION_AND_SAFETY.md](docs/PUBLICATION_AND_SAFETY.md).

## One candidate becomes a useful label row

In a scan, a resume-import route is a **candidate**. Its presence alone does not establish that importing works, who can use it, or whether it belongs on a public label.

The [Workshop Demo fixture](https://github.com/Catalyst-Forge-LLC/feature-facts/tree/main/examples/demo-repository/) shows a reviewed capability. Its register includes this recognition evidence (shortened excerpt):

```yaml
id: resume-importer
name: Resume import
recognition: confirmed
evidence:
  - id: resume-importer-recognition
    kind: declared
    state: current
    assertion:
      field: recognition
      value: confirmed
      claim: The synthetic maintainer declares recognition.
    declaration:
      actor: Fixture Maintainer
      source: decisions/features.md
      recorded_at: '2026-09-19T20:00:00Z'
```

The fixture's selection includes `resume-importer` and an attributed approval. Reporting produces this internal label row:

| Feature | Lifecycle | Availability | Maturity | Documentation | Tests | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Resume import | released | conditional: Pro plan, member role | experimental | linked-evidence | linked-evidence | current |

A reader can see the conditions and follow the evidence instead of assuming every route is a released feature. Linked tests mean an association was found, not that the tests ran or proved adequate coverage. This is a synthetic format example; see its [complete register](https://github.com/Catalyst-Forge-LLC/feature-facts/blob/main/examples/demo-repository/.featurefacts/features.yaml), [selection](https://github.com/Catalyst-Forge-LLC/feature-facts/blob/main/examples/demo-repository/.featurefacts/config.yaml), and [label](https://github.com/Catalyst-Forge-LLC/feature-facts/blob/main/examples/demo-repository/FEATURE_FACTS.md). The snippets above are incomplete records. A public projection still needs the separate permissions described above.

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

The plugin lists repos that already have a register. **Add repos** scans a folder the way Fleet and FilePress do. Init writes `.featurefacts/` into each ticked repo and skips one that already has a register. It does not write `FEATURE_FACTS.md` until a capability is selected. **Label** on a row shows that file and the checklist. Scan refreshes the list. Update label is the write.

## Spec

See [SPEC.md](SPEC.md). Schemas are CC0. Tooling is MIT.

[See the rest of the Catalyst Forge shelf.](https://catalystforge.com/tools/)
