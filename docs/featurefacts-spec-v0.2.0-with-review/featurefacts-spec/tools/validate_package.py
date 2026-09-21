"""Validate FeatureFacts 0.2.0 spec examples and contract regressions offline.

This is not the production CLI. It executes no target application code.
--target checks an existing artifact set and its indexed source files. It does
not re-enumerate arbitrary target source trees or implement a scan/merge engine.
"""
from __future__ import annotations

import argparse
import copy
import importlib.metadata
import json
import sys
import tempfile
from pathlib import Path
from typing import Callable

from contract_support import (ContractError, adapter_fingerprint, build_gaps, canonical, digest,
                              file_digest, gap_basis, load_yaml_text, markdown_label, project_label,
                              read_label, read_yaml, schema_errors, schema_tools, semantic_errors)

ROOT = Path(__file__).resolve().parents[1]


class Results:
    def __init__(self) -> None:
        self.items: list[dict] = []

    def run(self, name: str, check: Callable[[], None], category: str = "contract") -> None:
        try:
            check()
            self.items.append({"name": name, "category": category, "status": "passed"})
        except Exception as exc:
            self.items.append({"name": name, "category": category, "status": "failed",
                               "detail": f"{type(exc).__name__}: {exc}"})


def require(value: bool, message: str) -> None:
    if not value:
        raise AssertionError(message)


def require_empty(errors: list[str]) -> None:
    require(not errors, "\n".join(errors))


def load_bundle(path: Path) -> dict:
    state = path/".featurefacts"
    return {"registry": read_yaml(state/"features.yaml"),
            "config": read_yaml(state/"config.yaml"),
            "surfaces": json.loads((state/"surfaces.json").read_text(encoding="utf-8")),
            "manifest": json.loads((state/"manifest.json").read_text(encoding="utf-8")),
            "label": read_label(path/"FEATURE_FACTS.md"),
            "gaps": read_yaml(state/"gaps.yaml"),
            "indexes": {axis: json.loads((state/f"{name}-index.json").read_text(encoding="utf-8"))
                        for axis, name in (("docs", "docs"), ("tests", "test"))}}


def bundle_schema_errors(bundle: dict, tools: tuple) -> list[str]:
    errors = []
    for key, schema in (("registry", "registry"), ("config", "config"), ("surfaces", "surfaces"),
                        ("manifest", "manifest"), ("label", "feature-facts-label"), ("gaps", "gaps")):
        errors += schema_errors(schema, bundle[key], tools)
    for axis, name in (("docs", "docs-index"), ("tests", "test-index")):
        errors += schema_errors(name, bundle["indexes"][axis], tools)
    return errors


def artifact_errors(path: Path, bundle: dict) -> list[str]:
    errors = []
    for artifact in bundle["manifest"]["artifacts"]:
        target=path/artifact["path"]
        if not target.resolve().is_relative_to(path.resolve()) or target.is_symlink():
            errors.append(f"Unsafe artifact path: {artifact['path']}")
        elif not target.is_file() or file_digest(target) != artifact["sha256"]:
            errors.append(f"Artifact commit digest mismatch: {artifact['path']}")
    generated=json.loads((path/".featurefacts/features.json").read_text(encoding="utf-8"))
    if generated != bundle["registry"]:
        errors.append("features.json differs from canonical features.yaml")
    return errors


