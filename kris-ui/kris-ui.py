#!/usr/bin/env python3
"""KRIS Memory Bank UI — A sleek read-only viewer for KRIS documentation rings."""

import os
import re
import json
import webbrowser
import threading
from pathlib import Path
from datetime import datetime
from typing import Optional

import yaml

from flask import Flask, jsonify, request, abort, Response, render_template

KRIS_VERSION = "3.1"
import markdown
from markdown.extensions.codehilite import CodeHiliteExtension
from pygments.formatters import HtmlFormatter

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

RINGS = {
    "core": {
        "label": "Core",
        "color": "#D4A843",
        "budget_tokens": 15000,
        "description": "Strategic context — 20% of info for 80% of work",
        "icon": "◉",
    },
    "inner": {
        "label": "Inner",
        "color": "#4A90D9",
        "budget_tokens": 30000,
        "description": "Active work — current tasks & decisions",
        "icon": "◎",
    },
    "middle": {
        "label": "Middle",
        "color": "#4CAF50",
        "budget_tokens": 50000,
        "description": "System docs — architecture & patterns",
        "icon": "○",
    },
    "outer": {
        "label": "Outer",
        "color": "#888888",
        "budget_tokens": None,
        "description": "Archive — historical docs (unlimited)",
        "icon": "◌",
    },
}

RING_ORDER = ["core", "inner", "middle", "outer"]

MEMORY_BANK_ROOT = Path(
    os.environ.get("KRIS_MEMORY_BANK", str(Path(__file__).parent.parent.resolve()))
).resolve()

PORT = int(os.environ.get("KRIS_UI_PORT", "5111"))

# ---------------------------------------------------------------------------
# Markdown setup
# ---------------------------------------------------------------------------

PYGMENTS_CSS = HtmlFormatter(style="monokai").get_style_defs(".highlight")

MD_EXTENSIONS = [
    "tables",
    "fenced_code",
    CodeHiliteExtension(css_class="highlight", linenums=False, guess_lang=True),
    "toc",
    "md_in_html",
]


def render_markdown(raw: str) -> str:
    md = markdown.Markdown(extensions=MD_EXTENSIONS)
    html = md.convert(raw)
    # Checkbox rendering
    html = re.sub(
        r"<li>\s*\[ \]\s*",
        '<li class="task-item"><input type="checkbox" disabled> ',
        html,
    )
    html = re.sub(
        r"<li>\s*\[x\]\s*",
        '<li class="task-item"><input type="checkbox" disabled checked> ',
        html,
        flags=re.IGNORECASE,
    )
    return html


# ---------------------------------------------------------------------------
# Template registry
# ---------------------------------------------------------------------------

TEMPLATE_REGISTRY = {}  # type: dict


def scan_templates():
    """Scan templates/interactive/*/manifest.json at startup."""
    global TEMPLATE_REGISTRY
    TEMPLATE_REGISTRY = {}
    templates_dir = Path(__file__).parent / "templates" / "interactive"
    if not templates_dir.is_dir():
        return
    for d in sorted(templates_dir.iterdir()):
        if not d.is_dir() or d.name.startswith(("_", ".")):
            continue
        template_path = d / "template.html"
        if not template_path.exists():
            continue
        manifest = {}
        manifest_path = d / "manifest.json"
        if manifest_path.exists():
            try:
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                pass
        TEMPLATE_REGISTRY[d.name] = {
            "id": d.name,
            "name": manifest.get("name", d.name.replace("-", " ").title()),
            "description": manifest.get("description", ""),
            "version": manifest.get("version", "1.0"),
            "has_format": (d / "format.md").exists(),
        }


# ---------------------------------------------------------------------------
# File helpers
# ---------------------------------------------------------------------------

# Root-level files and directories included as virtual core ring entries
PROJECT_ROOT = MEMORY_BANK_ROOT.parent
CLAUDE_MD_PATH = PROJECT_ROOT / "CLAUDE.md"
AGENTS_MD_PATH = PROJECT_ROOT / "AGENTS.md"
CLAUDE_COMMANDS_DIR = PROJECT_ROOT / ".claude" / "commands"
KRIS_TASKS_DIR = PROJECT_ROOT / ".kris" / "tasks"

# Static virtual path mappings
VIRTUAL_CORE_FILES = {
    "core/CLAUDE.md": CLAUDE_MD_PATH,
    "core/AGENTS.md": AGENTS_MD_PATH,
}


