"""Build a complete local FeatureFacts skill bundle without application data."""
from __future__ import annotations

import argparse
import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def package(output: Path, replace: bool = False) -> Path:
    output = output.expanduser().absolute()
    if output.is_symlink():
        raise ValueError("Refusing a symlink destination")
    output = output.resolve()
    if output == ROOT or output.is_relative_to(ROOT) or ROOT.is_relative_to(output):
        raise ValueError("Choose an output outside the source package and its ancestors")
    if output.exists():
        if not output.is_dir():
            raise ValueError("Output exists and is not a directory")
        if any(output.iterdir()):
            if not replace:
                raise ValueError("Output is nonempty. Choose a new directory or pass --replace for a previous bundle")
            if not (output/"BUNDLE_INFO.md").exists():
                raise ValueError("Replacement is limited to an existing FeatureFacts bundle")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".featurefacts-skill-",dir=output.parent) as temp:
        staging=Path(temp)/"bundle"
        staging.mkdir()
        for dirname in ("schemas","examples","tools","tests"):
            shutil.copytree(ROOT/dirname,staging/dirname,
                            ignore=shutil.ignore_patterns("__pycache__","*.pyc"))
        shutil.copytree(ROOT/"docs",staging/"references")
        for filename in ("SKILL.md","FEATUREFACTS_LITE.md"):
            shutil.copyfile(ROOT/"content"/filename,staging/filename)
        shutil.copyfile(ROOT/"content/INSTALLATION.md",staging/"references/INSTALLATION.md")
        shutil.copyfile(ROOT/"requirements-validation.txt",staging/"requirements-validation.txt")
        (staging/"BUNDLE_INFO.md").write_text(
            "# FeatureFacts skill bundle\n\nFormat: 0.2.0 revised draft.\n\n"
            "This bundle contains a skill, schemas, references, synthetic examples, and an offline validation harness. "
            "It does not contain a production scanner or data from a user's application.\n\n"
            "Start with SKILL.md and references/INSTALLATION.md. Run `python tools/validate_package.py` "
            "to validate the bundled examples. Use `--target /path/to/repository` only for an existing artifact set, "
            "not as a replacement for a full production source scan.\n",encoding="utf-8")
        backup=None
        if output.exists():
            if any(output.iterdir()):
                backup=Path(temp)/"previous-bundle"
                output.rename(backup)
            else:
                output.rmdir()
        try:
            staging.rename(output)
        except OSError:
            if backup is not None and not output.exists():
                backup.rename(output)
            raise
    return output


def main() -> None:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output",type=Path,required=True)
    parser.add_argument("--replace",action="store_true",help="Replace a previously generated bundle")
    args=parser.parse_args()
    try:
        path=package(args.output,args.replace)
    except (OSError,ValueError) as exc:
        parser.error(str(exc))
    print(f"Self-contained FeatureFacts skill bundle created at {path}")


if __name__=="__main__":
    main()
