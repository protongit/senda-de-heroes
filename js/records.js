// Estadísticas y ranking de Senda de Héroes — capa cliente.
// Identidad sin login: un UUID anónimo + un nombre de perfil libre, guardados
// en localStorage. Solo se envían datos de juego (nunca IP, navegador ni entorno).
// Si no hay servidor disponible, las partidas quedan en una cola local y se
// reintentan cuando sea posible; el juego sigue funcionando sin la API.

const PLAYER_KEY = "senda-de-heroes.playerId";
const NAME_KEY = "senda-de-heroes.playerName";
const QUEUE_KEY = "senda-de-heroes.pendingStats";

function store() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function randomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
}

export function getPlayerId() {
  const s = store();
  if (!s) return null;
  let id = s.getItem(PLAYER_KEY);
  if (!id) {
    id = randomId();
    s.setItem(PLAYER_KEY, id);
  }
  return id;
}

export function getPlayerName() {
  const s = store();
  return (s && s.getItem(NAME_KEY)) || "";
}

export function setPlayerName(name) {
  const s = store();
  if (s) s.setItem(NAME_KEY, sanitizeName(name));
}

function sanitizeName(name) {
  return String(name || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, 24)
    .trim();
}

function api(method, path, body) {
  return fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  });
}

function enqueue(payload) {
  const s = store();
  if (!s) return { ok: false, queued: false };
  try {
    const list = JSON.parse(s.getItem(QUEUE_KEY) || "[]");
    list.push(payload);
    if (list.length > 100) list.splice(0, list.length - 100);
    s.setItem(QUEUE_KEY, JSON.stringify(list));
    return { ok: false, queued: true };
  } catch {
    return { ok: false, queued: false };
  }
}

export function computeScore(run) {
  const base = run.result === "victory" ? 5000 : 0;
  return (
    base +
    (run.depth || 0) * 100 +
    (run.level || 1) * 40 +
    (run.coins || 0) +
    (run.ascension || 0) * 800
  );
}

// Registra una partida terminada en el servidor. Devuelve una promesa que
// resuelve a { ok } o { ok:false, queued:true } si quedó en la cola local.
export function recordRun(run) {
  const playerId = getPlayerId();
  if (!playerId) return Promise.resolve({ ok: false, queued: false });
  const payload = {
    playerId,
    playerName: getPlayerName(),
    run: {
      heroId: run.heroId,
      heroName: sanitizeName(run.heroName),
      level: run.level || 1,
      depth: run.depth || 0,
      ascension: run.ascension || 0,
      coins: run.coins || 0,
      result: run.result || "defeat",
      kills: run.kills || {},
      morality: run.morality || {},
      finalBossId: run.finalBossId || null,
      defeatedBy: run.defeatedBy || null,
      durationMs: run.startedAt ? Date.now() - run.startedAt : 0,
      deckSize: run.deck ? run.deck.length : 0,
    },
  };
  return api("POST", "/api/stats", payload).catch(() => enqueue(payload));
}

export function fetchStats() {
  const playerId = getPlayerId();
  if (!playerId) return Promise.reject(new Error("sin jugador"));
  return api("GET", `/api/stats?playerId=${encodeURIComponent(playerId)}`);
}

export function fetchRanking(hero = "all", limit = 10) {
  return api("GET", `/api/ranking?hero=${encodeURIComponent(hero)}&limit=${limit}`);
}

// Guarda el nombre localmente y lo sincroniza con el servidor (para que el
// ranking muestre el nombre actual sin esperar a la siguiente partida).
export function renamePlayer(name) {
  setPlayerName(name);
  const playerId = getPlayerId();
  if (!playerId) return Promise.resolve({ ok: false });
  return api("POST", "/api/player", { playerId, playerName: sanitizeName(name) }).catch(() => ({ ok: false }));
}

export function deleteMyData() {
  const playerId = getPlayerId();
  if (!playerId) return Promise.resolve({ ok: false });
  return api("DELETE", `/api/stats?playerId=${encodeURIComponent(playerId)}`).then((res) => {
    const s = store();
    if (s && res.ok) s.removeItem(PLAYER_KEY);
    return res;
  });
}

// Reintenta enviar la cola de partidas pendientes (se llama al abrir el
// cuadro de mando y al arrancar la aplicación).
export function flushQueue() {
  const s = store();
  if (!s) return Promise.resolve();
  let list = [];
  try {
    list = JSON.parse(s.getItem(QUEUE_KEY) || "[]");
  } catch {
    list = [];
  }
  if (!list.length) return Promise.resolve();
  const pending = list.slice();
  const attempt = (i) => {
    if (i >= pending.length) return Promise.resolve();
    return api("POST", "/api/stats", pending[i])
      .then(() => {
        // eliminar el enviado con éxito
        try {
          const cur = JSON.parse(s.getItem(QUEUE_KEY) || "[]");
          cur.splice(0, 1);
          s.setItem(QUEUE_KEY, JSON.stringify(cur));
        } catch {
          // ignorar
        }
        return attempt(i + 1);
      })
      .catch(() => attempt(i + 1));
  };
  return attempt(0);
}