def package_checks(tools: tuple, results: Results) -> None:
    examples=ROOT/"examples"
    demo=load_bundle(examples/"demo-repository")
    for name in ("demo-repository", "partial-scan-repository", "empty-repository"):
        path=examples/name
        bundle=load_bundle(path)
        results.run(f"{name}:all-schemas", lambda b=bundle: require_empty(bundle_schema_errors(b,tools)), "examples")
        results.run(f"{name}:semantic-integrity-and-locators", lambda b=bundle,p=path: require_empty(semantic_errors(**b,source_root=p)), "examples")
        results.run(f"{name}:committed-artifact-digests", lambda b=bundle,p=path: require_empty(artifact_errors(p,b)), "examples")
        results.run(f"{name}:body-projection", lambda b=bundle,p=path: require((p/"FEATURE_FACTS.md").read_text(encoding="utf-8")==markdown_label(b["label"]),"Label body drift"), "examples")

    excerpts=[("sample-feature.yaml","feature-record",read_yaml),
              ("sample-registry.yaml","registry",read_yaml),
              ("sample-config.yaml","config",read_yaml),
              ("sample-gaps.yaml","gaps",read_yaml),
              ("sample-detector-result.json","detector-result",lambda p:json.loads(p.read_text(encoding="utf-8"))),
              ("FEATURE_FACTS.md","feature-facts-label",read_label),
              ("PUBLIC_FEATURE_FACTS.md","feature-facts-label",read_label),
              ("STANDALONE_FEATURE_FACTS.md","feature-facts-label",read_label)]
    for filename,schema,reader in excerpts:
        data=reader(examples/filename)
        results.run(f"excerpt:{filename}",lambda s=schema,d=data:require_empty(schema_errors(s,d,tools)),"examples")
    for filename,key in (("sample-registry.yaml","registry"),("sample-config.yaml","config"),("sample-gaps.yaml","gaps")):
        results.run(f"excerpt-parity:{filename}",lambda fn=filename,k=key:require(read_yaml(examples/fn)==demo[k],"Excerpt differs"),"examples")
    results.run("sample-feature-parity",lambda:require(read_yaml(examples/"sample-feature.yaml")==demo["registry"]["features"][0],"Feature excerpt differs"),"examples")

    def schema_case(name: str, schema: str, source: dict, mutation: Callable, valid: bool = False) -> None:
        data=copy.deepcopy(source)
        mutation(data)
        def check() -> None:
            errors=schema_errors(schema,data,tools)
            require(not errors if valid else bool(errors),"Unexpected schema acceptance/rejection: "+"\n".join(errors))
        results.run(name,check,"schema-regression")

    feature=demo["registry"]["features"][0]
    candidate=demo["registry"]["features"][2]
    config=demo["config"]
    label=demo["label"]
    schema_case("reject-feature-without-evidence","feature-record",feature,lambda f:f.update(evidence=[]))
    schema_case("reject-original-minimal-shipped-record","feature-record",{},lambda f:f.update(id="invented-feature",name="Invented",type="feature",status="shipped"))
    schema_case("reject-observation-without-locator","feature-record",feature,lambda f:f["evidence"][0].pop("locator"))
    schema_case("reject-declaration-without-actor","feature-record",feature,lambda f:f["evidence"][1]["declaration"].pop("actor"))
    schema_case("reject-inference-without-support","feature-record",demo["registry"]["features"][1],lambda f:f["evidence"][-1].pop("support_ids"))
    schema_case("reject-inference-without-uncertainty","feature-record",demo["registry"]["features"][1],lambda f:f["evidence"][-1].pop("uncertainty"))
    schema_case("accept-two-character-id","feature-record",feature,lambda f:f.update(id="ai"),True)
    schema_case("accept-one-character-id","feature-record",feature,lambda f:f.update(id="a"),True)
    schema_case("reject-double-hyphen-id","feature-record",feature,lambda f:f.update(id="a--b"))
    schema_case("reject-leading-hyphen-id","feature-record",feature,lambda f:f.update(id="-ai"))
    schema_case("reject-overlength-id","feature-record",feature,lambda f:f.update(id="a"*65))
    schema_case("reject-typo-lock","feature-record",feature,lambda f:f["editorial"]["locked"].append("visiblity"))
    schema_case("reject-automated-assessment-lock","feature-record",feature,lambda f:f["editorial"]["locked"].append("tests"))
    schema_case("accept-honest-unknown-candidate","feature-record",candidate,lambda f:None,True)
    schema_case("reject-unknown-without-reason","feature-record",candidate,lambda f:f["uncertainty_reasons"].pop("lifecycle"))
    schema_case("accept-explicit-undisclosed-state","feature-record",candidate,lambda f:(f.update(lifecycle="undisclosed"),f["uncertainty_reasons"].update(lifecycle="The owner withholds this field.")),True)
    schema_case("reject-empty-conditional-availability","feature-record",feature,lambda f:f["availability"].update(conditions=[]))
    schema_case("reject-absence-from-unassessed-state","feature-record",candidate,lambda f:f["tests"].update(result="no-linked-evidence"))
    schema_case("reject-partial-negative-conclusion","feature-record",candidate,lambda f:f["tests"].update(state="partial",result="no-linked-evidence",adapter_ids=["fixture-test"]))
    schema_case("reject-link-with-no-association","feature-record",feature,lambda f:f["tests"]["links"][0].pop("association"))
    schema_case("reject-filename-similarity-as-accepted-link","feature-record",feature,lambda f:f["tests"]["links"][0].update(association="name-similarity"))
    schema_case("reject-retirement-without-approval-structure","feature-record",feature,lambda f:f.update(lifecycle="retired"))
    schema_case("reject-public-map-link","config",config,lambda c:c["publication"].update(target="public"))
    schema_case("reject-selection-without-approval","config",config,lambda c:c["curation"].pop("approval"))
    schema_case("reject-more-than-twelve-selected-ids","config",config,lambda c:c["curation"].update(selected_ids=["feature-"+str(i) for i in range(13)]))
    schema_case("reject-duplicate-selected-id","config",config,lambda c:c["curation"]["selected_ids"].append("resume-importer"))
    schema_case("reject-executable-default-scan","config",config,lambda c:c["safety"].update(execute_target_code=True))
    schema_case("reject-default-network","config",config,lambda c:c["safety"].update(network=True))
    schema_case("reject-follow-symlinks","config",config,lambda c:c["safety"].update(follow_symlinks=True))
    schema_case("reject-parent-traversal-locator","feature-record",feature,lambda f:f["evidence"][0]["locator"].update(path="../secret.txt"))
    schema_case("reject-absolute-locator","feature-record",feature,lambda f:f["evidence"][0]["locator"].update(path="/tmp/secret.txt"))
    schema_case("reject-backslash-locator","feature-record",feature,lambda f:f["evidence"][0]["locator"].update(path="src\\route.txt"))
    schema_case("reject-unquoted-or-malformed-date-value","feature-facts-label",label,lambda l:l["generated"].update(date="September 19, 2026"))
    schema_case("reject-impossible-calendar-date","feature-facts-label",label,lambda l:l["generated"].update(date="2026-02-30"))
    schema_case("reject-empty-label-without-reason","feature-facts-label",label,lambda l:l.update(features=[],selection_state="no-eligible-features"))
    schema_case("reject-thirteen-label-rows","feature-facts-label",label,lambda l:l.update(features=l["features"]*13))
    standalone=read_label(examples/"STANDALONE_FEATURE_FACTS.md")
    schema_case("reject-standalone-map-claim","feature-facts-label",standalone,lambda l:l.update(map=".featurefacts/FEATURES.md"))
    schema_case("reject-standalone-registry-counts","feature-facts-label",standalone,lambda l:l.update(counts=label["counts"]))
    schema_case("reject-standalone-without-verification-limits","feature-facts-label",standalone,lambda l:l.pop("verification_limits"))

    def semantic_case(name: str, mutation: Callable, code: str) -> None:
        bundle=copy.deepcopy(demo)
        mutation(bundle)
        def check() -> None:
            errors=semantic_errors(**bundle)
            require(any(e.startswith(code+":") for e in errors),f"Expected {code}, received {errors}")
        results.run(name,check,"semantic-regression")

    semantic_case("reject-route-evidence-as-release-support",lambda b:b["registry"]["features"][0].update(evidence=[e for e in b["registry"]["features"][0]["evidence"] if e["assertion"]["field"]!="lifecycle"]),"missing-field-evidence")
    semantic_case("reject-current-claim-with-wrong-value",lambda b:b["registry"]["features"][0]["evidence"][0]["assertion"].update(value="A different capability"),"claim-value-mismatch")
    semantic_case("reject-missing-inference-support-id",lambda b:b["registry"]["features"][1]["evidence"][-1].update(support_ids=["missing-evidence"]),"invalid-inference-support")
    semantic_case("reject-inference-cycle",lambda b:(b["registry"]["features"][1]["evidence"][-1].update(support_ids=[b["registry"]["features"][1]["evidence"][-2]["id"]]),b["registry"]["features"][1]["evidence"][-2].update(support_ids=[b["registry"]["features"][1]["evidence"][-1]["id"]])),"inference-cycle")
    semantic_case("reject-stale-support-for-current-inference",lambda b:b["registry"]["features"][1]["evidence"][0].update(state="stale"),"stale-inference-support")
    semantic_case("reject-duplicate-feature-ids",lambda b:b["registry"]["features"].append(copy.deepcopy(b["registry"]["features"][0])),"duplicate-feature-id")
    semantic_case("reject-alias-collision",lambda b:b["registry"]["features"][0]["editorial"]["aliases"].append("admin-export"),"alias-collision")
    semantic_case("reject-dangling-surface",lambda b:b["registry"]["features"][0]["entry_points"].append("nonexistent-surface"),"dangling-surface")
    semantic_case("reject-document-surface-as-test",lambda b:b["registry"]["features"][0]["tests"]["links"][0].update(surface_id="import-doc"),"invalid-assessment-surface")
    semantic_case("reject-skipped-adapter-as-absence",lambda b:b["manifest"]["adapters"][-1].update(state="skipped",inspected_files=[],diagnostics=[{"code":"disabled","severity":"info","message":"Skipped by fixture"}]),"unassessed-as-absence")
    semantic_case("reject-tree-adapter-as-test-assessment",lambda b:b["registry"]["features"][0]["tests"].update(adapter_ids=["fixture-tree"]),"wrong-assessment-adapter")
    semantic_case("reject-false-complete-adapter",lambda b:b["manifest"]["adapters"][-1].update(inspected_files=[]),"incomplete-adapter")
    semantic_case("reject-false-complete-scan",lambda b:b["manifest"]["adapters"][-1].update(state="failed",diagnostics=[{"code":"failed","severity":"error","message":"Failed"}]),"false-complete-scan")
    semantic_case("reject-missing-configured-adapter-result",lambda b:b["manifest"]["adapters"].pop(),"configured-adapter-mismatch")
    semantic_case("reject-self-generated-evidence",lambda b:b["registry"]["features"][0]["evidence"][0]["locator"].update(path="FEATURE_FACTS.md"),"self-evidence")
    semantic_case("reject-skill-example-as-product-evidence",lambda b:b["registry"]["features"][0]["evidence"][0]["locator"].update(path=".agents/skills/featurefacts/examples/sample.md"),"self-evidence")
    semantic_case("reject-secret-file-as-evidence",lambda b:b["registry"]["features"][0]["evidence"][0]["locator"].update(path=".env.local"),"excluded-evidence")
    semantic_case("reject-reversed-source-lines",lambda b:b["registry"]["features"][0]["evidence"][0]["locator"].update(start_line=8,end_line=2),"reversed-lines")
    semantic_case("reject-candidate-label-selection",lambda b:b["config"]["curation"].update(selected_ids=["storage-helper"]),"ineligible-selection")
    semantic_case("reject-unknown-label-selection",lambda b:b["config"]["curation"].update(selected_ids=["missing-feature"]),"unknown-selection")
    semantic_case("reject-public-private-selection",lambda b:(b["config"]["publication"].update(target="public",map_link=None),b["config"]["curation"].update(selected_ids=["admin-export"])),"private-selection")
    semantic_case("reject-public-approval-without-declaration",lambda b:b["registry"]["features"][0].update(evidence=[e for e in b["registry"]["features"][0]["evidence"] if e["assertion"]["field"]!="publication"]),"declaration-required")
    semantic_case("reject-stale-public-approval",lambda b:next(e for e in b["registry"]["features"][0]["evidence"] if e["assertion"]["field"]=="publication").update(state="stale"),"public-approval-not-current")
    semantic_case("reject-duplicate-label-ids",lambda b:b["label"]["features"].append(copy.deepcopy(b["label"]["features"][0])),"duplicate-label-id")
    semantic_case("reject-wrong-count-denominator",lambda b:b["label"]["counts"].update(registered=999),"count-denominator")
    semantic_case("reject-wrong-assessment-denominator",lambda b:b["label"]["assessments"]["tests"].update(eligible=999),"assessment-denominator")
    semantic_case("reject-drifted-json-assessment-index",lambda b:b["indexes"]["tests"]["assessments"].pop(),"index-projection")
    semantic_case("reject-unrefreshed-label",lambda b:b["registry"]["features"][0].update(name="Changed display name"),"projection-mismatch")
    semantic_case("reject-manifest-registry-drift",lambda b:b["registry"]["features"][0]["editorial"].update(notes="Changed canonical note"),"registry-fingerprint")
    semantic_case("reject-gap-with-unknown-reference",lambda b:b["gaps"]["gaps"][0].update(evidence_ids=["nonexistent-evidence"]),"gap-reference")

    def public_checks() -> None:
        config=copy.deepcopy(demo["config"])
        config["publication"].update(target="public",map_link=None)
        projected=project_label(demo["registry"],config)
        require(projected==read_label(examples/"PUBLIC_FEATURE_FACTS.md"),"Public example differs from projection")
        require(projected["counts"]["registered"]==1,"Private record influenced public count")
        text=markdown_label(projected)
        for forbidden in ("admin-export","Administrative audit export","storage-helper",".featurefacts/","internal/admin.txt",demo["manifest"]["fingerprints"]["registry"]):
            require(forbidden not in text,f"Private information leaked: {forbidden}")
    results.run("public-projection-filters-rows-counts-links-and-private-hashes",public_checks,"publication")

    def private_change() -> None:
        config=copy.deepcopy(demo["config"])
        config["publication"].update(target="public",map_link=None)
        before=project_label(demo["registry"],config)
        changed=copy.deepcopy(demo["registry"])
        changed["features"][1]["name"]="Private capability changed"
        after=project_label(changed,config)
        require(before==after,"Private edit changed public fixture projection")
    results.run("private-only-change-does-not-affect-public-projection",private_change,"publication")

    def revocation_projection() -> None:
        config=copy.deepcopy(demo["config"])
        config["publication"].update(target="public",map_link=None)
        changed=copy.deepcopy(demo["registry"])
        changed["features"][0]["publication"].update(scope="internal")
        label=project_label(changed,config)
        require(label["features"]==[] and label["counts"]["registered"]==0,"Revoked feature remained public")
        require("resume-importer" not in markdown_label(label),"Revoked ID leaked through rendering")
    results.run("revocation-safe-projection-excludes-now-private-feature",revocation_projection,"publication")

    partial=load_bundle(examples/"partial-scan-repository")
    results.run("partial-scan-does-not-retire-features",lambda:require([f["id"] for f in partial["registry"]["features"]]==[f["id"] for f in demo["registry"]["features"]] and not any(f["lifecycle"]=="retired" for f in partial["registry"]["features"]),"Retirement or missing identity in fixture"),"maintenance-fixture")
    results.run("failed-test-adapter-does-not-emit-no-test-finding",lambda:require(not any(g["kind"]=="no-linked-tests" for g in partial["gaps"]["gaps"]),"False absence finding"),"maintenance-fixture")
    results.run("partial-scan-preserves-historical-test-assertion",lambda:require(next(e for e in partial["registry"]["features"][0]["evidence"] if e["assertion"]["field"]=="tests")["assertion"]==next(e for e in demo["registry"]["features"][0]["evidence"] if e["assertion"]["field"]=="tests")["assertion"],"Historical claim rewritten"),"maintenance-fixture")
    results.run("waiver-preserved-for-unchanged-basis",lambda:require(any(g["disposition"]["state"]=="waived" for g in build_gaps(demo["registry"],demo["config"],demo["manifest"])["gaps"]),"Waiver lost"),"maintenance-fixture")

    def changed_waiver() -> None:
        modified=copy.deepcopy(demo)
        modified["registry"]["features"][1]["docs"]["reason"]="Supported documentation scope changed."
        gaps=build_gaps(modified["registry"],modified["config"],modified["manifest"])
        require(any(g["rule_id"]=="docs-linked-evidence" and g["disposition"]["state"]=="needs-review" for g in gaps["gaps"]),"Changed basis silently renewed waiver")
    results.run("changed-waiver-basis-requires-review",changed_waiver,"maintenance-fixture")

    def source_drift() -> None:
        import shutil
        with tempfile.TemporaryDirectory(prefix="featurefacts-check-") as temp:
            copied=Path(temp)/"repo"
            shutil.copytree(examples/"demo-repository",copied)
            b=load_bundle(copied)
            before=copy.deepcopy(b["label"])
            with (copied/"src/routes.txt").open("a",encoding="utf-8") as handle:
                handle.write("\nChanged source, old register and label retained.\n")
            errors=semantic_errors(**b,source_root=copied)
            require(any(e.startswith("source-stale:") for e in errors),"Changed indexed source was not detected")
            require(before==b["label"],"Validation mutated label data")
            projection_errors=semantic_errors(**b)
            require(not any(e.startswith("projection-mismatch:") for e in projection_errors),"Projection did not remain independently consistent")
    results.run("stale-map-and-label-can-agree-but-indexed-source-check-fails",source_drift,"freshness-reference")

    def commit_drift() -> None:
        import shutil
        with tempfile.TemporaryDirectory(prefix="featurefacts-commit-") as temp:
            copied=Path(temp)/"repo"
            shutil.copytree(examples/"demo-repository",copied)
            b=load_bundle(copied)
            with (copied/".featurefacts/FEATURES.md").open("a",encoding="utf-8") as handle:
                handle.write("\nMixed generation.\n")
            require(bool(artifact_errors(copied,b)),"Mixed committed artifact not detected")
    results.run("artifact-digest-detects-mixed-generation",commit_drift,"freshness-reference")

    for name,text in (("duplicate-yaml-key","a: 1\na: 2\n"),("yaml-alias","a: &x [1]\nb: *x\n"),
                      ("non-json-unquoted-date","date: 2026-09-19\n")):
        def invalid_yaml(value: str = text) -> None:
            try: load_yaml_text(value)
            except ContractError: return
            raise AssertionError("Unsafe or nonportable YAML accepted")
        results.run("reject-"+name,invalid_yaml,"parsing")
    results.run("accept-quoted-date",lambda:require(load_yaml_text('date: "2026-09-19"\n')["date"]=="2026-09-19","Quoted date not preserved"),"parsing")
    results.run("deterministic-canonical-object-key-order",lambda:require(digest({"b":2,"a":1})==digest({"a":1,"b":2}),"Key-order hash mismatch"),"parsing")
    results.run("array-order-remains-semantic",lambda:require(digest(["a","b"])!=digest(["b","a"]),"Array order lost"),"parsing")

    def escaping() -> None:
        altered=copy.deepcopy(label)
        altered["features"][0]["name"]="<script>alert(1)</script>|break\nnew row"
        text=markdown_label(altered).split("---",2)[-1]
        require("<script>" not in text and "&#124;" in text,"Unsafe table or HTML content")
    results.run("rendering-escapes-table-and-html-content",escaping,"rendering")

    def idempotent_fixture() -> None:
        expected=project_label(demo["registry"],demo["config"])
        again=project_label(demo["registry"],demo["config"])
        require(canonical(expected)==canonical(again),"Fixture projection is not deterministic")
    results.run("fixture-projection-repeat-is-identical",idempotent_fixture,"rendering")


