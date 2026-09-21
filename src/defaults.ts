import { ADAPTERS, SCHEMA_VERSION } from './version.ts';
import type { Assessment, Config, Feature, Registry } from './types.ts';

export function defaultConfig(): Config {
  return {
    schemaVersion: SCHEMA_VERSION,
    include: [
      'package.json',
      'README.md',
      'CHANGELOG.md',
      'src/**',
      'app/**',
      'lib/**',
      'bin/**',
      'docs/**',
      'tests/**',
      'test/**',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/.env',
      '**/.env.*',
      '**/*.pem',
      '**/*.key',
      '.featurefacts/**',
      'FEATURE_FACTS.md',
      'site/**',
      'examples/**',
      'skill/**',
      'tests/fixtures/**',
      'docs/featurefacts-spec-v0.2.0-with-review/**',
      'docs/haulout-*.md',
    ],
    adapters: [
      { id: ADAPTERS.tree.id, kind: 'tree', enabled: true },
      { id: ADAPTERS.surface.id, kind: 'surface', enabled: true },
      { id: ADAPTERS.document.id, kind: 'document', enabled: true },
      { id: ADAPTERS.test.id, kind: 'test', enabled: true },
    ],
    externals: [],
    curation: {
      selected_ids: [],
      overrides: {},
    },
    publication: {
      target: 'internal',
      include_counts: true,
      include_assessments: true,
      map_link: '.featurefacts/FEATURES.md',
    },
    policy: {
      enabled: false,
      rules: [
        { id: 'released-test-links', level: 'fail' },
        { id: 'locked-locators-resolve', level: 'warn' },
        { id: 'unconfirmed-selection', level: 'fail' },
      ],
      unassessed: 'warn',
    },
    waivers: [],
    safety: {
      max_file_bytes: 1_048_576,
      follow_symlinks: false,
      network: false,
      execute_target_code: false,
    },
  };
}

export function emptyAssessment(reason: string, adapterIds: string[] = []): Assessment {
  return {
    state: 'unassessed',
    result: 'unknown',
    adapter_ids: adapterIds,
    links: [],
    reason,
  };
}

export function emptyRegistry(scanId: string, productName: string): Registry {
  return {
    schemaVersion: SCHEMA_VERSION,
    scan_id: scanId,
    product: {
      name: productName,
      type: 'unknown',
      status: 'unknown',
    },
    features: [],
    redirects: [],
  };
}

export function candidateFeature(partial: Pick<Feature, 'id' | 'name' | 'description'> & Partial<Feature>): Feature {
  return {
    type: 'surface-cluster',
    recognition: 'candidate',
    lifecycle: 'unknown',
    availability: {
      state: 'unknown',
      conditions: [],
      reason: 'Availability is a declaration. Source presence is not a deployment check.',
    },
    maturity: 'unknown',
    audiences: {
      state: 'unknown',
      values: [],
      reason: 'Audience was not declared.',
    },
    discovery: {
      state: 'unassessed',
      surfaces: [],
      adapter_ids: [],
      reason: 'Discovery surfaces were not assessed beyond extracted entry points.',
    },
    intent: 'unknown',
    publication: {
      scope: 'internal',
      reason: 'Internal is the conservative default. Public permission requires an attributed declaration.',
    },
    entry_points: [],
    implements: [],
    dependencies: [],
    docs: emptyAssessment('Documentation association was not assessed for this candidate.'),
    tests: emptyAssessment('Test association was not assessed for this candidate.'),
    observation: {
      state: 'current',
      last_seen_scan_id: null,
      reason: 'Current scan evidence is available.',
    },
    evidence: [],
    editorial: { locked: [], aliases: [], notes: '' },
    uncertainty_reasons: {
      lifecycle: 'Source presence does not establish release status.',
      maturity: 'No attributed maturity declaration.',
      intent: 'Discovery intent was not declared.',
    },
    ...partial,
  };
}
