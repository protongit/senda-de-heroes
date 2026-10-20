import { getCard, resolveCard, makeInstance } from "../js/cards.js";
import { getCharacter, CHARACTERS } from "../js/characters.js";
import { canEquip, createCombat, playCard, endTurn, playReaction, resolveEnemyTurn, continueToHeroTurn, enemyIntent, reactionMatches, applyEffects, applyMarks, expireMarks, drawCards } from "../js/engine.js";
import { takeHeroTurn } from "../js/ai.js";
import { createRng } from "../js/rng.js";
import { createRun, heroStatsForCombat, enemyForTier, addCardToRun, finishCombat, ensureMarket, rotateMarket, removeInstanceFromRun, continueRunAscension, rollOptions, rollShopServices, healAtShop, healerPrices, removeCurseAtShop, applyChallengeReward, applyChallengePenalty, snapshotChallengeState, diffChallengeState, consumeChallenge, rejectChallenge, tierForDepth } from "../js/run.js";
import { buy, sell } from "../js/shop.js";
import { BALANCE } from "../js/balance-config.js";
import { simulateRun, simulateChallenge } from "../js/simulate.js";
import { PERKS, perkOptions, applyPerk } from "../js/perks.js";
import { tableEffectsHTML } from "../js/ui.js";
import { getEnemy } from "../js/enemies.js";
import { DROP_POOLS } from "../js/loot.js";
import { CHALLENGE_TEMPLATES, rollChallenge, puzzleSolved, evaluateCombatOutcome } from "../js/challenges.js";
import { createDuel, playDuelCard, currentUnit, chooseEnemyTarget, applyDuelMarks, endDuelTurn } from "../js/duel.js";
import { MARK_META, REACTIONS } from "../js/elements.js";
import { serializeRun, deserializeRun } from "../js/save.js";

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

function dummyEnemy(moves) {
  return {
    id: "dummy", name: "Maniquí", level: 1, kind: "normal", hp: 999, icon: "🎯",
    ai: "defensive",
    moves,
    rewards: { coins: [0, 0], xp: 0, drops: [] },
  };
}

function testEquipRules() {
  const warrior = getCharacter("warrior");
  const dwarf = getCharacter("dwarf");
  const sorceress = getCharacter("sorceress");

  check("arco válido sin armas", canEquip(warrior, getCard("bow_long"), [], warrior.base.str).ok);
  check("arco sustituye espada equipada", canEquip(warrior, getCard("bow_long"), [getCard("sword_short")], warrior.base.str).ok);
  check("arco sustituye escudo equipado", canEquip(warrior, getCard("bow_long"), [getCard("shield_round")], warrior.base.str).ok);
  check("dos espadas caben en 2 manos (segunda sustituye)", canEquip(warrior, getCard("sword_short"), [getCard("sword_short")], warrior.base.str).ok);
  check("espada + escudo cabe", canEquip(warrior, getCard("shield_round"), [getCard("sword_short")], warrior.base.str).ok);
  check("tercera pieza de mano bloqueada", !canEquip(warrior, getCard("shield_round"), [getCard("sword_short"), getCard("dagger_elf")], warrior.base.str).ok);
  check("escudo no entra con arma a dos manos", !canEquip(warrior, getCard("shield_round"), [getCard("bow_long")], warrior.base.str).ok);
  check("enano no usa arcos", !canEquip(dwarf, getCard("bow_long"), [], dwarf.base.str).ok);
  check("hechicera no usa placa", !canEquip(sorceress, getCard("armor_chain"), [], sorceress.base.str).ok);
  check("fuerza insuficiente bloquea pesado", !canEquip(sorceress, getCard("axe_war"), [], sorceress.base.str).ok);
  check("enano con fuerza usa cota", canEquip(dwarf, getCard("armor_chain"), [], dwarf.base.str).ok);
  check("casco reemplaza casco", canEquip(warrior, getCard("helm_iron"), [getCard("helm_iron")], warrior.base.str).ok);
}

function testRingAndAmulet() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 };
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const combat = createCombat(warrior, stats, guard, [], createRng(400));
  combat.deck.hand = [resolveCard(makeInstance("amulet_arcane", 960)), resolveCard(makeInstance("ring_might", 961))];
  combat.hero.actions = 2;
  check("amuleto se equipa", playCard(combat, "amulet_arcane").ok);
  check("anillo se equipa junto al amuleto", playCard(combat, "ring_might").ok);
  check("amuleto y anillo comparten mesa", combat.loadout.some((c) => c.id === "amulet_arcane") && combat.loadout.some((c) => c.id === "ring_might"));
  check("slots de amuleto y anillo son distintos", getCard("amulet_arcane").slot === "neck" && getCard("ring_might").slot === "ring");
}

function testSaveLoad() {
  const run = createRun("sorceress", 901);
  addCardToRun(run, "ring_might");
  const amulet = run.deck.find((i) => i.cardId === "amulet_arcane");
  const ring = run.deck.find((i) => i.cardId === "ring_might");
  run.loadout = [amulet, ring];
  run.coins = 123;
  run.xp = 240;
  run.level = 4;
  run.depth = 3;
  run.maxHp = 140;
  run.hp = 77;
  run.morality.honor = 2;
  run.rng.next();
  run.mapRng.next();
  run.challengeRng.next();
  run.serviceRng.next();
  const payload = serializeRun(run);
  const restored = deserializeRun(JSON.parse(JSON.stringify(payload)));
  check("guardado recrea la partida", !!restored);
  check("guardado conserva héroe, nivel y posición", restored.heroId === "sorceress" && restored.level === 4 && restored.depth === 3);
  check("guardado conserva recursos y vida", restored.coins === 123 && restored.hp === 77 && restored.maxHp === 140 && restored.xp === 240);
  check("guardado conserva moralidad", restored.morality.honor === 2);
  check("guardado conserva el mazo", restored.deck.length === run.deck.length && restored.deck.some((i) => i.cardId === "ring_might"));
  check("guardado conserva equipo y referencias", restored.loadout.length === 2 && restored.loadout.every((c) => restored.deck.includes(c)));
  check("guardado conserva opciones de la senda", JSON.stringify(restored.options) === JSON.stringify(run.options));
  check("guardado conserva RNG", restored.rng.getState() === run.rng.getState() && restored.mapRng.getState() === run.mapRng.getState() && restored.challengeRng.getState() === run.challengeRng.getState() && restored.serviceRng.getState() === run.serviceRng.getState());
  check("guardado rechaza versiones desconocidas", deserializeRun({ version: 99, run: { heroId: "warrior" } }) === null);
}

function testHandSwap() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 6 };
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const run = createRun("warrior", 35);
  addCardToRun(run, "dagger_elf");
  const dagger = run.deck[run.deck.length - 1];
  const combat = createCombat(warrior, stats, guard, run.deck.slice(), createRng(90));

  // Equipar espada corta
  combat.deck.hand = [resolveCard(run.deck.find((i) => i.cardId === "sword_short"))];
  check("equipa espada corta", playCard(combat, "sword_short").ok);
  check("espada en mesa", combat.loadout.some((c) => c.id === "sword_short"));

  // Espada élfica sustituye a la espada corta: la corta va al descarte
  combat.deck.hand = [resolveCard(dagger)];
  check("juega espada élfica", playCard(combat, "dagger_elf").ok);
  check("espada élfica en mesa", combat.loadout.some((c) => c.id === "dagger_elf") && combat.loadout.length === 1);
  check("espada corta vuelve al descarte", combat.deck.discard.some((c) => c.id === "sword_short"));

  // Un arma a dos manos sustituye el arma élfica y cualquier escudo
  addCardToRun(run, "shield_round");
  addCardToRun(run, "bow_long");
  combat.deck.hand = [resolveCard(run.deck.find((i) => i.cardId === "shield_round")), resolveCard(run.deck.find((i) => i.cardId === "bow_long"))];
  check("equipa escudo junto a daga", playCard(combat, "shield_round").ok);
  check("daga + escudo en mesa", combat.loadout.length === 2);
  check("juega arco (sustituye ambos)", playCard(combat, "bow_long").ok);
  check("solo el arco en mesa", combat.loadout.length === 1 && combat.loadout[0].id === "bow_long");
  check("daga y escudo al descarte", combat.deck.discard.some((c) => c.id === "dagger_elf") && combat.deck.discard.some((c) => c.id === "shield_round"));
}

