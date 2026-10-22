import type { Feature, LabelFrontmatter, Registry } from './types.ts';

function esc(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function availability(row: LabelFrontmatter['features'][number]): string {
  if (row.availability !== 'conditional') return row.availability;
  const extra = row.conditions.map((item) => item.value).join(', ');
  return extra ? `conditional, ${extra}` : 'conditional';
}

function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/** One sentence per dimension, without "0 of 0" or "1 are". Zero buckets are left out. */
export function rollupSentence(name: string, rollup: NonNullable<LabelFrontmatter['assessments']>['docs']): string {
  if (rollup.eligible === 0) return `${name}: no eligible capabilities.`;
  const assessed = `${rollup.assessed} assessed ${rollup.assessed === 1 ? 'capability' : 'capabilities'}`;
  const lead =
    rollup.assessed === 0
      ? `${name}: no capability is fully assessed.`
      : rollup.with_links === 0
        ? `${name}: ${rollup.assessed === 1 ? 'the 1 assessed capability has no' : `none of the ${assessed} has`} linked evidence.`
        : `${name}: ${rollup.with_links} of ${assessed} ${rollup.with_links === 1 ? 'has' : 'have'} linked evidence.`;
  const rest = (
    [
      [rollup.partial, 'partially assessed'],
      [rollup.unassessed, 'unassessed'],
      [rollup.not_applicable, 'not applicable'],
      [rollup.undisclosed, 'undisclosed'],
    ] as const
  )
    .filter(([count]) => count > 0)
    .map(([count, what]) => `${count} ${count === 1 ? 'is' : 'are'} ${what}`);
  if (!rest.length) return lead;
  return `${lead} Of ${rollup.eligible} eligible ${rollup.eligible === 1 ? 'capability' : 'capabilities'}, ${listJoin(rest)}.`;
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
      lines.push(rollupSentence(name, rollup));
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
