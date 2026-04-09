"""WirePulse proxy — Flask Blueprint for /api/wp/* routes.

Reads .kris/sync.json (circuits array), proxies requests to the WirePulse server.
Tokens never reach the browser.
"""

import json
from pathlib import Path
from typing import Optional

import httpx
from flask import Blueprint, jsonify, request, abort, Response, stream_with_context

wp_bp = Blueprint("wirepulse", __name__)

_circuits: list[dict] = []
_active_idx: int = 0
_sync_json_path: Optional[Path] = None


def init_wirepulse(project_root: Path):
    global _sync_json_path
    _sync_json_path = project_root / ".kris" / "sync.json"
    _reload()


def _reload():
    global _circuits, _active_idx
    _circuits = []
    if _sync_json_path and _sync_json_path.exists():
        try:
            raw = json.loads(_sync_json_path.read_text(encoding="utf-8"))
            for c in raw.get("circuits", []):
                _circuits.append({
                    "name": c.get("name", "Unnamed"),
                    "server": c["server"].rstrip("/"),
                    "circuit_id": c.get("circuit_id", ""),
                    "token": c.get("me", {}).get("token", ""),
                    "my_name": c.get("me", {}).get("name", "unknown"),
                    "my_id": c.get("me", {}).get("id", ""),
                })
        except (json.JSONDecodeError, KeyError):
            _circuits = []
    if _active_idx >= len(_circuits):
        _active_idx = 0


def _active() -> dict:
    _reload()
    if not _circuits:
        abort(503, description="WirePulse not configured — missing .kris/sync.json")
    c = _circuits[_active_idx]
    if not c.get("token"):
        abort(503, description="Active circuit has no token")
    return c


def _headers() -> dict:
    return {"Authorization": f"Bearer {_active()['token']}", "Content-Type": "application/json"}


# ─── Config ───────────────────────────────────────────────────────────────────

@wp_bp.route("/api/wp/config")
def wp_config():
    _reload()
    if not _circuits or not any(c.get("token") for c in _circuits):
        return jsonify({"available": False, "circuits": []})

    circuits_info = []
    for i, c in enumerate(_circuits):
        server_ok = False
        if i == _active_idx:
            try:
                r = httpx.get(f"{c['server']}/health", timeout=5)
                server_ok = r.status_code == 200
            except httpx.HTTPError:
                pass
        circuits_info.append({
            "index": i, "name": c["name"], "server": c["server"],
            "circuit_id": c["circuit_id"], "my_name": c["my_name"],
            "active": i == _active_idx, "server_ok": server_ok if i == _active_idx else None,
        })

    a = _circuits[_active_idx]
    return jsonify({
        "available": True, "active_circuit": _active_idx,
        "server_ok": circuits_info[_active_idx]["server_ok"],
        "server": a["server"], "circuit_id": a["circuit_id"], "my_name": a["my_name"],
        "circuits": circuits_info,
    })


@wp_bp.route("/api/wp/switch-circuit", methods=["POST"])
def wp_switch_circuit():
    global _active_idx
    _reload()
    idx = request.get_json().get("index", 0)
    if not isinstance(idx, int) or idx < 0 or idx >= len(_circuits):
        return jsonify({"error": "Invalid circuit index"}), 400
    _active_idx = idx
    return jsonify({"status": "switched", "active_circuit": _active_idx, "name": _circuits[idx]["name"]})


# ─── Join / Create ────────────────────────────────────────────────────────────

@wp_bp.route("/api/wp/join", methods=["POST"])
def wp_join():
    data = request.get_json()
    code = data.get("code", "").strip()
    name = data.get("name", "").strip()
    server = data.get("server", "https://kris-sync.scaledagile.pro").strip().rstrip("/")
    circuit_name = data.get("circuit_name", "")
    description = data.get("description", "")
    supercharges = data.get("supercharges", [])

    if not code or not name:
        return jsonify({"error": "Code and name are required"}), 400

    try:
        r = httpx.post(f"{server}/join", json={
            "code": code, "name": name, "description": description, "supercharges": supercharges,
        }, timeout=10)
    except httpx.HTTPError as e:
        return jsonify({"error": f"Cannot reach server: {e}"}), 502

    if r.status_code != 200:
        return Response(r.content, status=r.status_code, content_type="application/json")

    result = r.json()
    _append_circuit(
        circuit_name or f"Circuit {result['circuit_id'][-6:]}",
        server,
        result["circuit_id"],
        name,
        result["token"],
        result["particle_id"],
    )

    return jsonify({"status": "joined", "particle_id": result["particle_id"], "circuit_id": result["circuit_id"]})


