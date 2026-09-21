"""Offline helpers for the FeatureFacts spec fixtures, not a production scanner.

Requires the development dependencies in requirements-validation.txt.
No target code, hooks, configuration modules, or test runners are executed.
"""
from __future__ import annotations

import copy
import hashlib
import json
import re
from urllib.parse import quote
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

VERSION = "0.2.0"


class ContractError(ValueError):
    """Invalid package data or unsafe input representation."""


class UniqueSafeLoader(yaml.SafeLoader):
    pass


def _mapping(loader: UniqueSafeLoader, node: yaml.MappingNode, deep: bool = False) -> dict:
    if any(key.tag == "tag:yaml.org,2002:merge" for key, _ in node.value):
        raise ContractError("YAML merge keys are not accepted")
    out = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if not isinstance(key, str):
            raise ContractError("Object keys must be strings")
        if key in out:
            raise ContractError(f"Duplicate YAML key: {key}")
        out[key] = loader.construct_object(value_node, deep=deep)
    return out


UniqueSafeLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _mapping)


def canonical(value: Any) -> bytes:
    """The spec's restricted JSON profile: sorted keys, UTF-8, no whitespace."""
    try:
        return json.dumps(value, sort_keys=True, separators=(",", ":"),
                          ensure_ascii=False, allow_nan=False).encode("utf-8")
    except (TypeError, ValueError) as exc:
        raise ContractError("Data must be JSON-compatible, with dates stored as strings") from exc


def digest(value: Any) -> str:
    return hashlib.sha256(canonical(value)).hexdigest()


def file_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_yaml_text(text: str) -> Any:
    if len(text.encode("utf-8")) > 8 * 1024 * 1024:
        raise ContractError("Validation input exceeds 8 MiB")
    # The contract forbids aliases and anchors, including recursive collections.
    for token in yaml.scan(text):
        if isinstance(token, (yaml.tokens.AliasToken, yaml.tokens.AnchorToken)):
            raise ContractError("YAML anchors and aliases are not accepted")
    result = yaml.load(text, Loader=UniqueSafeLoader)
    canonical(result)
    return result


def read_yaml(path: Path) -> Any:
    return load_yaml_text(path.read_text(encoding="utf-8"))


def write_yaml(path: Path, value: Any) -> None:
    canonical(value)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(value, sort_keys=False, allow_unicode=True), encoding="utf-8")


