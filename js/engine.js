import { getCard, resolveCard } from "./cards.js";
import { BALANCE } from "./balance-config.js";
import { findReaction, reactionDamage, MARK_META } from "./elements.js";

const HAND_SLOT = "hand";
const SINGLE_SLOTS = ["head", "body", "feet", "neck", "ring", "back", "relic"];

// Efectos con duración: sobre quién actúan respecto a quien los juega
const OVER_TIME_ATTACKER = new Set(["regen", "bonusDamage", "bonusBlock"]);
const OVER_TIME_DEFENDER = new Set(["poison", "weaken"]);

function removeInstances(list, remove) {
  const copy = list.slice();
  for (const id of remove) {
    const i = copy.indexOf(id);
    if (i !== -1) copy.splice(i, 1);
  }
  return copy;
}

export function cardRestriction(card, heroDef) {
  if (card.type === "curse") return "Maldición: no jugable";
  if (!heroDef) return null;
  if (card.cost > 0 && !heroDef.arcane) return "Solo arcanos";
  if (card.reqStr > 0) return `Fuerza ${card.reqStr}`;
  if (card.tags.includes("twoHanded")) return "A dos manos: sustituye arma y escudo";
  if (card.tags.includes("bow")) return "Sin espada ni escudo";
  return null;
}

function pushLog(state, text, meta = {}) {
  state.log.push({ round: state.round, text, ...meta });
  if (state.log.length > 200) state.log.shift();
}

function collectMarkEntries(state, side) {
  const entries = [];
  for (const mark of state.marks[side] || []) {
    entries.push({ type: "mark", ref: mark, kind: mark.kind, value: mark.value || 1 });
  }
  for (const eff of state.effects) {
    if (eff.side === side && eff.kind === "poison") {
      entries.push({ type: "effect", ref: eff, kind: "poison", value: eff.value || 1 });
    }
  }
  return entries;
}

function removeMarkEntry(state, side, entry) {
  if (entry.type === "mark") {
    state.marks[side] = (state.marks[side] || []).filter((m) => m !== entry.ref);
  } else {
    state.effects = state.effects.filter((e) => e !== entry.ref);
  }
}

function applyElementReaction(state, side, reaction, a, b) {
  const isEnemy = side === "enemy";
  const target = isEnemy ? state.enemy : state.hero;
  const attacker = isEnemy ? state.hero : state.enemy;
  const damage = reactionDamage(reaction, a, b);
  for (const eff of reaction.effects) {
    switch (eff.kind) {
      case "damage":
        applyDamage(target, damage);
        pushLog(state, `${reaction.icon} ${reaction.name}: ${damage} de daño a ${isEnemy ? state.enemyDef.name : "el héroe"}.`, { actor: isEnemy ? "hero" : "enemy", kind: "reaction" });
        break;
      case "block":
        attacker.block += eff.value || 5;
        break;
      case "heal":
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + (eff.value || 5));
        break;
      case "draw":
        if (attacker === state.hero) drawCards(state, eff.value || 1);
        break;
      case "stun":
        if (isEnemy) state.enemy.stunned = true;
        else state.hero.stunned = true;
        break;
      case "vulnerable":
        addEffect(state, { kind: "vulnerable", value: eff.value || 1 }, side, { name: `Vulnerable (${reaction.name})`, icon: reaction.icon, duration: eff.value || 1, actor: isEnemy ? "hero" : "enemy" });
        break;
      case "weaken":
        addEffect(state, { kind: "weaken", value: eff.value || 20 }, side, { name: `Debilidad (${reaction.name})`, icon: reaction.icon, duration: 2, actor: isEnemy ? "hero" : "enemy" });
        break;
      case "poison":
        addEffect(state, { kind: "poison", value: eff.value || 1 }, side, { name: `Veneno (${reaction.name})`, icon: reaction.icon, duration: eff.duration || 2, actor: isEnemy ? "hero" : "enemy" });
        break;
      default:
        break;
    }
  }
  pushLog(state, `${reaction.icon} Reacción elemental: ${reaction.name}.`, { actor: "system", kind: "reaction" });
}

export function checkElementReactions(state, side) {
  tryElementReaction(state, side);
}

