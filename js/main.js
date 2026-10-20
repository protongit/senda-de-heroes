import { menu } from "./screens/menu.js";
import { select } from "./screens/select.js";
import { senda } from "./screens/senda.js";
import { battle } from "./screens/battle.js";
import { reward } from "./screens/reward.js";
import { shop } from "./screens/shop.js";
import { forge } from "./screens/forge.js";
import { perk } from "./screens/perk.js";
import { deck } from "./screens/deck.js";
import { gameover } from "./screens/gameover.js";
import { duelsetup } from "./screens/duelsetup.js";
import { duelbattle } from "./screens/duelbattle.js";
import { challenge } from "./screens/challenge.js";

import { createCombat, playCard as enginePlayCard, endTurn as engineEndTurn, playReaction as enginePlayReaction, resolveEnemyTurn as engineResolveEnemyTurn, continueToHeroTurn as engineContinueToHeroTurn, enemyIntent, reactionMatches } from "./engine.js";
import {
  createRun,
  enemyForTier,
  heroStatsForCombat,
  finishCombat,
  grantTreasure,
  healAfterTreasure,
  advanceDepth,
  rotateMarket,
  continueRunAscension,
  rollShopServices,
  healAtShop,
  removeCurseAtShop,
  consumeChallenge,
  rejectChallenge as rejectChallengeFromRun,
  applyChallengeReward,
  applyChallengePenalty,
  snapshotChallengeState,
  addMorality,
  tierForDepth,
} from "./run.js";
import { removeInstanceFromRun } from "./run.js";
import { buy as shopBuy, sell as shopSell } from "./shop.js";
import { getCard, resolveCard } from "./cards.js";
import { BALANCE } from "./balance-config.js";
import { perkOptions, applyPerk } from "./perks.js";
import { simulateRun } from "./simulate.js";
import { CHARACTERS } from "./characters.js";
import { getEnemy } from "./enemies.js";
import { createRng } from "./rng.js";
import { saveRun, loadRun } from "./save.js";
import { initTooltips } from "./tooltip.js";
import { createDuel, playDuelCard, endDuelTurn } from "./duel.js";
import { evaluateCombatOutcome, puzzleSolved } from "./challenges.js";
import { koCombatant, prefersReducedMotion } from "./fx.js";

const VIEWS = { menu, select, senda, battle, reward, shop, forge, perk, deck, gameover, duelsetup, duelbattle, challenge };

let lastRenderedView = null;

const G = {
  run: null,
  combat: null,
  enemyDef: null,
  rewards: null,
  stock: [],
  toast: null,
  autoplay: false,
  logHidden: false,
  duel: null,
  duelSetup: null,
  challenge: null,
  challengePhase: null,
  challengeResult: null,
  challengeChoice: null,
  challengeMoralChoice: null,
  challengeOutcomeText: "",
  challengeStart: null,
  currentView: "menu",
  currentPayload: {},
  combatEnding: false,
};

function go(view, payload) {
  if (view !== "battle" && G.enemyTimer) {
    clearInterval(G.enemyTimer);
    G.enemyTimer = null;
  }
  G.currentView = view;
  G.currentPayload = payload || {};
  const ctx = {
    G,
    payload: G.currentPayload,
    go,
    startRun,
    continueSavedGame,
    saveGame,
    chooseOption,
    playCard,
    endTurn,
    playReaction,
    resolveReaction,
    continueEnemyTurn,
    continueAfterReward,
    buy,
    sell,
    leaveShop,
    forgeImprove,
    forgeSelect,
    forgeFuse,
    leaveForge,
    pickPerk,
    continueAscension,
    beginChallenge,
    answerPuzzle,
    chooseChallengeChoice,
    chooseChallengeMoral,
    continueChallenge,
    rejectChallenge,
    shopHeal,
    shopExorcise,
    toggleLog,
    startDuel,
    toggleDuelHero,
    setDuelEnemy,
    duelPlay,
    duelEnd,
  };
  const definition = VIEWS[view];
  if (!definition) throw new Error(`Vista desconocida: ${view}`);
  const app = document.getElementById("app");
  const viewChanged = lastRenderedView !== view;
  try {
    const { html, bind } = definition(ctx);
    app.innerHTML = html;
    const root = app.firstElementChild;
    if (root) root.classList.toggle("screen-enter", viewChanged);
    if (bind) bind(app);
    lastRenderedView = view;
  } catch (err) {
    app.innerHTML = `<section class="screen screen-enter"><h2>Error en la vista "${view}"</h2><pre style="white-space:pre-wrap;color:#f0a0a0">${String(err && err.stack ? err.stack : err)}</pre></section>`;
    console.error(err);
  }
  if (viewChanged) window.scrollTo(0, 0);
}