function testDeckCycle() {
  const run = createRun("warrior", 42);
  const enemy = getEnemy("goblin");
  const combat = createCombat(run.heroDef, heroStatsForCombat(run), enemy, run.deck.slice(), createRng(1));
  const total = combat.deck.draw.length + combat.deck.hand.length;
  check("reparte 6 cartas al empezar", combat.deck.hand.length === 6);
  check("mazo de 12 menos mano = 6 en robo", combat.deck.draw.length === 6);
  check("total de cartas conservado", total === 12);
  check("mazo inicial de 12 cartas", run.deck.length === 12);
  check("instancias con uid", combat.deck.hand.every((c) => c.uid != null));
  let turns = 0;
  while (!combat.winner && turns++ < 400) takeHeroTurn(combat);
  check("el combate termina", !!combat.winner);
  check("hp no negativo", combat.hero.hp >= 0 && combat.enemy.hp >= 0);
}

function testShop() {
  const run = createRun("elf", 7);
  run.coins = 100;
  const market = ensureMarket(run);
  check("mercado fijo generado", market.stable.length === BALANCE.marketStable);
  check("mercado fijo siempre con agua y comida", market.stable.includes("water") && market.stable.includes("food"));
  const rot1 = rotateMarket(run);
  check("zona rotativa generada", rot1.rotating.length === BALANCE.marketRotating);
  const rotIds = rot1.rotating.map((s) => s.id);
  check("sin duplicados entre zonas", new Set([...run.market.stable, ...rotIds]).size === run.market.stable.length + rotIds.length);

  const before = run.deck.length;
  const coinsBefore = run.coins;
  const target = market.stable[0];
  const res = buy(run, target);
  check("compra de mercado añade instancia", res.ok && run.deck.length === before + 1);
  check("compra fija es repetible (no se agota)", run.market.stable.includes(target));
  const res2 = buy(run, target);
  check("segunda compra del mismo fijo posible", res2.ok && run.market.stable.includes(target));
  const rotTarget = run.market.rotating[0]?.id;
  if (rotTarget) {
    buy(run, rotTarget);
    check("compra rotativa descuenta el hueco", !run.market.rotating.some((s) => s.id === rotTarget));
  }
  check("compra cuesta monedas", run.coins === coinsBefore - res.card.value * 2 - (rotTarget ? getCard(rotTarget).value : 0));

  addCardToRun(run, "food");
  addCardToRun(run, "food");
  const uid = run.deck[run.deck.length - 1].uid;
  const sold = sell(run, uid);
  check("venta por uid da monedas", sold.ok && sold.card.id === "food");
  const badSell = sell(run, 999999);
  check("uid inexistente rechazado", !badSell.ok);

  // la rotación avanza con la misma run (mapRng) y repone la zona
  rotateMarket(run);
  check("rotación repone surtido", run.market.rotating.length === BALANCE.marketRotating);
}

function testForge() {
  const run = createRun("warrior", 55);
  run.coins = 200;
  addCardToRun(run, "blessing_war");
  const sword = run.deck.find((i) => i.cardId === "sword_short");
  const blessing = run.deck.find((i) => i.cardId === "blessing_war");

  // Mejorar
  const baseValue = resolveCard(sword).value;
  const cost = Math.max(5, Math.ceil(baseValue * BALANCE.forgeUpgradeCostFactor));
  const coinsBefore = run.coins;
  sword.upgrade = 1;
  const improved = resolveCard(sword);
  check("mejora escala valor", improved.value === Math.floor(baseValue * BALANCE.upgradeFactor));
  check("mejora escala mods", improved.mods.damage === Math.ceil(3 * BALANCE.upgradeFactor));

  // Fusionar: equipo + efecto
  const fusionPrice = Math.max(8, Math.ceil(getCard("blessing_war").value * BALANCE.forgeFusionCostFactor));
  sword.fusedEffectId = blessing.cardId;
  removeInstanceFromRun(run, blessing.uid);
  const fusedResolved = resolveCard(sword);
  check("fusión adjunta efecto al equipo", fusedResolved.fused && fusedResolved.fused.id === "blessing_war");
  check("fusión retira la carta de efecto del mazo", !run.deck.some((i) => i.uid === blessing.uid));
  check("cartas de coste razonables", cost > 0 && fusionPrice > cost);
  check("monedas reservadas para pruebas", coinsBefore === 200);
}

function testInstances() {
  const inst = makeInstance("sword_short", 1);
  const plain = resolveCard(inst);
  check("resolveCard base", plain.damage !== undefined || (plain.mods && plain.mods.damage === 3));
  check("resolveCard conserva uid", plain.uid === 1);
  const up = resolveCard({ ...inst, upgrade: 1 });
  check("mejora escala valor", up.value === Math.floor(20 * 1.5));
  check("mejora escala mods", up.mods.damage === Math.ceil(3 * 1.5));
  const legacy = resolveCard("shield_round");
  check("resolveCard acepta string", legacy.id === "shield_round");
  const fused = resolveCard({ ...inst, cardId: "armor_leather", fusedEffectId: "blessing_war" });
  check("fusión adjunta efecto", fused.fused && fused.fused.id === "blessing_war" && fused.fused.duration === 3);
}

function testEffects() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 };
  const goblin = getEnemy("goblin");
  const run = createRun("warrior", 5);
  const combat = createCombat(warrior, stats, goblin, run.deck.slice(), createRng(11));

  combat.deck.hand = [resolveCard(makeInstance("poison_vial", 900))];
  const hp0 = combat.enemy.hp;
  check("juega veneno", playCard(combat, "poison_vial").ok);
  check("efecto creado en lado enemigo", combat.effects.some((e) => e.kind === "poison" && e.side === "enemy"));
  endTurn(combat);
  resolveEnemyTurn(combat);
  check("veneno pica al empezar el turno del enemigo", combat.winner === "hero" || combat.enemy.hp === hp0 - 4);
  const poison = combat.effects.find((e) => e.kind === "poison" && e.side === "enemy");
  check("veneno decrementa duración", poison && poison.remaining === 2);

  // Bendición: bonusDamage aplicado al daño del héroe
  const c2 = createCombat(warrior, stats, goblin, run.deck.slice(), createRng(12));
  c2.deck.hand = [resolveCard(makeInstance("blessing_war", 901)), resolveCard(makeInstance("lunge", 902))];
  playCard(c2, "blessing_war");
  const dmgBase = 9; // estocada
  const hpBefore = c2.enemy.hp;
  playCard(c2, "lunge");
  check("bonusDamage aplica", c2.enemy.hp === hpBefore - (dmgBase + 3));
  check("bendición en lado héroe", c2.effects.some((e) => e.kind === "bonusDamage" && e.side === "hero"));

  // Maldición de debilidad reduce daño enemigo (enemigo maniquí con un solo golpe)
  const striker = dummyEnemy([{ id: "hit", name: "Golpe", icon: "⚔️", weight: 1, effects: [{ kind: "damage", value: 10 }] }]);
  const c3 = createCombat(warrior, stats, striker, run.deck.slice(), createRng(13));
  c3.deck.hand = [resolveCard(makeInstance("curse_weak", 903))];
  playCard(c3, "curse_weak");
  endTurn(c3);
  resolveEnemyTurn(c3);
  check("weaken reduce daño enemigo", c3.winner === "hero" || c3.hero.hp === 100 - Math.floor(10 * 0.67));

  // Regeneración pica en turno del héroe (maniquí no hace daño)
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const c4 = createCombat(warrior, { ...stats, hp: 50 }, guard, run.deck.slice(), createRng(14));
  c4.deck.hand = [resolveCard(makeInstance("regen_brew", 904))];
  playCard(c4, "regen_brew");
  endTurn(c4);
  resolveEnemyTurn(c4);
  continueToHeroTurn(c4);
  check("regen cura al empezar turno", c4.hero.hp === 53);
  check("regen decrementa duración", (c4.effects.find((e) => e.kind === "regen") || {}).remaining === 2);

  // Maldición de languidez: -1 acción por ronda
  const c5 = createCombat(warrior, stats, guard, run.deck.slice(), createRng(15));
  c5.deck.hand = [resolveCard(makeInstance("curse_languor", 905))];
  playCard(c5, "curse_languor");
  endTurn(c5);
  resolveEnemyTurn(c5);
  continueToHeroTurn(c5);
  check("fewerActions reduce acciones", c5.hero.actions === 2);
}

