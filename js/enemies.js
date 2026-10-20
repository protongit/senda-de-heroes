export const ENEMIES = {
  goblin: {
    id: "goblin", name: "Goblin", level: 1, kind: "normal", hp: 40, icon: "👺",
    portrait: "assets/portraits/goblin.png", ai: "aggressive",
    moves: [
      { id: "stab", name: "Puñalada", icon: "🗡️", weight: 3, effects: [{ kind: "damage", value: 10 }] },
      { id: "slash", name: "Zarpazo", icon: "🐾", weight: 2, effects: [{ kind: "damage", value: 12 }] },
      { id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] },
    ],
    rewards: { coins: [8, 14], xp: 10, drops: [{ tier: "common", chance: 0.25 }] },
  },
  lobo: {
    id: "lobo", name: "Lobo Salvaje", level: 2, kind: "normal", hp: 54, icon: "🐺",
    portrait: "assets/portraits/lobo.png", ai: "aggressive",
    moves: [
      { id: "bite", name: "Mordisco", icon: "🦷", weight: 3, effects: [{ kind: "damage", value: 15 }] },
      { id: "claw", name: "Garra", icon: "🐾", weight: 3, effects: [{ kind: "damage", value: 15 }] },
      { id: "howl", name: "Aullido", icon: "🌙", weight: 1, effects: [{ kind: "strength", value: 2 }] },
    ],
    rewards: { coins: [12, 20], xp: 18, drops: [{ tier: "common", chance: 0.25 }] },
  },
  esqueleto: {
    id: "esqueleto", name: "Esqueleto Guerrero", level: 3, kind: "normal", hp: 75, icon: "💀",
    portrait: "assets/portraits/esqueleto.png", ai: "balanced",
    moves: [
      { id: "cleave", name: "Tajo", icon: "⚔️", weight: 3, effects: [{ kind: "damage", value: 22 }] },
      { id: "bone", name: "Guardia de Hueso", icon: "🦴", weight: 2, effects: [{ kind: "block", value: 11 }] },
      { id: "strike", name: "Golpe", icon: "🗡️", weight: 2, effects: [{ kind: "damage", value: 22 }] },
    ],
    rewards: { coins: [18, 28], xp: 28, drops: [{ tier: "common", chance: 0.3 }] },
  },
  trol: {
    id: "trol", name: "Trol", level: 4, kind: "normal", hp: 104, icon: "🧟",
    portrait: "assets/portraits/trol.png", ai: "balanced",
    moves: [
      { id: "smash", name: "Mazazo", icon: "🔨", weight: 3, effects: [{ kind: "damage", value: 27 }] },
      { id: "swipe", name: "Barrido", icon: "💢", weight: 2, effects: [{ kind: "damage", value: 22 }] },
      { id: "regen", name: "Regeneración", icon: "💚", weight: 2, effects: [{ kind: "heal", value: 13 }] },
      { id: "hide", name: "Piel de Piedra", icon: "🪨", weight: 1, effects: [{ kind: "block", value: 13 }] },
    ],
    rewards: { coins: [26, 38], xp: 40, drops: [{ tier: "uncommon", chance: 0.35 }] },
  },
  nigromante: {
    id: "nigromante", name: "Nigromante", level: 5, kind: "elite", hp: 112, icon: "🧙‍♂️",
    portrait: "assets/portraits/nigromante.png", ai: "caster",
    moves: [
      { id: "soul", name: "Drenar Alma", icon: "🩸", weight: 3, effects: [{ kind: "damage", value: 17 }, { kind: "heal", value: 12 }] },
      { id: "bolt", name: "Descarga Necrótica", icon: "🟣", weight: 3, effects: [{ kind: "damage", value: 27 }] },
      { id: "ward", name: "Sello Oscuro", icon: "🔮", weight: 2, effects: [{ kind: "block", value: 12 }] },
      { id: "curse", name: "Maldición de Flaqueza", icon: "☠️", weight: 2, duration: 2, effects: [{ kind: "weaken", value: 25 }, { kind: "damage", value: 8 }, { kind: "addCurse", cardId: "curse_open_wound", value: 1 }] },
    ],
    rewards: { coins: [40, 55], xp: 60, drops: [{ tier: "uncommon", chance: 0.5 }] },
  },
  senor_orco: {
    id: "senor_orco", name: "Señor de la Guerra Orco", level: 6, kind: "boss", hp: 160, icon: "👹",
    portrait: "assets/portraits/senor_orco.png", ai: "aggressive",
    moves: [
      { id: "crush", name: "Zarpazo Brutal", icon: "💥", weight: 3, effects: [{ kind: "damage", value: 25 }] },
      { id: "fury", name: "Furia", icon: "🔥", weight: 2, effects: [{ kind: "strength", value: 3 }] },
      { id: "cleave", name: "Tajo Doble", icon: "⚔️", weight: 2, effects: [{ kind: "damage", value: 20 }] },
      { id: "brace", name: "Guardia de Hierro", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 15 }] },
    ],
    rewards: { coins: [60, 85], xp: 110, drops: [{ tier: "rare", chance: 1.0 }] },
  },
  lich: {
    id: "lich", name: "Lich Anciano", level: 7, kind: "boss", hp: 200, icon: "☠️",
    portrait: "assets/portraits/lich.png", ai: "caster",
    moves: [
      { id: "oblivion", name: "Rayo de Oblivión", icon: "⚡", weight: 3, effects: [{ kind: "damage", value: 30 }] },
      { id: "siphon", name: "Sifón Vital", icon: "🩸", weight: 3, effects: [{ kind: "damage", value: 17 }, { kind: "heal", value: 17 }] },
      { id: "barrier", name: "Barrera Helada", icon: "❄️", weight: 2, effects: [{ kind: "block", value: 21 }] },
      { id: "curse", name: "Maldición Eterna", icon: "🌑", weight: 2, duration: 2, effects: [{ kind: "damage", value: 14 }, { kind: "fewerActions", value: 1 }, { kind: "addCurse", cardId: "curse_lich_whisper", value: 1 }] },
      { id: "plague", name: "Plaga Necrótica", icon: "🧫", weight: 2, duration: 3, effects: [{ kind: "poison", value: 4 }] },
    ],
    rewards: { coins: [100, 150], xp: 160, drops: [{ tier: "epic", chance: 1.0 }] },
  },
};

import { BALANCE } from "./balance-config.js";

function currentScale() {
  if (typeof process !== "undefined" && process.env && process.env.ENEMY_SCALE) {
    return parseFloat(process.env.ENEMY_SCALE);
  }
  return BALANCE.enemyScale ?? 1;
}

export function getEnemy(id, ascension = 0) {
  const e = ENEMIES[id];
  if (!e) throw new Error(`Enemigo desconocido: ${id}`);
  const s = currentScale() * (1 + BALANCE.ascensionStep * (ascension || 0));
  if (Math.abs(s - 1) < 1e-6) return e;
  const scale = (v) => Math.max(1, Math.round(v * s));
  return {
    ...e,
    hp: scale(e.hp),
    moves: e.moves.map((m) => ({
      ...m,
      effects: m.effects.map((ef) => (["damage", "block", "heal"].includes(ef.kind) ? { ...ef, value: scale(ef.value) } : ef)),
    })),
  };
}
