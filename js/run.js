import { getCharacter } from "./characters.js";
import { getEnemy } from "./enemies.js";
import { createRng } from "./rng.js";
import { rollDrops, rollCoins, DROP_POOLS } from "./loot.js";
import { getCard, makeInstance } from "./cards.js";
import { BALANCE, xpForLevel } from "./balance-config.js";
import { rollChallenge } from "./challenges.js";

export const MAX_STEPS = 7;

// Flags de perks/progressión que viajan con el héroe entre sendas
const CARRIED_FIELDS = ["coins", "xp", "level", "str", "energyPerRound", "maxHp", "perks", "drawBonus", "startBlock", "damageBonus", "onHitPoison", "sellBonus", "forgeDiscount", "afterWinHeal", "scrapped", "morality", "chronicle"];

const TIER_ENEMIES = {
  1: ["goblin"],
  2: ["lobo"],
  3: ["esqueleto"],
  4: ["trol"],
  5: ["nigromante"],
  boss1: ["senor_orco"],
  boss2: ["lich"],
};

const TIER_LABELS = {
  1: "Emboscada goblin",
  2: "Bestias salvajes",
  3: "No-muertos",
  4: "Guarida del trol",
  5: "Élite nigromante",
  boss1: "Jefe: Señor Orco",
  boss2: "Jefe final: Lich Anciano",
};

export function enemyForTier(tier, rng, ascension = 0) {
  const pool = TIER_ENEMIES[tier] || TIER_ENEMIES[1];
  return getEnemy(rng.pick(pool), ascension);
}

export function tierForDepth(depth) {
  return Math.min(5, 1 + depth);
}

export function rollOptions(run) {
  const d = run.depth;
  if (d >= MAX_STEPS) return [];
  if (d === MAX_STEPS - 1) {
    return [{ type: "combat", tier: "boss2", label: TIER_LABELS.boss2 }];
  }
  if (d === MAX_STEPS - 2) {
    return run.mapRng.shuffle([
      { type: "shop", label: "Mercader" },
      { type: "combat", tier: "boss1", label: TIER_LABELS.boss1 },
    ]);
  }
  const tier = tierForDepth(d);
  const candidates = [{ type: "combat", tier, label: TIER_LABELS[tier] }];
  if (tier > 1) {
    const lower = tier - 1;
    candidates.push({ type: "combat", tier: lower, label: TIER_LABELS[lower] });
  }
  candidates.push({ type: "shop", label: "Mercader" });
  if (d >= 1) candidates.push({ type: "treasure", label: "Cofre del tesoro" });
  if (d >= 1) candidates.push({ type: "forge", label: "Fragua" });

  const shuffled = run.mapRng.shuffle(candidates);
  const options = [];
  for (const opt of shuffled) {
    if (options.length >= 2) break;
    const duplicate = options.some((o) => o.type === opt.type && o.tier === opt.tier);
    if (duplicate) continue;
    options.push(opt);
  }
  if (
    d >= 1 &&
    (run.challengesSeen || 0) < BALANCE.challengeMaxPerRun &&
    run.challengeDoneDepth !== d &&
    run.challengeRng.chance(BALANCE.challengeChance)
  ) {
    const challenge = rollChallenge(run.challengeRng, { depth: d, heroId: run.heroId });
    if (challenge) {
      challenge.label = challenge.title;
      challenge.hint = `${challenge.style} · desafío secundario`;
      options.push(challenge);
    }
  }
  return options;
}

export function createRun(heroId, seed) {
  const heroDef = getCharacter(heroId);
  const rng = createRng(seed);
  const run = {
    heroId,
    seed,
    rng,
    mapRng: createRng((seed ^ 0x9e3779b9) >>> 0),
    challengeRng: createRng((seed ^ 0x51ed270b) >>> 0),
    serviceRng: createRng((seed ^ 0x2c1b3c6d) >>> 0),
    heroDef,
    depth: 0,
    options: [],
    coins: BALANCE.startingCoins,
    xp: 0,
    level: 1,
    maxHp: heroDef.base.hp,
    hp: heroDef.base.hp,
    str: heroDef.base.str,
    energyPerRound: heroDef.energyPerRound,
    actionsPerRound: heroDef.actionsPerRound,
    nextUid: 1,
    deck: [],
    loadout: [],
    scrapped: [],
    perks: [],
    pendingLevels: 0,
    ascension: 0,
    challengesSeen: 0,
    challengeDoneDepth: -1,
    morality: { mercy: 0, greed: 0, honor: 0, corruption: 0 },
    chronicle: [],
    shopServices: null,
    finished: false,
    result: null,
  };
  for (const cardId of heroDef.startingDeck) addCardToRun(run, cardId);
  run.options = rollOptions(run);
  return run;
}