function testFusedAndScrap() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 };
  const goblin = getEnemy("goblin");
  const run = createRun("warrior", 21);

  // Equipo con efecto fusionado: el efecto está activo desde el inicio del combate
  const armor = { ...makeInstance("armor_leather", 701), fusedEffectId: "blessing_war" };
  const combat = createCombat(warrior, stats, goblin, run.deck.slice(), createRng(31), [armor]);
  check("fusión crea efecto al iniciar", combat.effects.some((e) => e.kind === "bonusDamage" && e.side === "hero"));
  check("equipo fusionado en mesa", combat.loadout.some((c) => c.uid === 701 && c.fused));

  // Equipar en pleno combate un equipo fusionado activa su efecto; reemplazarlo lo retira
  const run3 = createRun("warrior", 23);
  addCardToRun(run3, "blessing_war");
  const armor3 = run3.deck.find((i) => i.cardId === "armor_leather");
  armor3.fusedEffectId = "blessing_war";
  const combat3 = createCombat(run3.heroDef, stats, getEnemy("goblin"), run3.deck.slice(), createRng(33));
  combat3.deck.hand = [resolveCard(armor3)];
  check("equipa armadura fusionada", playCard(combat3, "armor_leather").ok);
  check("efecto fusionado activo al equipar", combat3.effects.some((e) => e.kind === "bonusDamage" && e.side === "hero" && e.sourceUid === armor3.uid));
  combat3.deck.hand = combat3.deck.hand.filter((c) => c.id !== "armor_chain");
  combat3.deck.hand.push(resolveCard(makeInstance("armor_chain", 733)));
  check("reemplaza con cota (mismo slot)", playCard(combat3, "armor_chain").ok);
  check("reemplazo retira el efecto del equipo saliente", !combat3.effects.some((e) => e.sourceUid === armor3.uid));
  check("cota equipada en mesa", combat3.loadout.some((c) => c.id === "armor_chain"));

  // Scrap: la carta se consume y se purga del mazo de la run al ganar
  const run2 = createRun("warrior", 22);
  addCardToRun(run2, "last_fury");
  const scrapInst = run2.deck[run2.deck.length - 1];
  const enemy2 = getEnemy("goblin");
  const combat2 = createCombat(run2.heroDef, heroStatsForCombat(run2), enemy2, run2.deck.slice(), createRng(32));
  combat2.deck.hand = combat2.deck.hand.filter((c) => c.id !== "last_fury");
  combat2.deck.hand.push(resolveCard(scrapInst));
  const res = playCard(combat2, "last_fury");
  check("carta consumible se juega", res.ok);
  check("scrap registra uid", combat2.scrappedUids.includes(scrapInst.uid));
  check("scrap no va al descarte", !combat2.deck.discard.some((c) => c.uid === scrapInst.uid));
  combat2.winner = "hero";
  finishCombat(run2, "hero", enemy2, combat2);
  check("scrap purgado del mazo de la run", !run2.deck.some((i) => i.uid === scrapInst.uid));
  check("scrap registrado en run", run2.scrapped.includes("last_fury"));
}

function testBuffExhaust() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 6 };
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const run = createRun("warrior", 36);
  addCardToRun(run, "war_cry");
  const buffInst = run.deck[run.deck.length - 1];
  const combat = createCombat(warrior, stats, guard, run.deck.slice(), createRng(65));

  // Jugar el grito: fuerza +2 permanente en el combate y la carta se agota
  combat.deck.hand = combat.deck.hand.filter((c) => c.id !== "war_cry");
  combat.deck.hand.push(resolveCard(buffInst));
  check("juega grito de guerra", playCard(combat, "war_cry").ok);
  check("fuerza aplicada como efecto permanente", combat.effects.some((e) => e.kind === "strength" && e.value === 2 && e.remaining === null));
  check("buff agotado (no va al descarte)", combat.exhaustedUids.includes(buffInst.uid) && !combat.deck.discard.some((c) => c.uid === buffInst.uid));
  check("no se consume para siempre", !combat.scrappedUids.includes(buffInst.uid));

  // Reciclar el descarte: no vuelve a aparecer y la fuerza no se apila
  for (let i = 0; i < 30; i++) {
    endTurn(combat);
    if (combat.winner) break;
    continueToHeroTurn(combat);
  }
  check("no se re-roba en el mismo combate", !combat.deck.hand.some((c) => c.uid === buffInst.uid) && !combat.deck.draw.some((c) => c.uid === buffInst.uid) && !combat.deck.discard.some((c) => c.uid === buffInst.uid));
  check("fuerza sin apilar", combat.effects.filter((e) => e.kind === "strength").length === 1);

  // Al terminar el combate vuelve al mazo del jugador
  combat.winner = "hero";
  finishCombat(run, "hero", guard, combat);
  check("vuelve al mazo tras el combate", run.deck.some((i) => i.uid === buffInst.uid));
}

