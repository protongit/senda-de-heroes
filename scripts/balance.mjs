import { writeFileSync } from "node:fs";
import { CHARACTERS } from "../js/characters.js";
import { simulateRun } from "../js/simulate.js";

const N = parseInt(process.argv[2] || "500", 10);
const heroes = Object.keys(CHARACTERS);

const heroWins = Object.fromEntries(heroes.map((h) => [h, 0]));
const enemy = {};

for (let seed = 1; seed <= N; seed++) {
  for (const heroId of heroes) {
    const sim = simulateRun(heroId, seed);
    if (sim.result === "victory") heroWins[heroId]++;
    for (const enc of sim.encounters) {
      if (!enemy[enc.enemy]) enemy[enc.enemy] = { total: 0, won: 0, level: enc.level, kind: enc.kind, turns: 0, damage: 0 };
      enemy[enc.enemy].total++;
      enemy[enc.enemy].turns += enc.turns;
      enemy[enc.enemy].damage += enc.damage;
      if (enc.won) enemy[enc.enemy].won++;
    }
  }
}

const pct = (won, total) => (total ? ((won / total) * 100).toFixed(1) : "0.0");

console.log(`\n=== Balance (${N} partidas por héroe) ===\n`);
console.log("Héroe            Victoria");
console.log("---------------- --------");
for (const heroId of heroes) {
  const rate = parseFloat(pct(heroWins[heroId], N));
  const flag = rate < 40 || rate > 60 ? "  <-- FUERA DE 40-60%" : "";
  console.log(`${CHARACTERS[heroId].name.padEnd(16)} ${pct(heroWins[heroId], N)}%${flag}`);
}

console.log("\nEnemigo            Nivel  Tipo    Victoria del jugador");
console.log("------------------ ------ ------- --------------------");
for (const [id, s] of Object.entries(enemy)) {
  const rate = parseFloat(pct(s.won, s.total));
  const lo = s.kind === "boss" ? 20 : 30;
  const hi = s.kind === "boss" ? 60 : 80;
  const flag = rate < lo || rate > hi ? `  <-- fuera de ${lo}-${hi}%` : "";
  const avgTurns = (s.turns / s.total).toFixed(1);
  const avgDmg = (s.damage / s.total).toFixed(1);
  console.log(`${id.padEnd(18)} ${String(s.level).padEnd(6)} ${s.kind.padEnd(7)} ${pct(s.won, s.total).padEnd(7)}% turnos=${avgTurns} daño=${avgDmg}${flag}`);
}

const report = { samples: N, heroWinRate: {}, enemyWinRate: {} };
for (const heroId of heroes) report.heroWinRate[heroId] = parseFloat(pct(heroWins[heroId], N));
for (const [id, s] of Object.entries(enemy)) report.enemyWinRate[id] = { rate: parseFloat(pct(s.won, s.total)), level: s.level, kind: s.kind };
writeFileSync(new URL("../docs/balance-report.json", import.meta.url), JSON.stringify(report, null, 2));
console.log("\nInforme escrito en docs/balance-report.json");
