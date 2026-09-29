---
app_facts_version: 0.1.0
name: FeatureFacts
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

# FeatureFacts

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

[appfacts-label]: https://appfacts.dev/v#af1.eNqdkk9rwzAMxb9KeGcnYVdfMwqFbpf1NsZQHTdx63_YSlko_e7DSbt7dzG29J5-SNYVF8gXAU9OQ2KjiaekN6Q4Q4DnWKLdbltxCBYCmYmnDAlSbC4aAtYo7XORvW33q0KdIa-w5IeJhpLZz1F_qGQiQyBNns1Cew-9bk4LKARr_ACJ6KPDTaDXMUN-XuEL7HSBQITEq1aWku4r46tI6kxDqRB8A4FScnX_uepjSI6WXp51O-ONI1bjP7wzOfuM7UvgMBnbl7HdRd-OPA06PUYiwDozJDj_VHVdHlU5cqusacqt4XyPjNq6OukY8iMBARVcNLYgF1SV1_-4CSxKwyHNkBiZY5ZtOxgep0Ojgms7YrJz5noT0qDr3a5rj-ue1MdlUW6_wdTAWA