function tryElementReaction(state, side) {
  let guard = 0;
  while (guard++ < 5 && !state.winner) {
    const entries = collectMarkEntries(state, side);
    const found = findReaction(entries);
    if (!found) break;
    removeMarkEntry(state, side, found.a);
    removeMarkEntry(state, side, found.b);
    applyElementReaction(state, side, found.reaction, found.a, found.b);
    checkOver(state);
  }
}

export function applyMarks(state, marks, source = "hero") {
  if (!marks || !marks.length) return;
  const side = source === "hero" ? "enemy" : "hero";
  for (const mark of marks) {
    const meta = MARK_META[mark.kind] || { name: mark.kind, icon: "✦" };
    state.marks[side].push({
      uid: ++state._markUid,
      kind: mark.kind,
      value: mark.value || 1,
      remaining: mark.duration ?? 2,
    });
    pushLog(state, `${meta.icon} ${meta.name} sobre ${side === "enemy" ? state.enemyDef.name : "el héroe"} (${mark.duration ?? 2} rondas).`, { actor: side === "enemy" ? "hero" : "enemy", kind: "effect" });
    tryElementReaction(state, side);
  }
}

export function expireMarks(state, side) {
  const expired = [];
  state.marks[side] = (state.marks[side] || []).filter((mark) => {
    mark.remaining -= 1;
    if (mark.remaining <= 0) {
      expired.push(mark);
      return false;
    }
    return true;
  });
  for (const mark of expired) {
    const meta = MARK_META[mark.kind] || { name: mark.kind, icon: "✦" };
    pushLog(state, `${meta.icon} ${meta.name} se desvanece.`, { actor: side, kind: "effect" });
  }
}

export function applyRelic(state, card) {
  if (!card || card.type !== "equipment" || card.subtype !== "relic") return;
  const meta = { name: card.name, icon: card.icon, sourceUid: card.uid, actor: "hero" };
  if (card.effects && card.effects.length) {
    applyEffects(state, card.effects, "hero", { ...meta, duration: card.duration });
  }
  for (const eff of card.curseEffects || []) {
    const duration = eff.duration ?? card.duration ?? null;
    if (eff.kind === "selfDamage") {
      state.hero.hp = Math.max(0, state.hero.hp - eff.value);
      pushLog(state, `☠️ ${card.name}: recibes ${eff.value} de daño.`, { actor: "hero", kind: "damage" });
    } else if (["fewerActions", "poison", "weaken", "vulnerable", "bonusActions"].includes(eff.kind)) {
      addEffect(state, eff, "hero", { ...meta, name: `${card.name} · maldición`, icon: "☠️", duration, actor: "hero" });
    }
  }
  checkOver(state);
}

export function createCombat(heroDef, heroStats, enemyDef, deckIds, rng, initialLoadoutIds = [], options = {}) {
  const loadout = initialLoadoutIds.map(resolveCard);
  const loadoutUids = new Set(loadout.map((c) => c.uid).filter((u) => u != null));
  const rest = deckIds
    .map((inst) => (typeof inst === "string" ? { cardId: inst } : inst))
    .filter((inst) => inst.uid == null || !loadoutUids.has(inst.uid));
  const draw = rng.shuffle(rest).map(resolveCard);
  const state = {
    rng,
    heroDef,
    hero: {
      hp: heroStats.hp,
      maxHp: heroStats.maxHp,
      str: heroStats.str,
      energyPerRound: heroStats.energyPerRound,
      actionsPerRound: heroStats.actionsPerRound ?? BALANCE.actionLimit,
      drawBonus: heroStats.drawBonus || 0,
      startBlock: heroStats.startBlock || 0,
      damageBonus: heroStats.damageBonus || 0,
      onHitPoison: heroStats.onHitPoison || 0,
      arcane: !!heroDef.arcane,
      block: 0,
      strength: 0,
      vulnerable: 0,
      energy: 0,
      actions: 0,
      actionDebt: 0,
    },
    enemyDef,
    enemy: {
      hp: enemyDef.hp,
      maxHp: enemyDef.hp,
      block: 0,
      strength: 0,
      vulnerable: 0,
      moveQueue: [],
    },
    deck: { draw, hand: [], discard: [] },
    loadout,
    effects: [],
    marks: { hero: [], enemy: [] },
    pendingCurseIds: [],
    restrictions: options.restrictions || null,
    challenge: options.challenge || null,
    scrappedUids: [],
    exhaustedUids: [],
    _effectUid: 0,
    _markUid: 0,
    round: 1,
    phase: "hero",
    winner: null,
    log: [],
  };
  state.enemy.moveQueue = [chooseEnemyMove(state), chooseEnemyMove(state)];
  pushLog(state, `Comienza el combate contra ${enemyDef.name}.`, { actor: "system" });
  for (const card of loadout) {
    if (card.fused) {
      pushLog(state, `${card.fused.name} irradia desde ${card.name}.`, { actor: "hero", kind: "effect" });
      applyEffects(state, card.fused.effects, "hero", {
        name: `${card.name} · ${card.fused.name}`,
        icon: card.fused.icon,
        duration: card.fused.duration,
        sourceUid: card.uid,
        actor: "hero",
      });
    }
    if (card.subtype === "relic") applyRelic(state, card);
  }
  startHeroTurn(state);
  if (state.hero.startBlock) {
    state.hero.block += state.hero.startBlock;
    pushLog(state, `Guardia: el héroe comienza con ${state.hero.startBlock} de bloqueo.`, { actor: "hero", kind: "block" });
  }
  return state;
}