def resolve_virtual_path(requested_path: str) -> Optional[Path]:
    """Resolve a virtual core path to a real filesystem path."""
    # Static mappings
    if requested_path in VIRTUAL_CORE_FILES:
        p = VIRTUAL_CORE_FILES[requested_path]
        return p if p.exists() else None
    # Dynamic: .claude/commands/ files
    if requested_path.startswith("core/.claude/commands/"):
        fname = requested_path[len("core/.claude/commands/"):]
        p = CLAUDE_COMMANDS_DIR / fname
        return p if p.exists() and p.suffix == ".md" else None
    # Dynamic: .kris/tasks/ files
    if requested_path.startswith("core/.kris/tasks/"):
        fname = requested_path[len("core/.kris/tasks/"):]
        p = KRIS_TASKS_DIR / fname
        return p if p.exists() and p.suffix == ".md" else None
    return None


def safe_resolve(requested_path: str) -> Path:
    """Resolve a relative path safely within MEMORY_BANK_ROOT (+ virtual core files)."""
    # Check virtual paths first
    virtual = resolve_virtual_path(requested_path)
    if virtual:
        return virtual
    resolved = (MEMORY_BANK_ROOT / requested_path).resolve()
    if not str(resolved).startswith(str(MEMORY_BANK_ROOT)):
        abort(403)
    if resolved.suffix != ".md":
        abort(403)
    if not resolved.exists():
        abort(404)
    return resolved


def relative_time(ts: float) -> str:
    delta = datetime.now().timestamp() - ts
    if delta < 60:
        return "just now"
    if delta < 3600:
        m = int(delta / 60)
        return f"{m}m ago"
    if delta < 86400:
        h = int(delta / 3600)
        return f"{h}h ago"
    d = int(delta / 86400)
    return f"{d}d ago"


RING_DEFAULT_FILES = {
    "core": {"README.md", "projectBrief.md", "productContext.md", "techContext.md", "CLAUDE.md", "AGENTS.md"},
    "inner": {"README.md", "activeContext.md", "progress.md"},
    "middle": {"README.md"},
    "outer": {"README.md"},
}


def file_meta(filepath: Path, ring_name: str, virtual_path: str = "") -> dict:
    stat = filepath.stat()
    content = filepath.read_text(encoding="utf-8", errors="replace")
    words = len(content.split())
    tokens = round(words * 1.3)
    if virtual_path:
        rel = virtual_path
        # Extract folder from virtual path (e.g. "core/.claude/commands/kris.md" → ".claude/commands")
        parts = virtual_path.split("/")
        if len(parts) > 2:
            folder = "/".join(parts[1:-1])  # skip ring prefix and filename
        else:
            folder = ""
    else:
        rel = str(filepath.relative_to(MEMORY_BANK_ROOT))
        ring_dir = MEMORY_BANK_ROOT / ring_name
        rel_within_ring = filepath.relative_to(ring_dir)
        folder = str(rel_within_ring.parent) if str(rel_within_ring.parent) != "." else ""
    # A file is "default" if it sits at the ring root and its name is in the known set
    is_default = folder == "" and filepath.name in RING_DEFAULT_FILES.get(ring_name, set())
    return {
        "path": rel,
        "name": filepath.name,
        "ring": ring_name,
        "folder": folder,
        "is_default": is_default,
        "size_bytes": stat.st_size,
        "modified_ts": stat.st_mtime,
        "modified_relative": relative_time(stat.st_mtime),
        "modified_iso": datetime.fromtimestamp(stat.st_mtime).isoformat(
            timespec="seconds"
        ),
        "words": words,
        "tokens": tokens,
    }


def _placeholder(folder: str, message: str) -> dict:
    """Create a placeholder entry for empty command/task directories."""
    return {
        "path": "",
        "name": message,
        "ring": "core",
        "folder": folder,
        "is_default": False,
        "size_bytes": 0,
        "modified_ts": 0,
        "modified_relative": "",
        "modified_iso": "",
        "words": 0,
        "tokens": 0,
        "placeholder": True,
    }


