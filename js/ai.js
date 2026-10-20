import { derivedMods, heroDamageBonus, playCard, endTurn, checkOver, playReaction, resolveEnemyTurn, continueToHeroTurn, enemyIntent, reactionMatches, effectValue } from "./engine.js";
import { findReaction, reactionDamage } from "./elements.js";

function enemyThreat(state) {
  let max = 0;
  for (const m of state.enemyDef.moves) {
    const dmg = m.effects.filter((e) => e.kind === "damage").reduce((a, e) => a + e.value, 0);
    if (dmg > 0) max = Math.max(max, dmg + effectValue(state, "enemy", "strength"));
  }
  return max;
}

function scoreCard(state, card) {
  const mods = derivedMods(state);
  const dmgBonus = heroDamageBonus(state);
  const threat = enemyThreat(state);
  let score = 0;
  const hasDamage = card.effects.some((e) => e.kind === "damage");
  for (const e of card.effects) {
    switch (e.kind) {
      case "damage": {
        let d = e.value + dmgBonus;
        if (effectValue(state, "enemy", "vulnerable") > 0) d *= 1.3;
        if (state.enemy.hp <= d) d *= 2;
        score += d;
        break;
      }
      case "block": {
        const b = e.value + mods.block;
        const uncovered = Math.max(0, threat - state.hero.block);
        score += b * (uncovered > 0 ? 0.75 : 0.2);
        break;
      }
      case "heal": {
        const missing = state.hero.maxHp - state.hero.hp;
        const need = Math.min(missing, e.value);
        // Los recursos se consumen para siempre: priorizar emergencias,
        // pero curarse también si falta vida de verdad (no acapara hasta morir).
        if (state.hero.hp < state.hero.maxHp * 0.55) score += need * 2.6;
        else if (missing >= 3) score += need * 0.35;
        break;
      }
      case "strength":
        score += e.value * (state.round <= 4 ? 2.4 : 0.9);
        break;
      case "draw":
        score += e.value * 1.6;
        break;
      case "energy":
        score += e.value * 1.6;
        break;
      case "vulnerable":
        score += e.value * 2 + (state.round <= 6 ? 1.5 : 0);
        break;
      case "poison":
        score += e.value * 2.5;
        break;
      case "weaken":
        score += (e.value / 25) * 5;
        break;
      case "bonusDamage":
        score += e.value * 1.5;
        break;
      case "regen":
        score += e.value * 1.2;
        break;
      case "bonusBlock":
        score += e.value * 0.6;
        break;
      case "fewerActions":
        score += -99;
        break;
      case "bonusActions":
        score += e.value * 4;
        break;
      case "selfDamage":
        score += -e.value * 1.5;
        break;
      case "addCurse":
        score += -20;
        break;
      case "taunt":
      case "guard":
      case "rescue":
        score += 0;
        break;
      default:
        break;
    }
  }
  if (card.marks && card.marks.length) {
    const merged = state.marks.enemy.map((m) => ({ kind: m.kind, value: m.value }))
      .concat(card.marks.map((m) => ({ kind: m.kind, value: m.value })));
    const found = findReaction(merged);
    if (found) score += 6 + reactionDamage(found.reaction, found.a, found.b) * 0.5;
    else score += card.marks.length * 1.4;
  }
  if (hasDamage && state.enemy.hp <= 0) score = 0;
  if (state.hero.arcane) score -= card.cost * 0.4;
  return score;
}

function equipValue(card) {
  const m = card.mods || {};
  let value = (m.damage || 0) * 2 + (m.block || 0) + (m.energy || 0) * 3;
  for (const eff of card.effects || []) {
    if (["damage", "block", "heal", "strength", "draw", "energy", "bonusDamage", "bonusBlock", "regen", "bonusActions"].includes(eff.kind)) {
      value += (eff.value || 0) * 1.5;
    }
  }
  for (const eff of card.curseEffects || []) {
    if (eff.kind === "selfDamage") value -= (eff.value || 0) * 2;
    else if (eff.kind === "fewerActions") value -= 6;
    else if (eff.kind === "weaken") value -= (eff.value || 0) / 10;
    else if (eff.kind === "poison") value -= (eff.value || 0) * 2;
    else value -= 1;
  }
  return value;
}