export function derivedMods(state) {
  const mods = { damage: 0, block: 0, energy: 0 };
  for (const card of state.loadout) {
    if (!card.mods) continue;
    mods.damage += card.mods.damage || 0;
    mods.block += card.mods.block || 0;
    mods.energy += card.mods.energy || 0;
  }
  return mods;
}

export function effectValue(state, side, kind) {
  return state.effects.filter((e) => e.side === side && e.kind === kind).reduce((s, e) => s + e.value, 0);
}

export function heroDamageBonus(state) {
  return derivedMods(state).damage + effectValue(state, "hero", "strength") + (state.hero.damageBonus || 0) + effectValue(state, "hero", "bonusDamage");
}

export function canEquip(heroDef, card, loadout, heroStr) {
  if (card.type !== "equipment") return { ok: true };
  const cap = heroDef.capacity;
  const str = heroStr ?? heroDef.base.str;
  const tags = card.tags;

  if (tags.includes("heavy") && str < (card.reqStr || 0)) {
    return { ok: false, reason: `Requiere fuerza ${card.reqStr}` };
  }
  const armorClass = tags.find((t) => ["cloth", "leather", "plate"].includes(t));
  if (armorClass && !cap.allowedArmor.includes(armorClass)) {
    return { ok: false, reason: `No puede usar armadura de ${armorClass}` };
  }
  if (tags.includes("bow")) {
    if (!cap.allowBow) return { ok: false, reason: "No puede usar arcos" };
  }
  if (tags.includes("shield") && !cap.allowShield) {
    return { ok: false, reason: "No puede usar escudos" };
  }
  if (tags.includes("twoHanded") && !cap.allowTwoHanded) {
    return { ok: false, reason: "No puede usar armas a dos manos" };
  }

  if (card.slot === HAND_SLOT) {
    // Las manos usan sustitución: el arma sustituye al arma, el escudo al escudo
    // y un arma a dos manos sustituye todo lo equipado.
    const handItems = loadout.filter((c) => c.slot === HAND_SLOT);
    const isShield = tags.includes("shield");
    const sameFamily = handItems.filter((c) => (isShield ? c.tags.includes("shield") : !c.tags.includes("shield")));
    if (sameFamily.length || tags.includes("twoHanded")) return { ok: true };
    const used = handItems.reduce((sum, c) => sum + (c.tags.includes("twoHanded") ? 2 : 1), 0);
    const need = tags.includes("twoHanded") ? 2 : 1;
    if (used + need > cap.hands) return { ok: false, reason: "Sin manos libres" };
    return { ok: true };
  }
  return { ok: true };
}

function applyDamage(target, amount) {
  const dmg = Math.max(0, amount);
  const absorbed = Math.min(target.block, dmg);
  target.block -= absorbed;
  target.hp = Math.max(0, target.hp - (dmg - absorbed));
}