function toggleLog() {
  G.logHidden = !G.logHidden;
  go(G.currentView, G.currentPayload);
}

function startRun(heroId, seed) {
  const s = seed ?? (Date.now() & 0xffffffff);
  G.run = createRun(heroId, s);
  G.combat = null;
  G.rewards = null;
  G.challenge = null;
  G.challengePhase = null;
  G.challengeResult = null;
  G.challengeChoice = null;
  G.challengeMoralChoice = null;
  G.challengeOutcomeText = "";
  G.challengeStart = null;
  G.logHidden = false;
  go("senda");
}

function continueSavedGame() {
  const run = loadRun();
  if (!run) {
    G.toast = "No hay una partida guardada válida.";
    go("menu");
    return;
  }
  G.run = run;
  G.combat = null;
  G.enemyDef = null;
  G.rewards = null;
  G.challenge = null;
  G.challengePhase = null;
  G.challengeResult = null;
  G.challengeChoice = null;
  G.challengeMoralChoice = null;
  G.challengeOutcomeText = "";
  G.challengeStart = null;
  G.forgeSel = null;
  G.pendingAdvance = false;
  G.logHidden = false;
  G.toast = "Partida cargada.";
  go("senda");
}

function saveGame() {
  const res = saveRun(G.run);
  G.toast = res.ok ? "Partida guardada en este navegador." : res.reason;
  go(G.currentView, G.currentPayload);
}

function chooseOption(index) {
  const node = G.run.options[index];
  if (!node) return;
  if (node.type === "challenge") {
    startChallenge(node);
  } else if (node.type === "combat") {
    const enemy = enemyForTier(node.tier, G.run.rng, G.run.ascension);
    G.enemyDef = enemy;
    G.combat = createCombat(G.run.heroDef, heroStatsForCombat(G.run), enemy, G.run.deck.slice(), G.run.rng, G.run.loadout);
    G.logHidden = false;
    go("battle");
  } else if (node.type === "shop") {
    G.forgeSel = null;
    rotateMarket(G.run);
    rollShopServices(G.run, true);
    go("shop");
  } else if (node.type === "forge") {
    G.forgeSel = null;
    go("forge");
  } else if (node.type === "treasure") {
    const t = grantTreasure(G.run);
    healAfterTreasure(G.run);
    G.rewards = { treasure: true, coins: t.coins, cardId: t.cardId, needsAdvance: true };
    go("reward");
  }
}

function startChallenge(node) {
  G.challenge = node;
  G.challengeStart = snapshotChallengeState(G.run);
  G.challengePhase = "intro";
  G.challengeResult = null;
  G.challengeChoice = null;
  G.challengeMoralChoice = null;
  G.challengeOutcomeText = "";
  go("challenge");
}

function beginChallenge() {
  const node = G.challenge;
  if (!node) return;
  if (node.moral && node.moral.phase === "before" && G.challengePhase === "intro") {
    G.challengePhase = "moral";
    go("challenge");
    return;
  }
  startChallengeTrial();
}

function startChallengeTrial() {
  const node = G.challenge;
  if (!node) return;
  if (node.trial.type === "puzzle") {
    G.challengePhase = "puzzle";
    go("challenge");
    return;
  }
  if (node.trial.type === "choice") {
    G.challengePhase = "choice";
    go("challenge");
    return;
  }
  const tier = Math.min(5, tierForDepth(G.run.depth) + (node.trial.tierOffset || 1));
  const enemy = enemyForTier(tier, G.run.rng, G.run.ascension);
  G.enemyDef = enemy;
  G.combat = createCombat(G.run.heroDef, heroStatsForCombat(G.run), enemy, G.run.deck.slice(), G.run.rng, G.run.loadout, {
    restrictions: node.trial.restrictions || null,
    challenge: node,
  });
  G.logHidden = false;
  go("battle");
}

function moralSuffix() {
  return G.challengeMoralChoice?.outcome ? `\n\n${G.challengeMoralChoice.outcome}` : "";
}

