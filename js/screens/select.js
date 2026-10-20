import { CHARACTERS } from "../characters.js";
import { portraitHTML } from "../ui.js";

export function select(ctx) {
  const cards = Object.values(CHARACTERS)
    .map((c) => {
      const energy = c.arcane ? `${c.energyPerRound}✦ energía` : "sin energía";
      return `<button class="hero-card" data-hero="${c.id}">
        ${portraitHTML(c.icon, c.portrait, "hero-portrait")}
        <span class="hero-name">${c.name}</span>
        <span class="hero-title">${c.title}</span>
        <span class="hero-stats">❤️ ${c.base.hp} · 💪 ${c.base.str} · ${energy}</span>
        <span class="hero-tags">${c.arcane ? "Arcano" : "Marcial"} · ${c.capacity.allowedArmor.join("/")}</span>
      </button>`;
    })
    .join("");
  const html = `
  <section class="screen select">
    <h2>Elige tu héroe</h2>
    <div class="hero-grid">${cards}</div>
    <button class="btn" data-action="back">Volver</button>
  </section>`;
  return {
    html,
    bind(root) {
      root.querySelectorAll("[data-hero]").forEach((b) => {
        b.onclick = () => ctx.startRun(b.dataset.hero);
      });
      root.querySelector('[data-action="back"]').onclick = () => ctx.go("menu");
    },
  };
}