function addEffect(state, eff, side, meta) {
  const entry = {
    uid: ++state._effectUid,
    cardId: meta.cardId || null,
    name: meta.name || eff.kind,
    icon: meta.icon || "✨",
    side,
    kind: eff.kind,
    value: eff.value,
    remaining: meta.duration ?? null,
    sourceUid: meta.sourceUid ?? null,
    desc: meta.desc || "",
  };
  state.effects.push(entry);
  const who = side === "hero" ? "El héroe" : state.enemyDef.name;
  const dur = entry.remaining != null ? ` durante ${entry.remaining} rondas` : " el resto del combate";
  pushLog(state, `${entry.icon} ${entry.name}: afecta a ${who.toLowerCase()}${dur}.`, { actor: meta.actor || side, kind: "effect" });
}

export function applyEffects(state, effects, source, meta = {}) {
  const isHero = source === "hero";
  const actor = isHero ? "hero" : "enemy";
  const attacker = isHero ? state.hero : state.enemy;
  const defender = isHero ? state.enemy : state.hero;
  const mods = derivedMods(state);

  for (const eff of effects) {
    if (eff.kind === "fewerActions") {
      // Solo el héroe tiene acciones: la maldición siempre aterriza en el lado del héroe
      addEffect(state, eff, "hero", { ...meta, actor });
      continue;
    }
    if (OVER_TIME_ATTACKER.has(eff.kind) || OVER_TIME_DEFENDER.has(eff.kind)) {
      const side = OVER_TIME_ATTACKER.has(eff.kind)
        ? isHero
          ? "hero"
          : "enemy"
        : isHero
          ? "enemy"
          : "hero";
      addEffect(state, eff, side, { ...meta, duration: eff.duration ?? meta.duration, actor });
      continue;
    }
    switch (eff.kind) {
      case "damage": {
        let amount = eff.value + (isHero ? heroDamageBonus(state) : effectValue(state, "enemy", "strength") + effectValue(state, "enemy", "bonusDamage"));
        const weaken = effectValue(state, isHero ? "hero" : "enemy", "weaken");
        if (weaken > 0) amount = Math.floor(amount * Math.max(0, 1 - weaken / 100));
        if (effectValue(state, isHero ? "enemy" : "hero", "vulnerable") > 0) amount = Math.floor(amount * 1.5);
        applyDamage(defender, amount);
        pushLog(state, `${isHero ? "Héroe" : state.enemyDef.name} inflige ${amount} de daño.`, { actor, kind: "damage" });
        if (isHero && state.hero.onHitPoison && amount > 0 && defender.hp > 0) {
          addEffect(state, { kind: "poison", value: state.hero.onHitPoison }, "enemy", {
            name: "Hoja Tóxica",
            icon: "🧴",
            duration: 2,
            actor,
          });
        }
        break;
      }
      case "block": {
        const value = eff.value + (isHero ? mods.block : 0);
        attacker.block += value;
        pushLog(state, `${isHero ? "El héroe" : state.enemyDef.name} gana ${value} de bloqueo.`, { actor, kind: "block" });
        break;
      }
      case "heal": {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + eff.value);
        pushLog(state, `${isHero ? "El héroe" : state.enemyDef.name} cura ${eff.value}.`, { actor, kind: "heal" });
        break;
      }
      case "draw":
        if (isHero) drawCards(state, eff.value);
        break;
      case "energy":
        if (isHero) attacker.energy += eff.value;
        break;
      case "strength": {
        // La fuerza es un efecto con duración: null = todo el combate (como antes)
        addEffect(state, eff, isHero ? "hero" : "enemy", { ...meta, duration: meta.duration ?? null });
        break;
      }
      case "vulnerable": {
        // Vulnerable dura `value` rondas sobre el defensor
        addEffect(state, eff, isHero ? "enemy" : "hero", { ...meta, duration: eff.value });
        break;
      }
      case "bonusActions": {
        if (isHero) addEffect(state, eff, "hero", { ...meta, duration: eff.duration ?? null });
        break;
      }
      case "selfDamage": {
        attacker.hp = Math.max(0, attacker.hp - eff.value);
        pushLog(state, `${isHero ? "El héroe" : state.enemyDef.name} sufre ${eff.value} de daño.`, { actor, kind: "damage" });
        break;
      }
      case "addCurse": {
        const count = eff.value || 1;
        state.pendingCurseIds.push({ cardId: eff.cardId, count });
        const curseName = eff.cardId ? getCard(eff.cardId).name : "maldición";
        pushLog(state, `${state.enemyDef.name} te impone ${curseName}.`, { actor: "enemy", kind: "effect" });
        break;
      }
      case "taunt":
      case "guard":
      case "rescue": {
        // Efectos exclusivos del cooperativo; en 1P no tienen objetivo.
        break;
      }
      default:
        break;
    }
  }
}