def write_reports(results: Results, tools: tuple, json_path: Path | None, report_path: Path | None) -> None:
    failed=[x for x in results.items if x["status"]=="failed"]
    data={"spec_version":"0.2.0","validated_on":"2026-09-19",
          "scope":"Offline specification schemas, synthetic fixtures, and reference contract regressions. Not production scanner acceptance.",
          "environment":{name:importlib.metadata.version(name) for name in ("jsonschema","PyYAML","referencing")},
          "schema_count":len(tools[0]),"checks":len(results.items),"passed":len(results.items)-len(failed),"failed":len(failed),
          "limitations":["No production scanner, parser, merger, CLI, or runtime test execution is included.",
                         "Indexed-source checks do not discover added files by re-enumerating an arbitrary target repository.",
                         "Only the documented reference semantic subset and two missing-link finding rules are implemented.",
                         "Concurrency, crash recovery, actual rescans, and real-repository capability recognition remain implementation acceptance tests.",
                         "Schema validity and citation structure do not establish truth or genuine user authorization."],
          "results":results.items}
    if json_path:
        json_path.parent.mkdir(parents=True,exist_ok=True)
        json_path.write_text(json.dumps(data,indent=2)+"\n",encoding="utf-8")
    if report_path:
        lines=["# Validation report", "", "Specification revision: **0.2.0, revised draft**. Checked September 19, 2026.", "",
               f"**{data['passed']} of {data['checks']} checks passed, {data['failed']} failed.** The package contains {data['schema_count']} JSON Schemas, all checked against Draft 2020-12.", "",
               "The report is generated by `python tools/validate_package.py --json tests/validation-results.json --report VALIDATION.md`.", "",
               "## What ran", "", "Offline schema validation, complete/partial/empty synthetic artifact checks, locator/hash checks, reference integrity, evidence binding, publication filtering, waiver-basis projection, parsing regressions, and negative mutation tests. Target descriptors were read only as text.", "",
               "## Environment", "", "| Dependency | Tested version |", "|---|---|"]
        lines += [f"| {k} | {v} |" for k,v in data["environment"].items()]
        lines += ["", "## Boundaries", ""]+ [x for x in data["limitations"]]
        lines += ["", "The production acceptance matrix in `tests/ACCEPTANCE.md` remains pending. The self-contained skill bundle is separately exercised by packaging it and running its bundled validator.", "", "## Check results", "", "| Check | Category | Result |", "|---|---|---|"]
        lines += [f"| `{r['name']}` | {r['category']} | {r['status']} |" for r in results.items]
        if failed:
            lines += ["", "## Failures", ""]+[f"{r['name']}: {r['detail']}" for r in failed]
        report_path.write_text("\n".join(lines)+"\n",encoding="utf-8")
    print(f"{data['passed']}/{data['checks']} checks passed. {data['failed']} failed. {data['schema_count']} schemas loaded offline.")
    for item in failed:
        print(f"FAIL {item['name']}: {item['detail']}",file=sys.stderr)


