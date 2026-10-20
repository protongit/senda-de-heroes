export const BALANCE = {
  cardsPerRound: 6,
  handLimit: 12,
  actionLimit: 3,
  enemyScale: 0.94,
  startingCoins: 25,
  sellRatio: 0.5,
  minDeckToSell: 8,
  bossMaxHpBonus: 10,
  levelGains: { maxHp: 8, energyEvery: 2, strEvery: 2 },
  xpByLevel: [0, 40, 100, 180, 300, 460, 660, 900, 1200, 1560],
  shopStock: 5,
  upgradeFactor: 1.5,
  forgeUpgradeCostFactor: 0.6,
  forgeFusionCostFactor: 0.8,
  reactionActionCost: 1,
  marketStable: 6,
  marketRotating: 4,
  ascensionStep: 0.15,
  challengeChance: 0.45,
  challengeMaxPerRun: 3,
  curseRemovalCost: 25,
  healerPercent: 0.3,
  healerCostPerHp: 1.2,
  fullHealCostPerHp: 1.0,
};

export function xpForLevel(level) {
  const table = BALANCE.xpByLevel;
  if (level < table.length) return table[level];
  const last = table[table.length - 1];
  return last + (level - (table.length - 1)) * 400;
}