// Aplica los efectos por-turno del lado indicado (veneno, regen, bloqueo extra). NO decrementa duración.
function applyTurnEffects(state, side) {
  if (state.winner) return;
  for (const eff of state.effects) {
    if (eff.side !== side) continue;
    const target = side === "hero" ? state.hero : state.enemy;
    switch (eff.kind) {
      case "poison":
        target.hp = Math.max(0, target.hp - eff.value);
        pushLog(state, `${side === "hero" ? "El héroe" : state.enemyDef.name} sufre ${eff.value} de daño por veneno.`, { actor: side, kind: "effect" });
        break;
      case "regen": {
        const healed = Math.min(target.maxHp, target.hp + eff.value) - target.hp;
        target.hp += healed;
        if (healed > 0) pushLog(state, `${side === "hero" ? "El héroe" : state.enemyDef.name} regenera ${healed} de vida.`, { actor: side, kind: "heal" });
        break;
      }
      case "bonusBlock":
        target.block += eff.value;
        pushLog(state, `${side === "hero" ? "El héroe" : state.enemyDef.name} gana ${eff.value} de bloqueo (efecto).`, { actor: side, kind: "block" });
        break;
      default:
        break;
    }
  }
  checkOver(state);
}

// Decrementa la duración de los efectos del lado indicado y elimina los expirados.
// Se llama al FINAL del turno de su dueño: un efecto activo N rondas cubre N turnos completos del dueño.
function expireEffects(state, side) {
  if (state.winner) return;
  const expired = [];
  for (const eff of state.effects) {
    if (eff.side !== side) continue;
    if (eff.remaining != null) {
      eff.remaining -= 1;
      if (eff.remaining <= 0) expired.push(eff);
    }
  }
  for (const eff of expired) {
    pushLog(state, `${eff.icon} ${eff.name} se desvanece.`, { actor: eff.side, kind: "effect" });
  }
  state.effects = state.effects.filter((e) => !expired.includes(e));
}

export function drawCards(state, n) {
  for (let i = 0; i < n; i++) {
    if (state.deck.draw.length === 0) {
      if (state.deck.discard.length === 0) break;
      state.deck.draw = state.rng.shuffle(state.deck.discard);
      state.deck.discard = [];
      pushLog(state, "Se baraja el descarte en el mazo.", { actor: "system" });
    }
    const card = state.deck.draw.pop();
    state.deck.hand.push(card);
    if (card.onDraw) {
      if (card.onDraw.damage) {
        state.hero.hp = Math.max(0, state.hero.hp - card.onDraw.damage);
        pushLog(state, `☠️ ${card.name}: recibes ${card.onDraw.damage} de daño al robarla.`, { actor: "hero", kind: "damage" });
      }
      if (card.onDraw.actions) {
        state.hero.actions = Math.max(0, state.hero.actions - card.onDraw.actions);
        pushLog(state, `☠️ ${card.name}: pierdes ${card.onDraw.actions} acción al robarla.`, { actor: "hero", kind: "effect" });
      }
      checkOver(state);
    }
  }
}

