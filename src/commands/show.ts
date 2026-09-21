import { renderLabelBody, renderRegister } from '../render.ts';
import { loadLabel, loadRegistry, workspaceAt } from '../workspace.ts';

export function showCommand(root: string, featureId?: string): string {
  const ws = workspaceAt(root);
  const registry = loadRegistry(ws);
  if (featureId) {
    if (!registry) throw new Error('No register found.');
    const feature = registry.features.find((item) => item.id === featureId);
    if (!feature) throw new Error(`Unknown feature: ${featureId}`);
    return `${JSON.stringify(feature, null, 2)}\n`;
  }
  const label = loadLabel(ws);
  if (label) {
    return `---\n${JSON.stringify(label.data, null, 2)}\n---\n\n${label.body}`;
  }
  if (registry) return renderRegister(registry, registry.features);
  return renderLabelBody({
    feature_facts_version: '0.2.0',
    mode: 'map-backed',
    audience: 'internal',
    name: 'unknown',
    type: 'unknown',
    status: 'unknown',
    selection_state: 'not-curated',
    empty_reason: 'No FeatureFacts artifacts found. Run featurefacts init.',
    features: [],
    basis: { kind: 'registry', summary: 'Missing register.' },
    generated: {
      date: '1970-01-01',
      generator: 'featurefacts',
      generator_version: '0.2.0',
      projection_fingerprint: '0'.repeat(64),
    },
  });
}
