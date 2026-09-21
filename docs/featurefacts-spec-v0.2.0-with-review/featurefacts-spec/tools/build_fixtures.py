"""Generate synthetic spec fixtures. This is not feature discovery or a target CLI.

All writes are confined to this package's examples directory.
"""
from __future__ import annotations
import copy
import json
import shutil
from pathlib import Path

from contract_support import (VERSION, adapter_fingerprint, build_gaps, digest, file_digest,
                              gap_basis, markdown_label, project_label, scan_config,
                              source_fingerprint, write_yaml)

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples"
DATE = "2026-09-19"
STAMP = "2026-09-19T20:00:00Z"


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.strip()+"\n", encoding="utf-8")


def json_write(path: Path, data: dict) -> None:
    write(path, json.dumps(data, indent=2, ensure_ascii=False))


def make_sources(root: Path) -> None:
    sources = {
        "README.md": """# Workshop Demo

This is a synthetic specification fixture, not a functioning application.
Import a text resume into a profile. The import screen is under /app/import.
This README does not independently establish release status or plan availability.
""",
        "src/routes.txt": """Synthetic route declarations, interpreted as data only.
GET /app/import -> resume-importer screen, menu label Import resume
POST /api/import -> read uploaded text and produce a structured profile
The import feature calls storage-helper before parsing the text.
""",
        "src/storage.txt": """Synthetic implementation descriptor, not executable code.
store-upload(bytes) -> write uploaded bytes to local storage
This helper alone is not a maintainer-confirmed product capability.
""",
        "internal/admin.txt": """Synthetic operator implementation descriptor.
COMMAND export-audit -> export administrative audit events
The fixture does not provide a documentation or test association for this command.
""",
        "docs/import.md": """# Import a resume

feature: resume-importer
Open /app/import and select a text resume.
The parser creates a draft profile for review.
This guide does not claim comprehensive error handling documentation.
""",
        "tests/import.test.txt": """Synthetic test association, not an executed test.
feature: resume-importer
case: text upload yields a draft profile
No statement in this fixture establishes that a runner passes this test.
""",
        "decisions/features.md": """# Synthetic maintainer declarations

Actor: Fixture Maintainer. Date: 2026-09-19.
Resume import is a confirmed capability, released in the synthetic product.
Its availability is conditional on the Pro plan and member role. Its maturity is experimental.
Its intended audience is users. Limited in-app discovery is intentional.
The resume-importer label fields may be published publicly.
Admin audit export is a confirmed, implemented operator capability, not asserted released.
Its availability is conditional on the admin role, and its audience is administrators.
Its limited discoverability is intentional. Keep it internal to the register.
The storage helper remains a candidate surface cluster, not a confirmed product feature.
""",
        "public/index.html": """<!doctype html>
<title>Workshop Demo</title>
<p>This synthetic page does not enumerate the application's capabilities.</p>
""",
    }
    for path, text in sources.items():
        write(root/path, text)


def locator(root: Path, path: str, start: int = 1, end: int | None = None) -> dict:
    result = {"path": path, "content_sha256": file_digest(root/path), "start_line": start}
    if end is not None:
        result["end_line"] = end
    return result


def provenance(adapter: str, method: str) -> dict:
    return {"adapter_id": adapter, "adapter_version": VERSION, "origin": "deterministic", "method": method}


def declare(root: Path, f: dict, field: str, suffix: str | None = None) -> dict:
    return {"id": f["id"]+"-"+(suffix or field), "kind": "declared", "state": "current",
            "assertion": {"field": field, "value": copy.deepcopy(f[field]), "claim": f"The synthetic maintainer declares {field}."},
            "declaration": {"actor": "Fixture Maintainer", "source": "decisions/features.md", "recorded_at": STAMP,
                            "locator": locator(root, "decisions/features.md", 3, 11)}}