function answerPuzzle(answer) {
  const node = G.challenge;
  if (!node || !node.puzzle) return;
  const solved = puzzleSolved(node.puzzle, answer);
  if (solved) {
    G.challengeResult = "triumph";
    applyChallengeReward(G.run, node.outcomes.triumph?.reward || {});
    if (node.moral && node.moral.phase === "after") {
      G.challengePhase = "moral";
      go("challenge");
      return;
    }
    G.challengePhase = "outcome";
    G.challengeOutcomeText = (node.outcomes.triumph?.text || "") + moralSuffix();
    go("challenge");
  } else {
    G.challengeResult = "loss";
    applyChallengePenalty(G.run, node.outcomes.loss?.penalty || {});
    G.challengePhase = "outcome";
    G.challengeOutcomeText = (node.outcomes.loss?.text || "") + moralSuffix();
    go("challenge");
  }
}

function sacrificeRandomCard() {
  const candidates = G.run.deck.filter((inst) => getCard(inst.cardId).type !== "curse");
  if (!candidates.length) return null;
  const inst = G.run.rng.pick(candidates);
  const card = getCard(inst.cardId);
  removeInstanceFromRun(G.run, inst.uid);
  return card.name;
}

function chooseChallengeChoice(choiceId) {
  const node = G.challenge;
  const choice = node?.trial?.choices?.find((c) => c.id === choiceId);
  if (!choice) return;
  G.challengeChoice = choice;
  G.challengeResult = "win";
  if (choice.morality) addMorality(G.run, choice.morality);
  if (choice.needsCardSacrifice) {
    const sacrificed = sacrificeRandomCard();
    if (sacrificed) choice.outcome = `${choice.outcome || ""} (Sacrificaste ${sacrificed}.)`.trim();
  }
  applyChallengeReward(G.run, choice.reward || {});
  applyChallengePenalty(G.run, choice.penalty || {});
  G.challengePhase = "outcome";
  G.challengeOutcomeText = choice.outcome || "";
  go("challenge");
}

function chooseChallengeMoral(choiceId) {
  const node = G.challenge;
  const choice = node?.moral?.options?.find((c) => c.id === choiceId);
  if (!choice) return;
  G.challengeMoralChoice = choice;
  if (choice.morality) addMorality(G.run, choice.morality);
  applyChallengeReward(G.run, choice.reward || {});
  applyChallengePenalty(G.run, choice.penalty || {});
  if (node.moral.phase === "before") {
    if (G.run.finished) {
      G.challengePhase = "outcome";
      G.challengeOutcomeText = choice.outcome || "";
      go("challenge");
      return;
    }
    startChallengeTrial();
    return;
  }
  const base = node.outcomes[G.challengeResult]?.text || "";
  G.challengePhase = "outcome";
  G.challengeOutcomeText = `${base}\n\n${choice.outcome || ""}`.trim();
  go("challenge");
}

function rejectChallenge() {
  if (!G.challenge) {
    go("senda");
    return;
  }
  rejectChallengeFromRun(G.run);
  G.challenge = null;
  G.combat = null;
  G.challengePhase = null;
  G.challengeResult = null;
  G.challengeChoice = null;
  G.challengeMoralChoice = null;
  G.challengeOutcomeText = "";
  G.challengeStart = null;
  G.toast = "Has rechazado el desafío.";
  go("senda");
}

function continueChallenge() {
  const node = G.challenge;
  if (!node) {
    go("senda");
    return;
  }
  G.run.chronicle = G.run.chronicle || [];
  G.run.chronicle.push({
    id: node.id,
    title: node.title,
    result: G.challengeResult,
    choice: G.challengeChoice?.label || G.challengeMoralChoice?.label || null,
    text: G.challengeOutcomeText,
  });
  consumeChallenge(G.run);
  const finished = G.run.finished;
  const payload = finished ? { win: false, challenge: node } : null;
  G.challenge = null;
  G.combat = null;
  G.challengePhase = null;
  G.challengeResult = null;
  G.challengeChoice = null;
  G.challengeMoralChoice = null;
  G.challengeOutcomeText = "";
  G.challengeStart = null;
  if (finished) {
    go("gameover", payload);
    return;
  }
  if (G.run.pendingLevels > 0) {
    G.pendingAdvance = false;
    enterPerks();
    return;
  }
  go("senda");
}

function shopHeal(mode) {
  const res = healAtShop(G.run, mode);
  G.toast = res.ok ? `El curandero te cura ${res.healed} de vida (-${res.cost}🪙)` : res.reason;
  go("shop");
}

