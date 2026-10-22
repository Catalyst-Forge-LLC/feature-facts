# FeatureFacts

Know what a product can do, where the evidence lives, and which capabilities still need review.

FeatureFacts is part of [xFacts](https://xfacts.dev). It keeps a register of a repo's capabilities in `.featurefacts/` and writes a short label, `FEATURE_FACTS.md`, from the ones a maintainer confirms. A scan only proposes candidates; nothing reaches the label until someone selects it. With nothing selected, no label is written.

Scope: TypeScript/Node repositories. Requires Node 22.18 or newer. It is not a runtime dependency of the app you scan.

## Workflow

```bash
npx @xfacts/featurefacts init   --root ../my-app
npx @xfacts/featurefacts scan   --root ../my-app
npx @xfacts/featurefacts review --root ../my-app
npx @xfacts/featurefacts review --apply --root ../my-app --actor "Your Name" \
  --id cmd-scan --id cmd-serve --name "cmd-serve=Read-only server"
npx @xfacts/featurefacts check  --root ../my-app
```

1. `init` creates `.featurefacts/` with the default config. It refuses to run where a register exists, because it would replace the selection.
2. `scan` finds candidates and updates the register. It reads files only: it does not run code, use the network, or call a model.
3. `review` lists candidates as JSON: ID, name, recognition, docs and test signs, and whether each is on the label.
4. `review --apply` confirms the IDs you name, in label order (up to 12), and writes the label. Confirm only capabilities you can stand behind.
5. `check` fails when the label, register, or source are out of date. `check --projection` checks only the label against the register.
6. Commit all of `.featurefacts/`, including `manifest.json`, with `FEATURE_FACTS.md`. Without the manifest, `check` cannot judge freshness in a fresh clone or CI.

`report` rewrites `FEATURE_FACTS.md` after a hand edit, and removes it when nothing is selected. `show` prints the label, or `show ID` one capability's record.

## What scan finds

- **Commands:** `.command()` calls, `cmd === 'x'` checks, and `case 'x':` in a `switch` on an argv value, in files that read `process.argv`. A `switch (method)` in an MCP or JSON-RPC handler is not a command. The package `bin` is a capability only when no subcommands are visible.
- **Aliases:** names that share one branch (`case 'health': case 'scrape-health':`, `cmd === 'start' || cmd === 'serve'`) are one candidate; the others go in `editorial.aliases`. A name that was already confirmed keeps its ID.
- **Routes:** route calls whose path starts with `/`, SvelteKit `routes` files (`+server`, `+page`, `+page.server`, and pages with only `+page.svelte`), and `route.ts` files that export an HTTP handler such as `GET` (Next.js). A file named `server.ts` or `route.ts` is not a capability by name alone. A header lookup such as `.get('accept')` is not a route.
- **Route IDs:** `route-` plus the URL path, without the HTTP verb, so `POST /plans/:id/accept` and `routes/plans/[id]/accept/+server.ts` are both `route-plans-id-accept`. A one-segment path or `/api/x` uses its last segment (`route-deck`). A row confirmed under an older verb ID such as `route-post-plans-id-accept` keeps it, with the path ID as an alias.
- **Annotations** in source (not `package.json` prose) name or group capabilities explicitly.
- **Not surfaces:** commands and routes inside comments (line, block, and JSDoc); annotations are the only comments scan reads. Test code (`test/`, `tests/`, `__tests__/`, `fixtures/`, `e2e/`, `*.test.*`, `*.spec.*`) counts only as test evidence. Generated trees (`.svelte-kit`, `.next`, coverage) are skipped.

When a candidate is no longer seen:

- After a complete scan, an unconfirmed candidate is dropped. It holds no review, and a later scan proposes it again if the code returns.
- After a partial or failed scan it stays, marked stale, because the adapter may have missed it.
- A candidate no scan ever located (such as a product-name row seeded from `package.json`) is always dropped.
- Confirmed rows, IDs in `curation.selected_ids` or `curation.overrides`, and rows with locked fields are always kept, marked stale.

## Config

`init` writes `.featurefacts/config.yaml`; `scan` writes it when a register has none. The default include list is root `package.json`, `README.md`, `CHANGELOG.md`, root `*.js`, `*.mjs`, `*.cjs`, and `*.ts` files, and `src/`, `app/`, `apps/`, `packages/`, `lib/`, `bin/`, `client/`, `server/`, `web/`, `docs/`, `tests/`, `test/`. Root tool configs (`*.config.*` such as `vite.config.ts`, and `.eslintrc.*`) are excluded. A root `package.json` is not required; one under `web/` or `packages/` is enough.

A config keeps its own include list when defaults change. To catch up an older config:

```bash
npx @xfacts/featurefacts refresh-config --root ../my-app            # list changes
npx @xfacts/featurefacts refresh-config --root ../my-app --write    # apply them
npx @xfacts/featurefacts refresh-config --root ../my-app --include 'viewer/**' --write
```

It proposes default patterns that match something in the repo (a root glob only when a root script exists that is not a tool config or a plugin such as `localhelm.plugin.mjs`; a folder only when it holds code), any other top-level folder with its own `package.json` or `src/` and code (such as `ui/` or `viewer/`) unless an exclude covers it, and the tool-config excludes when a root glob would read a config file. The selection, approval, and other settings are kept; YAML comments are not. The config fingerprint changes, so run `scan` and `report` again before committing.

Curation fields in `config.yaml`, which `review --apply` writes:

- `curation.selected_ids`: up to 12 confirmed, non-retired IDs, in label order. See [docs/LABEL.md](docs/LABEL.md).
- `curation.overrides`: label names by ID, from `--name ID=Name`. `--name ID=` removes one. The register keeps the scan name.
- `curation.approval`: `actor` (`--actor`, default `git config user.name`; FeatureFacts will not invent an approver), `source` (`--source`, default `featurefacts review`), and `recorded_at` with the local UTC offset. The label's `generated.date` is the local day of the scan.
- `publication.target`: `internal` until you intend a public file.

`review --apply` with no `--id` clears the selection and removes the label. Each confirmed capability gets `recognition: confirmed` (and `lifecycle: implemented` if it was unknown) with a declared evidence item. To confirm by hand instead, attach that declaration yourself (`actor`, `source`, `recorded_at`; see [docs/CONTRACT.md](docs/CONTRACT.md)) and run `report`.

## Publishing

The internal label can link to `.featurefacts/FEATURES.md`. A public label is a separate target: each public row needs `publication.scope: public` with its own attributed permission, and the public label carries only approved fields, with no register or source locators. Do not upload `.featurefacts/` or add a public map link. See [docs/PUBLICATION_AND_SAFETY.md](docs/PUBLICATION_AND_SAFETY.md).

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

A reader can see the conditions and follow the evidence instead of assuming every route is a released feature. Linked tests mean an association was found, not that the tests ran or proved adequate coverage. This is a synthetic format example; see its [complete register](https://github.com/Catalyst-Forge-LLC/feature-facts/blob/main/examples/demo-repository/.featurefacts/features.yaml), [selection](https://github.com/Catalyst-Forge-LLC/feature-facts/blob/main/examples/demo-repository/.featurefacts/config.yaml), and [label](https://github.com/Catalyst-Forge-LLC/feature-facts/blob/main/examples/demo-repository/FEATURE_FACTS.md).

## Development

The static Worker site is in `site/`.

```bash
pnpm preview    # LocalSlip-claimed local port
pnpm ship       # wrangler deploy --config site/wrangler.jsonc
```

## LocalHelm

```bash
localhelm enroll ../feature-facts --apply
```

The plugin lists repos that have a register. **Add repos** finds repos in a folder; Init writes `.featurefacts/` into each ticked repo that has none. **Label** on a row shows `FEATURE_FACTS.md` and the checklist. Update label writes it.

## Spec

See [SPEC.md](SPEC.md). Schemas are CC0. Tooling is MIT.

[See the rest of the Catalyst Forge shelf.](https://catalystforge.com/tools/)
