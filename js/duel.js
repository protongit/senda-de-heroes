import { resolveCard } from "./cards.js";
import { canEquip } from "./engine.js";
import { BALANCE } from "./balance-config.js";
import { CHARACTERS } from "./characters.js";
import { findReaction, reactionDamage, MARK_META } from "./elements.js";

const SINGLE_SLOTS = ["head", "body", "feet", "neck", "ring", "back"];

function getCharacter(id) {
  return CHARACTERS[id];
}

function log(duel, text, meta = {}) {
  duel.log.push({ round: duel.round, text, ...meta });
  if (duel.log.length > 200) duel.log.shift();
}

export function createPlayerDuelist(heroDef, index, rng) {
  return {
    side: "player",
    id: `p${index}`,
    name: heroDef.name,
    icon: heroDef.icon,
    portrait: heroDef.portrait,
    heroDef,
    isAI: false,
    arcane: heroDef.arcane,
    hp: heroDef.base.hp,
    maxHp: heroDef.base.hp,
    str: heroDef.base.str,
    block: 0,
    strength: 0,
    vulnerable: 0,
    energy: 0,
    energyPerRound: heroDef.energyPerRound,
    actions: 0,
    actionsPerRound: heroDef.actionsPerRound,
    deck: { draw: rng.shuffle([...heroDef.startingDeck, ...(heroDef.duelCards || [])].map(resolveCard)), hand: [], discard: [] },
    loadout: [],
    moves: null,
    ai: null,
    threat: 0,
    guard: 0,
    forcedTarget: false,
    downed: false,
    rescued: false,
    marks: [],
    poison: 0,
    poisonTurns: 0,
    weaken: 0,
    stunned: false,
  };
}

export function createEnemyDuelist(enemyDef) {
  return {
    side: "enemy",
    id: enemyDef.id,
    name: enemyDef.name,
    icon: enemyDef.icon,
    portrait: enemyDef.portrait,
    heroDef: null,
    isAI: true,
    arcane: false,
    hp: enemyDef.hp,
    maxHp: enemyDef.hp,
    block: 0,
    strength: 0,
    vulnerable: 0,
    energy: 0,
    energyPerRound: 0,
    actions: 0,
    actionsPerRound: 0,
    deck: null,
    loadout: [],
    moves: enemyDef.moves,
    ai: enemyDef.ai,
    def: enemyDef,
    threat: 0,
    guard: 0,
    forcedTarget: false,
    downed: false,
    rescued: false,
    marks: [],
    poison: 0,
    poisonTurns: 0,
    weaken: 0,
    stunned: false,
  };
}

export function createDuel(mode, heroIds, enemyDef, rng) {
  const players = heroIds.map((id, i) => createPlayerDuelist(getCharacter(id), i + 1, rng));
  const enemy = enemyDef ? createEnemyDuelist(enemyDef) : null;
  const duel = {
    mode,
    rng,
    players,
    enemy,
    round: 1,
    turnIndex: 0,
    order: [],
    winner: null,
    log: [],
  };
  rebuildOrder(duel);
  log(duel, mode === "coop" ? `Comienza el combate cooperativo contra ${enemyDef.name}.` : "Comienza el duelo entre héroes.");
  startCurrentTurn(duel);
  return duel;
}

function rebuildOrder(duel) {
  duel.order = [];
  duel.players.forEach((p, i) => duel.order.push({ side: "player", index: i }));
  if (duel.enemy) duel.order.push({ side: "enemy", index: 0 });
}

function combatant(duel, ref) {
  return ref.side === "player" ? duel.players[ref.index] : duel.enemy;
}

function alivePlayers(duel) {
  return duel.players.filter((p) => !p.downed && p.hp > 0);
}

export function chooseEnemyTarget(duel) {
  const alive = alivePlayers(duel);
  if (!alive.length) return null;
  const guarders = alive.filter((p) => p.guard > 0);
  if (guarders.length) return guarders.reduce((best, p) => (p.threat > best.threat ? p : best), guarders[0]);
  const taunters = alive.filter((p) => p.forcedTarget);
  if (taunters.length) return taunters.reduce((best, p) => (p.threat > best.threat ? p : best), taunters[0]);
  return alive.reduce((best, p) => {
    if (p.threat > best.threat) return p;
    if (p.threat === best.threat && p.hp < best.hp) return p;
    return best;
  }, alive[0]);
}