function shopExorcise(uid) {
  const res = removeCurseAtShop(G.run, uid);
  G.toast = res.ok ? `El hechicero purifica ${res.card.name} (-${res.cost}🪙)` : res.reason;
  go("shop");
}

function playCard(cardId) {
  const res = enginePlayCard(G.combat, cardId);
  if (!res.ok) {
    G.toast = res.reason || "No se puede jugar esa carta";
    go("battle");
    return;
  }
  if (G.combat.winner) {
    finishBattle();
    return;
  }
  go("battle");
}

function hasPlayableReactions(state) {
  const move = enemyIntent(state);
  return state.deck.hand.some(
    (c) => c.reaction && reactionMatches(c, move) && (c.cost === 0 || (state.hero.arcane && c.cost <= state.hero.energy))
  );
}

function endTurn() {
  engineEndTurn(G.combat);
  if (G.combat.winner) {
    finishBattle();
    return;
  }
  if (G.combat.phase === "reaction" && !hasPlayableReactions(G.combat)) {
    engineResolveEnemyTurn(G.combat);
    if (G.combat.winner) {
      afterCombat();
      return;
    }
  }
  go("battle");
}

function playReaction(cardId) {
  const res = enginePlayReaction(G.combat, cardId);
  if (!res.ok) {
    G.toast = res.reason || "No puedes reaccionar con esa carta";
    go("battle");
    return;
  }
  if (G.combat.winner) {
    finishBattle();
    return;
  }
  // Al seleccionar la reacción se ejecuta y se resuelve el turno enemigo al instante
  engineResolveEnemyTurn(G.combat);
  if (G.combat.winner) {
    finishBattle();
    return;
  }
  go("battle");
}

function resolveReaction() {
  engineResolveEnemyTurn(G.combat);
  if (G.combat.winner) {
    finishBattle();
    return;
  }
  go("battle");
}

function continueEnemyTurn() {
  if (G.enemyTimer) {
    clearInterval(G.enemyTimer);
    G.enemyTimer = null;
  }
  engineContinueToHeroTurn(G.combat);
  if (G.combat.winner) {
    finishBattle();
    return;
  }
  go("battle");
}

function finishBattle() {
  if (G.combatEnding) return;
  G.combatEnding = true;
  const winner = G.combat && G.combat.winner;
  go("battle");
  const panel = document.querySelector(
    winner === "hero" ? '[data-combatant="enemy"]' : '[data-combatant="hero"]'
  );
  koCombatant(panel);
  const delay = panel && !prefersReducedMotion() ? 460 : 0;
  if (!delay) {
    G.combatEnding = false;
    afterCombat();
    return;
  }
  window.setTimeout(() => {
    G.combatEnding = false;
    afterCombat();
  }, delay);
}

function afterCombat() {
  if (G.enemyTimer) {
    clearInterval(G.enemyTimer);
    G.enemyTimer = null;
  }
  G.run.hp = G.combat.hero.hp;
  // El loadout referencia las instancias del deck: las mejoras/fusiones de fragua se propagan
  G.run.loadout = G.combat.loadout.map((c) => G.run.deck.find((i) => i.uid === c.uid)).filter(Boolean);

  if (G.challenge) {
    const node = G.challenge;
    const won = G.combat.winner === "hero";
    finishCombat(G.run, G.combat.winner, G.enemyDef, G.combat, { advance: false });
    if (!won) {
      G.challengeResult = "loss";
      applyChallengePenalty(G.run, node.outcomes.loss?.penalty || {});
      G.challengePhase = "outcome";
      G.challengeOutcomeText = (node.outcomes.loss?.text || "") + moralSuffix();
      go("challenge");
      return;
    }
    const result = evaluateCombatOutcome(G.combat, node);
    G.challengeResult = result;
    applyChallengeReward(G.run, node.outcomes[result]?.reward || {});
    if (node.moral && node.moral.phase === "after") {
      G.challengePhase = "moral";
      go("challenge");
      return;
    }
    G.challengePhase = "outcome";
    G.challengeOutcomeText = (node.outcomes[result]?.text || "") + moralSuffix();
    go("challenge");
    return;
  }

  const out = finishCombat(G.run, G.combat.winner, G.enemyDef, G.combat);
  if (out.result === "defeat") {
    go("gameover", { win: false });
    return;
  }
  G.rewards = { ...out.rewards, result: out.result };
  go("reward");
}

function continueAfterReward() {
  const needsAdvance = !!(G.rewards && G.rewards.needsAdvance);
  G.rewards = null;
  G.pendingAdvance = needsAdvance;
  enterPerks();
}