def get_ring_files(ring_name: str) -> list[dict]:
    ring_dir = MEMORY_BANK_ROOT / ring_name
    if not ring_dir.is_dir():
        return []
    files = sorted(ring_dir.rglob("*.md"), key=lambda p: str(p))
    result = [file_meta(f, ring_name) for f in files]
    # Include root-level files in the core ring (live at project root, outside memory-bank)
    if ring_name == "core":
        # .kris/tasks/ files
        if KRIS_TASKS_DIR.is_dir():
            task_files = sorted(KRIS_TASKS_DIR.glob("*.md"))
            if task_files:
                for tf in task_files:
                    result.append(file_meta(tf, "core",
                        virtual_path=f"core/.kris/tasks/{tf.name}"))
            else:
                result.append(_placeholder(".kris/tasks", "No tasks installed"))
        else:
            result.append(_placeholder(".kris/tasks", "No tasks installed"))
        # .claude/commands/ files
        if CLAUDE_COMMANDS_DIR.is_dir():
            cmd_files = sorted(CLAUDE_COMMANDS_DIR.glob("*.md"))
            if cmd_files:
                for cf in cmd_files:
                    result.append(file_meta(cf, "core",
                        virtual_path=f"core/.claude/commands/{cf.name}"))
            else:
                result.append(_placeholder(".claude/commands", "No commands installed"))
        else:
            result.append(_placeholder(".claude/commands", "No commands installed"))
        # AGENTS.md
        if AGENTS_MD_PATH.exists():
            result.insert(0, file_meta(AGENTS_MD_PATH, "core", virtual_path="core/AGENTS.md"))
        # CLAUDE.md
        if CLAUDE_MD_PATH.exists():
            result.insert(0, file_meta(CLAUDE_MD_PATH, "core", virtual_path="core/CLAUDE.md"))
    return result


def get_ring_stats(ring_name: str) -> dict:
    files = get_ring_files(ring_name)
    total_words = sum(f["words"] for f in files)
    total_tokens = sum(f["tokens"] for f in files)
    budget = RINGS[ring_name]["budget_tokens"]
    pct = round(total_tokens / budget * 100, 1) if budget else None
    return {
        "file_count": len(files),
        "total_words": total_words,
        "total_tokens": total_tokens,
        "budget_tokens": budget,
        "budget_pct": pct,
    }


def parse_frontmatter(content: str) -> list[dict]:
    """Extract **Key**: Value pairs from the first 15 lines."""
    lines = content.split("\n")[:15]
    pairs = []
    for line in lines:
        m = re.match(r"\*\*(.+?)\*\*:\s*(.+)", line.strip())
        if m:
            pairs.append({"key": m.group(1), "value": m.group(2)})
    return pairs


def parse_yaml_frontmatter(content: str) -> Optional[dict]:
    """Extract YAML frontmatter from --- delimited block at start of file."""
    stripped = content.lstrip()
    if not stripped.startswith("---"):
        return None
    end = stripped.find("---", 3)
    if end == -1:
        return None
    yaml_block = stripped[3:end].strip()
    if not yaml_block:
        return None
    try:
        parsed = yaml.safe_load(yaml_block)
        return parsed if isinstance(parsed, dict) else None
    except yaml.YAMLError:
        return None


def strip_yaml_frontmatter(content: str) -> str:
    """Remove YAML frontmatter block from content for rendering."""
    stripped = content.lstrip()
    if not stripped.startswith("---"):
        return content
    end = stripped.find("---", 3)
    if end == -1:
        return content
    return stripped[end + 3:].lstrip("\n")


def search_files(query: str) -> list[dict]:
    q = query.lower()
    results = []
    for ring_name in RING_ORDER:
        ring_dir = MEMORY_BANK_ROOT / ring_name
        if not ring_dir.is_dir():
            continue
        # Include virtual files (CLAUDE.md, AGENTS.md, commands, tasks in core)
        md_files = list(ring_dir.rglob("*.md"))
        if ring_name == "core":
            if AGENTS_MD_PATH.exists():
                md_files.insert(0, AGENTS_MD_PATH)
            if CLAUDE_MD_PATH.exists():
                md_files.insert(0, CLAUDE_MD_PATH)
            if CLAUDE_COMMANDS_DIR.is_dir():
                md_files.extend(sorted(CLAUDE_COMMANDS_DIR.glob("*.md")))
            if KRIS_TASKS_DIR.is_dir():
                md_files.extend(sorted(KRIS_TASKS_DIR.glob("*.md")))
        for fp in md_files:
            content = fp.read_text(encoding="utf-8", errors="replace")
            # Virtual files live outside MEMORY_BANK_ROOT
            if fp == CLAUDE_MD_PATH:
                rel = "core/CLAUDE.md"
            elif fp == AGENTS_MD_PATH:
                rel = "core/AGENTS.md"
            elif CLAUDE_COMMANDS_DIR.is_dir() and str(fp).startswith(str(CLAUDE_COMMANDS_DIR)):
                rel = f"core/.claude/commands/{fp.name}"
            elif KRIS_TASKS_DIR.is_dir() and str(fp).startswith(str(KRIS_TASKS_DIR)):
                rel = f"core/.kris/tasks/{fp.name}"
            else:
                rel = str(fp.relative_to(MEMORY_BANK_ROOT))
            lower_content = content.lower()
            if q in lower_content or q in fp.name.lower():
                # Find first match position for excerpt
                idx = lower_content.find(q)
                if idx == -1:
                    idx = 0
                start = max(0, idx - 80)
                end = min(len(content), idx + len(query) + 80)
                excerpt = content[start:end]
                # Line number
                line_no = content[:idx].count("\n") + 1
                # Highlight
                excerpt_html = re.sub(
                    re.escape(query),
                    lambda m: f"<mark>{m.group()}</mark>",
                    excerpt,
                    flags=re.IGNORECASE,
                )
                results.append(
                    {
                        "ring": ring_name,
                        "path": rel,
                        "name": fp.name,
                        "line": line_no,
                        "excerpt": excerpt_html,
                    }
                )
                if len(results) >= 50:
                    return results
    return results


# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------

app = Flask(__name__)
scan_templates()


@app.route("/api/rings")
def api_rings():
    data = {}
    for name in RING_ORDER:
        data[name] = {
            **RINGS[name],
            "files": get_ring_files(name),
            "stats": get_ring_stats(name),
        }
    return jsonify(data)


@app.route("/api/file")
def api_file():
    path_param = request.args.get("path", "")
    if not path_param:
        abort(400)
    fp = safe_resolve(path_param)
    content = fp.read_text(encoding="utf-8", errors="replace")
    ring_name = path_param.split("/")[0] if "/" in path_param else "unknown"
    # Pass virtual_path for files outside memory-bank root (e.g., CLAUDE.md)
    is_virtual = not str(fp.resolve()).startswith(str(MEMORY_BANK_ROOT))
    meta = file_meta(fp, ring_name, virtual_path=path_param if is_virtual else "")

    # Parse YAML frontmatter and strip it before rendering
    yaml_fm = parse_yaml_frontmatter(content)
    render_content = strip_yaml_frontmatter(content) if yaml_fm else content

    response = {
        "html": render_markdown(render_content),
        "raw": content,
        "meta": meta,
        "frontmatter": parse_frontmatter(content),
    }

    # Add interactive field if YAML frontmatter specifies it
    if yaml_fm and "interactive" in yaml_fm:
        val = yaml_fm["interactive"]
        response["interactive"] = val if isinstance(val, list) else [val]

    return jsonify(response)


@app.route("/api/search")
def api_search():
    q = request.args.get("q", "").strip()
    if len(q) < 2:
        return jsonify([])
    return jsonify(search_files(q))


@app.route("/api/raw-file")
def api_raw_file():
    """Serve raw markdown content for interactive docs to fetch."""
    path_param = request.args.get("path", "")
    if not path_param:
        abort(400)
    fp = safe_resolve(path_param)
    content = fp.read_text(encoding="utf-8", errors="replace")
    return Response(content, mimetype="text/plain; charset=utf-8")


@app.route("/api/interactive-docs")
def api_interactive_docs():
    """Return all interactive HTML docs across all ring directories."""
    docs = []
    for ring_name in RING_ORDER:
        interactive_dir = MEMORY_BANK_ROOT / ring_name / "interactive"
        if not interactive_dir.is_dir():
            continue
        for f in sorted(interactive_dir.glob("*.html")):
            content = f.read_text(encoding="utf-8", errors="replace")
            title_match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE)
            title = title_match.group(1) if title_match else f.stem.replace("-", " ").title()
            stat = f.stat()
            docs.append({
                "ring": ring_name,
                "name": f.stem,
                "title": title,
                "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d"),
                "size_kb": round(stat.st_size / 1024, 1),
                "url": f"/interactive/{ring_name}/{f.stem}",
            })
    return jsonify(docs)


@app.route("/interactive/<ring>/<name>")
def interactive_page(ring, name):
    """Serve interactive HTML docs from memory-bank/<ring>/interactive/."""
    safe_ring = re.sub(r"[^a-z]", "", ring)
    safe_name = re.sub(r"[^a-zA-Z0-9_-]", "", name)
    if safe_ring not in RING_ORDER:
        abort(404)
    html_path = MEMORY_BANK_ROOT / safe_ring / "interactive" / f"{safe_name}.html"
    if not html_path.exists() or not str(html_path.resolve()).startswith(
        str(MEMORY_BANK_ROOT)
    ):
        abort(404)
    return Response(html_path.read_text(encoding="utf-8"), mimetype="text/html")


@app.route("/api/templates")
def api_templates():
    """Return list of registered interactive templates."""
    templates = []
    for tid, t in TEMPLATE_REGISTRY.items():
        entry = {**t}
        if t["has_format"]:
            entry["format_url"] = f"/api/template-format?id={tid}"
        templates.append(entry)
    return jsonify(templates)


