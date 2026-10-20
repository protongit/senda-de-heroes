import { createRun } from "./run.js";

const SAVE_KEY = "senda-de-heroes.save";
const SAVE_VERSION = 1;

const RUN_FIELDS = [
  "heroId", "seed", "depth", "coins", "xp", "level", "maxHp", "hp", "str",
  "energyPerRound", "actionsPerRound", "nextUid", "pendingLevels", "ascension",
  "challengesSeen", "challengeDoneDepth", "morality", "chronicle", "scrapped",
  "perks", "drawBonus", "startBlock", "damageBonus", "onHitPoison", "sellBonus",
  "forgeDiscount", "afterWinHeal", "finished", "result", "options", "market",
  "shopServices",
];

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function rngState(rng) {
  return rng && typeof rng.getState === "function" ? rng.getState() : null;
}

function restoreRng(rng, state) {
  if (rng && state != null && typeof rng.setState === "function") rng.setState(state);
}

export function serializeRun(run) {
  if (!run || !run.heroId) return null;
  const data = {};
  for (const field of RUN_FIELDS) data[field] = clone(run[field]);
  data.deck = (run.deck || []).map((inst) => ({
    uid: inst.uid,
    cardId: inst.cardId,
    upgrade: inst.upgrade ? 1 : 0,
    fusedEffectId: inst.fusedEffectId || null,
  }));
  data.loadoutUids = (run.loadout || []).map((card) => card.uid).filter((uid) => uid != null);
  data.rngState = rngState(run.rng);
  data.mapRngState = rngState(run.mapRng);
  data.challengeRngState = rngState(run.challengeRng);
  data.serviceRngState = rngState(run.serviceRng);
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    meta: {
      heroId: run.heroId,
      heroName: run.heroDef?.name || run.heroId,
      heroIcon: run.heroDef?.icon || "⚔️",
      level: run.level,
      depth: run.depth,
      ascension: run.ascension || 0,
      coins: run.coins,
      hp: run.hp,
      maxHp: run.maxHp,
      deckSize: (run.deck || []).length,
    },
    run: data,
  };
}

export function deserializeRun(payload) {
  if (!payload || payload.version !== SAVE_VERSION || !payload.run || !payload.run.heroId) return null;
  const data = payload.run;
  let run;
  try {
    run = createRun(data.heroId, data.seed);
  } catch {
    return null;
  }
  for (const field of RUN_FIELDS) {
    if (data[field] !== undefined) run[field] = clone(data[field]);
  }
  run.deck = (data.deck || []).map((inst) => ({
    uid: inst.uid,
    cardId: inst.cardId,
    upgrade: inst.upgrade ? 1 : 0,
    fusedEffectId: inst.fusedEffectId || null,
  }));
  const byUid = new Map(run.deck.map((inst) => [inst.uid, inst]));
  run.loadout = (data.loadoutUids || []).map((uid) => byUid.get(uid)).filter(Boolean);
  restoreRng(run.rng, data.rngState);
  restoreRng(run.mapRng, data.mapRngState);
  restoreRng(run.challengeRng, data.challengeRngState);
  restoreRng(run.serviceRng, data.serviceRngState);
  return run;
}

function storage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readSaveData() {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(SAVE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload || payload.version !== SAVE_VERSION || !payload.run) return null;
    return payload;
  } catch {
    return null;
  }
}

export function saveRun(run) {
  const store = storage();
  if (!store) return { ok: false, reason: "El almacenamiento local no está disponible." };
  if (!run || run.finished) return { ok: false, reason: "No hay una partida en curso que guardar." };
  const payload = serializeRun(run);
  if (!payload) return { ok: false, reason: "No se pudo preparar la partida." };
  try {
    store.setItem(SAVE_KEY, JSON.stringify(payload));
    return { ok: true, savedAt: payload.savedAt };
  } catch {
    return { ok: false, reason: "No se pudo guardar la partida en este navegador." };
  }
}

export function loadRun() {
  const payload = readSaveData();
  return payload ? deserializeRun(payload) : null;
}

export function hasSavedRun() {
  return !!readSaveData();
}

export function savedRunInfo() {
  const payload = readSaveData();
  return payload ? { ...payload.meta, savedAt: payload.savedAt } : null;
}

export function clearSavedRun() {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(SAVE_KEY);
  } catch {
    // Sin almacenamiento disponible: no hay nada que borrar.
  }
}