export function addCardToRun(run, cardId) {
  const inst = makeInstance(cardId, run.nextUid++);
  run.deck.push(inst);
  return inst;
}

export function grantXp(run, amount) {
  run.xp += amount;
  let pending = 0;
  while (run.xp >= xpForLevel(run.level + 1)) {
    run.level += 1;
    pending += 1;
  }
  run.pendingLevels = (run.pendingLevels || 0) + pending;
  return pending;
}

export function consumeChallenge(run) {
  run.options = (run.options || []).filter((o) => o.type !== "challenge");
  run.challengeDoneDepth = run.depth;
  run.challengesSeen = (run.challengesSeen || 0) + 1;
}

export function rejectChallenge(run) {
  run.options = (run.options || []).filter((o) => o.type !== "challenge");
  run.challengeDoneDepth = run.depth;
}

export function addMorality(run, morality = {}) {
  run.morality = run.morality || { mercy: 0, greed: 0, honor: 0, corruption: 0 };
  for (const [key, value] of Object.entries(morality || {})) {
    run.morality[key] = (run.morality[key] || 0) + value;
  }
}

export function applyChallengeReward(run, reward = {}) {
  if (reward.morality) addMorality(run, reward.morality);
  if (reward.coins) run.coins += reward.coins;
  if (reward.xp) grantXp(run, reward.xp);
  if (reward.heal) run.hp = Math.min(run.maxHp, run.hp + reward.heal);
  if (reward.maxHp) {
    run.maxHp += reward.maxHp;
    run.hp = Math.min(run.maxHp, run.hp + reward.maxHp);
  }
  if (reward.cardId) addCardToRun(run, reward.cardId);
  if (reward.cardTier && DROP_POOLS[reward.cardTier]) {
    const pool = DROP_POOLS[reward.cardTier];
    if (pool.length) addCardToRun(run, run.rng.pick(pool));
  }
  if (reward.relic) addCardToRun(run, reward.relic);
  if (reward.removeCurse) {
    const curse = run.deck.find((inst) => getCard(inst.cardId).type === "curse");
    if (curse) removeInstanceFromRun(run, curse.uid);
  }
  if (reward.upgradeCard) {
    const candidates = run.deck.filter((inst) => !inst.upgrade && getCard(inst.cardId).type !== "curse");
    if (candidates.length) run.rng.pick(candidates).upgrade = 1;
  }
  if (reward.curseId) addCardToRun(run, reward.curseId);
  return reward;
}

export function applyChallengePenalty(run, penalty = {}) {
  if (penalty.damage) run.hp = Math.max(0, run.hp - penalty.damage);
  if (penalty.coins) run.coins = Math.max(0, run.coins - penalty.coins);
  if (penalty.maxHp) {
    run.maxHp = Math.max(10, run.maxHp - penalty.maxHp);
    run.hp = Math.min(run.hp, run.maxHp);
  }
  if (penalty.curseId) addCardToRun(run, penalty.curseId);
  if (penalty.runOver || run.hp <= 0) {
    run.hp = 0;
    run.finished = true;
    run.result = "defeat";
  }
  return penalty;
}

export function snapshotChallengeState(run) {
  return {
    coins: run.coins,
    xp: run.xp,
    level: run.level,
    hp: run.hp,
    maxHp: run.maxHp,
    morality: { ...(run.morality || {}) },
    deck: (run.deck || []).map((inst) => ({
      uid: inst.uid,
      cardId: inst.cardId,
      upgrade: inst.upgrade ? 1 : 0,
      fusedEffectId: inst.fusedEffectId || null,
    })),
  };
}

export function diffChallengeState(run, before) {
  if (!before) return null;
  const after = snapshotChallengeState(run);
  const beforeByUid = new Map(before.deck.map((inst) => [inst.uid, inst]));
  const afterUids = new Set(after.deck.map((inst) => inst.uid));
  const gained = after.deck.filter((inst) => !beforeByUid.has(inst.uid));
  const lost = before.deck.filter((inst) => !afterUids.has(inst.uid));
  const upgraded = after.deck.filter((inst) => {
    const prev = beforeByUid.get(inst.uid);
    return prev && !prev.upgrade && inst.upgrade;
  });
  const morality = {};
  const moralKeys = new Set([...Object.keys(before.morality || {}), ...Object.keys(after.morality || {})]);
  for (const key of moralKeys) {
    const delta = (after.morality[key] || 0) - (before.morality[key] || 0);
    if (delta) morality[key] = delta;
  }
  return {
    coins: after.coins - before.coins,
    xp: after.xp - before.xp,
    levels: after.level - before.level,
    hp: after.hp - before.hp,
    maxHp: after.maxHp - before.maxHp,
    gained,
    lost,
    upgraded,
    morality,
  };
}