export function playCard(state, cardId) {
  if (state.phase !== "hero" || state.winner) return { ok: false, reason: "No es tu turno" };
  const idx = state.deck.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) return { ok: false, reason: "Carta no está en la mano" };
  const card = state.deck.hand[idx];
  if (card.type === "curse") return { ok: false, reason: "Maldición: no se puede jugar" };
  if (state.restrictions?.noResources && (card.type === "resource" || card.type === "effect")) return { ok: false, reason: "Prueba: sin recursos ni efectos" };
  if (state.restrictions?.noEffects && card.type === "effect") return { ok: false, reason: "Prueba: sin cartas de efecto" };
  if (state.restrictions?.noEquipment && card.type === "equipment") return { ok: false, reason: "Prueba: sin equipo" };
  if (state.hero.actions <= 0) return { ok: false, reason: "Sin acciones esta ronda" };
  const cost = card.cost;
  if (cost > 0 && !state.hero.arcane) return { ok: false, reason: "Requiere energía (solo clases arcanas)" };
  if (state.hero.energy < cost) return { ok: false, reason: "Energía insuficiente" };

  if (card.type === "equipment") {
    const check = canEquip(state.heroDef, card, state.loadout, state.hero.str);
    if (!check.ok) return check;
    state.hero.energy -= cost;
    state.hero.actions -= 1;
    state.deck.hand.splice(idx, 1);
    if (SINGLE_SLOTS.includes(card.slot)) {
      const existing = state.loadout.findIndex((c) => c.slot === card.slot);
      if (existing !== -1) {
        const old = state.loadout[existing];
        state.effects = state.effects.filter((e) => e.sourceUid !== old.uid);
        state.deck.discard.push(old);
        state.loadout.splice(existing, 1);
      }
    } else if (card.slot === HAND_SLOT) {
      // Intercambio en las manos: arma↔arma, escudo↔escudo, a dos manos ↔ todo
      const isShield = card.tags.includes("shield");
      const handItems = state.loadout.filter((c) => c.slot === HAND_SLOT);
      const olds = card.tags.includes("twoHanded")
        ? handItems.slice()
        : handItems.filter((c) => (isShield ? c.tags.includes("shield") : !c.tags.includes("shield")));
      for (const old of olds) {
        state.effects = state.effects.filter((e) => e.sourceUid !== old.uid);
        state.deck.discard.push(old);
      }
      state.loadout = state.loadout.filter((c) => !olds.includes(c));
    }
    state.loadout.push(card);
    pushLog(state, `Se equipa ${card.name}.`, { actor: "hero", kind: "equip" });
    if (card.fused) {
      pushLog(state, `${card.fused.name} irradia desde ${card.name}.`, { actor: "hero", kind: "effect" });
      applyEffects(state, card.fused.effects, "hero", {
        name: `${card.name} · ${card.fused.name}`,
        icon: card.fused.icon,
        duration: card.fused.duration,
        sourceUid: card.uid,
        actor: "hero",
      });
    }
    if (card.subtype === "relic") applyRelic(state, card);
    return { ok: true };
  }

  // Gemas y runas son SOLO material de fusión: no se juegan en combate
  if (card.subtype === "gem" || card.subtype === "rune") {
    return { ok: false, reason: "Es material de fusión: úsala en la fragua" };
  }

  state.hero.energy -= cost;
  state.hero.actions -= 1;
  state.deck.hand.splice(idx, 1);
  if (card.scrap) {
    if (card.uid != null) state.scrappedUids.push(card.uid);
    pushLog(state, `Se consume ${card.name} (sale del mazo).`, { actor: "hero", kind: "effect" });
  } else if (card.type === "effect" || card.type === "resource") {
    // Las cartas de efecto y los recursos se consumen para siempre: salen del mazo
    // hasta que el jugador vuelva a comprarlos o encontrarlos en un tesoro o botín.
    if (card.uid != null) {
      state.exhaustedUids.push(card.uid); // contador/badge de UI durante el combate
      state.scrappedUids.push(card.uid); // purga permanente al terminar el combate
    }
    pushLog(state, `${card.name} se consume (un solo uso: consíguela de nuevo en el mercado o el botín).`, { actor: "hero", kind: "effect" });
  } else if (card.subtype === "buff") {
    // Los potes de combate completo (Grito de Guerra...) son de un solo uso por
    // combate: se agotan y vuelven al mazo del jugador en el siguiente.
    if (card.uid != null) state.exhaustedUids.push(card.uid);
    pushLog(state, `${card.name} se agota (un uso por combate).`, { actor: "hero", kind: "effect" });
  } else {
    state.deck.discard.push(card);
  }
  pushLog(state, `Se juega ${card.name}.`, { actor: "hero", kind: "skill" });
  applyEffects(state, card.effects, "hero", { name: card.name, icon: card.icon, duration: card.duration, cardId: card.id, desc: card.text });
  checkElementReactions(state, "enemy");
  if (card.marks && card.marks.length) applyMarks(state, card.marks, "hero");
  checkOver(state);
  return { ok: true };
}

