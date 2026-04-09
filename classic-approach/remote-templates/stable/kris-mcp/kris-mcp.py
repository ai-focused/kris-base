#!/usr/bin/env python3
"""kris-mcp — MCP server for KRIS ring operations and WirePulse coordination.

Ring tools are always available. WirePulse tools load only when .kris/sync.json
exists with a valid circuit token.

Entry point:
    python3 memory-bank/kris-mcp/kris-mcp.py
"""

import json
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import httpx
from mcp.server.fastmcp import FastMCP

# ── Project root detection ──────────────────────────────────────────────────

def _find_root() -> Path:
    """Find KRIS project root: KRIS_ROOT env, or nearest parent with memory-bank/."""
    env = os.environ.get("KRIS_ROOT")
    if env:
        p = Path(env)
        if (p / "memory-bank").is_dir():
            return p

    cwd = Path.cwd()
    for parent in [cwd, *cwd.parents]:
        if (parent / "memory-bank").is_dir():
            return parent
    return cwd


ROOT = _find_root()
MEMORY_BANK = ROOT / "memory-bank"

# Exclude UI/MCP internals from ring operations
EXCLUDED_DIRS = {"kris-ui", "kris-mcp"}

# ── Token estimation ────────────────────────────────────────────────────────

def _tokens(text: str) -> int:
    """Estimate tokens: words * 1.3."""
    return int(len(text.split()) * 1.3)


# ── Ring helpers ────────────────────────────────────────────────────────────

RING_DIRS = {
    "core": MEMORY_BANK / "core",
    "inner": MEMORY_BANK / "inner",
    "middle": MEMORY_BANK / "middle",
    "outer": MEMORY_BANK / "outer",
}

RING_BUDGETS = {
    "core": 15_000,
    "inner": 30_000,
    "middle": 50_000,  # per-file
    "outer": 0,        # unlimited
}

# Core ring also includes root-level .md files in memory-bank/
CORE_ROOT_FILES = ["projectBrief.md", "productContext.md", "techContext.md"]


def _ring_files(ring: str) -> list[Path]:
    """List .md files in a ring, excluding internal dirs."""
    files = []
    ring_dir = RING_DIRS.get(ring)

    if ring == "core":
        # Core includes memory-bank/core/*.md + root-level project files
        if ring_dir and ring_dir.is_dir():
            files.extend(sorted(ring_dir.glob("*.md")))
        for name in CORE_ROOT_FILES:
            p = MEMORY_BANK / name
            if p.exists():
                files.append(p)

    elif ring_dir and ring_dir.is_dir():
        for md in sorted(ring_dir.rglob("*.md")):
            # Skip excluded directories
            if any(part in EXCLUDED_DIRS for part in md.relative_to(MEMORY_BANK).parts):
                continue
            files.append(md)

    return files