def observe(root: Path, f: dict, field: str, path: str, adapter: str, claim: str, suffix: str | None = None) -> dict:
    value = f["description"] if field == "capability" else f[field]
    return {"id": f["id"]+"-"+(suffix or field), "kind": "observed", "state": "current",
            "assertion": {"field": field, "value": copy.deepcopy(value), "claim": claim},
            "locator": locator(root, path), "provenance": provenance(adapter, "explicit-fixture-descriptor")}


def assessment(state: str = "unassessed", result: str = "unknown", adapter: str | None = None,
               surface: str | None = None, reason: str = "This dimension has not been assessed.") -> dict:
    return {"state": state, "result": result, "adapter_ids": [adapter] if adapter else [],
            "links": [{"surface_id": surface, "association": "explicit-annotation"}] if surface else [], "reason": reason}


def base_feature(fid: str, name: str, description: str) -> dict:
    return {"id": fid, "name": name, "description": description, "type": "feature", "recognition": "candidate",
            "lifecycle": "unknown", "availability": {"state": "unknown", "conditions": [], "reason": "Deployment availability has not been established."},
            "maturity": "unknown", "audiences": {"state": "unknown", "values": [], "reason": "Audience has not been established."},
            "discovery": {"state": "unassessed", "surfaces": [], "adapter_ids": [], "reason": "Discovery has not been assessed."},
            "intent": "unknown", "publication": {"scope": "internal", "reason": "No public disclosure approval."},
            "entry_points": [], "implements": [], "dependencies": [], "docs": assessment(), "tests": assessment(),
            "observation": {"state": "current", "last_seen_scan_id": "demo-scan-1", "reason": "Current fixture source evidence is available."},
            "evidence": [], "editorial": {"locked": [], "aliases": [], "notes": "Synthetic example."},
            "uncertainty_reasons": {"lifecycle": "Release state has not been established.", "maturity": "Maturity has not been assessed.", "intent": "No maintainer intent has been recorded."}}