export function rollShopServices(run, force = false) {
  if (!force && run.shopServices) return run.shopServices;
  const rng = run.serviceRng || createRng((run.seed ^ 0x2c1b3c6d) >>> 0);
  const services = { hechicero: rng.chance(0.55), curandero: rng.chance(0.55) };
  if (!services.hechicero && !services.curandero && rng.chance(0.5)) services.curandero = true;
  run.shopServices = services;
  return services;
}

export function healerPrices(run) {
  const missing = Math.max(0, run.maxHp - run.hp);
  const smallAmount = Math.min(Math.ceil(run.maxHp * BALANCE.healerPercent), missing);
  return {
    missing,
    smallAmount,
    smallCost: Math.ceil(smallAmount * BALANCE.healerCostPerHp),
    fullAmount: missing,
    fullCost: Math.ceil(missing * BALANCE.fullHealCostPerHp),
  };
}

export function healAtShop(run, mode = "small") {
  const prices = healerPrices(run);
  const full = mode === "full";
  const cost = full ? prices.fullCost : prices.smallCost;
  const amount = full ? prices.fullAmount : prices.smallAmount;
  if (amount <= 0) return { ok: false, reason: "Ya tienes la vida completa" };
  if (run.coins < cost) return { ok: false, reason: "Monedas insuficientes" };
  run.coins -= cost;
  const before = run.hp;
  run.hp = Math.min(run.maxHp, run.hp + amount);
  return { ok: true, cost, healed: run.hp - before };
}

export function removeCurseAtShop(run, uid) {
  const inst = run.deck.find((i) => i.uid === uid);
  if (!inst) return { ok: false, reason: "No tienes esa maldición" };
  if (getCard(inst.cardId).type !== "curse") return { ok: false, reason: "Eso no es una maldición" };
  if (run.coins < BALANCE.curseRemovalCost) return { ok: false, reason: "Monedas insuficientes" };
  run.coins -= BALANCE.curseRemovalCost;
  const removed = removeInstanceFromRun(run, uid);
  return { ok: true, card: getCard(removed.cardId), cost: BALANCE.curseRemovalCost };
}

// Nueva senda con el mismo héroe (NG+): conserva mazo, nivel, perks y monedas; sube la ascensión
export function continueRunAscension(prev) {
  const seed = ((prev.seed ^ (0x9e3779b9 * ((prev.ascension || 0) + 1))) >>> 0) || ((Date.now() & 0xffffffff) || 1);
  const run = createRun(prev.heroId, seed);
  run.ascension = (prev.ascension || 0) + 1;
  run.deck = prev.deck;
  run.loadout = prev.loadout;
  run.nextUid = prev.nextUid;
  for (const f of CARRIED_FIELDS) run[f] = prev[f] ?? run[f];
  run.hp = run.maxHp; // se cura por completo al emprender la nueva senda
  run.actionsPerRound = prev.actionsPerRound ?? run.heroDef.actionsPerRound;
  run.market = null;
  run.pendingLevels = 0;
  run.finished = false;
  run.result = null;
  run.options = rollOptions(run);
  return run;
}

export function removeInstanceFromRun(run, uid) {
  const i = run.deck.findIndex((inst) => inst.uid === uid);
  if (i === -1) return null;
  const [inst] = run.deck.splice(i, 1);
  run.loadout = run.loadout.filter((l) => l.uid !== uid);
  return inst;
}

export function heroStatsForCombat(run) {
  return {
    hp: run.hp,
    maxHp: run.maxHp,
    str: run.str,
    energyPerRound: run.energyPerRound,
    actionsPerRound: run.actionsPerRound ?? run.heroDef.actionsPerRound,
    drawBonus: run.drawBonus || 0,
    startBlock: run.startBlock || 0,
    damageBonus: run.damageBonus || 0,
    onHitPoison: run.onHitPoison || 0,
  };
}

export function advanceDepth(run) {
  run.depth += 1;
  run.options = rollOptions(run);
  if (run.depth >= MAX_STEPS) {
    run.finished = true;
    run.result = "victory";
  }
}

function grantBossBonus(run, enemyDef) {
  if (enemyDef.kind !== "boss") return 0;
  run.maxHp += BALANCE.bossMaxHpBonus;
  run.hp = Math.min(run.maxHp, run.hp + BALANCE.bossMaxHpBonus);
  return BALANCE.bossMaxHpBonus;
}

