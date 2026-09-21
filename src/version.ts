export const TOOL_NAME = 'featurefacts';
export const TOOL_VERSION = '0.2.0';
export const SCHEMA_VERSION = '0.2.0';
export const RULE_SET = { rule_set: 'featurefacts-core', version: '0.2.0' } as const;

export const ADAPTERS = {
  tree: { id: 'typescript-tree', version: '0.2.0', kind: 'tree' },
  surface: { id: 'typescript-node-surface', version: '0.2.0', kind: 'surface' },
  document: { id: 'markdown-document', version: '0.2.0', kind: 'document' },
  test: { id: 'typescript-test', version: '0.2.0', kind: 'test' },
} as const;
