import { equal, ok } from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { discoverRepos, hasRegister, readRemembered, registeredRepos, rememberRepos } from '../scripts/helm-repos.mjs';

function repo(dir: string, withRegister = false): void {
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, 'package.json'), '{}\n');
	if (!withRegister) return;
	mkdirSync(join(dir, '.featurefacts'), { recursive: true });
	writeFileSync(join(dir, '.featurefacts', 'config.yaml'), 'schema: 1\n');
}

test('discover lists repos and marks an existing register', () => {
	const root = mkdtempSync(join(tmpdir(), 'ff-helm-'));
	try {
		repo(join(root, 'fresh'));
		repo(join(root, 'done'), true);
		mkdirSync(join(root, 'fresh', 'node_modules', 'nested'), { recursive: true });
		writeFileSync(join(root, 'fresh', 'node_modules', 'nested', 'package.json'), '{}\n');
		const rows = discoverRepos(root);
		equal(rows.map((row) => row.name).join(','), 'done,fresh');
		equal(rows.find((row) => row.name === 'done')?.enrolled, true);
		equal(rows.find((row) => row.name === 'fresh')?.enrolled, false);
		ok(!hasRegister(join(root, 'fresh')));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('registered repos keep a remembered path outside the walk', () => {
	const root = mkdtempSync(join(tmpdir(), 'ff-helm-home-'));
	const outside = mkdtempSync(join(tmpdir(), 'ff-helm-out-'));
	try {
		repo(root, true);
		repo(outside, true);
		rememberRepos(root, [outside]);
		const listed = registeredRepos(root).map((row) => row.absPath.toLowerCase());
		ok(listed.some((item) => item === outside.replace(/\\/g, '/').toLowerCase()));
		equal(readRemembered(root).length, 1);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(outside, { recursive: true, force: true });
	}
});
