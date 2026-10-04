import { execFileSync } from 'node:child_process';
import { reportCommand } from './report.ts';
import type { Feature } from '../types.ts';
import { loadConfig, loadRegistry, workspaceAt, writeYaml } from '../workspace.ts';

const LABEL_LIMIT = 12;
const REVIEW_SOURCE = 'LocalHelm FeatureFacts review';

export interface ReviewFeature {
  id: string;
  name: string;
  recognition: string;
  selected: boolean;
  summary: string;
}

export function reviewSnapshot(root: string): { limit: number; features: ReviewFeature[] } {
  const ws = workspaceAt(root);
  const registry = loadRegistry(ws);
  if (!registry) throw new Error('No register found. Run Scan before Review.');
  const config = loadConfig(ws);
  const selected = new Set(config.curation.selected_ids);
  return {
    limit: LABEL_LIMIT,
    features: registry.features.map((feature) => ({
      id: feature.id,
      name: feature.name,
      recognition: feature.recognition,
      selected: selected.has(feature.id),
      summary: reviewSummary(feature, selected.has(feature.id)),
    })),
  };
}

export function gitActor(root: string): string {
  try {
    const name = execFileSync('git', ['-C', root, 'config', 'user.name'], {
      encoding: 'utf8',
      windowsHide: true,
    }).trim();
    if (name) return name;
  } catch {
    // Fall through to the same message as an empty name.
  }
  throw new Error('Set git user.name before confirming capabilities. FeatureFacts will not invent who approved them.');
}

/** Tick the capabilities that belong on the label. Unticked rows stay in the register. */
export function curateSelection(root: string, ids: string[], actor: string): { selected: string[]; wroteLabel: boolean } {
  const name = actor.trim();
  if (!name) throw new Error('Set git user.name before confirming capabilities. FeatureFacts will not invent who approved them.');
  if (ids.length > LABEL_LIMIT) {
    throw new Error(`A label holds at most ${LABEL_LIMIT} capabilities. Untick down to ${LABEL_LIMIT}.`);
  }
  const unique = [...new Set(ids)];
  const ws = workspaceAt(root);
  const registry = loadRegistry(ws);
  if (!registry) throw new Error('No register found. Run Scan before Review.');
  const known = new Set(registry.features.map((feature) => feature.id));
  for (const id of unique) {
    if (!known.has(id)) throw new Error(`No capability ${id}. Run Scan, then review again.`);
  }
  const recordedAt = new Date().toISOString();
  for (const feature of registry.features) {
    if (!unique.includes(feature.id)) continue;
    feature.recognition = 'confirmed';
    // A scan cluster may only stay a candidate. Confirming it promotes the row to a feature.
    if (feature.type === 'surface-cluster') feature.type = 'feature';
    ensureDeclared(feature, 'recognition', 'confirmed', name, recordedAt);
    if (feature.lifecycle === 'unknown') {
      feature.lifecycle = 'implemented';
      delete feature.uncertainty_reasons.lifecycle;
      ensureDeclared(feature, 'lifecycle', 'implemented', name, recordedAt);
    }
  }
  const config = loadConfig(ws);
  config.curation.selected_ids = unique;
  config.curation.approval = { actor: name, source: REVIEW_SOURCE, recorded_at: recordedAt };
  writeYaml(ws.featuresPath, registry);
  writeYaml(ws.configPath, config);
  const reported = reportCommand(root);
  return { selected: unique, wroteLabel: reported.changed.includes('FEATURE_FACTS.md') || unique.length > 0 };
}

function reviewSummary(feature: Feature, selected: boolean): string {
  const where = feature.evidence.find((item) => item.locator?.path)?.locator?.path;
  const state = feature.recognition === 'confirmed' ? 'Confirmed' : 'Candidate';
  const place = selected ? 'On the label.' : 'Not on the label.';
  return where ? `${state}. ${place} Seen in ${where}.` : `${state}. ${place}`;
}

function ensureDeclared(
  feature: Feature,
  field: 'recognition' | 'lifecycle',
  value: string,
  actor: string,
  recordedAt: string,
): void {
  const existing = feature.evidence.find(
    (item) => item.kind === 'declared' && item.assertion.field === field && item.assertion.value === value && item.state === 'current',
  );
  if (existing) return;
  feature.evidence.push({
    id: `${feature.id}-${field}`,
    kind: 'declared',
    state: 'current',
    assertion: {
      field,
      value,
      claim: `Confirmed in LocalHelm as ${value}.`,
    },
    declaration: {
      actor,
      source: REVIEW_SOURCE,
      recorded_at: recordedAt,
    },
  });
}