function testIntentAndReactions() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 };
  const striker = dummyEnemy([{ id: "hit", name: "Golpe", icon: "⚔️", weight: 1, effects: [{ kind: "damage", value: 10 }] }]);

  // Intención: cola de 2 movimientos pre-anunciada
  const c1 = createCombat(warrior, stats, striker, [], createRng(41));
  check("intención visible al empezar", !!enemyIntent(c1));
  check("cola de intención tiene 2", c1.enemy.moveQueue.length === 2);
  const q1 = c1.enemy.moveQueue[1];
  endTurn(c1); // entra en fase de reacción
  check("endTurn deja fase de reacción", c1.phase === "reaction");
  check("la intención no cambia al terminar turno", enemyIntent(c1) === c1.enemy.moveQueue[0]);
  resolveEnemyTurn(c1);
  check("tras resolver, la intención rota al siguiente movimiento", enemyIntent(c1) === q1 && c1.enemy.moveQueue.length === 2);
  check("cada reacción cuesta 1 acción el turno siguiente", c1.hero.actions === 3 && c1.hero.actionDebt === 0);

  // Reacción válida contra ataque + deuda de acciones
  const c2 = createCombat(warrior, stats, striker, [], createRng(42));
  c2.deck.hand = [resolveCard(makeInstance("intercept", 910)), resolveCard(makeInstance("lunge", 911))];
  endTurn(c2);
  const res = playReaction(c2, "intercept");
  check("reacción válida se juega", res.ok);
  check("bloqueo de la reacción disponible", c2.hero.block === 8);
  check("deuda de acción acumulada", c2.hero.actionDebt === 1);
  check("reacción jugada va al descarte", c2.deck.discard.some((c) => c.uid === 910));
  resolveEnemyTurn(c2);
  check("turno enemigo queda en pausa (enemyDone)", c2.phase === "enemyDone");
  check("resumen del turno enemigo capturado", !!c2.enemyTurnSummary && c2.enemyTurnSummary.move.name === "Golpe" && c2.enemyTurnSummary.entries.length > 0);
  check("resumen registra la vida del héroe", c2.enemyTurnSummary.heroHpBefore === 100 && c2.enemyTurnSummary.heroHpAfter === 98);
  continueToHeroTurn(c2);
  check("continuar reanuda el turno del héroe", c2.phase === "hero" && c2.round === 2 && c2.enemyTurnSummary === null);
  check("deuda reduce acciones del turno siguiente", c2.hero.actions === 2 && c2.hero.actionDebt === 0);

  // Reacción con trigger no compatible se rechaza
  const healer = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const c3 = createCombat(warrior, stats, healer, [], createRng(43));
  c3.deck.hand = [resolveCard(makeInstance("intercept", 912))];
  endTurn(c3);
  check("reacción sin trigger compatible se rechaza", !playReaction(c3, "intercept").ok);
  resolveEnemyTurn(c3);

  // Contraataque pega antes del movimiento enemigo
  const c4 = createCombat(warrior, stats, striker, [], createRng(44));
  c4.deck.hand = [resolveCard(makeInstance("counter_attack", 913))];
  const enemyHp0 = c4.enemy.hp;
  endTurn(c4);
  playReaction(c4, "counter_attack");
  check("contraataque inflige daño", c4.enemy.hp === enemyHp0 - 8);
  resolveEnemyTurn(c4);
}

function testPerks() {
  const run = createRun("warrior", 77);
  check("sin niveles pendientes al empezar", run.pendingLevels === 0);
  const opts = perkOptions(run);
  check("dos opciones de perk", opts.length === 2 && opts[0].id !== opts[1].id);
  check("arcana solo para arcanos", opts.every((p) => !p.arcaneOnly));

  applyPerk(run, "perk_vigor");
  check("vigor suma vida", run.maxHp === run.heroDef.base.hp + 10 && run.hp === run.maxHp);
  applyPerk(run, "perk_insight");
  check("vista aguda suma robo", run.drawBonus === 1);
  applyPerk(run, "perk_guard");
  check("guardia suma bloqueo inicial", run.startBlock === 3);
  applyPerk(run, "perk_brutality");
  check("brutalidad suma daño", run.damageBonus === 1);
  applyPerk(run, "perk_venom");
  check("hoja tóxica registrada", run.onHitPoison === 1);
  applyPerk(run, "perk_arcana");
  check("perk arcano no aplicable a marcial", !run.perks.includes("perk_arcana"));
  applyPerk(run, "perk_smith");
  check("herrero descuenta fragua", run.forgeDiscount === 0.5);

  // Los perks afectan al combate
  const stats = heroStatsForCombat(run);
  check("stats incluyen perks", stats.startBlock === 3 && stats.damageBonus === 1 && stats.drawBonus === 1 && stats.onHitPoison === 1);
  const striker = dummyEnemy([{ id: "hit", name: "Golpe", icon: "⚔️", weight: 1, effects: [{ kind: "damage", value: 10 }] }]);
  const combat = createCombat(run.heroDef, stats, striker, run.deck.slice(), createRng(78));
  check("bloqueo inicial aplicado", combat.hero.block === 3);
  check("robo bonus aplicado", combat.deck.hand.length === BALANCE.cardsPerRound + 1);
  combat.deck.hand = [resolveCard(makeInstance("lunge", 920))];
  const hp0 = combat.enemy.hp;
  playCard(combat, "lunge");
  check("daño bonus aplicado", combat.enemy.hp === hp0 - 10);
  check("veneno al golpear creado", combat.effects.some((e) => e.kind === "poison" && e.side === "enemy"));

  // Niveles pendientes tras victoria con XP (umbral nivel N+1 = xpForLevel(N+1))
  const run2 = createRun("elf", 78);
  run2.xp = 200;
  const goblin = getEnemy("goblin");
  finishCombat(run2, "hero", goblin, null);
  check("niveles pendientes calculados", run2.pendingLevels === 2 && run2.level === 3);
  drainHelper(run2);
  check("perks aplicados tras drenar", run2.pendingLevels === 0 && run2.perks.length === 2);
}

function drainHelper(run) {
  while (run.pendingLevels > 0) {
    const opts = perkOptions(run);
    if (!opts.length) {
      run.pendingLevels = 0;
      break;
    }
    applyPerk(run, opts[0].id);
    run.pendingLevels -= 1;
  }
}

function testForgeEquipped() {
  const run = createRun("warrior", 24);
  const swordInst = run.deck.find((i) => i.cardId === "sword_short");
  // El loadout referencia las instancias del deck (como tras un combate real)
  run.loadout = [swordInst];
  check("loadout es referencia del deck", run.loadout[0] === swordInst);

  // Mejorar en la fragua un equipo equipado se aplica en el siguiente combate
  swordInst.upgrade = 1;
  const combat = createCombat(run.heroDef, heroStatsForCombat(run), getEnemy("goblin"), run.deck.slice(), createRng(34), run.loadout);
  check("mejora en equipo equipado aplica en combate", combat.loadout.some((c) => c.id === "sword_short" && c.mods.damage === Math.ceil(3 * BALANCE.upgradeFactor)));

  // Fusionar un efecto en un equipo equipado activa el efecto al iniciar el combate
  addCardToRun(run, "blessing_war");
  const blessing = run.deck.find((i) => i.cardId === "blessing_war");
  swordInst.fusedEffectId = blessing.cardId;
  removeInstanceFromRun(run, blessing.uid);
  const combat2 = createCombat(run.heroDef, heroStatsForCombat(run), getEnemy("goblin"), run.deck.slice(), createRng(35), run.loadout);
  check("fusión en equipo equipado activa efecto al iniciar", combat2.effects.some((e) => e.kind === "bonusDamage" && e.side === "hero"));
  check("equipo equipado conserva mejora y fusión", combat2.loadout.some((c) => c.id === "sword_short" && c.upgrade && c.fused));
}

function testCurseStacking() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 };
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const run = createRun("warrior", 31);
  const c = createCombat(warrior, stats, guard, run.deck.slice(), createRng(50));
  const curseMeta = { name: "Maldición Eterna", icon: "🌑", duration: 2, actor: "enemy" };

  // Turno 1: el enemigo lanza Maldición Eterna durante su turno
  endTurn(c);
  resolveEnemyTurn(c);
  applyEffects(c, [{ kind: "fewerActions", value: 1 }], "enemy", { ...curseMeta });
  continueToHeroTurn(c);
  check("maldición 1: -1 acción", c.hero.actions === 2);
  check("maldición 1 en mesa con 2 rondas", (c.effects.find((e) => e.kind === "fewerActions") || {}).remaining === 2);

  // Turno 2: lanza la segunda maldición
  endTurn(c);
  resolveEnemyTurn(c);
  applyEffects(c, [{ kind: "fewerActions", value: 1 }], "enemy", { ...curseMeta });
  continueToHeroTurn(c);
  check("dos maldiciones se acumulan (-2 acciones)", c.hero.actions === 1);
  check("dos entradas de maldición activas", c.effects.filter((e) => e.kind === "fewerActions").length === 2);

  // La primera expira (2 rondas cumplidas), la segunda sigue su propio tiempo
  endTurn(c);
  resolveEnemyTurn(c);
  continueToHeroTurn(c);
  check("primera maldición expirada, queda -1", c.hero.actions === 2 && c.effects.filter((e) => e.kind === "fewerActions").length === 1);

  // La segunda expira
  endTurn(c);
  resolveEnemyTurn(c);
  continueToHeroTurn(c);
  check("ambas maldiciones expiradas", c.hero.actions === 3 && c.effects.length === 0);
}