export function equipCard(state, cardId) {
  return playCard(state, cardId);
}

function chooseEnemyMove(state) {
  const moves = state.enemyDef.moves;
  const profile = state.enemyDef.ai;
  const lowHp = state.enemy.hp < state.enemy.maxHp * 0.35;
  return state.rng.weighted(moves, (m) => {
    let w = m.weight;
    const kinds = m.effects.map((e) => e.kind);
    if (lowHp && kinds.includes("heal")) w *= 3;
    if (profile === "aggressive" && kinds.includes("damage")) w *= 1.5;
    if (profile === "defensive" && kinds.includes("block")) w *= 1.8;
    if (profile === "caster" && kinds.includes("heal")) w *= 1.6;
    if (profile === "caster" && kinds.includes("damage")) w *= 1.2;
    return w;
  });
}

function startHeroTurn(state) {
  if (state.winner) return;
  state.phase = "hero";
  // En la primera ronda se conserva el bloqueo aportado por reliquias/equipo
  // antes de empezar el combate; en las siguientes se reinicia.
  state.hero.block = state.round === 1 ? state.hero.block : 0;
  applyTurnEffects(state, "hero");
  if (state.winner) return;
  const mods = derivedMods(state);
  state.hero.energy = state.hero.energyPerRound + mods.energy;
  const bonusActions = effectValue(state, "hero", "bonusActions");
  state.hero.actions = Math.max(0, state.hero.actionsPerRound + bonusActions - effectValue(state, "hero", "fewerActions") - (state.hero.actionDebt || 0));
  state.hero.actionDebt = 0;
  drawCards(state, BALANCE.cardsPerRound + (state.hero.drawBonus || 0));
  if (state.winner) return;
  pushLog(state, `— Ronda ${state.round}: ${state.hero.actions} acciones, ${state.hero.energy} energía.`, { actor: "system" });
}

function enemyTurn(state) {
  if (state.winner) return;
  state.phase = "enemy";
  state.enemy.block = 0;
  applyTurnEffects(state, "enemy");
  if (state.winner) return;
  if (state.enemy.stunned) {
    state.enemy.stunned = false;
    pushLog(state, `${state.enemyDef.name} está aturdido y pierde su movimiento.`, { actor: "enemy", kind: "effect" });
    expireEffects(state, "enemy");
    expireMarks(state, "enemy");
    checkOver(state);
    return;
  }
  const move = state.enemy.moveQueue.shift() || chooseEnemyMove(state);
  state.enemy.moveQueue.push(chooseEnemyMove(state));
  pushLog(state, `${state.enemyDef.name} usa ${move.name}.`, { actor: "enemy", kind: "move", icon: move.icon || state.enemyDef.icon });
  applyEffects(state, move.effects, "enemy", { name: move.name, icon: move.icon, duration: move.duration, cardId: move.id });
  if (!state.winner) {
    expireEffects(state, "enemy");
    expireMarks(state, "enemy");
  }
  checkOver(state);
}

export function endTurn(state) {
  if (state.phase !== "hero" || state.winner) return;
  state.reactionLogStart = state.log.length;
  state.phase = "reaction";
}