def make_registry(root: Path) -> dict:
    f = base_feature("resume-importer", "Resume import", "Parse an uploaded text resume into a draft profile.")
    f.update({"recognition": "confirmed", "lifecycle": "released", "maturity": "experimental", "intent": "limited-discovery", "uncertainty_reasons": {}})
    f["availability"] = {"state": "conditional", "conditions": [{"kind": "plan", "value": "Pro"}, {"kind": "role", "value": "member"}],
                         "reason": "Declared by the synthetic maintainer, not inferred from route presence."}
    f["audiences"] = {"state": "known", "values": ["user"], "reason": "Declared fixture audience."}
    f["discovery"] = {"state": "partial", "surfaces": ["in-app"], "adapter_ids": ["fixture-surface"],
                       "reason": "The local fixture shows an in-app menu. No global marketing absence is inferred."}
    f["publication"] = {"scope": "public", "reason": "Fixture Maintainer approved the label fields for this capability."}
    f["entry_points"] = ["import-route", "import-api"]
    f["implements"] = ["import-api"]
    f["docs"] = assessment("assessed", "linked-evidence", "fixture-document", "import-doc", "An explicit feature annotation was found in the inspected documentation.")
    f["tests"] = assessment("assessed", "linked-evidence", "fixture-test", "import-test", "An explicit feature annotation was found. Test execution and breadth were not assessed.")
    f["editorial"] = {"locked": ["name", "intent", "publication"], "aliases": ["cv-import"], "notes": "Keep approved presentation decisions through rescans."}
    f["evidence"] = [observe(root, f, "capability", "src/routes.txt", "fixture-surface", "The fixture explicitly describes the import behavior.")]
    for field in ("recognition", "lifecycle", "availability", "maturity", "audiences", "intent", "publication"):
        f["evidence"].append(declare(root, f, field))
    f["evidence"].append(observe(root, f, "discovery", "src/routes.txt", "fixture-surface", "The fixture explicitly names an in-app Import resume menu."))
    f["evidence"].append(observe(root, f, "docs", "docs/import.md", "fixture-document", "The document carries an exact feature annotation."))
    f["evidence"].append(observe(root, f, "tests", "tests/import.test.txt", "fixture-test", "The test descriptor carries an exact feature annotation, not a passing result."))

    admin = base_feature("admin-export", "Administrative audit export", "Export administrative audit events for an operator.")
    admin.update({"recognition": "confirmed", "lifecycle": "implemented", "intent": "limited-discovery"})
    admin["uncertainty_reasons"] = {"maturity": "The fixture does not declare maturity."}
    admin["entry_points"] = ["admin-command"]
    admin["implements"] = ["admin-command"]
    admin["availability"] = {"state": "conditional", "conditions": [{"kind": "role", "value": "admin"}], "reason": "Synthetic maintainer declaration, not a deployment probe."}
    admin["audiences"] = {"state": "known", "values": ["admin"], "reason": "Synthetic maintainer declaration."}
    admin["publication"]["reason"] = "The fixture maintainer requests internal-only disclosure."
    for axis, aid in (("docs", "fixture-document"), ("tests", "fixture-test")):
        admin[axis] = assessment("assessed", "no-linked-evidence", aid, reason="The adapter completed its declared local scope without an accepted association.")
    admin["evidence"] = [observe(root, admin, "capability", "internal/admin.txt", "fixture-surface", "The fixture describes the administrative command."),
                          observe(root, admin, "lifecycle", "internal/admin.txt", "fixture-surface", "An implementation descriptor is present. This is not evidence of release.")]
    for field in ("recognition", "availability", "audiences", "intent"):
        admin["evidence"].append(declare(root, admin, field))
    for axis in ("docs", "tests"):
        admin["evidence"].append({"id": f"admin-export-{axis}", "kind": "inferred", "state": "current",
                                  "assertion": {"field": axis, "value": copy.deepcopy(admin[axis]),
                                                "claim": f"No linked {axis} evidence was found in the completed supported scope."},
                                  "support_ids": ["admin-export-capability"], "method": f"{axis}-linked-evidence@{VERSION}",
                                  "uncertainty": "low", "rationale": "This conclusion concerns associations within the completed fixture scan only. It makes no claim about other repositories or sources."})

    candidate = base_feature("storage-helper", "Storage helper candidate", "A source helper stores uploaded bytes.")
    candidate["type"] = "surface-cluster"
    candidate["implements"] = ["storage-symbol"]
    candidate["evidence"] = [observe(root, candidate, "capability", "src/storage.txt", "fixture-surface", "A storage helper is present, but product-level recognition is unconfirmed.")]
    return {"schemaVersion": VERSION, "scan_id": "demo-scan-1", "product": {"name": "Workshop Demo", "type": "synthetic fixture", "status": "experimental"},
            "features": [f, admin, candidate], "redirects": []}