function testEffectExhaust() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 };
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const run = createRun("warrior", 32);
  addCardToRun(run, "blessing_war");
  const blessingInst = run.deck[run.deck.length - 1];
  const combat = createCombat(warrior, stats, guard, run.deck.slice(), createRng(60));

  // Jugar la carta de efecto: se consume (no va al descarte)
  combat.deck.hand = combat.deck.hand.filter((c) => c.id !== "blessing_war");
  combat.deck.hand.push(resolveCard(blessingInst));
  check("juega carta de efecto", playCard(combat, "blessing_war").ok);
  check("efecto aplicado en mesa", combat.effects.some((e) => e.kind === "bonusDamage" && e.side === "hero"));
  check("carta consumida registrada", combat.exhaustedUids.includes(blessingInst.uid) && combat.scrappedUids.includes(blessingInst.uid));
  check("no va al descarte", !combat.deck.discard.some((c) => c.uid === blessingInst.uid));

  // Reciclar el descarte una y otra vez: la carta consumida no vuelve a aparecer
  let seen = 0;
  for (let i = 0; i < 40; i++) {
    endTurn(combat);
    if (combat.winner) break;
    continueToHeroTurn(combat);
    seen += combat.deck.hand.filter((c) => c.uid === blessingInst.uid).length;
  }
  check("un solo uso por combate (no se re-roba)", seen === 0 && combat.exhaustedUids.includes(blessingInst.uid));

  // Al terminar el combate se retira PERMANENTEMENTE del mazo de la run
  combat.winner = "hero";
  finishCombat(run, "hero", guard, combat);
  check("consumida: fuera del mazo de la run", !run.deck.some((i) => i.uid === blessingInst.uid));
  check("registrada entre las consumidas de la run", run.scrapped.includes("blessing_war"));

  // Solo vuelve si se consigue de nuevo (compra/tesoro/botín)
  addCardToRun(run, "blessing_war");
  const combat2 = createCombat(run.heroDef, heroStatsForCombat(run), guard, run.deck.slice(), createRng(61));
  check("vuelta a conseguir: disponible en combate", combat2.deck.hand.some((c) => c.uid === run.deck[run.deck.length - 1].uid) || combat2.deck.draw.some((c) => c.uid === run.deck[run.deck.length - 1].uid));
}

function testResourceConsumption() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 80, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 };
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const run = createRun("warrior", 33);
  const foodIdx = run.deck.findIndex((i) => i.cardId === "food");
  const foodInst = run.deck[foodIdx];
  const combat = createCombat(warrior, stats, guard, run.deck.slice(), createRng(70));

  combat.deck.hand = combat.deck.hand.filter((c) => c.id !== "food");
  combat.deck.hand.push(resolveCard(foodInst));
  const hp0 = combat.hero.hp;
  check("juega recurso", playCard(combat, "food").ok);
  check("recurso cura", combat.hero.hp === Math.min(combat.hero.maxHp, hp0 + 6));
  check("recurso consumido registrado", combat.exhaustedUids.includes(foodInst.uid) && combat.scrappedUids.includes(foodInst.uid));
  check("recurso no va al descarte", !combat.deck.discard.some((c) => c.uid === foodInst.uid));

  combat.winner = "hero";
  finishCombat(run, "hero", guard, combat);
  check("recurso consumido: fuera del mazo de la run", !run.deck.some((i) => i.uid === foodInst.uid));
  check("otro recurso sigue en el mazo", run.deck.some((i) => i.cardId === "water"));
}

function testGemsRunes() {
  // Las gemas/runas son SOLO material: no jugables, sí fusionables, presentes en pools
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 };
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const run = createRun("warrior", 34);
  addCardToRun(run, "gema_fuego");
  const gemInst = run.deck[run.deck.length - 1];
  const combat = createCombat(warrior, stats, guard, run.deck.slice(), createRng(80));
  combat.deck.hand = combat.deck.hand.filter((c) => c.id !== "gema_fuego");
  combat.deck.hand.push(resolveCard(gemInst));
  const res = playCard(combat, "gema_fuego");
  check("gema NO jugable en combate", !res.ok && res.reason.includes("material de fusión"));
  check("gema sigue en la mano", combat.deck.hand.some((c) => c.uid === gemInst.uid));
  check("gema no consumida", !combat.exhaustedUids.includes(gemInst.uid) && !combat.scrappedUids.includes(gemInst.uid));

  // Fusionar una gema a un equipo (vía forgeFuse: equipo + efecto)
  const sword = run.deck.find((i) => i.cardId === "sword_short");
  sword.fusedEffectId = gemInst.cardId;
  removeInstanceFromRun(run, gemInst.uid);
  const fused = resolveCard(sword);
  check("gema fusionable en equipo", fused.fused && fused.fused.id === "gema_fuego");
  check("gema retirada del mazo al fusionar", !run.deck.some((i) => i.uid === gemInst.uid));
  run.loadout = [sword]; // el equipo fusionado está en la mesa

  const combat2 = createCombat(warrior, heroStatsForCombat(run), guard, run.deck.slice(), createRng(81), run.loadout);
  check("gema fusionada genera efecto en combate", combat2.effects.some((e) => e.kind === "bonusDamage" && e.side === "hero"));
  check("gema fusionada es permanente (sin rondas)", (combat2.effects.find((e) => e.kind === "bonusDamage") || {}).remaining === null);

  // El efecto permanente no expira con las rondas
  endTurn(combat2); resolveEnemyTurn(combat2); continueToHeroTurn(combat2);
  endTurn(combat2); resolveEnemyTurn(combat2); continueToHeroTurn(combat2);
  endTurn(combat2); resolveEnemyTurn(combat2); continueToHeroTurn(combat2);
  check("el efecto de la gema sigue activo tras 3 rondas", combat2.effects.some((e) => e.kind === "bonusDamage" && e.side === "hero"));
  check("sigue en la mesa tras 3 rondas", combat2.loadout.some((c) => c.id === "sword_short" && c.fused));

  const pools = Object.values(DROP_POOLS).flat();
  for (const id of ["gema_fuego", "gema_hielo", "gema_vida", "runa_guarda", "runa_poder", "runa_terror"]) {
    check(`gema/runa en pools: ${id}`, pools.includes(id));
  }
}