def read_label(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    match = re.match(r"\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\Z)", text, re.DOTALL)
    if not match:
        raise ContractError(f"Missing frontmatter in {path}")
    return load_yaml_text(match.group(1))


def schema_tools(schema_dir: Path) -> tuple[dict, Registry]:
    schemas = {}
    resources = []
    for path in sorted(schema_dir.glob("*.schema.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(data)
        schemas[path.name.removesuffix(".schema.json")] = data
        resources.append((data["$id"], Resource.from_contents(data)))
    # No retrieval callback is installed. Unknown $refs fail, without network access.
    return schemas, Registry().with_resources(resources)


def schema_errors(name: str, data: Any, tools: tuple[dict, Registry]) -> list[str]:
    schemas, resources = tools
    validator = Draft202012Validator(schemas[name], registry=resources,
                                    format_checker=FormatChecker())
    return [f"{name}:{'/'.join(map(str, e.absolute_path))}: {e.message}"
            for e in sorted(validator.iter_errors(data), key=lambda e: str(e.absolute_path))]


def scan_config(config: dict) -> dict:
    return {key: config[key] for key in ("include", "exclude", "adapters", "externals", "safety")}


def source_fingerprint(scope: dict) -> str:
    files = [{k: item[k] for k in ("path", "sha256", "bytes")} for item in scope["files"]]
    return digest({"files": sorted(files, key=lambda x: x["path"]),
                   "exclusions": sorted(scope["exclusions"], key=lambda x: (x["path"], x["reason"]))})


def adapter_fingerprint(adapters: list[dict]) -> str:
    return digest(sorted([{k: a[k] for k in ("id", "version", "kind")} for a in adapters],
                         key=lambda a: a["id"]))


def eligible_features(registry: dict, config: dict) -> list[dict]:
    public = config["publication"]["target"] == "public"
    def publicly_approved(feature: dict) -> bool:
        return feature["publication"]["scope"] == "public" and any(
            e["kind"] == "declared" and e["state"] == "current"
            and e["assertion"]["field"] == "publication"
            and e["assertion"]["value"] == feature["publication"]
            for e in feature["evidence"])
    return [f for f in registry["features"]
            if f["recognition"] == "confirmed" and f["lifecycle"] != "retired"
            and (not public or publicly_approved(f))]


def assessment_label(value: dict) -> str:
    if value["state"] == "partial":
        return "partial"
    return value["result"]


def rollup(features: list[dict], axis: str) -> dict:
    out = dict.fromkeys(("eligible", "assessed", "with_links", "without_links", "partial",
                         "unassessed", "not_applicable", "undisclosed"), 0)
    out["eligible"] = len(features)
    for feature in features:
        value = feature[axis]
        state = value["state"].replace("-", "_")
        out[state] += 1
        if state == "assessed":
            out["with_links" if value["result"] == "linked-evidence" else "without_links"] += 1
    return out


def project_label(registry: dict, config: dict, date: str = "2026-09-19") -> dict:
    eligible = eligible_features(registry, config)
    by_id = {f["id"]: f for f in eligible}
    selected = [by_id[i] for i in config["curation"]["selected_ids"] if i in by_id]
    rows = []
    for f in selected:
        rows.append({"id": f["id"],
                     "name": config["curation"]["overrides"].get(f["id"], {}).get("name", f["name"]),
                     "lifecycle": f["lifecycle"], "availability": f["availability"]["state"],
                     "conditions": copy.deepcopy(f["availability"]["conditions"]),
                     "maturity": f["maturity"], "documentation": assessment_label(f["docs"]),
                     "tests": assessment_label(f["tests"]), "evidence_state": f["observation"]["state"]})
    result = {"feature_facts_version": VERSION, "mode": "map-backed",
              "audience": config["publication"]["target"], **registry["product"],
              "selection_state": "curated" if rows else ("not-curated" if eligible else "no-eligible-features"),
              "features": rows,
              "basis": {"kind": "registry", "summary": "Curated capabilities within the declared survey and publication scope."}}
    if not rows:
        result["empty_reason"] = ("Eligible capabilities await approved label selection." if eligible
                                  else "No confirmed capabilities are eligible for this label.")
    publication = config["publication"]
    if publication["map_link"] is not None and publication["target"] == "internal":
        result["map"] = publication["map_link"]
    if publication["include_counts"]:
        result["counts"] = {"scope": "eligible-confirmed-active", "registered": len(eligible),
                            "selected": len(rows), "unlabeled": len(eligible)-len(rows)}
    if publication["include_assessments"]:
        result["assessments"] = {axis: rollup(eligible, axis) for axis in ("docs", "tests")}
    result["generated"] = {"date": date, "generator": "featurefacts-spec-fixture",
                           "generator_version": VERSION, "projection_fingerprint": digest(result)}
    return result


def gap_basis(feature: dict, axis: str, adapters: list[dict], rule_version: str = VERSION) -> str:
    adapter_ids = set(feature[axis]["adapter_ids"])
    return digest({"feature_id": feature["id"], "rule_id": f"{axis}-linked-evidence", "rule_version": rule_version,
                   "assessment": feature[axis],
                   "evidence": [e for e in feature["evidence"] if e["assertion"]["field"] == axis],
                   "adapters": sorted([a for a in adapters if a["id"] in adapter_ids], key=lambda a: a["id"])})


def build_gaps(registry: dict, config: dict, manifest: dict) -> dict:
    """Fixture implementation of the two scope-bound missing-link rules only."""
    gaps = []
    for f in registry["features"]:
        if f["recognition"] != "confirmed" or f["lifecycle"] == "retired":
            continue
        for axis in ("docs", "tests"):
            assessment = f[axis]
            if assessment["state"] != "assessed" or assessment["result"] != "no-linked-evidence":
                continue
            rule_id = f"{axis}-linked-evidence"
            basis = gap_basis(f, axis, manifest["adapters"])
            waiver = next((w for w in config["waivers"] if w["feature_id"] == f["id"] and w["rule_id"] == rule_id), None)
            state = "open" if waiver is None else ("waived" if waiver["basis_fingerprint"] == basis else "needs-review")
            term = "documentation" if axis == "docs" else "test"
            gaps.append({"id": "gap-"+digest([f["id"], rule_id])[:24], "feature_id": f["id"],
                         "rule_id": rule_id, "rule_version": VERSION,
                         "kind": "no-linked-docs" if axis == "docs" else "no-linked-tests",
                         "severity": "warn", "applicability": "applicable",
                         "reason": "The named adapters completed the supported scope without an accepted association.",
                         "evidence_ids": [e["id"] for e in f["evidence"] if e["assertion"]["field"] == axis],
                         "adapter_ids": assessment["adapter_ids"],
                         "text": f"No linked {term} evidence was found for {f['name']} in the inspected scope.",
                         "suggested_action": f"Review {f['id']} and add an explicit {term} association, or record a justified waiver.",
                         "basis_fingerprint": basis,
                         "disposition": {"state": state, "reason": waiver["reason"] if waiver else "No applicable waiver."}})
    return {"schemaVersion": VERSION, "scan_id": registry["scan_id"], "gaps": gaps}


def semantic_errors(registry: dict, config: dict, surfaces: dict, manifest: dict | None = None,
                    label: dict | None = None, gaps: dict | None = None, indexes: dict | None = None,
                    source_root: Path | None = None) -> list[str]:
    """Reference integrity and fixture-level guarantees after structural validation."""
    errors: list[str] = []
    def err(code: str, message: str) -> None:
        errors.append(f"{code}: {message}")
    def unique(items: list[str], code: str) -> None:
        if len(items) != len(set(items)):
            err(code, "IDs must be unique")
    features = registry["features"]
    unique([f["id"] for f in features], "duplicate-feature-id")
    unique([s["id"] for s in surfaces["surfaces"]], "duplicate-surface-id")
    unique([a["id"] for a in config["adapters"]], "duplicate-config-adapter")
    by_id = {f["id"]: f for f in features}
    by_surface = {s["id"]: s for s in surfaces["surfaces"]}
    unique([e["id"] for f in features for e in f["evidence"]], "duplicate-evidence-id")
    reserved = list(by_id)
    for f in features:
        reserved.extend(f["editorial"]["aliases"])
    unique(reserved, "alias-collision")
    redirects = registry["redirects"]
    unique([r["from"] for r in redirects], "duplicate-redirect")
    for r in redirects:
        if r["from"] not in by_id or r["to"] not in by_id or r["from"] == r["to"]:
            err("invalid-redirect", str(r))
        elif by_id[r["from"]]["lifecycle"] != "retired":
            err("redirect-not-retired", r["from"])
    def check_cycle(graph: dict[str, list[str]], code: str) -> None:
        visited, active = set(), set()
        def visit(node: str) -> None:
            if node in active:
                err(code, node)
                return
            if node in visited:
                return
            visited.add(node)
            active.add(node)
            for target in graph.get(node, []):
                visit(target)
            active.remove(node)
        for node in graph:
            visit(node)
    check_cycle({r["from"]: [r["to"]] for r in redirects}, "redirect-cycle")
    adapters = {a["id"]: a for a in manifest["adapters"]} if manifest else {}
    if manifest:
        unique([a["id"] for a in manifest["adapters"]], "duplicate-manifest-adapter")
        if manifest["scan_id"] != registry["scan_id"] or surfaces["scan_id"] != registry["scan_id"]:
            err("scan-id-mismatch", "Artifacts disagree")
        unique([item["path"] for item in manifest["scope"]["files"]], "duplicate-scope-path")
        if manifest["fingerprints"]["source"] != source_fingerprint(manifest["scope"]):
            err("source-index-fingerprint", "Stored scope index is inconsistent")
        if manifest["fingerprints"]["config"] != digest(scan_config(config)):
            err("config-fingerprint", "Scan configuration changed")
        if manifest["fingerprints"]["adapters"] != adapter_fingerprint(manifest["adapters"]):
            err("adapter-fingerprint", "Adapter identities changed")
        if manifest["fingerprints"]["registry"] != digest(registry):
            err("registry-fingerprint", "Manifest does not match canonical registry")
        if manifest["status"] == "complete" and any(a["state"] in ("failed", "partial", "unsupported") for a in adapters.values()):
            err("false-complete-scan", "An adapter did not complete")
        if manifest["status"] == "complete" and not any(a["kind"] == "surface" and a["state"] == "completed" for a in adapters.values()):
            err("false-complete-scan", "No surface detector completed")
        if any(a["state"] == "failed" for a in adapters.values()) and manifest["status"] not in ("partial", "failed"):
            err("failure-status-mismatch", "Failed adapter requires partial or failed scan status")
        source_paths = {x["path"] for x in manifest["scope"]["files"]}
        for a in adapters.values():
            if not set(a["inspected_files"]) <= set(a["eligible_files"]) <= source_paths:
                err("adapter-scope-mismatch", a["id"])
            if a["state"] == "completed" and set(a["eligible_files"]) != set(a["inspected_files"]):
                err("incomplete-adapter", a["id"])
        if set(adapters) != {a["id"] for a in config["adapters"]}:
            err("configured-adapter-mismatch", "Every configured adapter needs an outcome")
        for configured in config["adapters"]:
            a = adapters.get(configured["id"])
            if a and (a["kind"] != configured["kind"] or (not configured["enabled"] and a["state"] != "skipped")):
                err("configured-adapter-state", configured["id"])
        for item in manifest["scope"]["files"]:
            if any(i not in adapters for i in item["eligible_adapter_ids"]+item["inspected_by"]):
                err("unknown-file-adapter", item["path"])
            eligible = {a["id"] for a in adapters.values() if item["path"] in a["eligible_files"]}
            inspected = {a["id"] for a in adapters.values() if item["path"] in a["inspected_files"]}
            if set(item["eligible_adapter_ids"]) != eligible or set(item["inspected_by"]) != inspected:
                err("file-adapter-index-mismatch", item["path"])
        if source_root:
            for item in manifest["scope"]["files"]:
                path = source_root / item["path"]
                if not path.exists() or path.is_symlink() or not path.resolve().is_relative_to(source_root.resolve()):
                    err("source-missing", item["path"])
                elif file_digest(path) != item["sha256"] or path.stat().st_size != item["bytes"]:
                    err("source-stale", item["path"])
    def locator_check(locator: dict, state: str, context: str) -> None:
        if locator.get("end_line", 0) < locator.get("start_line", 0) and "end_line" in locator:
            err("reversed-lines", context)
        path_text = locator["path"]
        if path_text == "FEATURE_FACTS.md" or path_text.startswith((".featurefacts/", ".agents/skills/featurefacts/")):
            err("self-evidence", context)
        parts = Path(path_text).parts
        if any(p in (".git", "node_modules", "dist", "build", "vendor") for p in parts) or Path(path_text).name.startswith(".env") or path_text.endswith((".pem", ".key")):
            err("excluded-evidence", context)
        if source_root and state == "current":
            path = source_root/path_text
            if not path.exists() or path.is_symlink() or not path.resolve().is_relative_to(source_root.resolve()):
                err("unresolved-current-locator", context)
            elif file_digest(path) != locator["content_sha256"]:
                err("stale-current-locator", context)
            elif locator.get("end_line", locator.get("start_line", 1)) > max(1, len(path.read_text(encoding="utf-8").splitlines())):
                err("line-out-of-bounds", context)
    for s in by_surface.values():
        locator_check(s["locator"], s["state"], s["id"])
        if manifest:
            p = s["provenance"]
            a = adapters.get(p["adapter_id"])
            if not a or (s["state"] == "current" and a["version"] != p["adapter_version"]):
                err("surface-provenance", s["id"])
            elif s["state"] == "current" and s["locator"]["path"] not in a["inspected_files"]:
                err("surface-outside-inspection", s["id"])
    for f in features:
        evidence = {e["id"]: e for e in f["evidence"]}
        claims: dict[str, list[dict]] = {}
        for e in evidence.values():
            field = e["assertion"]["field"]
            expected = f["description"] if field == "capability" else f.get(field)
            if field == "dependencies":
                expected = [d["target"] for d in f["dependencies"]]
            if e["assertion"]["value"] != expected:
                if e["state"] == "current":
                    err("claim-value-mismatch", f"{f['id']}/{e['id']}")
            else:
                claims.setdefault(field, []).append(e)
            if e["kind"] == "observed":
                locator_check(e["locator"], e["state"], e["id"])
                if manifest:
                    a = adapters.get(e["provenance"]["adapter_id"])
                    if not a or (e["state"] == "current" and (a["version"] != e["provenance"]["adapter_version"] or e["locator"]["path"] not in a["inspected_files"])):
                        err("evidence-provenance", e["id"])
            elif e["kind"] == "declared":
                if "locator" in e["declaration"]:
                    locator_check(e["declaration"]["locator"], e["state"], e["id"])
            else:
                for support in e["support_ids"]:
                    if support not in evidence or support == e["id"]:
                        err("invalid-inference-support", e["id"])
                    elif e["state"] == "current" and evidence[support]["state"] != "current":
                        err("stale-inference-support", e["id"])
        check_cycle({e["id"]: e.get("support_ids", []) for e in evidence.values()}, "inference-cycle")
        required = {"capability"}
        if f["recognition"] == "confirmed": required.add("recognition")
        for field in ("lifecycle", "maturity", "intent"):
            if f[field] not in ("unknown", "undisclosed"): required.add(field)
        if f["availability"]["state"] not in ("unknown", "undisclosed"): required.add("availability")
        if f["audiences"]["state"] == "known": required.add("audiences")
        if f["discovery"]["state"] in ("assessed", "partial"): required.add("discovery")
        if f["publication"]["scope"] == "public": required.add("publication")
        if f["dependencies"]: required.add("dependencies")
        for axis in ("docs", "tests"):
            if f[axis]["state"] not in ("unassessed", "undisclosed"): required.add(axis)
        for field in required:
            if field not in claims:
                err("missing-field-evidence", f"{f['id']}/{field}")
        declared_fields = set()
        if f["recognition"] == "confirmed": declared_fields.add("recognition")
        if f["lifecycle"] in ("released", "retired"): declared_fields.add("lifecycle")
        if f["publication"]["scope"] == "public": declared_fields.add("publication")
        if f["intent"] not in ("unknown", "undisclosed"): declared_fields.add("intent")
        if f["availability"]["state"] not in ("unknown", "undisclosed"): declared_fields.add("availability")
        for field in declared_fields:
            if not any(e["kind"] == "declared" for e in claims.get(field, [])):
                err("declaration-required", f"{f['id']}/{field}")
        if f["publication"]["scope"] == "public" and not any(e["kind"] == "declared" and e["state"] == "current" for e in claims.get("publication", [])):
            err("public-approval-not-current", f["id"])
        if f["observation"]["state"] == "current" and not any(e["state"] == "current" for e in claims.get("capability", [])):
            err("capability-not-current", f["id"])
        if f["lifecycle"] == "retired":
            for eid in f["editorial"]["retirement"]["evidence_ids"]:
                if eid not in evidence or evidence[eid]["assertion"]["field"] != "lifecycle" or evidence[eid]["kind"] != "declared":
                    err("invalid-retirement-approval", f["id"])
        for sid in f["entry_points"]+f["implements"]:
            if sid not in by_surface:
                err("dangling-surface", f"{f['id']}/{sid}")
        for dep in f["dependencies"]:
            target = dep["target"]
            if target.startswith("external:"):
                if target[9:] not in config["externals"]: err("unknown-external", target)
            elif target not in by_id: err("dangling-feature", target)
            for eid in dep["evidence_ids"]:
                if eid not in evidence or evidence[eid]["assertion"]["field"] != "dependencies":
                    err("dependency-evidence", f["id"])
        for axis in ("docs", "tests"):
            assessment = f[axis]
            if assessment["state"] == "not-applicable" and not any(e["kind"] == "declared" for e in claims.get(axis, [])):
                err("applicability-declaration", f"{f['id']}/{axis}")
            unique([x["surface_id"] for x in assessment["links"]], "duplicate-assessment-link")
            for link in assessment["links"]:
                s = by_surface.get(link["surface_id"])
                if not s or s["kind"] != ("document" if axis == "docs" else "test"):
                    err("invalid-assessment-surface", f"{f['id']}/{axis}")
                elif assessment["state"] == "assessed" and s["state"] != "current":
                    err("stale-assessment-link", f"{f['id']}/{axis}")
                if link["association"] == "maintainer-reviewed" and not any(e["kind"] == "declared" for e in claims.get(axis, [])):
                    err("association-review-required", f"{f['id']}/{axis}")
            if manifest:
                for aid in assessment["adapter_ids"]:
                    if aid not in adapters:
                        err("unknown-assessment-adapter", aid)
                    elif adapters[aid]["kind"] != ("document" if axis == "docs" else "test"):
                        err("wrong-assessment-adapter", aid)
                    elif assessment["state"] == "assessed" and adapters[aid]["state"] != "completed":
                        err("unassessed-as-absence", f"{f['id']}/{axis}")
        if manifest:
            for aid in f["discovery"]["adapter_ids"]:
                if aid not in adapters:
                    err("unknown-discovery-adapter", aid)
                elif f["discovery"]["state"] == "assessed" and adapters[aid]["state"] != "completed":
                    err("incomplete-discovery", f["id"])
    selected = config["curation"]["selected_ids"]
    for fid in selected:
        if fid not in by_id:
            err("unknown-selection", fid)
        elif by_id[fid]["recognition"] != "confirmed" or by_id[fid]["lifecycle"] == "retired":
            err("ineligible-selection", fid)
        elif config["publication"]["target"] == "public" and by_id[fid]["publication"]["scope"] != "public":
            err("private-selection", fid)
    for fid in config["curation"]["overrides"]:
        if fid not in selected:
            err("unused-override", fid)
    unique([w["feature_id"]+":"+w["rule_id"] for w in config["waivers"]], "duplicate-waiver")
    for w in config["waivers"]:
        if w["feature_id"] not in by_id:
            err("unknown-waiver-feature", w["feature_id"])
    if label:
        unique([f["id"] for f in label["features"]], "duplicate-label-id")
        clean = {k:v for k,v in label.items() if k != "generated"}
        if label["generated"]["projection_fingerprint"] != digest(clean):
            err("label-self-fingerprint", "Label was edited without regeneration")
        if label["mode"] == "map-backed":
            expected = project_label(registry, config, label["generated"]["date"])
            if clean != {k:v for k,v in expected.items() if k != "generated"}:
                err("projection-mismatch", "Label disagrees with eligible registry projection")
            if manifest and manifest["fingerprints"]["projection"] != label["generated"]["projection_fingerprint"]:
                err("manifest-projection", "Manifest disagrees with label")
        if "counts" in label:
            counts = label["counts"]
            if counts["selected"] != len(label["features"]) or counts["registered"] != counts["selected"]+counts["unlabeled"]:
                err("count-denominator", "Invalid selected or registered totals")
        for value in label.get("assessments", {}).values():
            if value["assessed"] != value["with_links"]+value["without_links"] or value["eligible"] != sum(value[k] for k in ("assessed", "partial", "unassessed", "not_applicable", "undisclosed")):
                err("assessment-denominator", "Invalid assessment totals")
    if gaps and manifest:
        unique([g["id"] for g in gaps["gaps"]], "duplicate-gap-id")
        if gaps["scan_id"] != registry["scan_id"]:
            err("gap-scan-id", "Finding snapshot differs from registry")
        for g in gaps["gaps"]:
            feature = by_id.get(g["feature_id"])
            if not feature:
                err("unknown-gap-feature", g["feature_id"])
                continue
            available_evidence = {e["id"] for e in feature["evidence"]}
            if not set(g["evidence_ids"]) <= available_evidence or not set(g["adapter_ids"]) <= set(adapters):
                err("gap-reference", g["id"])
        expected = build_gaps(registry, config, manifest)
        supported_rules = {"docs-linked-evidence", "tests-linked-evidence"}
        actual = {**gaps, "gaps": [g for g in gaps["gaps"] if g["rule_id"] in supported_rules]}
        if actual != expected:
            err("gap-projection", "Supported missing-link findings or waiver projection differ")
    if indexes:
        for axis, data in indexes.items():
            expected = {"schemaVersion": VERSION, "scan_id": registry["scan_id"], "kind": axis,
                        "assessments": [{"feature_id": f["id"], "assessment": f[axis]} for f in features]}
            if data != expected:
                err("index-projection", axis)
    return errors


def markdown_label(label: dict) -> str:
    """Minimal deterministic example renderer. Escapes untrusted table content."""
    def cell(value: str) -> str:
        return str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("|", "&#124;").replace("\n", " ").replace("\r", " ")
    lines = ["---", yaml.safe_dump(label, sort_keys=False, allow_unicode=True).rstrip(), "---", "",
             f"# Feature Facts: {cell(label['name'])}", "", "What can this product do?", "",
             "Synthetic format example, not a scan or audit of a real product.", ""]
    if label["features"]:
        lines += ["| Feature | Lifecycle | Availability | Maturity | Documentation | Tests | Evidence |",
                  "|---|---|---|---|---|---|---|"]
        for f in label["features"]:
            availability = f["availability"]
            if f["conditions"]:
                availability += ", "+", ".join(c["value"] for c in f["conditions"])
            lines.append("| "+" | ".join(cell(v) for v in (f["name"],f["lifecycle"],availability,f["maturity"],f["documentation"],f["tests"],f["evidence_state"]))+" |")
    else:
        lines.append(cell(label["empty_reason"]))
    if "counts" in label:
        c=label["counts"]
        lines += ["",f"Within the eligible confirmed scope: {c['registered']} registered, {c['selected']} selected, and {c['unlabeled']} not selected."]
    for axis, a in label.get("assessments", {}).items():
        lines += ["", f"{axis.capitalize()}: {a['with_links']} of {a['assessed']} assessed capabilities have linked evidence. "
                  f"Of {a['eligible']} eligible capabilities, {a['partial']} are partially assessed, {a['unassessed']} unassessed, "
                  f"{a['not_applicable']} not applicable, and {a['undisclosed']} undisclosed."]
    lines += ["", "Linked evidence is not a claim that tests pass or documentation is adequate."]
    if "map" in label:
        lines += ["", f"[Open the feature register]({quote(label['map'], safe='/-._~')})"]
    if label["mode"] == "standalone":
        lines += ["", cell(label["verification_limits"])]
    return "\n".join(lines)+"\n"
