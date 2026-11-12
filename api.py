"""API de estadísticas de Senda de Héroes.

Servicio mínimo sin dependencias (solo stdlib: http.server + sqlite3) que
persiste las estadísticas de partida y sirve el ranking. Solo se almacenan
datos de juego: un identificador anónimo (UUID), un nombre de perfil libre y
los campos numéricos de cada partida. No se leen ni guardan IPs, cabeceras,
cookies ni metadatos del navegador.

Endpoints:
  GET    /api/health                 -> { "ok": true }
  POST   /api/stats                  -> registra una partida terminada
  GET    /api/stats?playerId=...     -> estadísticas completas del jugador
  GET    /api/ranking?hero=<id|all>&limit=N -> ranking (vista reducida)
  DELETE /api/stats?playerId=...     -> borra todos los datos del jugador
"""
import json
import os
import sqlite3
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

DB_PATH = os.environ.get("STATS_DB", os.path.join("data", "stats.db"))

_lock = threading.Lock()
_ready = False

SCHEMA = """
CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  hero_id TEXT NOT NULL,
  hero_name TEXT NOT NULL DEFAULT '',
  level INTEGER NOT NULL,
  depth INTEGER NOT NULL,
  ascension INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL,
  score INTEGER NOT NULL,
  kills TEXT NOT NULL DEFAULT '{}',
  morality TEXT NOT NULL DEFAULT '{}',
  final_boss_id TEXT,
  defeated_by TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  deck_size INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_runs_player ON runs(player_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_runs_hero ON runs(hero_id, score DESC);
"""


def _connect():
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    global _ready
    if _ready:
        return
    with _lock:
        if _ready:
            return
        conn = _connect()
        try:
            conn.executescript(SCHEMA)
            conn.commit()
        finally:
            conn.close()
        _ready = True


def _score(run):
    base = 5000 if run.get("result") == "victory" else 0
    return (
        base
        + int(run.get("depth") or 0) * 100
        + int(run.get("level") or 1) * 40
        + int(run.get("coins") or 0)
        + int(run.get("ascension") or 0) * 800
    )


def _run_dict(row):
    return {
        "heroId": row["hero_id"],
        "heroName": row["hero_name"],
        "level": row["level"],
        "depth": row["depth"],
        "ascension": row["ascension"],
        "coins": row["coins"],
        "result": row["result"],
        "score": row["score"],
        "kills": json.loads(row["kills"] or "{}"),
        "morality": json.loads(row["morality"] or "{}"),
        "finalBossId": row["final_boss_id"],
        "defeatedBy": row["defeated_by"],
        "durationMs": row["duration_ms"],
        "deckSize": row["deck_size"],
        "createdAt": row["created_at"],
    }


def _upsert_player(conn, player_id, name, now):
    conn.execute(
        "INSERT OR IGNORE INTO players(player_id, name, created_at) VALUES (?, ?, ?)",
        (player_id, name or "", now),
    )
    conn.execute(
        "UPDATE players SET name = ? WHERE player_id = ?",
        (name or "", player_id),
    )


def set_player_name(player_id, name):
    """Crea (si no existe) o renombra a un jugador sin registrar una partida."""
    init_db()
    with _lock:
        conn = _connect()
        try:
            now = int(time.time() * 1000)
            _upsert_player(conn, player_id, name, now)
            conn.commit()
            return {"ok": True}
        finally:
            conn.close()