@app.route("/api/interactive-meta")
def api_interactive_meta():
    """Return all files across all rings that have interactive frontmatter tags."""
    results = []
    for ring_name in RING_ORDER:
        ring_dir = MEMORY_BANK_ROOT / ring_name
        if not ring_dir.is_dir():
            continue
        for fp in ring_dir.rglob("*.md"):
            try:
                content = fp.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            yaml_fm = parse_yaml_frontmatter(content)
            if not yaml_fm or "interactive" not in yaml_fm:
                continue
            val = yaml_fm["interactive"]
            interactive_tags = val if isinstance(val, list) else [val]
            stat = fp.stat()
            results.append({
                "path": str(fp.relative_to(MEMORY_BANK_ROOT)),
                "ring": ring_name,
                "name": fp.name,
                "interactive": interactive_tags,
                "title": yaml_fm.get("title", fp.stem.replace("-", " ").title()),
                "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d"),
            })
    return jsonify(results)


@app.route("/interactive/render/<template_id>")
def interactive_render(template_id):
    """Render an interactive template with a source markdown file."""
    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "", template_id)
    if safe_id not in TEMPLATE_REGISTRY:
        abort(404)
    src = request.args.get("src", "")
    embed = request.args.get("embed", "false")
    return render_template(
        f"interactive/{safe_id}/template.html",
        template_id=safe_id,
        src_path=src,
        embed=embed,
        kris_version=KRIS_VERSION,
    )


@app.route("/api/template-format")
def api_template_format():
    """Serve format.md from a template directory as rendered HTML."""
    tid = request.args.get("id", "")
    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "", tid)
    if safe_id not in TEMPLATE_REGISTRY:
        abort(404)
    format_path = Path(__file__).parent / "templates" / "interactive" / safe_id / "format.md"
    if not format_path.exists():
        abort(404)
    content = format_path.read_text(encoding="utf-8", errors="replace")
    return jsonify({"html": render_markdown(content), "raw": content})


def _parse_project_info() -> dict:
    """Extract project name and logo path from CLAUDE.md."""
    project_name = PROJECT_ROOT.name  # fallback: folder name
    logo_path = None
    if CLAUDE_MD_PATH.exists():
        try:
            content = CLAUDE_MD_PATH.read_text(encoding="utf-8", errors="replace")
            # Parse project name from title: "# Welcome to ProjectName!"
            title_match = re.search(r"^# Welcome to (.+?)!", content, re.MULTILINE)
            if title_match:
                project_name = title_match.group(1).strip()
            # Parse logo from frontmatter: **Logo**: path/to/logo.png
            for line in content.split("\n")[:20]:
                logo_match = re.match(r"\*\*Logo\*\*:\s*(.+)", line.strip())
                if logo_match:
                    val = logo_match.group(1).strip()
                    if val:
                        logo_path = val
                    break
        except OSError:
            pass
    return {"name": project_name, "logo_path": logo_path}


@app.route("/api/project-logo")
def api_project_logo():
    """Serve the project logo referenced in CLAUDE.md."""
    info = _parse_project_info()
    if not info["logo_path"]:
        abort(404)
    # Resolve relative to project root
    logo_file = (PROJECT_ROOT / info["logo_path"]).resolve()
    # Security: must be within project root
    if not str(logo_file).startswith(str(PROJECT_ROOT)):
        abort(403)
    if not logo_file.exists():
        abort(404)
    # Detect content type
    suffix = logo_file.suffix.lower()
    content_types = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                     ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp"}
    ct = content_types.get(suffix, "application/octet-stream")
    return Response(logo_file.read_bytes(), mimetype=ct)


@app.route("/")
def index():
    info = _parse_project_info()
    return render_template(
        "index.html",
        pygments_css=PYGMENTS_CSS,
        kris_version=KRIS_VERSION,
        ring_order=RING_ORDER,
        rings_config=RINGS,
        project_name=info["name"],
        has_project_logo=info["logo_path"] is not None,
        memory_bank_path=str(MEMORY_BANK_ROOT),
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    def open_browser():
        import time
        time.sleep(1.2)
        webbrowser.open(f"http://localhost:{PORT}")

    print(f"\n  KRIS Memory Bank UI")
    print(f"  Serving: {MEMORY_BANK_ROOT}")
    print(f"  URL:     http://localhost:{PORT}")
    print(f"  Press Ctrl+C to stop\n")

    threading.Thread(target=open_browser, daemon=True).start()
    host = os.environ.get("KRIS_UI_HOST", "0.0.0.0")
    app.run(host=host, port=PORT, debug=False)