function enterPerks() {
  G.perkOptions = G.run.pendingLevels > 0 ? perkOptions(G.run) : [];
  if (G.run.pendingLevels > 0 && G.perkOptions.length) {
    go("perk");
    return;
  }
  // Sin niveles pendientes o sin ventajas disponibles: seguir directamente
  G.run.pendingLevels = 0;
  afterPerks(G.pendingAdvance);
}

function pickPerk(perkId) {
  applyPerk(G.run, perkId);
  G.run.pendingLevels = Math.max(0, G.run.pendingLevels - 1);
  enterPerks();
}

function afterPerks(needsAdvance) {
  G.pendingAdvance = false;
  if (needsAdvance) advanceDepth(G.run);
  if (G.run.finished) {
    go("gameover", { win: G.run.result === "victory" });
    return;
  }
  go("senda");
}

function continueAscension() {
  G.run = continueRunAscension(G.run);
  G.combat = null;
  G.enemyDef = null;
  G.rewards = null;
  G.challenge = null;
  G.challengePhase = null;
  G.challengeResult = null;
  G.challengeChoice = null;
  G.challengeMoralChoice = null;
  G.challengeOutcomeText = "";
  G.challengeStart = null;
  G.logHidden = false;
  go("senda");
}

function buy(cardId) {
  const res = shopBuy(G.run, cardId);
  G.toast = res.ok ? `Compraste ${res.card.name}` : res.reason;
  go("shop");
}

function sell(uid) {
  const res = shopSell(G.run, uid);
  G.toast = res.ok ? `Vendiste ${res.card.name} (+${res.gained}🪙)` : res.reason;
  go("shop");
}

function leaveShop() {
  advanceDepth(G.run);
  if (G.run.finished) {
    go("gameover", { win: true });
    return;
  }
  go("senda");
}

function forgeDiscount(run) {
  return 1 - (run.forgeDiscount || 0);
}

function upgradeCostOf(card) {
  return Math.max(3, Math.ceil((card.value || 0) * BALANCE.forgeUpgradeCostFactor * forgeDiscount(G.run)));
}

function fusionCostOf(card) {
  return Math.max(5, Math.ceil((card.value || 0) * BALANCE.forgeFusionCostFactor * forgeDiscount(G.run)));
}

function forgeImprove(uid) {
  const inst = G.run.deck.find((i) => i.uid === uid);
  if (!inst || inst.upgrade) {
    G.toast = "Esa carta no se puede mejorar";
    go("forge");
    return;
  }
  const cost = upgradeCostOf(resolveCard(inst));
  if (G.run.coins < cost) {
    G.toast = "Monedas insuficientes";
    go("forge");
    return;
  }
  G.run.coins -= cost;
  inst.upgrade = 1;
  G.toast = `${resolveCard(inst).name} mejorada (-${cost}🪙)`;
  go("forge");
}

function forgeSelect(uid) {
  G.forgeSel = G.forgeSel === uid ? null : uid;
  go("forge");
}

function forgeFuse(equipUid, effectUid) {
  const eq = G.run.deck.find((i) => i.uid === equipUid);
  const eff = G.run.deck.find((i) => i.uid === effectUid);
  if (!eq || !eff) {
    G.toast = "Elige un equipo y un efecto";
    go("forge");
    return;
  }
  if (getCard(eq.cardId).type !== "equipment" || getCard(eff.cardId).type !== "effect") {
    G.toast = "Solo equipo + carta de efecto";
    go("forge");
    return;
  }
  if (eq.fusedEffectId) {
    G.toast = "Ese equipo ya tiene un efecto";
    go("forge");
    return;
  }
  const cost = fusionCostOf(getCard(eff.cardId));
  if (G.run.coins < cost) {
    G.toast = "Monedas insuficientes";
    go("forge");
    return;
  }
  G.run.coins -= cost;
  eq.fusedEffectId = eff.cardId;
  removeInstanceFromRun(G.run, eff.uid);
  G.forgeSel = null;
  G.toast = `${getCard(eff.cardId).name} fusionada en ${getCard(eq.cardId).name} (-${cost}🪙)`;
  go("forge");
}

function leaveForge() {
  G.forgeSel = null;
  advanceDepth(G.run);
  if (G.run.finished) {
    go("gameover", { win: true });
    return;
  }
  go("senda");
}

