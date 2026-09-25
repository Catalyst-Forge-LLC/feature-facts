/**
 * Repos FeatureFacts can init from LocalHelm.
 * A repo is a folder with package.json or .git. The walk stops there.
 * A register is `.featurefacts/config.yaml`. Init must not replace one.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

const SKIP = new Set(['node_modules', 'dist', 'coverage', 'build', 'vendor', 'site', 'target']);

export function stateDir(featureFactsRoot) {
	return join(featureFactsRoot, '.featurefacts-helm');
}

export function reposFile(featureFactsRoot) {
	return join(stateDir(featureFactsRoot), 'repos.json');
}

function skipName(name) {
	if (name.startsWith('.') || name.startsWith('__')) return true;
	return SKIP.has(name);
}

export function hasRegister(dir) {
	return existsSync(join(dir, '.featurefacts', 'config.yaml'));
}

export function isRepo(dir) {
	if (existsSync(join(dir, 'package.json'))) return true;
	const git = join(dir, '.git');
	if (!existsSync(git)) return false;
	try {
		const info = statSync(git);
		return info.isDirectory() || info.isFile();
	} catch {
		return false;
	}
}

function keyOf(dir) {
	return resolve(dir).toLowerCase();
}

function rowId(dir, used) {
	const base = basename(dir);
	let id = base;
	if (used.has(id)) id = `${basename(dirname(dir))}__${base}`;
	let n = 2;
	while (used.has(id)) {
		id = `${base}-${n}`;
		n += 1;
	}
	used.add(id);
	return id;
}

/** Child repos under root, including root when it is a repo. Does not write. */
export function discoverRepos(root, maxDepth = 3) {
	const absRoot = resolve(root);
	if (!existsSync(absRoot) || !statSync(absRoot).isDirectory()) {
		throw new Error(`scan root is not a directory: ${root}`);
	}
	const found = [];
	function visit(dir, depth) {
		if (isRepo(dir)) {
			const rel = relative(absRoot, dir).replace(/\\/g, '/') || '.';
			found.push({
				name: basename(dir),
				path: rel,
				absPath: resolve(dir).replace(/\\/g, '/'),
				enrolled: hasRegister(dir),
			});
			return;
		}
		if (depth >= maxDepth) return;
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch (err) {
			if (dir === absRoot) {
				throw new Error(`cannot read ${dir}: ${err instanceof Error ? err.message : String(err)}`);
			}
			return;
		}
		for (const entry of entries) {
			if (!entry.isDirectory() || skipName(entry.name)) continue;
			visit(join(dir, entry.name), depth + 1);
		}
	}
	visit(absRoot, 0);
	found.sort((a, b) => a.path.localeCompare(b.path, undefined, { sensitivity: 'base', numeric: true }));
	return found;
}

export function readRemembered(featureFactsRoot) {
	const file = reposFile(featureFactsRoot);
	if (!existsSync(file)) return [];
	let parsed;
	try {
		parsed = JSON.parse(readFileSync(file, 'utf8'));
	} catch {
		throw new Error(`${file} is not valid JSON. Fix or remove that file before init.`);
	}
	const paths = parsed && Array.isArray(parsed.paths) ? parsed.paths : null;
	if (!paths || paths.some((item) => typeof item !== 'string')) {
		throw new Error(`${file} must be { "paths": [] }. Fix or remove that file before init.`);
	}
	return paths;
}

export function rememberRepos(featureFactsRoot, absPaths) {
	const have = readRemembered(featureFactsRoot);
	const seen = new Set(have.map((item) => keyOf(item)));
	const next = [...have];
	for (const raw of absPaths) {
		const abs = resolve(raw).replace(/\\/g, '/');
		const key = keyOf(abs);
		if (seen.has(key)) continue;
		seen.add(key);
		next.push(abs);
	}
	const dir = stateDir(featureFactsRoot);
	mkdirSync(dir, { recursive: true });
	writeFileSync(reposFile(featureFactsRoot), `${JSON.stringify({ paths: next }, null, 2)}\n`);
	return next;
}

/** Repos that already have a register: workspace walk plus remembered paths. */
export function registeredRepos(featureFactsRoot) {
	const home = resolve(featureFactsRoot);
	const workspace = dirname(home);
	const byKey = new Map();
	function add(dir) {
		const abs = resolve(dir);
		if (!existsSync(abs) || !statSync(abs).isDirectory() || !hasRegister(abs)) return;
		byKey.set(keyOf(abs), abs);
	}
	try {
		for (const row of discoverRepos(workspace, 3)) {
			if (row.enrolled) add(row.absPath);
		}
	} catch {
		add(home);
	}
	add(home);
	for (const saved of readRemembered(home)) add(saved);
	const used = new Set();
	return [...byKey.values()]
		.sort((a, b) => basename(a).localeCompare(basename(b), undefined, { sensitivity: 'base' }))
		.map((dir) => {
			const rel = relative(workspace, dir).replace(/\\/g, '/') || '.';
			return {
				id: rowId(dir, used),
				name: basename(dir),
				path: rel,
				absPath: resolve(dir).replace(/\\/g, '/'),
			};
		});
}