@wp_bp.route("/api/wp/create-circuit", methods=["POST"])
def wp_create_circuit():
    data = request.get_json()
    circuit_name = data.get("circuit_name", "").strip()
    your_name = data.get("your_name", "").strip()
    server = data.get("server", "https://kris-sync.scaledagile.pro").strip().rstrip("/")
    description = data.get("description", "")
    supercharges = data.get("supercharges", [])

    if not circuit_name or not your_name:
        return jsonify({"error": "Circuit name and your name are required"}), 400

    try:
        r = httpx.post(f"{server}/circuits/register", json={"name": circuit_name, "description": description}, timeout=10)
        if r.status_code != 200:
            return jsonify({"error": "Failed to create circuit"}), 502
        circuit = r.json()

        r2 = httpx.post(f"{server}/particles/register",
            json={"name": your_name, "type": "proton", "supercharges": supercharges},
            headers={"Authorization": f"Bearer {circuit['api_key']}"}, timeout=10)
        if r2.status_code != 200:
            return jsonify({"error": "Failed to register particle"}), 502
        particle = r2.json()
    except httpx.HTTPError as e:
        return jsonify({"error": f"Cannot reach server: {e}"}), 502

    _append_circuit(
        circuit_name,
        server,
        circuit["circuit_id"],
        your_name,
        particle["token"],
        particle["particle_id"],
    )

    return jsonify({
        "status": "created",
        "circuit_id": circuit["circuit_id"],
        "circuit_name": circuit_name,
        "particle_id": particle["particle_id"],
    })


def _append_circuit(name, server, circuit_id, my_name, token, particle_id=""):
    """Persist a newly joined/created circuit to .kris/sync.json.

    v3.7: particle_id is stored under me.id so kris-mcp wp_status can mark
    the caller with self: true. Backward compatible — empty string for legacy
    callers (but all in-tree callers now pass it).
    """
    global _active_idx
    existing = {"circuits": []}
    if _sync_json_path and _sync_json_path.exists():
        try:
            existing = json.loads(_sync_json_path.read_text(encoding="utf-8"))
            if "circuits" not in existing:
                existing = {"circuits": []}
        except (json.JSONDecodeError, KeyError):
            existing = {"circuits": []}

    me = {"name": my_name, "token": token}
    if particle_id:
        me["id"] = particle_id
    existing["circuits"].append({
        "name": name, "server": server, "circuit_id": circuit_id,
        "me": me,
    })

    if _sync_json_path:
        _sync_json_path.parent.mkdir(parents=True, exist_ok=True)
        _sync_json_path.write_text(json.dumps(existing, indent=2), encoding="utf-8")

    _reload()
    _active_idx = len(_circuits) - 1


# ─── Proxy routes ─────────────────────────────────────────────────────────────

@wp_bp.route("/api/wp/tasks")
def wp_tasks():
    c = _active()
    status_filter = request.args.get("status", "")
    url = f"{c['server']}/tasks/mine"
    if status_filter:
        url += f"?status={status_filter}"
    r = httpx.get(url, headers=_headers(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/tasks", methods=["POST"])
def wp_create_task():
    c = _active()
    r = httpx.post(f"{c['server']}/tasks", headers=_headers(), content=request.get_data(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/tasks/<task_id>/claim", methods=["PATCH"])
def wp_claim(task_id):
    c = _active()
    r = httpx.patch(f"{c['server']}/tasks/{task_id}/claim", headers=_headers(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/tasks/<task_id>/status", methods=["PATCH"])
def wp_status(task_id):
    c = _active()
    r = httpx.patch(f"{c['server']}/tasks/{task_id}/status", headers=_headers(), content=request.get_data(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/tasks/<task_id>/messages")
def wp_get_messages(task_id):
    c = _active()
    r = httpx.get(f"{c['server']}/tasks/{task_id}/messages", headers=_headers(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/tasks/<task_id>/messages", methods=["POST"])
def wp_post_message(task_id):
    c = _active()
    r = httpx.post(f"{c['server']}/tasks/{task_id}/messages", headers=_headers(), content=request.get_data(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/particles")
def wp_particles():
    c = _active()
    r = httpx.get(f"{c['server']}/particles", headers=_headers(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/particles/<particle_id>", methods=["DELETE"])
def wp_remove_particle(particle_id):
    c = _active()
    r = httpx.delete(f"{c['server']}/particles/{particle_id}", headers=_headers(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/invites")
def wp_list_invites():
    c = _active()
    r = httpx.get(f"{c['server']}/invites", headers=_headers(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/invites", methods=["POST"])
def wp_create_invite():
    c = _active()
    r = httpx.post(f"{c['server']}/invites", headers=_headers(), content=request.get_data(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/invites/<invite_id>", methods=["DELETE"])
def wp_revoke_invite(invite_id):
    c = _active()
    r = httpx.delete(f"{c['server']}/invites/{invite_id}", headers=_headers(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/presence")
def wp_presence():
    c = _active()
    r = httpx.get(f"{c['server']}/particles/presence", headers=_headers(), timeout=10)
    return Response(r.content, status=r.status_code, content_type="application/json")


@wp_bp.route("/api/wp/events")
def wp_events():
    c = _active()

    def generate():
        with httpx.Client(timeout=None) as client:
            with client.stream("GET", f"{c['server']}/events/stream",
                               headers={"Authorization": f"Bearer {c['token']}"}) as response:
                for line in response.iter_lines():
                    yield line + "\n"

    return Response(stream_with_context(generate()), content_type="text/event-stream",
                    headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"})