def record_run(player_id, player_name, run):
    init_db()
    with _lock:
        conn = _connect()
        try:
            now = int(time.time() * 1000)
            _upsert_player(conn, player_id, player_name, now)
            score = _score(run)
            conn.execute(
                """INSERT INTO runs
                   (player_id, hero_id, hero_name, level, depth, ascension, coins,
                    result, score, kills, morality, final_boss_id, defeated_by,
                    duration_ms, deck_size, created_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    player_id,
                    run.get("heroId") or "",
                    run.get("heroName") or "",
                    int(run.get("level") or 1),
                    int(run.get("depth") or 0),
                    int(run.get("ascension") or 0),
                    int(run.get("coins") or 0),
                    run.get("result") or "defeat",
                    score,
                    json.dumps(run.get("kills") or {}),
                    json.dumps(run.get("morality") or {}),
                    run.get("finalBossId"),
                    run.get("defeatedBy"),
                    int(run.get("durationMs") or 0),
                    int(run.get("deckSize") or 0),
                    now,
                ),
            )
            conn.commit()
            return {"ok": True, "score": score}
        finally:
            conn.close()


def _empty_stats(player_id, name=""):
    return {
        "player": {"id": player_id, "name": name, "createdAt": None},
        "aggregates": {
            "runs": 0, "wins": 0, "losses": 0, "winRate": 0, "bestScore": 0,
            "totalCoins": 0, "totalKills": 0, "totalPlayMs": 0,
            "maxAscension": 0, "maxLevel": 1,
        },
        "byHero": [],
        "byEnemy": [],
        "morality": {"mercy": 0, "greed": 0, "honor": 0, "corruption": 0},
        "recentRuns": [],
    }


def get_player_stats(player_id):
    init_db()
    with _lock:
        conn = _connect()
        try:
            p = conn.execute(
                "SELECT * FROM players WHERE player_id = ?", (player_id,)
            ).fetchone()
            if not p:
                return None
            rows = conn.execute(
                "SELECT * FROM runs WHERE player_id = ? ORDER BY created_at DESC",
                (player_id,),
            ).fetchall()
            runs = [_run_dict(r) for r in rows]
            wins = sum(1 for r in runs if r["result"] == "victory")
            losses = len(runs) - wins
            total_kills = sum(sum((r["kills"] or {}).values()) for r in runs)
            total_coins = sum(r["coins"] for r in runs)
            total_play = sum(r["durationMs"] for r in runs)
            best = max((r["score"] for r in runs), default=0)
            max_asc = max((r["ascension"] for r in runs), default=0)
            max_level = max((r["level"] for r in runs), default=1)

            by_hero = {}
            for r in runs:
                h = by_hero.setdefault(
                    r["heroId"],
                    {"heroId": r["heroId"], "runs": 0, "wins": 0, "bestScore": 0, "maxAscension": 0},
                )
                h["runs"] += 1
                if r["result"] == "victory":
                    h["wins"] += 1
                h["bestScore"] = max(h["bestScore"], r["score"])
                h["maxAscension"] = max(h["maxAscension"], r["ascension"])

            by_enemy = {}
            for r in runs:
                for eid, cnt in (r["kills"] or {}).items():
                    by_enemy.setdefault(eid, {"defeats": 0, "deaths": 0})["defeats"] += int(cnt)
                if r["result"] == "defeat" and r.get("defeatedBy"):
                    by_enemy.setdefault(r["defeatedBy"], {"defeats": 0, "deaths": 0})["deaths"] += 1

            morality = {"mercy": 0, "greed": 0, "honor": 0, "corruption": 0}
            for r in runs:
                for k in morality:
                    morality[k] += (r["morality"] or {}).get(k, 0)

            return {
                "player": {"id": p["player_id"], "name": p["name"], "createdAt": p["created_at"]},
                "aggregates": {
                    "runs": len(runs),
                    "wins": wins,
                    "losses": losses,
                    "winRate": round(wins / len(runs) * 100, 1) if runs else 0,
                    "bestScore": best,
                    "totalCoins": total_coins,
                    "totalKills": total_kills,
                    "totalPlayMs": total_play,
                    "maxAscension": max_asc,
                    "maxLevel": max_level,
                },
                "byHero": list(by_hero.values()),
                "byEnemy": [
                    {"enemyId": k, "defeats": v["defeats"], "deaths": v["deaths"]}
                    for k, v in sorted(by_enemy.items(), key=lambda kv: -(kv[1]["defeats"] + kv[1]["deaths"]))
                ],
                "morality": morality,
                "recentRuns": runs[:20],
            }
        finally:
            conn.close()


def get_ranking(hero, limit):
    init_db()
    with _lock:
        conn = _connect()
        try:
            query = (
                "SELECT r.*, p.name AS player_name FROM runs r "
                "JOIN players p ON p.player_id = r.player_id"
            )
            params = []
            if hero and hero != "all":
                query += " WHERE r.hero_id = ?"
                params.append(hero)
            query += " ORDER BY r.created_at ASC"
            rows = conn.execute(query, params).fetchall()

            # Agrupa por jugador: agregados globales + la última senda jugada.
            by_player = {}
            for r in rows:
                pid = r["player_id"]
                p = by_player.setdefault(pid, {
                    "playerId": pid,
                    "playerName": r["player_name"] or "Jugador",
                    "runs": 0,
                    "wins": 0,
                    "bestScore": 0,
                    "totalCoins": 0,
                    "totalKills": 0,
                    "maxAscension": 0,
                    "maxLevel": 1,
                    "lastRun": None,
                })
                p["runs"] += 1
                if r["result"] == "victory":
                    p["wins"] += 1
                p["bestScore"] = max(p["bestScore"], r["score"])
                p["totalCoins"] += r["coins"]
                p["totalKills"] += sum(json.loads(r["kills"] or "{}").values())
                p["maxAscension"] = max(p["maxAscension"], r["ascension"])
                p["maxLevel"] = max(p["maxLevel"], r["level"])
                p["lastRun"] = {
                    "heroId": r["hero_id"],
                    "heroName": r["hero_name"],
                    "level": r["level"],
                    "ascension": r["ascension"],
                    "result": r["result"],
                    "score": r["score"],
                    "createdAt": r["created_at"],
                }

            result = list(by_player.values())
            for p in result:
                p["winRate"] = round(p["wins"] / p["runs"] * 100, 1) if p["runs"] else 0
            result.sort(key=lambda p: (-p["bestScore"], -p["wins"], -p["winRate"]))
            return result[: int(limit)]
        finally:
            conn.close()


def delete_player(player_id):
    init_db()
    with _lock:
        conn = _connect()
        try:
            conn.execute("DELETE FROM runs WHERE player_id = ?", (player_id,))
            conn.execute("DELETE FROM players WHERE player_id = ?", (player_id,))
            conn.commit()
            return {"ok": True}
        finally:
            conn.close()


def dispatch(method, path, query, body):
    """Rutea una petición y devuelve (status, dict). Separado del handler HTTP
    para poder montarlo también en el servidor estático de desarrollo."""
    if path == "/api/health" and method == "GET":
        return 200, {"ok": True}

    if path == "/api/stats":
        if method == "POST":
            try:
                data = json.loads(body.decode("utf-8")) if body else {}
            except Exception:
                return 400, {"error": "cuerpo JSON inválido"}
            player_id = data.get("playerId")
            run = data.get("run")
            if not player_id or not run:
                return 400, {"error": "playerId y run requeridos"}
            return 200, record_run(player_id, data.get("playerName"), run)

        player_id = (query.get("playerId") or [""])[0]
        if not player_id:
            return 400, {"error": "playerId requerido"}
        if method == "GET":
            data = get_player_stats(player_id)
            if data is None:
                return 200, _empty_stats(player_id)
            return 200, data
        if method == "DELETE":
            return 200, delete_player(player_id)
        return 405, {"error": "método no permitido"}

    if path == "/api/player" and method == "POST":
        try:
            data = json.loads(body.decode("utf-8")) if body else {}
        except Exception:
            return 400, {"error": "cuerpo JSON inválido"}
        player_id = data.get("playerId")
        if not player_id:
            return 400, {"error": "playerId requerido"}
        return 200, set_player_name(player_id, data.get("playerName"))

    if path == "/api/ranking" and method == "GET":
        hero = (query.get("hero") or ["all"])[0]
        try:
            limit = int((query.get("limit") or ["10"])[0])
        except ValueError:
            limit = 10
        limit = max(1, min(limit, 100))
        return 200, {"ranking": get_ranking(hero, limit)}

    return 404, {"error": "no encontrado"}


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _handle(self, method):
        parsed = urlparse(self.path)
        body = b""
        if method in ("POST", "PUT"):
            try:
                length = int(self.headers.get("Content-Length") or 0)
                body = self.rfile.read(length)
            except Exception:
                body = b""
        status, obj = dispatch(method, parsed.path, parse_qs(parsed.query), body)
        self._send(status, obj)

    def do_GET(self):
        self._handle("GET")

    def do_POST(self):
        self._handle("POST")

    def do_DELETE(self):
        self._handle("DELETE")

    def log_message(self, fmt, *args):
        # No se registra la IP ni las cabeceras del cliente.
        pass


def main():
    init_db()
    port = int(os.environ.get("PORT", "8000"))
    httpd = ThreadingHTTPServer(("", port), Handler)
    print(f"Senda de Héroes — API de estadísticas en :{port} (DB: {DB_PATH})")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