function toggleDuelHero(heroId) {
  const setup = G.duelSetup;
  const at = setup.heroes.indexOf(heroId);
  if (at === -1) {
    if (setup.heroes.length >= 2) setup.heroes.shift();
    setup.heroes.push(heroId);
  } else {
    setup.heroes.splice(at, 1);
  }
  go("duelsetup", { mode: setup.mode });
}

function setDuelEnemy(id) {
  if (G.duelSetup) G.duelSetup.enemy = id;
}

function startDuel() {
  const setup = G.duelSetup;
  if (!setup || setup.heroes.length !== 2) return;
  const rng = createRng((Date.now() & 0xffffffff) >>> 0);
  const enemyDef = setup.mode === "coop" ? getEnemy(setup.enemy) : null;
  G.duel = createDuel(setup.mode, setup.heroes.slice(), enemyDef, rng);
  G.logHidden = false;
  go("duelbattle");
}

function duelPlay(cardId) {
  const res = playDuelCard(G.duel, cardId);
  if (!res.ok) G.toast = res.reason || "No se puede jugar";
  go("duelbattle");
}

function duelEnd() {
  endDuelTurn(G.duel);
  go("duelbattle");
}

function runAutoplay(heroId, seed) {
  G.autoplay = true;
  const sim = simulateRun(heroId, seed);
  G.run = sim.run;
  G.rewards = null;
  const failed = sim.encounters.find((e) => !e.won);
  const payload = { ...sim.payload, defeatedBy: failed ? failed.enemy : null };
  const el = document.getElementById("autoplay-result");
  if (el) {
    el.textContent = JSON.stringify(payload);
    el.dataset.done = "true";
  }
  go("gameover", { win: payload.result === "victory" });
  return payload;
}

function runBatch(count) {
  G.autoplay = true;
  const heroes = Object.keys(CHARACTERS);
  const heroWins = Object.fromEntries(heroes.map((h) => [h, 0]));
  const enemy = {};
  for (let seed = 1; seed <= count; seed++) {
    for (const heroId of heroes) {
      const sim = simulateRun(heroId, seed);
      if (sim.result === "victory") heroWins[heroId]++;
      for (const enc of sim.encounters) {
        if (!enemy[enc.enemy]) enemy[enc.enemy] = { total: 0, won: 0, id: enc.enemy };
        enemy[enc.enemy].total++;
        if (enc.won) enemy[enc.enemy].won++;
      }
    }
  }
  const lines = [`batch hero=${heroes.length} seedsPerHero=${count} games=${heroes.length * count}`];
  for (const h of heroes) lines.push(`hero ${h}: ${heroWins[h]}/${count} ${((heroWins[h] / count) * 100).toFixed(0)}%`);
  for (const e of Object.values(enemy)) lines.push(`enemy ${e.id}: ${e.won}/${e.total} ${((e.won / e.total) * 100).toFixed(0)}%`);
  const text = lines.join(" | ");
  const el = document.getElementById("autoplay-result");
  if (el) {
    el.textContent = text;
    el.dataset.done = "true";
  }
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = `<section class="screen gameover win"><h1>Batch completado</h1><pre style="white-space:pre-wrap;text-align:left;font-size:0.8rem">${lines.join("\n")}</pre></section>`;
  }
  return { heroWins, enemy };
}

function boot() {
  const params = new URLSearchParams(window.location.search);
  const duel = params.get("duel");
  if (duel) {
    const mode = duel === "coop" ? "coop" : "versus";
    G.duelSetup = { mode, heroes: [], enemy: params.get("enemy") || "goblin" };
    go("duelsetup", { mode });
    return;
  }
  if (params.get("autoplay") === "1") {
    const batch = parseInt(params.get("batch") || "0", 10);
    if (batch > 0) {
      runBatch(batch);
      return;
    }
    const hero = params.get("hero") || "warrior";
    const seed = parseInt(params.get("seed") || "1", 10);
    runAutoplay(hero, seed);
    return;
  }
  go("menu");
}

window.game = { G, go, startRun, continueSavedGame, saveGame, runAutoplay, runBatch, startDuel };
window.addEventListener("error", (e) => {
  const app = document.getElementById("app");
  if (app) app.innerHTML = `<section class="screen"><h2>Error</h2><pre style="white-space:pre-wrap;color:#f0a0a0">${e.message}\n${e.error && e.error.stack ? e.error.stack : ""}</pre></section>`;
});
document.addEventListener("DOMContentLoaded", () => {
  initTooltips();
  boot();
});