def main() -> int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target",type=Path,help="Validate an existing target artifact set and indexed source files, not a full scan")
    parser.add_argument("--json",type=Path,help="Optional result JSON path")
    parser.add_argument("--report",type=Path,help="Optional Markdown report path")
    args=parser.parse_args()
    tools=schema_tools(ROOT/"schemas")
    results=Results()
    results.run("schema-meta-validation",lambda:require(len(tools[0])==11,"Unexpected schema count"),"schemas")
    if args.target:
        target=args.target.resolve()
        bundle=load_bundle(target)
        structural=bundle_schema_errors(bundle,tools)
        results.run("target:schemas",lambda:require_empty(structural),"target")
        if not structural:
            results.run("target:reference-and-indexed-source-checks",lambda:require_empty(semantic_errors(**bundle,source_root=target)),"target")
            results.run("target:artifact-commit-digests",lambda:require_empty(artifact_errors(target,bundle)),"target")
        print("Target validation does not enumerate new source files, run adapters, verify arbitrary rendering, or replace full source freshness.")
    else:
        package_checks(tools,results)
    write_reports(results,tools,args.json,args.report)
    return 1 if any(r["status"]=="failed" for r in results.items) else 0


if __name__=="__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, ContractError, KeyError) as exc:
        print(f"Validation could not complete: {exc}",file=sys.stderr)
        raise SystemExit(2)
