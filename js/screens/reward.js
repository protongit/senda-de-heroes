import { getCard } from "../cards.js";
import { lootSlotHTML } from "../ui.js";
import { revealItems } from "../fx.js";

export function reward(ctx) {
  const { G } = ctx;
  const r = G.rewards || {};
  const run = G.run;
  let body;
  if (r.treasure) {
    body = `<p>Encuentras un cofre con <strong class="coins-gain">${r.coins} 🪙</strong>:</p><div class="treasure-card">${lootSlotHTML(getCard(r.cardId), 0, "loot-featured")}</div>`;
  } else {
    const drops = (r.drops || []).map((id, i) => lootSlotHTML(getCard(id), i)).join("") || `<span class="muted">Sin botín</span>`;
    const curses = (r.curses || []).map((id, i) => lootSlotHTML(getCard(id), i, "loot-curse")).join("");
    const lvl = r.pendingLevels > 0
      ? `<p class="levelup">¡Nivel ${r.level}! Elegirás ${r.pendingLevels === 1 ? "una ventaja" : `${r.pendingLevels} ventajas`} al continuar.</p>`
      : "";
    body = `
      <p>Botín: <strong class="coins-gain">${r.coins} 🪙</strong> · <strong>${r.xp} XP</strong>${r.bossBonus ? ` · +${r.bossBonus}❤️ máx` : ""}</p>
      ${lvl}
      <div class="drops">${drops}</div>
      ${curses ? `<p class="muted">Maldiciones que se adhieren a tu mazo:</p><div class="drops">${curses}</div>` : ""}
      <p class="muted">Vida restante: ${run.hp}/${run.maxHp}</p>`;
  }
  const html = `
  <section class="screen reward">
    <h2 class="victory-banner">${r.result === "victory" ? "¡Jefe final derrotado!" : "¡Victoria!"}</h2>
    ${body}
    <button class="btn primary" data-action="continue">Continuar</button>
  </section>`;
  return {
    html,
    bind(root) {
      revealItems(root);
      root.querySelector('[data-action="continue"]').onclick = () => ctx.continueAfterReward();
    },
  };
}
