export const ENEMIES = {
  goblin: {
    id: "goblin", name: "Goblin", level: 1, kind: "normal", hp: 40, icon: "👺",
    portrait: "assets/portraits/goblin.png", ai: "aggressive", battleLabel: "Emboscada goblin",
    moves: [
      { id: "stab", name: "Puñalada", icon: "🗡️", weight: 3, effects: [{ kind: "damage", value: 10 }] },
      { id: "slash", name: "Zarpazo", icon: "🐾", weight: 2, effects: [{ kind: "damage", value: 12 }] },
      { id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] },
    ],
    rewards: { coins: [8, 14], xp: 10, drops: [{ tier: "common", chance: 0.25 }] },
  },
  bandido: {
    id: "bandido", name: "Bandido", level: 1, kind: "normal", hp: 38, icon: "🗡️",
    portrait: "assets/portraits/bandido.png", ai: "aggressive", battleLabel: "Emboscada de bandidos",
    moves: [
      { id: "stab", name: "Apuñalar", icon: "🗡️", weight: 3, effects: [{ kind: "damage", value: 9 }] },
      { id: "dirty", name: "Golpe Sucio", icon: "💢", weight: 2, duration: 2, effects: [{ kind: "damage", value: 7 }, { kind: "weaken", value: 15 }] },
      { id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 4 }] },
    ],
    rewards: { coins: [9, 15], xp: 11, drops: [{ tier: "common", chance: 0.25 }] },
  },
  lobo: {
    id: "lobo", name: "Lobo Salvaje", level: 2, kind: "normal", hp: 54, icon: "🐺",
    portrait: "assets/portraits/lobo.png", ai: "aggressive", battleLabel: "Bestias salvajes",
    moves: [
      { id: "bite", name: "Mordisco", icon: "🦷", weight: 3, effects: [{ kind: "damage", value: 15 }] },
      { id: "claw", name: "Garra", icon: "🐾", weight: 3, effects: [{ kind: "damage", value: 15 }] },
      { id: "howl", name: "Aullido", icon: "🌙", weight: 1, effects: [{ kind: "strength", value: 2 }] },
    ],
    rewards: { coins: [12, 20], xp: 18, drops: [{ tier: "common", chance: 0.25 }] },
  },
  oso: {
    id: "oso", name: "Oso Cavernario", level: 2, kind: "normal", hp: 62, icon: "🐻",
    portrait: "assets/portraits/oso.png", ai: "aggressive", battleLabel: "Oso cavernario",
    moves: [
      { id: "maul", name: "Zarpazo", icon: "🐾", weight: 3, effects: [{ kind: "damage", value: 15 }] },
      { id: "bite", name: "Mordida", icon: "🦷", weight: 2, effects: [{ kind: "damage", value: 13 }] },
      { id: "roar", name: "Rugido", icon: "🌙", weight: 1, effects: [{ kind: "strength", value: 2 }] },
    ],
    rewards: { coins: [13, 21], xp: 19, drops: [{ tier: "common", chance: 0.25 }] },
  },
  esqueleto: {
    id: "esqueleto", name: "Esqueleto Guerrero", level: 3, kind: "normal", hp: 75, icon: "💀",
    portrait: "assets/portraits/esqueleto.png", ai: "balanced", battleLabel: "No-muertos",
    moves: [
      { id: "cleave", name: "Tajo", icon: "⚔️", weight: 3, effects: [{ kind: "damage", value: 22 }] },
      { id: "bone", name: "Guardia de Hueso", icon: "🦴", weight: 2, effects: [{ kind: "block", value: 11 }] },
      { id: "strike", name: "Golpe", icon: "🗡️", weight: 2, effects: [{ kind: "damage", value: 22 }] },
    ],
    rewards: { coins: [18, 28], xp: 28, drops: [{ tier: "common", chance: 0.3 }] },
  },
  espectro: {
    id: "espectro", name: "Espectro", level: 3, kind: "normal", hp: 68, icon: "👻",
    portrait: "assets/portraits/espectro.png", ai: "caster", battleLabel: "Espectro",
    moves: [
      { id: "touch", name: "Toque Gélido", icon: "❄️", weight: 3, effects: [{ kind: "damage", value: 17 }] },
      { id: "wail", name: "Lamento", icon: "💨", weight: 2, duration: 2, effects: [{ kind: "weaken", value: 20 }, { kind: "damage", value: 8 }] },
      { id: "phase", name: "Fase Etérea", icon: "🌫️", weight: 2, effects: [{ kind: "block", value: 12 }] },
    ],
    rewards: { coins: [18, 28], xp: 29, drops: [{ tier: "common", chance: 0.3 }] },
  },
  trol: {
    id: "trol", name: "Trol", level: 4, kind: "normal", hp: 104, icon: "🧟",
    portrait: "assets/portraits/trol.png", ai: "balanced", battleLabel: "Guarida del trol",
    moves: [
      { id: "smash", name: "Mazazo", icon: "🔨", weight: 3, effects: [{ kind: "damage", value: 27 }] },
      { id: "swipe", name: "Barrido", icon: "💢", weight: 2, effects: [{ kind: "damage", value: 22 }] },
      { id: "regen", name: "Regeneración", icon: "💚", weight: 2, effects: [{ kind: "heal", value: 13 }] },
      { id: "hide", name: "Piel de Piedra", icon: "🪨", weight: 1, effects: [{ kind: "block", value: 13 }] },
    ],
    rewards: { coins: [26, 38], xp: 40, drops: [{ tier: "uncommon", chance: 0.35 }] },
  },
  ogro: {
    id: "ogro", name: "Ogro", level: 4, kind: "normal", hp: 118, icon: "🪓",
    portrait: "assets/portraits/ogro.png", ai: "aggressive", battleLabel: "Ogro",
    moves: [
      { id: "club", name: "Mazazo", icon: "🔨", weight: 3, effects: [{ kind: "damage", value: 29 }] },
      { id: "slam", name: "Golpe Pesado", icon: "💢", weight: 2, effects: [{ kind: "damage", value: 22 }, { kind: "block", value: 6 }] },
      { id: "roar", name: "Grito de Guerra", icon: "🔥", weight: 1, effects: [{ kind: "strength", value: 3 }] },
    ],
    rewards: { coins: [27, 39], xp: 42, drops: [{ tier: "uncommon", chance: 0.35 }] },
  },
  nigromante: {
    id: "nigromante", name: "Nigromante", level: 5, kind: "elite", hp: 112, icon: "🧙‍♂️",
    portrait: "assets/portraits/nigromante.png", ai: "caster", battleLabel: "Élite nigromante",
    moves: [
      { id: "soul", name: "Drenar Alma", icon: "🩸", weight: 3, effects: [{ kind: "damage", value: 17 }, { kind: "heal", value: 12 }] },
      { id: "bolt", name: "Descarga Necrótica", icon: "🟣", weight: 3, effects: [{ kind: "damage", value: 27 }] },
      { id: "ward", name: "Sello Oscuro", icon: "🔮", weight: 2, effects: [{ kind: "block", value: 12 }] },
      { id: "curse", name: "Maldición de Flaqueza", icon: "☠️", weight: 2, duration: 2, effects: [{ kind: "weaken", value: 25 }, { kind: "damage", value: 8 }, { kind: "addCurse", cardId: "curse_open_wound", value: 1 }] },
    ],
    rewards: { coins: [40, 55], xp: 60, drops: [{ tier: "uncommon", chance: 0.5 }] },
  },
  vampiro: {
    id: "vampiro", name: "Vampiro", level: 5, kind: "elite", hp: 108, icon: "🧛",
    portrait: "assets/portraits/vampiro.png", ai: "caster", battleLabel: "Vampiro",
    moves: [
      { id: "drain", name: "Mordisco Vampírico", icon: "🩸", weight: 3, effects: [{ kind: "damage", value: 20 }, { kind: "heal", value: 10 }] },
      { id: "claw", name: "Garra Nocturna", icon: "🌙", weight: 3, effects: [{ kind: "damage", value: 24 }] },
      { id: "mist", name: "Forma de Niebla", icon: "🌫️", weight: 2, effects: [{ kind: "block", value: 14 }] },
      { id: "curse", name: "Sed Eterna", icon: "🦇", weight: 2, duration: 2, effects: [{ kind: "damage", value: 12 }, { kind: "addCurse", cardId: "curse_open_wound", value: 1 }] },
    ],
    rewards: { coins: [42, 57], xp: 62, drops: [{ tier: "uncommon", chance: 0.5 }] },
  },
  senor_orco: {
    id: "senor_orco", name: "Señor de la Guerra Orco", level: 6, kind: "boss", hp: 160, icon: "👹",
    portrait: "assets/portraits/senor_orco.png", ai: "aggressive", battleLabel: "Jefe: Señor Orco",
    moves: [
      { id: "crush", name: "Zarpazo Brutal", icon: "💥", weight: 3, effects: [{ kind: "damage", value: 25 }] },
      { id: "fury", name: "Furia", icon: "🔥", weight: 2, effects: [{ kind: "strength", value: 3 }] },
      { id: "cleave", name: "Tajo Doble", icon: "⚔️", weight: 2, effects: [{ kind: "damage", value: 20 }] },
      { id: "brace", name: "Guardia de Hierro", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 15 }] },
    ],
    rewards: { coins: [60, 85], xp: 110, drops: [{ tier: "rare", chance: 1.0 }] },
  },
  capitan_osario: {
    id: "capitan_osario", name: "Capitán Osario", level: 6, kind: "boss", hp: 155, icon: "☠️",
    portrait: "assets/portraits/capitan_osario.png", ai: "balanced", battleLabel: "Jefe: Capitán Osario",
    moves: [
      { id: "command", name: "Orden de Carga", icon: "📢", weight: 2, effects: [{ kind: "strength", value: 2 }] },
      { id: "blade", name: "Filo Oxidado", icon: "⚔️", weight: 3, effects: [{ kind: "damage", value: 26 }] },
      { id: "shield", name: "Muro de Huesos", icon: "🦴", weight: 2, effects: [{ kind: "block", value: 18 }] },
      { id: "curse", name: "Toque del Osario", icon: "💀", weight: 2, duration: 2, effects: [{ kind: "damage", value: 14 }, { kind: "weaken", value: 20 }, { kind: "addCurse", cardId: "curse_deadweight", value: 1 }] },
    ],
    rewards: { coins: [62, 88], xp: 112, drops: [{ tier: "rare", chance: 1.0 }] },
  },
  lich: {
    id: "lich", name: "Lich Anciano", level: 7, kind: "boss", hp: 210, icon: "☠️",
    portrait: "assets/portraits/lich.png", ai: "caster", battleLabel: "Jefe final: Lich Anciano",
    moves: [
      { id: "oblivion", name: "Rayo de Oblivión", icon: "⚡", weight: 3, effects: [{ kind: "damage", value: 32 }] },
      { id: "siphon", name: "Sifón Vital", icon: "🩸", weight: 3, effects: [{ kind: "damage", value: 18 }, { kind: "heal", value: 18 }] },
      { id: "barrier", name: "Barrera Helada", icon: "❄️", weight: 2, effects: [{ kind: "block", value: 22 }] },
      { id: "curse", name: "Maldición Eterna", icon: "🌑", weight: 2, duration: 2, effects: [{ kind: "damage", value: 15 }, { kind: "fewerActions", value: 1 }, { kind: "addCurse", cardId: "curse_lich_whisper", value: 1 }] },
      { id: "plague", name: "Plaga Necrótica", icon: "🧫", weight: 2, duration: 3, effects: [{ kind: "poison", value: 4 }] },
    ],
    rewards: { coins: [100, 150], xp: 160, drops: [{ tier: "epic", chance: 1.0 }] },
  },
  dragon_ceniza: {
    id: "dragon_ceniza", name: "Dragón de Ceniza", level: 7, kind: "boss", hp: 215, icon: "🐉",
    portrait: "assets/portraits/dragon_ceniza.png", ai: "aggressive", battleLabel: "Jefe final: Dragón de Ceniza",
    moves: [
      { id: "breath", name: "Aliento de Ceniza", icon: "🔥", weight: 3, duration: 3, effects: [{ kind: "damage", value: 18 }, { kind: "poison", value: 2 }] },
      { id: "claw", name: "Garra Ígnea", icon: "🐾", weight: 3, effects: [{ kind: "damage", value: 28 }] },
      { id: "wings", name: "Alas de Ceniza", icon: "🪶", weight: 2, effects: [{ kind: "block", value: 18 }, { kind: "strength", value: 2 }] },
      { id: "roar", name: "Rugido Volcánico", icon: "🌋", weight: 2, duration: 2, effects: [{ kind: "vulnerable", value: 2 }, { kind: "strength", value: 2 }] },
    ],
    rewards: { coins: [110, 160], xp: 170, drops: [{ tier: "epic", chance: 1.0 }] },
  },
  reina_aranas: {
    id: "reina_aranas", name: "Reina de las Arañas", level: 7, kind: "boss", hp: 230, icon: "🕷️",
    portrait: "assets/portraits/reina_aranas.png", ai: "caster", battleLabel: "Jefe final: Reina de las Arañas",
    moves: [
      { id: "bite", name: "Mordisco Venenoso", icon: "🧪", weight: 3, duration: 3, effects: [{ kind: "damage", value: 22 }, { kind: "poison", value: 4 }] },
      { id: "web", name: "Telaraña Real", icon: "🕸️", weight: 3, duration: 2, effects: [{ kind: "weaken", value: 30 }, { kind: "block", value: 16 }] },
      { id: "swarm", name: "Enjambre", icon: "🕷️", weight: 2, duration: 2, effects: [{ kind: "damage", value: 20 }, { kind: "vulnerable", value: 2 }] },
      { id: "curse", name: "Huevos Malditos", icon: "🥚", weight: 2, effects: [{ kind: "addCurse", cardId: "curse_open_wound", value: 1 }, { kind: "heal", value: 15 }] },
    ],
    rewards: { coins: [105, 155], xp: 165, drops: [{ tier: "epic", chance: 1.0 }] },
  },
  senor_abismo: {
    id: "senor_abismo", name: "Señor del Abismo", level: 7, kind: "boss", hp: 220, icon: "😈",
    portrait: "assets/portraits/senor_abismo.png", ai: "caster", battleLabel: "Jefe final: Señor del Abismo",
    moves: [
      { id: "blade", name: "Espada Abisal", icon: "🔥", weight: 3, effects: [{ kind: "damage", value: 30 }] },
      { id: "drain", name: "Drenar Voluntad", icon: "🩸", weight: 3, effects: [{ kind: "damage", value: 18 }, { kind: "heal", value: 12 }] },
      { id: "curse", name: "Maldición Abisal", icon: "🌑", weight: 2, duration: 2, effects: [{ kind: "damage", value: 14 }, { kind: "fewerActions", value: 1 }, { kind: "addCurse", cardId: "curse_lich_whisper", value: 1 }] },
      { id: "aura", name: "Aura de Terror", icon: "💀", weight: 2, duration: 2, effects: [{ kind: "weaken", value: 20 }, { kind: "strength", value: 1 }] },
    ],
    rewards: { coins: [120, 170], xp: 175, drops: [{ tier: "epic", chance: 1.0 }] },
  },
};

// Jefes intermedios (profundidad 5) y jefes finales (bolsa sin repetición).
export const MID_BOSSES = ["senor_orco", "capitan_osario"];
export const FINAL_BOSSES = ["lich", "dragon_ceniza", "reina_aranas", "senor_abismo"];

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
