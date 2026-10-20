import { esc } from "../ui.js";

export function perk(ctx) {
  const { G } = ctx;
  const run = G.run;
  const options = G.perkOptions || [];
  const remaining = run.pendingLevels;

  const cards = options
    .map(
      (p, i) => `<button class="option-card perk-option levelup-choice" style="--i:${i}" data-perk="${i}">
        <span class="option-icon">${p.icon}</span>
        <span class="option-label">${esc(p.name)}</span>
        <span class="option-hint">${esc(p.text)}</span>
      </button>`
    )
    .join("");

  const html = `
  <section class="screen perk">
    <header class="hud">
      <span>⭐ Subida de nivel</span>
      <span>${run.heroDef.icon} ${run.heroDef.name} · Nv ${run.level}</span>
      <span>Pendientes: ${remaining}</span>
    </header>
    <h2 class="levelup-title">Elige una ventaja</h2>
    <p class="muted">${remaining > 1 ? `Tienes ${remaining} niveles por elegir. ` : ""}La ventaja se aplica de inmediato y permanece toda la partida.</p>
    <div class="options">${cards}</div>
  </section>`;
  return {
    html,
    bind(root) {
      root.querySelectorAll("[data-perk]").forEach((b) => {
        b.onclick = () => ctx.pickPerk(options[parseInt(b.dataset.perk, 10)].id);
      });
    },
  };
}