def _file_meta(path: Path) -> dict:
    """Return metadata for a single file."""
    content = path.read_text(encoding="utf-8", errors="replace")
    stat = path.stat()
    rel = str(path.relative_to(ROOT))
    return {
        "path": rel,
        "size_kb": round(stat.st_size / 1024, 1),
        "tokens_est": _tokens(content),
        "last_modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    }


def _ring_status(ring: str) -> dict:
    """Compute status for a single ring."""
    files = _ring_files(ring)
    total_tokens = 0
    total_size = 0
    file_count = 0

    for f in files:
        content = f.read_text(encoding="utf-8", errors="replace")
        total_tokens += _tokens(content)
        total_size += f.stat().st_size
        file_count += 1

    budget = RING_BUDGETS[ring]
    if budget == 0:
        pct = 0
        status = "green"
    else:
        if ring == "middle":
            # Middle ring is per-file — check worst case
            max_tokens = max(
                (_tokens(f.read_text(encoding="utf-8", errors="replace")) for f in files),
                default=0,
            )
            pct = int(max_tokens / budget * 100) if budget else 0
        else:
            pct = int(total_tokens / budget * 100) if budget else 0

        if pct < 60:
            status = "green"
        elif pct <= 80:
            status = "amber"
        else:
            status = "red"

    return {
        "ring": ring,
        "files": file_count,
        "size_kb": round(total_size / 1024, 1),
        "tokens_est": total_tokens,
        "budget": budget,
        "budget_pct": pct,
        "status": status,
    }


def _resolve_path(path: str) -> Path:
    """Resolve a ring-relative path to absolute. Validates within memory-bank/."""
    # Allow paths like "inner/activeContext.md" or "memory-bank/inner/activeContext.md"
    if path.startswith("memory-bank/"):
        full = ROOT / path
    else:
        full = MEMORY_BANK / path

    # Security: must be within memory-bank
    try:
        full.resolve().relative_to(MEMORY_BANK.resolve())
    except ValueError:
        raise ValueError(f"Path must be within memory-bank/: {path}")

    return full


# ── WirePulse config ────────────────────────────────────────────────────────

def _load_wirepulse() -> Optional[dict]:
    """Load active circuit from .kris/sync.json. Returns None if not configured."""
    sync_path = ROOT / ".kris" / "sync.json"
    if not sync_path.exists():
        return None

    try:
        raw = json.loads(sync_path.read_text(encoding="utf-8"))
        circuits = raw.get("circuits", [])
        if not circuits:
            return None

        active_idx = raw.get("active_idx", 0)
        if active_idx >= len(circuits):
            active_idx = 0

        c = circuits[active_idx]
        token = c.get("me", {}).get("token", "")
        if not token:
            return None

        return {
            "server": c["server"].rstrip("/"),
            "token": token,
            "circuit_id": c.get("circuit_id", ""),
        }
    except (json.JSONDecodeError, KeyError):
        return None


# ── MCP Server ──────────────────────────────────────────────────────────────

mcp = FastMCP(
    "kris-mcp",
    instructions="KRIS ring operations and WirePulse coordination tools.",
)


# ── Ring Tools ──────────────────────────────────────────────────────────────

@mcp.tool()
def kris_status(ring: str = "") -> dict:
    """Ring health metadata. Pass ring name (core/inner/middle/outer) or omit for all rings."""
    if ring and ring in RING_DIRS:
        return _ring_status(ring)

    return {"rings": [_ring_status(r) for r in RING_DIRS]}


@mcp.tool()
def kris_list(ring: str) -> list[dict]:
    """List .md files in a ring with per-file metadata. Ring: core/inner/middle/outer/all."""
    if ring == "all":
        result = []
        for r in RING_DIRS:
            result.extend(_file_meta(f) for f in _ring_files(r))
        return sorted(result, key=lambda x: x["tokens_est"], reverse=True)

    if ring not in RING_DIRS:
        raise ValueError(f"Unknown ring: {ring}. Use core/inner/middle/outer/all.")

    files = _ring_files(ring)
    result = [_file_meta(f) for f in files]
    return sorted(result, key=lambda x: x["tokens_est"], reverse=True)


@mcp.tool()
def kris_read(path: str) -> dict:
    """Read a ring file. Path relative to project root (e.g. inner/activeContext.md)."""
    full = _resolve_path(path)
    if not full.exists():
        raise FileNotFoundError(f"File not found: {path}")

    content = full.read_text(encoding="utf-8", errors="replace")
    stat = full.stat()
    return {
        "path": str(full.relative_to(ROOT)),
        "content": content,
        "tokens_est": _tokens(content),
        "last_modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    }


@mcp.tool()
def kris_write(path: str, content: str) -> dict:
    """Write or replace a ring file. Path must be within memory-bank/."""
    full = _resolve_path(path)

    # Ensure parent exists
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_text(content, encoding="utf-8")

    return {
        "path": str(full.relative_to(ROOT)),
        "tokens_est": _tokens(content),
        "written_at": datetime.now(timezone.utc).isoformat(),
    }


@mcp.tool()
def kris_append(path: str, content: str) -> dict:
    """Append content to an existing ring file with a newline separator."""
    full = _resolve_path(path)
    if not full.exists():
        raise FileNotFoundError(f"File not found: {path}")

    with open(full, "a", encoding="utf-8") as f:
        f.write("\n" + content)

    total = full.read_text(encoding="utf-8", errors="replace")
    return {
        "path": str(full.relative_to(ROOT)),
        "tokens_est": _tokens(total),
        "appended_at": datetime.now(timezone.utc).isoformat(),
    }


@mcp.tool()
def kris_search(ring: str, pattern: str, context_lines: int = 2) -> list[dict]:
    """Search ring files for a pattern (string or regex). Returns up to 50 matches."""
    if ring == "all":
        rings = list(RING_DIRS.keys())
    elif ring in RING_DIRS:
        rings = [ring]
    else:
        raise ValueError(f"Unknown ring: {ring}. Use core/inner/middle/outer/all.")

    try:
        regex = re.compile(pattern, re.IGNORECASE)
    except re.error:
        regex = re.compile(re.escape(pattern), re.IGNORECASE)

    matches = []
    for r in rings:
        for fpath in _ring_files(r):
            lines = fpath.read_text(encoding="utf-8", errors="replace").splitlines()
            rel = str(fpath.relative_to(ROOT))
            for i, line in enumerate(lines):
                if regex.search(line):
                    start = max(0, i - context_lines)
                    end = min(len(lines), i + context_lines + 1)
                    matches.append({
                        "file": rel,
                        "line": i + 1,
                        "content": line,
                        "context_before": lines[start:i],
                        "context_after": lines[i + 1:end],
                    })
                    if len(matches) >= 50:
                        return matches

    return matches


@mcp.tool()
def kris_move(from_path: str, to_path: str) -> dict:
    """Move a file within memory-bank/. Creates parent dirs. Fails if target exists."""
    src = _resolve_path(from_path)
    dst = _resolve_path(to_path)

    if not src.exists():
        raise FileNotFoundError(f"Source not found: {from_path}")
    if dst.exists():
        raise FileExistsError(f"Target already exists: {to_path}")

    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dst))

    return {
        "from_path": str(src.relative_to(ROOT)),
        "to_path": str(dst.relative_to(ROOT)),
        "moved_at": datetime.now(timezone.utc).isoformat(),
    }