export function playReaction(state, cardId) {
  if (state.phase !== "reaction" || state.winner) return { ok: false, reason: "Sin ventana de reacción" };
  const idx = state.deck.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) return { ok: false, reason: "Carta no está en la mano" };
  const card = state.deck.hand[idx];
  if (!card.reaction) return { ok: false, reason: "No es una carta de reacción" };
  const move = enemyIntent(state);
  if (!reactionMatches(card, move)) return { ok: false, reason: "El movimiento enemigo no activa esta reacción" };
  if (card.cost > 0 && !state.hero.arcane) return { ok: false, reason: "Requiere energía (solo clases arcanas)" };
  if (state.hero.energy < card.cost) return { ok: false, reason: "Energía insuficiente" };
  state.hero.energy -= card.cost;
  state.hero.actionDebt = (state.hero.actionDebt || 0) + BALANCE.reactionActionCost;
  state.deck.hand.splice(idx, 1);
  if (card.scrap) {
    if (card.uid != null) state.scrappedUids.push(card.uid);
  } else {
    state.deck.discard.push(card);
  }
  pushLog(state, `Reacción: ${card.name} (costará ${BALANCE.reactionActionCost} acción el próximo turno).`, { actor: "hero", kind: "reaction" });
  applyEffects(state, card.effects, "hero", { name: card.name, icon: card.icon, duration: card.duration, cardId: card.id, desc: card.text });
  checkElementReactions(state, "enemy");
  if (card.marks && card.marks.length) applyMarks(state, card.marks, "hero");
  checkOver(state);
  return { ok: true };
}

export function resolveEnemyTurn(state) {
  if (state.phase !== "reaction" || state.winner) return;
  for (const card of state.deck.hand) state.deck.discard.push(card);
  state.deck.hand = [];
  expireEffects(state, "hero");
  expireMarks(state, "hero");
  state.phase = "enemy";
  const move = enemyIntent(state);
  const heroHpBefore = state.hero.hp;
  const logStart = state.reactionLogStart ?? state.log.length;
  state.reactionLogStart = null;
  enemyTurn(state);
  state.enemyTurnSummary = {
    move: move ? { id: move.id, name: move.name, icon: move.icon, effects: move.effects.map((e) => ({ ...e })) } : null,
    heroHpBefore,
    heroHpAfter: state.hero.hp,
    entries: state.log.slice(logStart),
  };
  if (state.winner) return;
  state.phase = "enemyDone";
}

export function continueToHeroTurn(state) {
  if (state.phase !== "enemyDone" || state.winner) return;
  state.round += 1;
  state.enemyTurnSummary = null;
  startHeroTurn(state);
}

export function enemyIntent(state) {
  return (state.enemy.moveQueue && state.enemy.moveQueue[0]) || null;
}

export function moveTags(move) {
  if (!move) return { attack: false, defend: false, buff: false };
  const kinds = move.effects.map((e) => e.kind);
  return {
    attack: kinds.includes("damage"),
    defend: kinds.includes("block"),
    buff: kinds.some((k) => ["heal", "strength", "energy", "vulnerable", "poison", "weaken"].includes(k)),
  };
}

const TRIGGER_ALIAS = { enemy_attack: "attack", enemy_defend: "defend", enemy_buff: "buff" };

export function reactionMatches(card, move) {
  if (!card.reaction || !move) return false;
  const tags = moveTags(move);
  return card.reaction.trigger.some((t) => tags[TRIGGER_ALIAS[t] || t]);
}

export function intentPreview(state) {
  const move = enemyIntent(state);
  if (!move) return null;
  const tags = moveTags(move);
  let damage = 0;
  for (const e of move.effects) {
    if (e.kind === "damage") damage += e.value;
  }
  damage += effectValue(state, "enemy", "strength") + effectValue(state, "enemy", "bonusDamage");
  const weaken = effectValue(state, "enemy", "weaken");
  if (weaken > 0) damage = Math.floor(damage * Math.max(0, 1 - weaken / 100));
  if (effectValue(state, "hero", "vulnerable") > 0) damage = Math.floor(damage * 1.5);
  return { move, tags, damage };
}

export function checkOver(state) {
  if (state.enemy.hp <= 0) {
    state.winner = "hero";
    state.phase = "over";
    pushLog(state, `${state.enemyDef.name} ha caído.`, { actor: "system", kind: "ko" });
  } else if (state.hero.hp <= 0) {
    state.winner = "enemy";
    state.phase = "over";
    pushLog(state, "El héroe ha caído.", { actor: "system", kind: "ko" });
  }
  return state.winner;
}

export function isOver(state) {
  return state.winner;
}

export function playableCards(state) {
  return state.deck.hand.filter((c) => c.type !== "curse" && (c.cost === 0 || (state.hero.arcane && c.cost <= state.hero.energy)));
}