def make_config() -> dict:
    return {"schemaVersion": VERSION,
            "include": ["README.md", "CHANGELOG.md", "package.json", "index.*", "app/**", "src/**", "docs/**", "tests/**", "public/**", "internal/**", "decisions/**"],
            "exclude": ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**", "**/.env", "**/.env.*", "**/*.pem", "**/*.key", ".featurefacts/**", "FEATURE_FACTS.md"],
            "adapters": [{"id": f"fixture-{kind}", "kind": kind, "enabled": True} for kind in ("tree", "surface", "document", "test")],
            "externals": [],
            "curation": {"selected_ids": ["resume-importer"], "overrides": {},
                         "approval": {"actor": "Fixture Maintainer", "source": "Synthetic package fixture selection", "recorded_at": STAMP}},
            "publication": {"target": "internal", "include_counts": True, "include_assessments": True, "map_link": ".featurefacts/FEATURES.md"},
            "policy": {"enabled": False, "rules": [{"id": "released-test-links", "level": "fail"}, {"id": "locked-locators-resolve", "level": "warn"}], "unassessed": "warn"},
            "waivers": [], "safety": {"max_file_bytes": 1048576, "follow_symlinks": False, "network": False, "execute_target_code": False}}


def make_surfaces(root: Path) -> dict:
    records = [
        ("import-route", "route", "GET /app/import", "src/routes.txt", "fixture-surface", 2),
        ("import-api", "api", "POST /api/import", "src/routes.txt", "fixture-surface", 3),
        ("admin-command", "command", "export-audit", "internal/admin.txt", "fixture-surface", 2),
        ("storage-symbol", "symbol", "store-upload", "src/storage.txt", "fixture-surface", 2),
        ("import-doc", "document", "Import a resume", "docs/import.md", "fixture-document", 3),
        ("import-test", "test", "text upload yields a draft profile", "tests/import.test.txt", "fixture-test", 2),
    ]
    return {"schemaVersion": VERSION, "scan_id": "demo-scan-1", "surfaces": [
        {"id": sid, "kind": kind, "ref": name, "locator": locator(root,path,line),
         "provenance": provenance(aid,"explicit-fixture-descriptor"), "state": "current"}
        for sid,kind,name,path,aid,line in records]}


def make_manifest(root: Path, registry: dict, config: dict) -> dict:
    files = sorted(p.relative_to(root).as_posix() for p in root.rglob("*") if p.is_file() and ".featurefacts" not in p.parts and p.name != "FEATURE_FACTS.md")
    file_sets = {"tree": files,
                 "surface": ["internal/admin.txt", "src/routes.txt", "src/storage.txt"],
                 "document": ["README.md", "decisions/features.md", "docs/import.md", "public/index.html"],
                 "test": ["tests/import.test.txt"]}
    adapters = [{"id": f"fixture-{kind}", "version": VERSION, "kind": kind, "state": "completed",
                 "eligible_files": sorted(paths), "inspected_files": sorted(paths), "diagnostics": []} for kind,paths in file_sets.items()]
    index = []
    for name in files:
        ids = [a["id"] for a in adapters if name in a["eligible_files"]]
        index.append({"path": name, "sha256": file_digest(root/name), "bytes": (root/name).stat().st_size,
                      "eligible_adapter_ids": ids, "inspected_by": ids})
    scope = {"include": config["include"], "exclude": config["exclude"], "supported_ecosystems": ["synthetic-text-fixture"], "files": index, "exclusions": []}
    return {"schemaVersion": VERSION, "scan_id": registry["scan_id"], "tool": "featurefacts", "tool_version": VERSION,
            "generated_at": STAMP, "root": ".", "status": "complete", "scope": scope, "adapters": adapters,
            "rules_version": VERSION, "fingerprints": {"source": source_fingerprint(scope), "config": digest(scan_config(config)),
                "adapters": adapter_fingerprint(adapters), "rules": digest({"rule_set":"featurefacts-core","version":VERSION}),
                "registry": digest(registry), "projection": "0"*64}, "artifacts": [], "diagnostics": []}


def write_bundle(root: Path, registry: dict, config: dict, surfaces: dict, manifest: dict) -> None:
    m = root/".featurefacts"
    m.mkdir(parents=True, exist_ok=True)
    label = project_label(registry, config, DATE)
    gaps = build_gaps(registry, config, manifest)
    write_yaml(m/"config.yaml", config)
    write_yaml(m/"features.yaml", registry)
    json_write(m/"features.json", registry)
    json_write(m/"surfaces.json", surfaces)
    write_yaml(m/"gaps.yaml", gaps)
    for axis,name in (("docs","docs-index.json"),("tests","test-index.json")):
        json_write(m/name, {"schemaVersion": VERSION, "scan_id": registry["scan_id"], "kind": axis,
                           "assessments": [{"feature_id": f["id"], "assessment": f[axis]} for f in registry["features"]]})
    write(root/"FEATURE_FACTS.md", markdown_label(label))
    lines = [f"# {registry['product']['name']} feature register", "", "Synthetic fixture. No application was scanned or executed.", "",
             f"Scan outcome: **{manifest['status']}**. The register is bounded by the manifest's declared scope.", "",
             "## Capabilities", ""]
    for f in registry["features"]:
        lines += [f"### {f['name']} (`{f['id']}`)", "", f["description"], "",
                  f"Recognition: {f['recognition']}. Lifecycle: {f['lifecycle']}. Evidence: {f['observation']['state']}.", "",
                  f"Documentation: {f['docs']['result']} ({f['docs']['state']}). Tests: {f['tests']['result']} ({f['tests']['state']}).", ""]
        for s in surfaces["surfaces"]:
            if s["id"] in f["entry_points"]+f["implements"]:
                loc=s["locator"]
                lines += [f"Source: [{loc['path']}, line {loc.get('start_line',1)}](../{loc['path']}#L{loc.get('start_line',1)}).", ""]
    lines += ["## Follow-up findings", ""]
    if not gaps["gaps"]:
        lines.append("No applicable missing-link findings were emitted. Unassessed dimensions are not negative findings.")
    for gap in gaps["gaps"]:
        lines += [f"**{gap['disposition']['state']}**: {gap['text']}", "",gap["suggested_action"], ""]
    write(m/"FEATURES.md", "\n".join(lines))
    manifest["fingerprints"].update({"source":source_fingerprint(manifest["scope"]),"config":digest(scan_config(config)),
                                     "adapters":adapter_fingerprint(manifest["adapters"]),"registry":digest(registry),
                                     "projection":label["generated"]["projection_fingerprint"]})
    paths = ["FEATURE_FACTS.md", ".featurefacts/features.yaml", ".featurefacts/features.json", ".featurefacts/surfaces.json",
             ".featurefacts/gaps.yaml", ".featurefacts/docs-index.json", ".featurefacts/test-index.json", ".featurefacts/FEATURES.md"]
    manifest["artifacts"] = [{"path": name, "sha256": file_digest(root/name)} for name in paths]
    json_write(m/"manifest.json", manifest)


def build() -> None:
    demo = EXAMPLES/"demo-repository"
    if demo.exists(): shutil.rmtree(demo)
    make_sources(demo)
    registry=make_registry(demo)
    config=make_config()
    surfaces=make_surfaces(demo)
    manifest=make_manifest(demo,registry,config)
    admin=registry["features"][1]
    config["waivers"].append({"feature_id":"admin-export", "rule_id":"docs-linked-evidence",
                               "basis_fingerprint":gap_basis(admin,"docs",manifest["adapters"]),
                               "reason":"The fixture owner accepts no linked operator guide for this demonstration.",
                               "approved_by":"Fixture Maintainer", "recorded_at":STAMP})
    write_bundle(demo,registry,config,surfaces,manifest)
    for src,dst in [(demo/".featurefacts/config.yaml",EXAMPLES/"sample-config.yaml"),
                    (demo/".featurefacts/features.yaml",EXAMPLES/"sample-registry.yaml"),
                    (demo/".featurefacts/gaps.yaml",EXAMPLES/"sample-gaps.yaml")]:
        shutil.copyfile(src,dst)
    display_config=copy.deepcopy(config)
    display_config["publication"]["map_link"]="demo-repository/.featurefacts/FEATURES.md"
    write(EXAMPLES/"FEATURE_FACTS.md",markdown_label(project_label(registry,display_config,DATE)))
    write_yaml(EXAMPLES/"sample-feature.yaml",registry["features"][0])
    json_write(EXAMPLES/"sample-detector-result.json",{"schemaVersion":VERSION,"scan_id":registry["scan_id"],
                 "adapter":manifest["adapters"][1],"surfaces":[s for s in surfaces["surfaces"] if s["provenance"]["adapter_id"]=="fixture-surface"]})

    public_config=copy.deepcopy(config)
    public_config["publication"].update({"target":"public","map_link":None})
    public_label=project_label(registry,public_config,DATE)
    write(EXAMPLES/"PUBLIC_FEATURE_FACTS.md",markdown_label(public_label))

    standalone=copy.deepcopy(public_label)
    standalone.update({"mode":"standalone","basis":{"kind":"declaration","summary":"Maintainer-supplied synthetic capability list, not a source survey."},
                       "declaration":{"actor":"Fixture Maintainer","source":"Synthetic standalone example","recorded_at":STAMP},
                       "verification_limits":"This standalone label contains attributed declarations. No source freshness, test execution, or full-product inventory is asserted."})
    for key in ("counts","assessments","map","generated"): standalone.pop(key,None)
    for row in standalone["features"]: row["evidence_state"]="declared"
    standalone["generated"]={"date":DATE,"generator":"featurefacts-spec-fixture","generator_version":VERSION,"projection_fingerprint":digest(standalone)}
    write(EXAMPLES/"STANDALONE_FEATURE_FACTS.md",markdown_label(standalone))

    partial=EXAMPLES/"partial-scan-repository"
    if partial.exists(): shutil.rmtree(partial)
    make_sources(partial)
    pr,pc,ps,pm=copy.deepcopy((registry,config,surfaces,manifest))
    pr["scan_id"]=ps["scan_id"]=pm["scan_id"]="demo-scan-2"
    pm["status"]="partial"
    test_adapter=next(a for a in pm["adapters"] if a["kind"]=="test")
    test_adapter.update({"state":"failed","inspected_files":[],"diagnostics":[{"code":"fixture-parser-failure","severity":"error","message":"Simulated test parser failure. No absence conclusion is justified."}]})
    for item in pm["scope"]["files"]:
        item["inspected_by"]=[a for a in item["inspected_by"] if a!="fixture-test"]
    for s in ps["surfaces"]:
        if s["kind"]=="test": s["state"]="stale"
    for f in pr["features"]:
        f["observation"]["last_seen_scan_id"] = "demo-scan-2"
        f["tests"]=assessment("unassessed","unknown","fixture-test",reason="The test adapter failed. Prior test surfaces are retained as stale, not evidence of absence.")
        for e in f["evidence"]:
            if e["assertion"]["field"]=="tests":
                # Historical assertions retain their original content, never rewritten as new observations.
                e["state"]="stale"
    write_bundle(partial,pr,pc,ps,pm)

    empty=EXAMPLES/"empty-repository"
    if empty.exists(): shutil.rmtree(empty)
    empty.mkdir(parents=True)
    write(empty/"README.md","# Empty synthetic repository\n\nNo product source is present. The scanner must not fabricate a feature.")
    er={"schemaVersion":VERSION,"scan_id":"empty-scan-1","product":{"name":"Empty Demo","type":"synthetic fixture","status":"unknown"},"features":[],"redirects":[]}
    ec=make_config()
    ec["curation"]={"selected_ids":[],"overrides":{}}
    es={"schemaVersion":VERSION,"scan_id":er["scan_id"],"surfaces":[]}
    em=make_manifest(empty,er,ec)
    for a in em["adapters"]:
        if a["kind"]=="tree":
            a["eligible_files"]=a["inspected_files"]=["README.md"]
        elif a["kind"]=="document":
            a["eligible_files"]=a["inspected_files"]=["README.md"]
        else:
            a.update({"state":"unsupported","eligible_files":[],"inspected_files":[],"diagnostics":[{"code":"no-supported-inputs","severity":"info","message":"No supported product or test inputs were present."}]})
    em["scope"]["files"][0]["eligible_adapter_ids"]=["fixture-tree","fixture-document"]
    em["scope"]["files"][0]["inspected_by"]=["fixture-tree","fixture-document"]
    em["status"]="unsupported"
    write_bundle(empty,er,ec,es,em)


if __name__ == "__main__":
    build()
    print("Synthetic fixture bundles regenerated under examples/.")
