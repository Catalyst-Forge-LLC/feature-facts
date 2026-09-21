export type AdapterKind = 'tree' | 'surface' | 'document' | 'test' | 'graph' | 'history';
export type AdapterState = 'completed' | 'partial' | 'skipped' | 'unsupported' | 'failed';
export type Recognition = 'candidate' | 'confirmed';
export type PublicationTarget = 'internal' | 'public';

export interface Locator {
  path: string;
  content_sha256: string;
  start_line?: number;
  end_line?: number;
  symbol?: string;
}

export interface Provenance {
  adapter_id: string;
  adapter_version: string;
  origin: 'deterministic' | 'agent-assisted' | 'maintainer';
  method: string;
}

export interface Diagnostic {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  path?: string;
}

export interface AdapterMeta {
  id: string;
  version: string;
  kind: AdapterKind;
  state: AdapterState;
  eligible_files: string[];
  inspected_files: string[];
  diagnostics: Diagnostic[];
}

export interface Surface {
  id: string;
  kind:
    | 'file'
    | 'symbol'
    | 'route'
    | 'command'
    | 'job'
    | 'flag'
    | 'permission'
    | 'nav'
    | 'api'
    | 'schema'
    | 'document'
    | 'test'
    | 'other';
  ref: string;
  title?: string;
  locator: Locator;
  provenance: Provenance;
  state: 'current' | 'stale' | 'unresolved';
}

export interface Assessment {
  state: 'assessed' | 'partial' | 'unassessed' | 'not-applicable' | 'undisclosed';
  result: 'linked-evidence' | 'no-linked-evidence' | 'unknown' | 'not-applicable' | 'undisclosed';
  adapter_ids: string[];
  links: Array<{ surface_id: string; association: 'explicit-annotation' | 'static-reference' | 'maintainer-reviewed' }>;
  reason: string;
}

export interface Evidence {
  id: string;
  kind: 'observed' | 'declared' | 'inferred';
  state: 'current' | 'stale' | 'unresolved';
  assertion: { field: string; value: unknown; claim: string };
  locator?: Locator;
  provenance?: Provenance;
  declaration?: { actor: string; source: string; recorded_at: string };
  support_ids?: string[];
  method?: string;
  uncertainty?: 'low' | 'medium' | 'high';
  rationale?: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  type: 'feature' | 'workflow' | 'integration' | 'surface-cluster';
  recognition: Recognition;
  lifecycle: 'implemented' | 'released' | 'stub' | 'retired' | 'unknown' | 'undisclosed';
  availability: {
    state: 'unrestricted' | 'conditional' | 'unavailable' | 'unknown' | 'undisclosed';
    conditions: Array<{ kind: 'plan' | 'role' | 'flag' | 'other'; value: string }>;
    reason: string;
  };
  maturity: 'stable' | 'experimental' | 'deprecated' | 'unknown' | 'undisclosed';
  audiences: { state: 'known' | 'unknown' | 'undisclosed'; values: string[]; reason: string };
  discovery: {
    state: 'assessed' | 'partial' | 'unassessed' | 'undisclosed';
    surfaces: string[];
    adapter_ids: string[];
    reason: string;
  };
  intent: 'public-discovery' | 'limited-discovery' | 'unknown' | 'undisclosed';
  publication: { scope: PublicationTarget; reason: string };
  entry_points: string[];
  implements: string[];
  dependencies: Array<{ target: string; evidence_ids: string[] }>;
  docs: Assessment;
  tests: Assessment;
  observation: { state: 'current' | 'stale' | 'unresolved'; last_seen_scan_id: string | null; reason: string };
  evidence: Evidence[];
  editorial: { locked: string[]; aliases: string[]; notes: string };
  uncertainty_reasons: { lifecycle?: string; maturity?: string; intent?: string };
}

export interface Config {
  schemaVersion: '0.2.0';
  include: string[];
  exclude: string[];
  adapters: Array<{ id: string; kind: AdapterKind; enabled: boolean }>;
  externals: string[];
  curation: {
    selected_ids: string[];
    overrides: Record<string, { name: string }>;
    approval?: { actor: string; source: string; recorded_at: string };
  };
  publication: {
    target: PublicationTarget;
    include_counts: boolean;
    include_assessments: boolean;
    map_link: string | null;
  };
  policy: {
    enabled: boolean;
    rules: Array<{ id: string; level: 'warn' | 'fail' }>;
    unassessed: 'warn' | 'fail' | 'ignore';
  };
  waivers: Array<{
    feature_id: string;
    rule_id: string;
    basis_fingerprint: string;
    reason: string;
    approved_by: string;
    recorded_at: string;
  }>;
  safety: {
    max_file_bytes: number;
    follow_symlinks: false;
    network: false;
    execute_target_code: false;
  };
}

export interface Registry {
  schemaVersion: '0.2.0';
  scan_id: string;
  product: { name: string; type: string; status: string; license?: string };
  features: Feature[];
  redirects: Array<{ from: string; to: string; reason: string; approved_by: string }>;
}

export interface FileRecord {
  path: string;
  sha256: string;
  bytes: number;
  eligible_adapter_ids: string[];
  inspected_by: string[];
}

export interface Exclusion {
  path: string;
  reason: string;
}

export interface Manifest {
  schemaVersion: '0.2.0';
  scan_id: string;
  tool: 'featurefacts';
  tool_version: string;
  generated_at: string;
  root: '.';
  status: 'complete' | 'partial' | 'unsupported' | 'failed';
  scope: {
    include: string[];
    exclude: string[];
    supported_ecosystems: string[];
    files: FileRecord[];
    exclusions: Exclusion[];
  };
  adapters: AdapterMeta[];
  rules_version: string;
  fingerprints: {
    source: string;
    config: string;
    adapters: string;
    rules: string;
    registry: string;
    projection: string;
  };
  artifacts: Array<{ path: string; sha256: string }>;
  diagnostics: Diagnostic[];
}

export interface LabelFrontmatter {
  feature_facts_version: '0.2.0';
  mode: 'map-backed' | 'standalone';
  audience: PublicationTarget;
  name: string;
  type: string;
  status: string;
  license?: string;
  selection_state: 'curated' | 'not-curated' | 'no-eligible-features';
  empty_reason?: string;
  features: Array<{
    id: string;
    name: string;
    lifecycle: string;
    availability: string;
    conditions: Array<{ kind: string; value: string }>;
    maturity: string;
    documentation: string;
    tests: string;
    evidence_state: string;
  }>;
  basis: { kind: 'registry' | 'declaration'; summary: string };
  map?: string;
  counts?: { scope: 'eligible-confirmed-active'; registered: number; selected: number; unlabeled: number };
  assessments?: { docs: Rollup; tests: Rollup };
  generated: {
    date: string;
    generator: string;
    generator_version: string;
    projection_fingerprint: string;
  };
}

export interface Rollup {
  eligible: number;
  assessed: number;
  with_links: number;
  without_links: number;
  partial: number;
  unassessed: number;
  not_applicable: number;
  undisclosed: number;
}

export interface ScanContext {
  root: string;
  config: Config;
  files: FileRecord[];
  exclusions: Exclusion[];
  contents: Map<string, { bytes: Buffer; text: string }>;
}