function testAscension() {
  const run = createRun("warrior", 90);
  check("ascensión inicial 0", run.ascension === 0);

  // Escalado de enemigos por ascensión
  const base = getEnemy("goblin");
  const asc1 = getEnemy("goblin", 1);
  const asc2 = getEnemy("goblin", 2);
  check("ascensión 1 escala al enemigo", asc1.hp > base.hp);
  check("ascensión 2 escala más que la 1", asc2.hp > asc1.hp);
  const dmgBase = base.moves[0].effects.find((e) => e.kind === "damage")?.value ?? 0;
  const dmgAsc = asc1.moves[0].effects.find((e) => e.kind === "damage")?.value ?? 0;
  check("daño de movimientos escalado", dmgAsc >= dmgBase);

  // Progresión simulada y continuación NG+
  run.ascension = 0;
  run.level = 4;
  run.maxHp = 150;
  run.hp = 88;
  run.coins = 123;
  run.xp = 320;
  run.str = 9;
  run.perks = ["perk_vigor", "perk_insight"];
  run.drawBonus = 1;
  addCardToRun(run, "reaper_scythe");
  addCardToRun(run, "quick_cut");
  const deckSize = run.deck.length;
  const nextUid = run.nextUid;

  const ng = continueRunAscension(run);
  check("ascensión incrementada", ng.ascension === 1);
  check("mazo conservado (mismas instancias)", ng.deck === run.deck && ng.deck.length === deckSize);
  check("nivel/xp/monedas conservados", ng.level === 4 && ng.xp === 320 && ng.coins === 123);
  check("perks conservados", ng.perks.length === 2 && ng.drawBonus === 1);
  check("fuerza conservada", ng.str === 9);
  check("se cura al empezar la nueva senda", ng.hp === ng.maxHp && ng.maxHp === 150);
  check("uid continúa sin colisiones", ng.nextUid === nextUid);
  check("nueva senda lista", ng.depth === 0 && ng.finished === false && Array.isArray(ng.options) && ng.options.length > 0);
  const enemy = enemyForTier(1, ng.rng, ng.ascension);
  check("enemigo de NG+ escalado", enemy.hp > getEnemy("goblin").hp);

  // Cartas nuevas presentes en los pools
  const pools = Object.values(DROP_POOLS).flat();
  for (const id of ["quick_cut", "shield_wall", "fierce_charge", "cat_reflex", "web_shot", "sun_bless", "growing_fury", "purge_potion", "stigma", "blast_charge", "gauntlets_iron", "ring_might", "boots_swift", "mage_cloak", "plate_h", "reaper_scythe"]) {
    check(`carta nueva en pools: ${id}`, pools.includes(id));
  }
}

function testStatusEffectsOnTable() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 };
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const run = createRun("warrior", 30);
  const combat = createCombat(warrior, stats, guard, run.deck.slice(), createRng(45));

  // Marca del cazador: vulnerable como efecto con carta en mesa
  combat.deck.hand = [
    resolveCard(makeInstance("hunter_mark", 930)),
    resolveCard(makeInstance("lunge", 931)),
  ];
  playCard(combat, "hunter_mark");
  const vuln = combat.effects.find((e) => e.kind === "vulnerable" && e.side === "enemy");
  check("vulnerable es efecto en lado enemigo", !!vuln && vuln.remaining === 2);
  const hp0 = combat.enemy.hp;
  playCard(combat, "lunge");
  check("vulnerable multiplica daño x1.5", combat.enemy.hp === hp0 - Math.floor(9 * 1.5));

  // Grito de guerra: fuerza como efecto permanente del combate (combate fresco: 3 acciones)
  const combat2 = createCombat(warrior, stats, guard, run.deck.slice(), createRng(46));
  combat2.deck.hand = [resolveCard(makeInstance("war_cry", 934)), resolveCard(makeInstance("lunge", 935))];
  playCard(combat2, "war_cry");
  const str = combat2.effects.find((e) => e.kind === "strength" && e.side === "hero");
  check("fuerza es efecto permanente en lado héroe", !!str && str.remaining === null);
  const hp1 = combat2.enemy.hp;
  playCard(combat2, "lunge");
  check("fuerza suma al daño", combat2.enemy.hp === hp1 - 11);

  // La mesa muestra las cartas de efecto activas con sus rondas
  const mesaHero = tableEffectsHTML(combat2.effects, "hero");
  const mesaEnemy = tableEffectsHTML(combat.effects, "enemy");
  check("mesa muestra Marca del Cazador", mesaEnemy.includes("Marca del Cazador") && mesaEnemy.includes("2"));
  check("mesa muestra Grito de Guerra", mesaHero.includes("Grito de Guerra") && mesaHero.includes("∞"));
  check("tooltips en las cartas de la mesa", mesaEnemy.includes("data-tip") && mesaHero.includes("data-tip"));
}

function testSimulations() {
  for (const heroId of Object.keys(CHARACTERS)) {
    for (const seed of [1, 2, 3, 17, 99]) {
      const sim = simulateRun(heroId, seed);
      check(`${heroId}#${seed} termina`, sim.result === "victory" || sim.result === "defeat");
      check(`${heroId}#${seed} hp válido`, sim.payload.hp >= 0);
      check(`${heroId}#${seed} uids únicos`, new Set(sim.run.deck.map((i) => i.uid)).size === sim.run.deck.length);
      check(`${heroId}#${seed} loadout son referencias del deck`, sim.run.loadout.every((l) => sim.run.deck.some((i) => i === l)));
    }
  }
}

function testCurses() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 };
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const run = createRun("warrior", 201);
  addCardToRun(run, "curse_deadweight");
  const curse = run.deck[run.deck.length - 1];
  const combat = createCombat(warrior, stats, guard, run.deck.slice(), createRng(201));
  combat.deck.hand = [resolveCard(curse)];
  const res = playCard(combat, "curse_deadweight");
  check("maldición no jugable", !res.ok && res.reason.includes("Maldición"));

  // El enemigo encola una maldición y se añade al mazo al ganar
  const run2 = createRun("warrior", 202);
  const combat2 = createCombat(warrior, stats, guard, run2.deck.slice(), createRng(202));
  applyEffects(combat2, [{ kind: "addCurse", cardId: "curse_lich_whisper", value: 1 }], "enemy", { name: "Prueba" });
  check("maldición encolada", combat2.pendingCurseIds.length === 1);
  combat2.winner = "hero";
  finishCombat(run2, "hero", guard, combat2);
  check("maldición persistente en el mazo", run2.deck.some((i) => i.cardId === "curse_lich_whisper"));
  check("cola de maldición consumida", combat2.pendingCurseIds.length === 0);

  // onDraw: Herida Abierta daña al robarla
  const run3 = createRun("warrior", 203);
  addCardToRun(run3, "curse_open_wound");
  const wound = run3.deck[run3.deck.length - 1];
  const combat3 = createCombat(warrior, stats, guard, run3.deck.slice(), createRng(203));
  combat3.deck.draw = [resolveCard(wound)];
  combat3.deck.hand = [];
  const hp0 = combat3.hero.hp;
  drawCards(combat3, 1);
  check("malidción onDraw daña", combat3.hero.hp === hp0 - 2);

  // La tienda no compra maldiciones; el hechicero las elimina
  const sold = sell(run, curse.uid);
  check("no se venden maldiciones", !sold.ok && sold.reason.includes("hechicero"));
  const run4 = createRun("warrior", 204);
  addCardToRun(run4, "curse_deadweight");
  run4.coins = 100;
  const c4 = run4.deck[run4.deck.length - 1];
  const removed = removeCurseAtShop(run4, c4.uid);
  check("hechicero elimina maldición", removed.ok && !run4.deck.some((i) => i.uid === c4.uid));
  check("hechicero cobra monedas", run4.coins === 100 - BALANCE.curseRemovalCost);
}

