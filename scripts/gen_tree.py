from pathlib import Path

# scripts/gen_tree.py -> repo root is one level up
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "TREE.md"

EXCLUDE_DIRS = {
    ".git",
    ".github",
    ".venv",
    "__pycache__",
    ".pytest_cache",
    ".ruff_cache",
    ".vscode",
    "node_modules",
    "out",
    "out_test",
}

EXCLUDE_FILES = {
    ".DS_Store",
    ".gitignore",
    "TREE.md",
}


def build_tree(path: Path, prefix: str = "") -> list[str]:
    """Recursively build a clean text tree."""
    lines: list[str] = []

    entries = sorted(
        [
            p
            for p in path.iterdir()
            if not p.name.startswith(".")
            and p.name not in EXCLUDE_FILES
            and p.name not in EXCLUDE_DIRS
        ],
        key=lambda p: (p.is_file(), p.name.lower()),
    )

    for i, p in enumerate(entries):
        elbow = "└── " if i == len(entries) - 1 else "├── "
        lines.append(prefix + elbow + p.name)
        if p.is_dir():
            more = "    " if i == len(entries) - 1 else "│   "
            lines.extend(build_tree(p, prefix + more))
    return lines


def make_md_tree() -> str:
    """Generate markdown-friendly repo tree with root folder name."""
    repo_name = ROOT.name
    body = ["```text", repo_name]
    body.extend(build_tree(ROOT))
    body.append("```")
    return "\n".join(body)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    md_tree = make_md_tree()
    OUT.write_text(md_tree, encoding="utf-8")
    print(f"✅ Repo tree written to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
