import {
  createRun,
  enemyForTier,
  heroStatsForCombat,
  finishCombat,
  grantTreasure,
  healAfterTreasure,
  advanceDepth,
  rotateMarket,
  tierForDepth,
  rollShopServices,
  healAtShop,
  removeCurseAtShop,
  consumeChallenge,
  applyChallengeReward,
  applyChallengePenalty,
  addMorality,
} from "./run.js";
import { createCombat } from "./engine.js";
import { getCard, resolveCard } from "./cards.js";
import { buy, price } from "./shop.js";
import { BALANCE } from "./balance-config.js";
import { perkOptions, applyPerk } from "./perks.js";
import { takeHeroTurn } from "./ai.js";
import { evaluateCombatOutcome } from "./challenges.js";

function drainPendingPerks(run) {
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

function shopTurn(run) {
  rotateMarket(run);
  rollShopServices(run, true);
  if (run.shopServices?.curandero && run.hp < run.maxHp * 0.6) {
    healAtShop(run, run.hp < run.maxHp * 0.35 ? "full" : "small");
  }
  if (run.shopServices?.hechicero) {
    const curse = run.deck.find((inst) => getCard(inst.cardId).type === "curse");
    if (curse) removeCurseAtShop(run, curse.uid);
  }
  const market = [...run.market.stable, ...run.market.rotating.map((s) => s.id)];
  const affordable = market
    .map((id) => getCard(id))
    .filter((c) => run.coins - price(c) >= 10)
    .sort((a, b) => price(a) - price(b));
  if (affordable[0]) buy(run, affordable[0].id);
  advanceDepth(run);
}

function forgeTurn(run) {
  const candidates = run.deck
    .filter((inst) => !inst.upgrade)
    .map((inst) => ({ inst, card: resolveCard(inst) }))
    .filter(({ card }) => run.coins - Math.max(5, Math.ceil((card.value || 0) * BALANCE.forgeUpgradeCostFactor)) >= 5)
    .sort((a, b) => (b.card.value || 0) - (a.card.value || 0));
  if (candidates[0]) {
    const cost = Math.max(5, Math.ceil((candidates[0].card.value || 0) * BALANCE.forgeUpgradeCostFactor));
    run.coins -= cost;
    candidates[0].inst.upgrade = 1;
  }
  advanceDepth(run);
}

function firstMoral(node) {
  return node?.moral?.options?.[0] || null;
}

function applySimMoral(run, node, phase) {
  if (node?.moral?.phase !== phase) return false;
  const moral = firstMoral(node);
  if (!moral) return false;
  addMorality(run, moral.morality || {});
  applyChallengeReward(run, moral.reward || {});
  applyChallengePenalty(run, moral.penalty || {});
  return true;
}

export function simulateChallenge(run, node) {
  if (!node) return;
  if (node.trial?.type === "combat") {
    applySimMoral(run, node, "before");
    const tier = Math.min(5, tierForDepth(run.depth) + (node.trial.tierOffset || 1));
    const enemy = enemyForTier(tier, run.rng, run.ascension);
    const combat = createCombat(run.heroDef, heroStatsForCombat(run), enemy, run.deck.slice(), run.rng, run.loadout, {
      restrictions: node.trial.restrictions || null,
      challenge: node,
    });
    let turns = 0;
    while (!combat.winner && turns++ < 400) takeHeroTurn(combat);
    run.hp = combat.hero.hp;
    run.loadout = combat.loadout.map((c) => run.deck.find((i) => i.uid === c.uid)).filter(Boolean);
    finishCombat(run, combat.winner, enemy, combat, { advance: false });
    if (combat.winner === "enemy") {
      applyChallengePenalty(run, node.outcomes.loss?.penalty || {});
      consumeChallenge(run);
      return;
    }
    const result = evaluateCombatOutcome(combat, node);
    applyChallengeReward(run, node.outcomes[result]?.reward || {});
    const moral = firstMoral(node);
    if (moral && node.moral.phase === "after") {
      addMorality(run, moral.morality || {});
      applyChallengeReward(run, moral.reward || {});
      applyChallengePenalty(run, moral.penalty || {});
    }
    drainPendingPerks(run);
    consumeChallenge(run);
    return;
  }
  if (node.trial?.type === "puzzle") {
    applySimMoral(run, node, "before");
    const solved = run.rng.chance(0.68);
    if (solved) {
      applyChallengeReward(run, node.outcomes.triumph?.reward || {});
      const moral = firstMoral(node);
      if (moral && node.moral.phase === "after") {
        addMorality(run, moral.morality || {});
        applyChallengeReward(run, moral.reward || {});
      }
    } else {
      applyChallengePenalty(run, node.outcomes.loss?.penalty || {});
    }
    drainPendingPerks(run);
    consumeChallenge(run);
    return;
  }
  if (node.trial?.type === "choice") {
    const choices = node.trial.choices || [];
    const choice = choices.find((c) => !(c.penalty?.coins && run.coins < c.penalty.coins)) || choices[0];
    if (choice) {
      addMorality(run, choice.morality || {});
      if (choice.needsCardSacrifice) {
        const candidates = run.deck.filter((inst) => getCard(inst.cardId).type !== "curse");
        if (candidates.length) removeInstanceFromRun(run, run.rng.pick(candidates).uid);
      }
      applyChallengeReward(run, choice.reward || {});
      applyChallengePenalty(run, choice.penalty || {});
    }
    drainPendingPerks(run);
    consumeChallenge(run);
  }
}

export function simulateRun(heroId, seed) {
  const run = createRun(heroId, seed);
  const encounters = [];
  let guard = 0;
  while (!run.finished && guard++ < 40) {
    const options = run.options;
    if (!options || options.length === 0) break;
    const node = options[0];
    if (node.type === "challenge") {
      simulateChallenge(run, node);
      if (run.finished) break;
      continue;
    }
    if (node.type === "combat") {
      const enemy = enemyForTier(node.tier, run.rng, run.ascension);
      const hpBefore = run.hp;
      const combat = createCombat(run.heroDef, heroStatsForCombat(run), enemy, run.deck.slice(), run.rng, run.loadout);
      let turns = 0;
      while (!combat.winner && turns++ < 400) takeHeroTurn(combat);
      run.hp = combat.hero.hp;
      // El loadout referencia las instancias del deck: las mejoras/fusiones de fragua se propagan
      run.loadout = combat.loadout.map((c) => run.deck.find((i) => i.uid === c.uid)).filter(Boolean);
      const out = finishCombat(run, combat.winner, enemy, combat);
      drainPendingPerks(run);
      encounters.push({
        enemy: enemy.id,
        level: enemy.level,
        kind: enemy.kind,
        won: combat.winner === "hero",
        turns,
        hpBefore,
        hpAfter: run.hp,
        damage: hpBefore - run.hp,
      });
      if (out.result === "defeat") break;
    } else if (node.type === "shop") {
      shopTurn(run);
    } else if (node.type === "forge") {
      forgeTurn(run);
    } else if (node.type === "treasure") {
      grantTreasure(run);
      healAfterTreasure(run);
      advanceDepth(run);
    }
  }
  return {
    run,
    encounters,
    result: run.result || "defeat",
    payload: {
      hero: heroId,
      seed,
      result: run.result || "defeat",
      depth: run.depth,
      steps: 7,
      level: run.level,
      hp: run.hp,
      maxHp: run.maxHp,
      coins: run.coins,
      deckSize: run.deck.length,
    },
  };
}
