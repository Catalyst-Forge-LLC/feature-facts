---
app_facts_version: 0.1.0
name: featurefacts
type: CLI tool
status: active
license: MIT
version: 0.2.1
repository: https://github.com/Catalyst-Forge-LLC/feature-facts
stack:
  language: TypeScript
  runtime: Node.js
  tooling: pnpm
key_dependencies:
  - name: ajv
    purpose: Declared in package.json.
    registry: npm
  - name: ajv-formats
    purpose: Declared in package.json.
    registry: npm
  - name: minimatch
    purpose: Declared in package.json.
    registry: npm
  - name: yaml
    purpose: Declared in package.json.
    registry: npm
build:
  package_manager: pnpm
  test: tsx --test tests/cli.test.ts tests/helm-repos.test.ts
  compile: build script
generated:
  date: 2026-09-29
  generator: "appfacts-cli v0.1.0 (scaffold)"
  inputs_fingerprint: 855a5ee959f5eaf2
credits:
  generated_with: https://appfacts.dev
  built_by: "Catalyst Forge — https://www.catalystforge.com/"
---

# featurefacts

`CLI tool` · **active** · MIT

FeatureFacts: a compact capability label and evidence-backed feature register.

**[Open visual label →][appfacts-label]** · or scan `APP_FACTS.png`

[Repository](https://github.com/Catalyst-Forge-LLC/feature-facts)

### Stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript |
| Runtime | Node.js |
| Tooling | pnpm |

### Key dependencies

- `ajv` (npm) — Declared in package.json.
- `ajv-formats` (npm) — Declared in package.json.
- `minimatch` (npm) — Declared in package.json.
- `yaml` (npm) — Declared in package.json.

### Build

- **Package Manager** — pnpm
- **Test** — tsx --test tests/cli.test.ts tests/helm-repos.test.ts
- **Compile** — build script

---
*Generated with [AppFacts](https://appfacts.dev) · Built by [Catalyst Forge](https://www.catalystforge.com/) · [Visual label][appfacts-label]*

[appfacts-label]: https://appfacts.dev/v#af1.eNqdkk9rwzAMxb9KeGc7YVdfOwaFbpf1NsZQHTdx53_YSlko_e7DSbt7dzG29J5-SNYFZ6gngUDeQOFoiKdsjqS5QIDnVKOb3bbhGB0EChNPBQqk2Z4NBJzVJpQqe93uV4X-hrrAURgmGmpmPyfzrrNNDIE8BbYL7S32pj0toBidDQMUUkgeV4HepAL1cUGosNMZAgkKz0Y7yqZvbGgS6W8aaoUYWgjUkqv7zyWPMXtaennU7W2wnliP__DO5N0jtk-Bw2RdX8d2E315CjSYfB-JAJvCUODy00hZH009Sqedbeut5XKLjMZ5mU2K5Z6AgI4-WVeRC6op639cBRal5ZhnKIzMqaiuGyyP06HV0XcbYnJzYfkS82Dkbrfpbnsi10W5_gJOw8CY