// Con sustitución en las manos: solo equipar si la nueva pieza mejora a la que saldría
function wouldUpgrade(state, card) {
  if (card.slot !== "hand") {
    const cur = state.loadout.find((c) => c.slot === card.slot);
    return !cur || equipValue(card) > equipValue(cur);
  }
  const items = state.loadout.filter((c) => c.slot === "hand");
  if (card.tags.includes("twoHanded")) {
    return equipValue(card) > items.reduce((s, c) => s + equipValue(c), 0);
  }
  const isShield = card.tags.includes("shield");
  const same = items.find((c) => (isShield ? c.tags.includes("shield") : !c.tags.includes("shield")));
  if (same) return equipValue(card) > equipValue(same);
  return items.length < state.heroDef.capacity.hands;
}

function equipBest(state) {
  if (state.restrictions?.noEquipment) return;
  const equips = state.deck.hand
    .filter((c) => c.type === "equipment")
    .slice()
    .sort((a, b) => equipValue(b) - equipValue(a));
  for (const card of equips) {
    const cost = state.hero.arcane ? card.cost : 0;
    if (state.hero.energy < cost) continue;
    if (!wouldUpgrade(state, card)) continue;
    playCard(state, card.id);
    if (state.winner) return;
  }
}

function chooseNext(state) {
  const playable = state.deck.hand.filter(
    (c) =>
      c.type !== "curse" &&
      !c.reaction &&
      c.subtype !== "gem" &&
      c.subtype !== "rune" &&
      !(state.restrictions?.noResources && (c.type === "resource" || c.type === "effect")) &&
      !(state.restrictions?.noEffects && c.type === "effect") &&
      (c.cost === 0 || (state.hero.arcane && c.cost <= state.hero.energy))
  );
  let best = null;
  let bestScore = 0.15;
  for (const card of playable) {
    const s = scoreCard(state, card);
    if (s > bestScore) {
      bestScore = s;
      best = card;
    }
  }
  return best;
}

function aiReact(state) {
  const move = enemyIntent(state);
  if (!move) return;
  const threat = move.effects.filter((e) => e.kind === "damage").reduce((a, e) => a + e.value, 0) + effectValue(state, "enemy", "strength");
  const candidates = state.deck.hand.filter(
    (c) => c.reaction && reactionMatches(c, move) && (c.cost === 0 || (state.hero.arcane && c.cost <= state.hero.energy))
  );
  let played = 0;
  for (const card of candidates) {
    if (played >= 1) break;
    const hasDamage = card.effects.some((e) => e.kind === "damage");
    const hasBlock = card.effects.some((e) => e.kind === "block");
    const overTime = card.effects.some((e) => ["poison", "weaken", "bonusDamage", "regen", "bonusBlock", "fewerActions"].includes(e.kind));
    let score = 0;
    if (hasDamage) score += 6;
    if (hasBlock) score += threat > state.hero.block ? 6 : 1;
    if (overTime) score += 5;
    if (score >= 5 && playReaction(state, card.id).ok) played++;
  }
}

export function takeHeroTurn(state) {
  equipBest(state);
  let guard = 0;
  while (!state.winner && state.phase === "hero" && guard++ < 60) {
    const card = chooseNext(state);
    if (!card) break;
    const res = playCard(state, card.id);
    if (!res.ok) break;
  }
  if (!state.winner) {
    endTurn(state);
    if (state.phase === "reaction") {
      aiReact(state);
      resolveEnemyTurn(state);
    }
    if (state.phase === "enemyDone") continueToHeroTurn(state);
  }
  checkOver(state);
  return state.winner;
}