function testRelics() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 };
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const run = createRun("warrior", 210);
  addCardToRun(run, "relic_troll_heart");
  addCardToRun(run, "relic_obsidian_bastion");
  const troll = run.deck.find((i) => i.cardId === "relic_troll_heart");
  const bastion = run.deck.find((i) => i.cardId === "relic_obsidian_bastion");
  check("reliquias son equipo con slot propio", getCard("relic_troll_heart").subtype === "relic" && getCard("relic_troll_heart").slot === "relic");

  const combat = createCombat(warrior, stats, guard, run.deck.slice(), createRng(210), [troll]);
  check("reliquia en la mesa", combat.loadout.some((c) => c.id === "relic_troll_heart"));
  check("beneficio de reliquia", combat.effects.some((e) => e.kind === "regen" && e.side === "hero"));
  check("maldición de reliquia", combat.effects.some((e) => e.kind === "weaken" && e.side === "hero"));

  combat.deck.hand = [resolveCard(bastion)];
  check("segunda reliquia se equipa", playCard(combat, "relic_obsidian_bastion").ok);
  check("solo una reliquia activa", combat.loadout.filter((c) => c.subtype === "relic").length === 1);
  check("efectos de la reliquia anterior se retiran", !combat.effects.some((e) => e.kind === "regen" && e.side === "hero"));
  check("bloqueo inicial de reliquia", combat.hero.block === 4);
  check("maldición de acciones de reliquia", combat.effects.some((e) => e.kind === "fewerActions" && e.side === "hero"));

  const pools = Object.values(DROP_POOLS).flat();
  for (const id of ["relic_troll_heart", "relic_lich_eye", "relic_obsidian_bastion", "relic_moon_chalice", "relic_thorn_crown", "relic_ashen_gauntlet"]) {
    check(`reliquia en pools: ${id}`, pools.includes(id));
  }
}

function testMarks() {
  const warrior = getCharacter("warrior");
  const stats = { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 6 };
  const troll = getEnemy("trol");
  const run = createRun("warrior", 220);
  addCardToRun(run, "bleed_cut");
  addCardToRun(run, "sunder");
  const bleed = run.deck[run.deck.length - 2];
  const fracture = run.deck[run.deck.length - 1];
  const combat = createCombat(warrior, stats, troll, run.deck.slice(), createRng(220));
  combat.deck.hand = [resolveCard(bleed), resolveCard(fracture)];
  const hp0 = combat.enemy.hp;
  check("carta aplica sangrado", playCard(combat, "bleed_cut").ok && combat.marks.enemy.some((m) => m.kind === "bleed"));
  check("carta aplica fractura", playCard(combat, "sunder").ok);
  check("reacción hemorragia", combat.enemy.hp < hp0 - 20);
  check("marcas consumidas por la reacción", combat.marks.enemy.length === 0);

  // Veneno + viento: nube tóxica
  const elf = getCharacter("elf");
  const run2 = createRun("elf", 221);
  addCardToRun(run2, "poison_vial");
  addCardToRun(run2, "gale_arrow");
  const poison = run2.deck[run2.deck.length - 2];
  const wind = run2.deck[run2.deck.length - 1];
  const c2 = createCombat(elf, { ...stats, energyPerRound: 2 }, troll, run2.deck.slice(), createRng(221));
  c2.deck.hand = [resolveCard(poison), resolveCard(wind)];
  const hp1 = c2.enemy.hp;
  playCard(c2, "poison_vial");
  check("veneno activo", c2.effects.some((e) => e.kind === "poison" && e.side === "enemy"));
  playCard(c2, "gale_arrow");
  check("reacción nube tóxica consume viento", !c2.marks.enemy.some((m) => m.kind === "wind"));
  check("reacción nube tóxica daña y refresca veneno", c2.enemy.hp < hp1 - 8 && c2.effects.some((e) => e.kind === "poison" && e.side === "enemy"));

  // Escarcha + rayo: sobrecarga aturde
  const sorceress = getCharacter("sorceress");
  const run3 = createRun("sorceress", 222);
  addCardToRun(run3, "frost_bolt");
  addCardToRun(run3, "static_arc");
  const frost = run3.deck[run3.deck.length - 2];
  const shock = run3.deck[run3.deck.length - 1];
  const c3 = createCombat(sorceress, { ...stats, energyPerRound: 4, actionsPerRound: 4 }, troll, run3.deck.slice(), createRng(222));
  c3.deck.hand = [resolveCard(frost), resolveCard(shock)];
  c3.hero.energy = 4;
  playCard(c3, "frost_bolt");
  playCard(c3, "static_arc");
  check("reacción sobrecarga aturde", c3.enemy.stunned === true);

  // Duración y tabla de reacciones
  const c4 = createCombat(warrior, stats, troll, [], createRng(223));
  applyMarks(c4, [{ kind: "burn", value: 1, duration: 1 }], "hero");
  check("marca aplicada", c4.marks.enemy.length === 1);
  expireMarks(c4, "enemy");
  check("marca expira", c4.marks.enemy.length === 0);
  for (const reaction of REACTIONS) {
    check(`reacción ${reaction.id} usa marcas válidas`, !!MARK_META[reaction.a] && !!MARK_META[reaction.b]);
  }
}

