import type { Feature, LabelFrontmatter, Registry } from './types.ts';

function esc(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function availability(row: LabelFrontmatter['features'][number]): string {
  if (row.availability !== 'conditional') return row.availability;
  const extra = row.conditions.map((item) => item.value).join(', ');
  return extra ? `conditional, ${extra}` : 'conditional';
}

export function renderLabelBody(label: LabelFrontmatter): string {
  const lines = [`# Feature Facts: ${esc(label.name)}`, '', 'What can this product do?', ''];
  if (!label.features.length) {
    lines.push(label.empty_reason ?? 'No curated rows.');
    lines.push('');
    lines.push('Zero rows is a valid label. Candidates are not confirmed capabilities.');
  } else {
    lines.push('| Feature | Lifecycle | Availability | Maturity | Documentation | Tests | Evidence |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const row of label.features) {
      lines.push(
        `| ${esc(row.name)} | ${esc(row.lifecycle)} | ${esc(availability(row))} | ${esc(row.maturity)} | ${esc(row.documentation)} | ${esc(row.tests)} | ${esc(row.evidence_state)} |`,
      );
    }
    lines.push('');
    if (label.features.some((row) => row.evidence_state !== 'current')) {
      lines.push('Some rows are stale, unresolved, or declaration-only. Frontmatter is not the only place those limits appear.');
      lines.push('');
    }
  }
  if (label.counts) {
    lines.push(
      `Within the eligible confirmed scope: ${label.counts.registered} registered, ${label.counts.selected} selected, and ${label.counts.unlabeled} not selected.`,
    );
    lines.push('');
  }
  if (label.assessments) {
    for (const [name, rollup] of [
      ['Docs', label.assessments.docs],
      ['Tests', label.assessments.tests],
    ] as const) {
      lines.push(
        `${name}: ${rollup.with_links} of ${rollup.assessed} assessed capabilities have linked evidence. Of ${rollup.eligible} eligible capabilities, ${rollup.partial} are partially assessed, ${rollup.unassessed} unassessed, ${rollup.not_applicable} not applicable, and ${rollup.undisclosed} undisclosed.`,
      );
    }
    lines.push('');
    lines.push('Linked evidence is not a claim that tests pass or documentation is adequate.');
    lines.push('');
  }
  if (label.map) {
    lines.push(`[Open the feature register](${label.map})`);
    lines.push('');
  } else if (label.audience === 'public') {
    lines.push('This public projection does not link to the private register.');
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}

export function renderRegister(registry: Registry, features: Feature[]): string {
  const lines = [
    `# Feature register: ${esc(registry.product.name)}`,
    '',
    `Scan \`${registry.scan_id}\`. Candidates are not confirmed capabilities.`,
    '',
    '| ID | Name | Recognition | Lifecycle | Availability | Docs | Tests | Observation |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const feature of features) {
    lines.push(
      `| \`${feature.id}\` | ${esc(feature.name)} | ${feature.recognition} | ${feature.lifecycle} | ${feature.availability.state} | ${feature.docs.result} | ${feature.tests.result} | ${feature.observation.state} |`,
    );
  }
  if (!features.length) {
    lines.push('');
    lines.push('No feature records yet. Run a scan, then review candidates before confirming anything.');
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}