# ── WirePulse Tools (conditional) ──────────────────────────────────────────

_wp = _load_wirepulse()

if _wp:
    _client = httpx.Client(
        base_url=_wp["server"],
        headers={"Authorization": f"Bearer {_wp['token']}", "Content-Type": "application/json"},
        timeout=15,
    )

    @mcp.tool()
    def wp_status() -> list[dict]:
        """Particle presence — who is online. Also serves as heartbeat."""
        r = _client.get("/particles/presence")
        r.raise_for_status()
        return r.json()

    @mcp.tool()
    def wp_tasks(status: str = "") -> list[dict]:
        """List tasks. Optional status filter: open/claimed/in-progress/blocked/needs-review/done."""
        params = {}
        if status:
            params["status"] = status
        r = _client.get("/tasks/mine", params=params)
        r.raise_for_status()
        return r.json()

    @mcp.tool()
    def wp_task_create(
        title: str,
        description: str = "",
        assignee_id: str = "",
        repo: str = "",
        branch: str = "",
        commit_sha: str = "",
    ) -> dict:
        """Create a new task. Only title is required."""
        body: dict = {"title": title}
        if description:
            body["description"] = description
        if assignee_id:
            body["assignee_id"] = assignee_id
        if repo:
            body["repo"] = repo
        if branch:
            body["branch"] = branch
        if commit_sha:
            body["commit_sha"] = commit_sha
        r = _client.post("/tasks", json=body)
        r.raise_for_status()
        return r.json()

    @mcp.tool()
    def wp_task_claim(task_id: str) -> dict:
        """Claim an open task. Idempotent if caller already owns it."""
        r = _client.patch(f"/tasks/{task_id}/claim")
        r.raise_for_status()
        return r.json()

    @mcp.tool()
    def wp_task_status(task_id: str, status: str) -> dict:
        """Update task status. Valid: open->claimed, claimed->in-progress, etc."""
        r = _client.patch(f"/tasks/{task_id}/status", json={"status": status})
        r.raise_for_status()
        return r.json()

    @mcp.tool()
    def wp_messages_list(task_id: str) -> list[dict]:
        """List messages on a task."""
        r = _client.get(f"/tasks/{task_id}/messages")
        r.raise_for_status()
        return r.json()

    @mcp.tool()
    def wp_message_post(task_id: str, body: str) -> dict:
        """Post a message on a task."""
        r = _client.post(f"/tasks/{task_id}/messages", json={"body": body})
        r.raise_for_status()
        return r.json()

    @mcp.tool()
    def wp_claim_file(file_path: str) -> dict:
        """Claim a file (advisory lock). Returns warning if already claimed by another."""
        r = _client.post("/claims", json={"file_path": file_path})
        r.raise_for_status()
        return r.json()

    @mcp.tool()
    def wp_claim_release(claim_id: str) -> dict:
        """Release a file claim."""
        r = _client.delete(f"/claims/{claim_id}")
        r.raise_for_status()
        return r.json()

    @mcp.tool()
    def wp_invite_create(role: str = "electron", expires_hours: int = 48) -> dict:
        """Create an invite code. Protons only. Returns KRIS-XXXX-XXXX code."""
        r = _client.post("/invites", json={"role": role, "expires_hours": expires_hours})
        r.raise_for_status()
        return r.json()


# ── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run(transport="stdio")