export function finishCombat(run, winner, enemyDef, combat = null, options = {}) {
  if (winner === "enemy") {
    run.finished = true;
    run.result = "defeat";
    run.hp = 0;
    return { result: "defeat", rewards: null };
  }

  const coins = rollCoins(enemyDef, run.rng);
  const drops = rollDrops(enemyDef, run.rng);
  run.coins += coins;
  grantXp(run, enemyDef.rewards.xp);
  for (const cardId of drops) addCardToRun(run, cardId);
  const curses = [];
  if (combat && combat.pendingCurseIds) {
    for (const entry of combat.pendingCurseIds) {
      for (let i = 0; i < (entry.count || 1); i++) {
        addCardToRun(run, entry.cardId);
        curses.push(entry.cardId);
      }
    }
    combat.pendingCurseIds = [];
  }

  if (combat && combat.scrappedUids && combat.scrappedUids.length) {
    for (const uid of combat.scrappedUids) {
      const removed = removeInstanceFromRun(run, uid);
      if (removed) run.scrapped.push(removed.cardId);
    }
    combat.scrappedUids = [];
  }

  const bossBonus = grantBossBonus(run, enemyDef);

  if (run.afterWinHeal) run.hp = Math.min(run.maxHp, run.hp + run.afterWinHeal);
  run.hp = Math.min(run.maxHp, run.hp);

  const advance = options.advance !== false;
  let result = "continue";
  if (advance && enemyDef.id === "lich") {
    run.finished = true;
    run.result = "victory";
    result = "victory";
  } else if (advance) {
    advanceDepth(run);
  } else {
    result = "challenge";
  }
  return {
    result,
    rewards: { coins, xp: enemyDef.rewards.xp, drops, curses, bossBonus, pendingLevels: run.pendingLevels, level: run.level, hp: run.hp, maxHp: run.maxHp },
  };
}

export function grantTreasure(run) {
  const coins = run.rng.int(15, 30);
  run.coins += coins;
  const cardId = run.rng.pick(["potion", "amulet_arcane", "armor_leather", "helm_iron", "boots_leather", "cloak_scout", "dodge", "food", "quick_cut", "ring_might", "purge_potion", "sun_bless", "gema_fuego", "runa_guarda", "bleed_cut", "frost_bolt", "gale_arrow", "relic_obsidian_bastion", "relic_ashen_gauntlet"]);
  addCardToRun(run, cardId);
  return { coins, cardId };
}

export function healAfterTreasure(run) {
  run.hp = Math.min(run.maxHp, run.hp + 8);
}

export const MARKET_TIER_LABEL = { common: "Común", uncommon: "Infrecuente", rare: "Rara", epic: "Épica" };

function marketUsable(run, id) {
  const c = getCard(id);
  if (c.cost > 0 && !run.heroDef.arcane) return false;
  if (c.reqStr > 0 && run.heroDef.base.str < c.reqStr) return false;
  return true;
}

export function ensureMarket(run) {
  if (run.market) return run.market;
  const rng = run.rng;
  // Consumibles básicos siempre disponibles para poder reponer
  const staples = ["water", "food"].filter((id) => marketUsable(run, id));
  const stablePool = [...DROP_POOLS.common, ...DROP_POOLS.uncommon].filter(
    (id) => marketUsable(run, id) && !staples.includes(id)
  );
  const stable = [...staples];
  const seen = new Set(staples);
  let guard = 0;
  while (stable.length < BALANCE.marketStable && guard++ < 200) {
    const id = rng.pick(stablePool);
    if (seen.has(id)) continue;
    seen.add(id);
    stable.push(id);
  }
  run.market = { stable, rotating: [] };
  return run.market;
}

function marketTierForDepth(depth, rng) {
  const roll = rng.next();
  if (depth >= 5) return roll < 0.2 ? "common" : roll < 0.55 ? "uncommon" : roll < 0.85 ? "rare" : "epic";
  if (depth >= 3) return roll < 0.4 ? "common" : roll < 0.8 ? "uncommon" : "rare";
  return roll < 0.6 ? "common" : "uncommon";
}

export function rotateMarket(run) {
  ensureMarket(run);
  const rng = run.mapRng;
  const slots = [];
  const taken = new Set(run.market.stable);
  let guard = 0;
  while (slots.length < BALANCE.marketRotating && guard++ < 300) {
    const tier = marketTierForDepth(run.depth, rng);
    const pool = DROP_POOLS[tier].filter((id) => marketUsable(run, id) && !taken.has(id));
    if (!pool.length) continue;
    const id = rng.pick(pool);
    taken.add(id);
    slots.push({ id, tier });
  }
  run.market.rotating = slots;
  return run.market;
}