export function derivedBlock(unit) {
  return (unit.loadout || []).reduce((sum, c) => sum + ((c.mods && c.mods.block) || 0), 0);
}
export function derivedDamage(unit) {
  return (unit.loadout || []).reduce((sum, c) => sum + ((c.mods && c.mods.damage) || 0), 0);
}
export function derivedEnergy(unit) {
  return (unit.loadout || []).reduce((sum, c) => sum + ((c.mods && c.mods.energy) || 0), 0);
}

function drawCards(unit, n, rng) {
  for (let i = 0; i < n; i++) {
    if (unit.deck.draw.length === 0) {
      if (unit.deck.discard.length === 0) break;
      unit.deck.draw = rng.shuffle(unit.deck.discard);
      unit.deck.discard = [];
    }
    unit.deck.hand.push(unit.deck.draw.pop());
  }
}

function applyPoison(duel, unit) {
  if (!unit.poison) return;
  unit.hp = Math.max(0, unit.hp - unit.poison);
  log(duel, `${unit.name} sufre ${unit.poison} de veneno.`, { actor: unit.side === "player" ? "hero" : "enemy", icon: "🧴", kind: "effect" });
  unit.poisonTurns -= 1;
  if (unit.poisonTurns <= 0) unit.poison = 0;
  markDowned(duel, unit);
}

function startTurnFor(duel, unit) {
  unit.block = 0;
  applyPoison(duel, unit);
  if (unit.downed || unit.hp <= 0) {
    checkOver(duel);
    return;
  }
  if (unit.side === "player") {
    unit.energy = unit.energyPerRound + derivedEnergy(unit);
    unit.actions = unit.actionsPerRound;
    drawCards(unit, BALANCE.cardsPerRound, duel.rng);
  }
}

export function startCurrentTurn(duel) {
  const ref = duel.order[duel.turnIndex % duel.order.length];
  const unit = combatant(duel, ref);
  if (!unit || unit.downed || unit.hp <= 0) {
    advanceTurn(duel);
    return;
  }
  duel.activeRef = ref;
  startTurnFor(duel, unit);
  if (duel.winner) return;
  if (unit.downed || unit.hp <= 0) {
    advanceTurn(duel);
    return;
  }
  if (unit.isAI) aiTurn(duel, unit);
}

function advanceTurn(duel) {
  if (duel.winner) return;
  let guard = 0;
  do {
    duel.turnIndex += 1;
    if (duel.turnIndex % duel.order.length === 0) duel.round += 1;
    const ref = duel.order[duel.turnIndex % duel.order.length];
    const unit = combatant(duel, ref);
    if (unit && !unit.downed && unit.hp > 0) break;
  } while (guard++ < duel.order.length * 2);
  startCurrentTurn(duel);
}

export function currentUnit(duel) {
  return combatant(duel, duel.order[duel.turnIndex % duel.order.length]);
}

function markDowned(duel, unit) {
  if (unit.hp > 0) return;
  unit.hp = 0;
  if (unit.side === "player" && !unit.downed) {
    unit.downed = true;
    unit.deck.hand = [];
    log(duel, `${unit.name} cae. Un aliado puede rescatarlo.`, { actor: "system", kind: "ko" });
  }
}

function applyDamage(duel, target, amount) {
  const absorbed = Math.min(target.block, amount);
  target.block -= absorbed;
  target.hp = Math.max(0, target.hp - (amount - absorbed));
  markDowned(duel, target);
}

function opponentFor(duel, unit) {
  if (unit.side === "enemy") return chooseEnemyTarget(duel);
  if (duel.mode === "versus") {
    const other = duel.players.find((p) => p !== unit && !p.downed && p.hp > 0);
    return other || null;
  }
  return duel.enemy;
}

function tickMarks(unit) {
  unit.marks = (unit.marks || []).filter((mark) => {
    mark.remaining -= 1;
    return mark.remaining > 0;
  });
}

