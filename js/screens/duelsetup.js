import { CHARACTERS } from "../characters.js";
import { ENEMIES } from "../enemies.js";
import { portraitHTML } from "../ui.js";

export function duelsetup(ctx) {
  const mode = ctx.payload.mode || "coop";
  const G = ctx.G;
  if (!G.duelSetup || G.duelSetup.mode !== mode) {
    G.duelSetup = { mode, heroes: [], enemy: "goblin" };
  }
  const setup = G.duelSetup;

  const heroCards = Object.values(CHARACTERS)
    .map((c) => {
      const on = setup.heroes.includes(c.id) ? "selected" : "";
      return `<button class="hero-card ${on}" data-hero="${c.id}">
        ${portraitHTML(c.icon, c.portrait, "hero-portrait")}
        <span class="hero-name">${c.name}</span>
        <span class="hero-stats">❤️ ${c.base.hp} · 💪 ${c.base.str} · ${c.arcane ? c.energyPerRound + "✦" : "marcial"}</span>
      </button>`;
    })
    .join("");

  const enemyOptions = Object.values(ENEMIES)
    .map((e) => `<option value="${e.id}" ${setup.enemy === e.id ? "selected" : ""}>Nv ${e.level} · ${e.name}${e.kind === "boss" ? " (jefe)" : ""}</option>`)
    .join("");

  const title = mode === "coop" ? "Cooperativo: 2 héroes contra la IA" : "Competitivo: 2 héroes cara a cara";
  const enemyPicker = mode === "coop"
    ? `<label class="muted">Enemigo: <select data-enemy>${enemyOptions}</select></label>`
    : `<p class="muted">Los dos jugadores se enfrentan entre sí.</p>`;

  const ready = setup.heroes.length === 2;
  const html = `
  <section class="screen duelsetup">
    <h2>${title}</h2>
    <p class="muted">Elige dos héroes (${setup.heroes.length}/2).</p>
    <div class="hero-grid">${heroCards}</div>
    ${enemyPicker}
    <div class="map-actions">
      <button class="btn primary" data-action="start" ${ready ? "" : "disabled"}>Comenzar</button>
      <button class="btn" data-action="back">Volver</button>
    </div>
  </section>`;
  return {
    html,
    bind(root) {
      root.querySelectorAll("[data-hero]").forEach((b) => {
        b.onclick = () => ctx.toggleDuelHero(b.dataset.hero);
      });
      const sel = root.querySelector("[data-enemy]");
      if (sel) sel.onchange = () => ctx.setDuelEnemy(sel.value);
      root.querySelector('[data-action="start"]').onclick = () => ctx.startDuel();
      root.querySelector('[data-action="back"]').onclick = () => ctx.go("menu");
    },
  };
}