function testChallenges() {
  let offers = 0;
  for (let seed = 1; seed <= 120; seed++) {
    const run = createRun("warrior", seed);
    run.depth = 2;
    run.options = rollOptions(run);
    if (run.options.some((o) => o.type === "challenge")) offers++;
  }
  check("los desafíos aparecen con probabilidad", offers > 0 && offers < 120);
  const bossRun = createRun("warrior", 5);
  bossRun.depth = 5;
  bossRun.options = rollOptions(bossRun);
  check("sin desafío en pasos de jefe", !bossRun.options.some((o) => o.type === "challenge"));
  check("hay 12 plantillas de desafío", CHALLENGE_TEMPLATES.length === 12);

  const challenge = rollChallenge(createRng(230), { depth: 2 });
  check("desafío con historia", challenge && challenge.intro.length >= 2 && challenge.outcomes.win && challenge.outcomes.loss);
  check("puzzle resuelve respuesta correcta", puzzleSolved({ mode: "single", answer: "a" }, "a"));
  check("puzzle rechaza respuesta incorrecta", !puzzleSolved({ mode: "single", answer: "a" }, "b"));
  check("puzzle de pareja", puzzleSolved({ mode: "pair", answer: ["a", "b"] }, ["b", "a"]));
  check("puzzle de secuencia", puzzleSolved({ mode: "sequence", answer: ["a", "b"] }, ["a", "b"]));

  // Recompensas y penalizaciones
  const run = createRun("warrior", 231);
  run.coins = 50;
  run.hp = 40;
  const deck0 = run.deck.length;
  applyChallengeReward(run, { coins: 10, xp: 10, cardTier: "common", relic: "relic_troll_heart", heal: 5, maxHp: 2 });
  check("recompensa suma monedas", run.coins === 60);
  check("recompensa añade cartas/reliquia", run.deck.length === deck0 + 2);
  check("recompensa cura y sube vida máxima", run.hp > 40 && run.maxHp === run.heroDef.base.hp + 2);
  applyChallengePenalty(run, { damage: 5, coins: 10, curseId: "curse_deadweight" });
  check("penalización daña y cobra", run.hp === 42 && run.coins === 50);
  check("penalización añade maldición", run.deck.some((i) => i.cardId === "curse_deadweight"));

  // Balance visible de un desafío
  const snap = snapshotChallengeState(run);
  run.coins += 7;
  run.xp += 10;
  run.hp -= 3;
  run.maxHp += 2;
  run.morality.honor += 1;
  const gained = addCardToRun(run, "ring_might");
  const lost = run.deck.find((i) => i.cardId === "food");
  removeInstanceFromRun(run, lost.uid);
  const upgraded = run.deck.find((i) => i.cardId === "sword_short");
  upgraded.upgrade = 1;
  const diff = diffChallengeState(run, snap);
  check("balance de desafío suma monedas/XP/vida", diff.coins === 7 && diff.xp === 10 && diff.hp === -3 && diff.maxHp === 2);
  check("balance de desafío registra moralidad", diff.morality.honor === 1);
  check("balance de desafío registra cartas ganadas", diff.gained.length === 1 && diff.gained[0].cardId === "ring_might" && gained.cardId === "ring_might");
  check("balance de desafío registra cartas perdidas", diff.lost.length === 1 && diff.lost[0].cardId === "food");
  check("balance de desafío registra mejoras", diff.upgraded.length === 1 && diff.upgraded[0].cardId === "sword_short");
  check("balance de desafío sin instantánea", diffChallengeState(run, null) === null);

  const tide = CHALLENGE_TEMPLATES.find((t) => t.id === "deck_tide");
  const tideSave = tide.moral.options.find((o) => o.id === "save");
  check("el amuleto narrado se entrega como carta", tideSave.reward.cardId === "amulet_arcane");

  const run2 = createRun("warrior", 232);
  run2.options = [{ type: "challenge", id: "x" }, { type: "combat", tier: 1 }];
  const depth0 = run2.depth;
  consumeChallenge(run2);
  check("desafío no avanza profundidad", run2.depth === depth0);
  check("desafío consumido de la senda", !run2.options.some((o) => o.type === "challenge"));
  check("desafío contabilizado", run2.challengesSeen === 1);

  const run3 = createRun("warrior", 233);
  run3.options = [{ type: "challenge", id: "x" }, { type: "combat", tier: 1 }];
  const depth3 = run3.depth;
  rejectChallenge(run3);
  check("rechazar desafío no avanza", run3.depth === depth3);
  check("rechazar desafío lo consume", !run3.options.some((o) => o.type === "challenge"));
  check("rechazar desafío no cuenta como completado", run3.challengesSeen === 0);

  // El autoplay resuelve un desafío sin avanzar profundidad
  const simRun = createRun("warrior", 234);
  simRun.depth = 2;
  simRun.options = [{ type: "challenge", id: "puzzle_test" }, { type: "combat", tier: 2 }];
  const node = {
    id: "puzzle_test",
    kind: "puzzle",
    trial: { type: "puzzle", template: "riddle" },
    outcomes: { triumph: { text: "ok", reward: { coins: 5 } }, win: { text: "ok", reward: {} }, loss: { text: "no", penalty: { damage: 2 } } },
    moral: null,
  };
  const depthBefore = simRun.depth;
  simulateChallenge(simRun, node);
  check("autoplay resuelve desafío sin avanzar", simRun.depth === depthBefore && !simRun.options.some((o) => o.type === "challenge"));

  // Resultado de combate
  const guard = dummyEnemy([{ id: "guard", name: "Guardia", icon: "🛡️", weight: 1, effects: [{ kind: "block", value: 5 }] }]);
  const c = createCombat(getCharacter("warrior"), { hp: 100, maxHp: 100, str: 7, energyPerRound: 0, actionsPerRound: 3 }, guard, [], createRng(233));
  c.winner = "hero";
  c.hero.hp = 80;
  check("resultado triunfo", evaluateCombatOutcome(c, { trial: {} }) === "triumph");
  c.hero.hp = 20;
  check("resultado victoria ajustada", evaluateCombatOutcome(c, { trial: {} }) === "win");
  c.winner = "enemy";
  check("resultado derrota", evaluateCombatOutcome(c, { trial: {} }) === "loss");
}

function testShopServices() {
  const run = createRun("warrior", 240);
  run.coins = 100;
  run.hp = 10;
  const services = rollShopServices(run, true);
  check("servicios aleatorios con flags", typeof services.hechicero === "boolean" && typeof services.curandero === "boolean");
  const prices = healerPrices(run);
  check("precio venda proporcional", prices.smallCost === Math.ceil(prices.smallAmount * BALANCE.healerCostPerHp) && prices.fullCost === Math.ceil(prices.missing * BALANCE.fullHealCostPerHp));
  const heal = healAtShop(run, "small");
  check("curandero cura vida", heal.ok && run.hp > 10 && run.coins === 100 - prices.smallCost);
  const full = healAtShop(run, "full");
  check("sin monedas no hay cura completa", !full.ok && full.reason === "Monedas insuficientes");
  run.coins = 100;
  const p2 = healerPrices(run);
  const full2 = healAtShop(run, "full");
  check("cura completa", full2.ok && run.hp === run.maxHp && run.coins === 100 - p2.fullCost);
}

function testDuelCoop() {
  const duel = createDuel("coop", ["warrior", "elf"], getEnemy("goblin"), createRng(250));
  const warrior = duel.players[0];
  const elf = duel.players[1];
  const allCards = warrior.deck.draw.concat(warrior.deck.hand).map((c) => c.id);
  check("cartas de clase en mazo de duelo", allCards.includes("bleed_cut") && allCards.includes("taunt_war"));
  check("cartas de clase no están en el mazo inicial de 1P", !getCharacter("warrior").startingDeck.includes("taunt_war"));

  warrior.threat = 10;
  elf.threat = 20;
  check("enemigo apunta a más amenaza", chooseEnemyTarget(duel) === elf);
  warrior.guard = 5;
  check("guardia redirige el objetivo", chooseEnemyTarget(duel) === warrior);
  warrior.guard = 0;
  elf.forcedTarget = true;
  check("provocar fuerza el objetivo", chooseEnemyTarget(duel) === elf);

  // Provocar y guardia se resuelven como cartas
  warrior.deck.hand = [resolveCard(makeInstance("taunt_war", 950)), resolveCard(makeInstance("clan_guard", 951))];
  warrior.actions = 4;
  check("provocar se juega", playDuelCard(duel, "taunt_war").ok && warrior.forcedTarget);
  check("guardia se juega", playDuelCard(duel, "clan_guard").ok && warrior.guard > 0);

  // Caído y rescate
  elf.hp = 0;
  elf.downed = true;
  warrior.deck.hand = [resolveCard(makeInstance("elf_rescue", 952))];
  warrior.actions = 4;
  const res = playDuelCard(duel, "elf_rescue");
  check("rescate se juega", res.ok);
  check("aliado caído revive", !elf.downed && elf.hp === 5);

  // Marcas y reacción en duelo
  const duel2 = createDuel("coop", ["warrior", "elf"], getEnemy("trol"), createRng(251));
  const enemy = duel2.enemy;
  const hp0 = enemy.hp;
  applyDuelMarks(duel2, duel2.players[0], [{ kind: "bleed", value: 1, duration: 2 }]);
  applyDuelMarks(duel2, duel2.players[0], [{ kind: "fracture", value: 1, duration: 2 }]);
  check("reacción elemental en duelo", enemy.hp < hp0 - 10);
  check("marcas consumidas en duelo", enemy.marks.length === 0);
}

function main() {
  console.log("Ejecutando batería de humo de Senda de Héroes...");
  testEquipRules();
  testRingAndAmulet();
  testSaveLoad();
  testHandSwap();
  testDeckCycle();
  testShop();
  testForge();
  testInstances();
  testEffects();
  testFusedAndScrap();
  testIntentAndReactions();
  testPerks();
  testForgeEquipped();
  testCurseStacking();
  testEffectExhaust();
  testResourceConsumption();
  testBuffExhaust();
  testGemsRunes();
  testAscension();
  testStatusEffectsOnTable();
  testCurses();
  testRelics();
  testMarks();
  testChallenges();
  testShopServices();
  testDuelCoop();
  testSimulations();
  console.log(`\nResultado: ${passed} comprobaciones OK, ${failed} fallos.`);
  if (failed > 0) process.exit(1);
}

main();