function tryDuelReaction(duel, target, source) {
  const found = findReaction(target.marks || []);
  if (!found) return;
  target.marks = (target.marks || []).filter((m) => m !== found.a && m !== found.b);
  const damage = reactionDamage(found.reaction, found.a, found.b);
  for (const eff of found.reaction.effects) {
    switch (eff.kind) {
      case "damage":
        applyDamage(duel, target, damage);
        log(duel, `${found.reaction.icon} ${found.reaction.name}: ${damage} de daño a ${target.name}.`, { actor: source.side === "player" ? "hero" : "enemy", icon: found.reaction.icon, kind: "reaction" });
        break;
      case "block":
        source.block += eff.value || 5;
        break;
      case "heal":
        source.hp = Math.min(source.maxHp, source.hp + (eff.value || 5));
        break;
      case "draw":
        if (source.side === "player") drawCards(source, eff.value || 1, duel.rng);
        break;
      case "stun":
        target.stunned = true;
        break;
      case "vulnerable":
        target.vulnerable += eff.value || 1;
        break;
      case "weaken":
        target.weaken = (target.weaken || 0) + (eff.value || 20);
        break;
      case "poison":
        target.poison = (target.poison || 0) + (eff.value || 1);
        target.poisonTurns = Math.max(target.poisonTurns || 0, eff.duration || 2);
        break;
      default:
        break;
    }
  }
  log(duel, `${found.reaction.icon} Reacción elemental: ${found.reaction.name}.`, { actor: "system", kind: "reaction" });
  checkOver(duel);
}

export function applyDuelMarks(duel, source, marks) {
  if (!marks || !marks.length) return;
  const target = opponentFor(duel, source);
  if (!target) return;
  for (const mark of marks) {
    target.marks.push({ kind: mark.kind, value: mark.value || 1, remaining: mark.duration ?? 2 });
    const meta = MARK_META[mark.kind] || { name: mark.kind, icon: "✦" };
    log(duel, `${meta.icon} ${meta.name} sobre ${target.name}.`, { actor: source.side === "player" ? "hero" : "enemy", icon: meta.icon, kind: "effect" });
    tryDuelReaction(duel, target, source);
  }
}

function applyEffects(duel, unit, effects, targetOverride = null) {
  const target = targetOverride || opponentFor(duel, unit);
  for (const eff of effects) {
    switch (eff.kind) {
      case "damage": {
        if (!target) break;
        let amount = eff.value + (unit.side === "player" ? derivedDamage(unit) : 0) + unit.strength;
        if (unit.weaken > 0) amount = Math.floor(amount * Math.max(0, 1 - unit.weaken / 100));
        if (target.vulnerable > 0) amount = Math.floor(amount * 1.5);
        applyDamage(duel, target, amount);
        if (unit.side === "player") unit.threat += amount;
        log(duel, `${unit.name} inflige ${amount} de daño a ${target.name}.`, { actor: unit.side === "player" ? "hero" : "enemy", icon: unit.icon, kind: "damage" });
        break;
      }
      case "block":
        unit.block += eff.value + (unit.side === "player" ? derivedBlock(unit) : 0);
        break;
      case "heal": {
        const before = unit.hp;
        unit.hp = Math.min(unit.maxHp, unit.hp + eff.value);
        if (unit.side === "player") unit.threat += Math.floor((unit.hp - before) * 0.5);
        break;
      }
      case "draw":
        if (unit.side === "player") drawCards(unit, eff.value, duel.rng);
        break;
      case "energy":
        if (unit.side === "player") unit.energy += eff.value;
        break;
      case "strength":
        unit.strength += eff.value;
        break;
      case "vulnerable":
        if (target) target.vulnerable += eff.value;
        break;
      case "weaken":
        if (target) target.weaken = (target.weaken || 0) + eff.value;
        break;
      case "poison":
        if (target) {
          target.poison = (target.poison || 0) + eff.value;
          target.poisonTurns = Math.max(target.poisonTurns || 0, 3);
          target.marks.push({ kind: "poison", value: eff.value, remaining: 3 });
          tryDuelReaction(duel, target, unit);
        }
        break;
      case "taunt":
        unit.threat += eff.value || 0;
        unit.forcedTarget = true;
        log(duel, `${unit.name} provoca al enemigo.`, { actor: unit.side === "player" ? "hero" : "enemy", icon: "📢", kind: "effect" });
        break;
      case "guard":
        unit.guard = eff.value || 1;
        log(duel, `${unit.name} cubre a sus aliados.`, { actor: unit.side === "player" ? "hero" : "enemy", icon: "🛡️", kind: "effect" });
        break;
      case "rescue": {
        const ally = duel.players.find((p) => p !== unit && p.downed && !p.rescued);
        if (ally) {
          ally.hp = eff.value || 5;
          ally.downed = false;
          ally.rescued = true;
          ally.threat = 0;
          log(duel, `${unit.name} rescata a ${ally.name} con ${ally.hp} de vida.`, { actor: "hero", icon: "🌿", kind: "heal" });
        }
        break;
      }
      case "selfDamage":
        unit.hp = Math.max(0, unit.hp - eff.value);
        markDowned(duel, unit);
        break;
      default:
        break;
    }
  }
  checkOver(duel);
}

