import { BALANCE } from "./balance-config.js";

// Ventajas elegibles al subir de nivel (sustituyen a las subidas automáticas)
export const PERKS = [
  {
    id: "perk_vigor",
    name: "Vigor",
    icon: "❤️",
    art: "assets/perks/perk_vigor.png",
    text: "+10 de vida máxima (y curas 10).",
    maxStacks: 3,
    apply(run) {
      run.maxHp += 10;
      run.hp = Math.min(run.maxHp, run.hp + 10);
    },
  },
  {
    id: "perk_might",
    name: "Complexión",
    icon: "💪",
    art: "assets/perks/perk_might.png",
    text: "+1 de fuerza (permite equipo pesado).",
    maxStacks: 3,
    apply(run) {
      run.str += 1;
    },
  },
  {
    id: "perk_arcana",
    name: "Fluidez Arcana",
    icon: "✦",
    art: "assets/perks/perk_arcana.png",
    text: "+1 de energía por ronda.",
    arcaneOnly: true,
    maxStacks: 2,
    apply(run) {
      run.energyPerRound += 1;
    },
  },
  {
    id: "perk_insight",
    name: "Vista Aguda",
    icon: "🃏",
    art: "assets/perks/perk_insight.png",
    text: "+1 carta robada por ronda.",
    maxStacks: 2,
    apply(run) {
      run.drawBonus = (run.drawBonus || 0) + 1;
    },
  },
  {
    id: "perk_guard",
    name: "Guardia",
    icon: "🛡️",
    art: "assets/perks/perk_guard.png",
    text: "+3 de bloqueo al empezar cada combate.",
    maxStacks: 3,
    apply(run) {
      run.startBlock = (run.startBlock || 0) + 3;
    },
  },
  {
    id: "perk_brutality",
    name: "Brutalidad",
    icon: "🗡️",
    art: "assets/perks/perk_brutality.png",
    text: "+1 de daño en cada uno de tus ataques.",
    maxStacks: 3,
    apply(run) {
      run.damageBonus = (run.damageBonus || 0) + 1;
    },
  },
  {
    id: "perk_haggle",
    name: "Regateo",
    icon: "🪙",
    art: "assets/perks/perk_haggle.png",
    text: "+25% de monedas al vender cartas.",
    maxStacks: 2,
    apply(run) {
      run.sellBonus = (run.sellBonus || 0) + 0.25;
    },
  },
  {
    id: "perk_smith",
    name: "Mano de Herrero",
    icon: "🔨",
    art: "assets/perks/perk_smith.png",
    text: "Los servicios de la fragua cuestan la mitad.",
    maxStacks: 1,
    apply(run) {
      run.forgeDiscount = 0.5;
    },
  },
  {
    id: "perk_mending",
    name: "Sanación",
    icon: "✨",
    art: "assets/perks/perk_mending.png",
    text: "+12 de cura al ganar un combate.",
    maxStacks: 2,
    apply(run) {
      run.afterWinHeal = (run.afterWinHeal || 0) + 12;
    },
  },
  {
    id: "perk_venom",
    name: "Hoja Tóxica",
    icon: "🧴",
    art: "assets/perks/perk_venom.png",
    text: "Tus ataques aplican 1 de veneno durante 2 rondas.",
    maxStacks: 1,
    apply(run) {
      run.onHitPoison = (run.onHitPoison || 0) + 1;
    },
  },
  {
    id: "perk_speed",
    name: "Celeridad",
    icon: "⚡",
    art: "assets/perks/perk_speed.png",
    text: "+1 acción por ronda.",
    maxStacks: 1,
    apply(run) {
      run.actionsPerRound = (run.actionsPerRound || BALANCE.actionLimit) + 1;
    },
  },
];

export function perkOptions(run) {
  const stacks = {};
  for (const id of run.perks || []) stacks[id] = (stacks[id] || 0) + 1;
  const pool = PERKS.filter((p) => {
    if (p.arcaneOnly && !run.heroDef.arcane) return false;
    if ((stacks[p.id] || 0) >= (p.maxStacks || 99)) return false;
    return true;
  });
  const options = [];
  let guard = 0;
  while (options.length < 2 && pool.length > 0 && guard++ < 50) {
    const p = run.mapRng.pick(pool);
    if (!options.includes(p)) options.push(p);
  }
  return options;
}

export function applyPerk(run, perkId) {
  const perk = PERKS.find((p) => p.id === perkId);
  if (!perk) return null;
  if (perk.arcaneOnly && !run.heroDef.arcane) return null;
  run.perks = run.perks || [];
  run.perks.push(perk.id);
  perk.apply(run);
  return perk;
}