export function playDuelCard(duel, cardId) {
  const unit = currentUnit(duel);
  if (!unit || unit.isAI || duel.winner) return { ok: false, reason: "No es tu turno" };
  const idx = unit.deck.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) return { ok: false, reason: "Carta no en mano" };
  const card = unit.deck.hand[idx];
  if (unit.actions <= 0) return { ok: false, reason: "Sin acciones" };
  if (card.cost > 0 && !unit.arcane) return { ok: false, reason: "Solo arcanos" };
  if (unit.energy < card.cost) return { ok: false, reason: "Energía insuficiente" };

  if (card.type === "equipment") {
    const check = canEquip(unit.heroDef, card, unit.loadout, unit.str);
    if (!check.ok) return check;
    unit.energy -= card.cost;
    unit.actions -= 1;
    unit.deck.hand.splice(idx, 1);
    if (SINGLE_SLOTS.includes(card.slot)) {
      const existing = unit.loadout.findIndex((c) => c.slot === card.slot);
      if (existing !== -1) unit.deck.discard.push(unit.loadout[existing]), unit.loadout.splice(existing, 1);
    }
    unit.loadout.push(card);
    log(duel, `${unit.name} equipa ${card.name}.`);
    return { ok: true };
  }
  unit.energy -= card.cost;
  unit.actions -= 1;
  unit.deck.hand.splice(idx, 1);
  unit.deck.discard.push(card);
  applyEffects(duel, unit, card.effects);
  if (card.marks && card.marks.length && !duel.winner) applyDuelMarks(duel, unit, card.marks);
  return { ok: true };
}

export function endDuelTurn(duel) {
  const unit = currentUnit(duel);
  if (!unit || unit.isAI || duel.winner) return;
  unit.deck.hand.forEach((c) => unit.deck.discard.push(c));
  unit.deck.hand = [];
  if (unit.vulnerable > 0) unit.vulnerable -= 1;
  tickMarks(unit);
  advanceTurn(duel);
}

function chooseMove(duel, enemy) {
  const low = enemy.hp < enemy.maxHp * 0.35;
  return duel.rng.weighted(enemy.moves, (m) => {
    let w = m.weight;
    const kinds = m.effects.map((e) => e.kind);
    if (low && kinds.includes("heal")) w *= 3;
    if (enemy.ai === "aggressive" && kinds.includes("damage")) w *= 1.5;
    if (enemy.ai === "caster" && kinds.includes("heal")) w *= 1.6;
    return w;
  });
}

function aiTurn(duel, enemy) {
  if (duel.winner) return;
  enemy.block = 0;
  if (enemy.stunned) {
    enemy.stunned = false;
    log(duel, `${enemy.name} está aturdido y pierde su movimiento.`, { actor: "enemy", kind: "effect" });
    tickMarks(enemy);
    if (!duel.winner) advanceTurn(duel);
    return;
  }
  const move = chooseMove(duel, enemy);
  const hasDamage = move.effects.some((e) => e.kind === "damage");
  const target = hasDamage ? chooseEnemyTarget(duel) : null;
  if (target) log(duel, `${enemy.name} se dirige a ${target.name}.`, { actor: "enemy", icon: "🎯", kind: "move" });
  log(duel, `${enemy.name} usa ${move.name}.`, { actor: "enemy", icon: move.icon || enemy.icon, kind: "move" });
  applyEffects(duel, enemy, move.effects, target);
  if (hasDamage) {
    for (const p of duel.players) {
      p.guard = 0;
      p.forcedTarget = false;
    }
  }
  if (enemy.vulnerable > 0) enemy.vulnerable -= 1;
  tickMarks(enemy);
  checkOver(duel);
  if (!duel.winner) advanceTurn(duel);
}

export function checkOver(duel) {
  if (duel.mode === "coop") {
    if (duel.enemy && duel.enemy.hp <= 0) {
      duel.winner = "players";
      log(duel, "¡Los héroes han derrotado al enemigo!");
    } else if (alivePlayers(duel).length === 0) {
      duel.winner = "enemy";
    }
  } else {
    const alive = alivePlayers(duel);
    if (alive.length <= 1) {
      duel.winner = alive.length === 1 ? alive[0].name : "tie";
    }
  }
  return duel.winner;
}

export function isDuelOver(duel) {
  return duel.winner;
}
