import { CHARACTERS } from "../characters.js";
import { portraitHTML } from "../ui.js";
import { icon } from "../icons.js";

export function select(ctx) {
  const cards = Object.values(CHARACTERS)
    .map((c, i) => {
      const energy = c.arcane ? `${icon("bolt")} ${c.energyPerRound} energía` : `${icon("shield")} sin energía`;
      return `<button class="hero-card" data-hero="${c.id}" data-tilt style="--i:${i}">
        ${portraitHTML(c.icon, c.portrait, "hero-portrait")}
        <span class="hero-name">${c.name}</span>
        <span class="hero-title">${c.title}</span>
        <span class="hero-stats">${icon("heart")} ${c.base.hp} · ${icon("strength")} ${c.base.str} · ${energy}</span>
        <span class="hero-tags">${c.arcane ? "Arcano" : "Marcial"} · ${c.capacity.allowedArmor.join("/")}</span>
      </button>`;
    })
    .join("");
  const html = `
  <section class="screen select">
    <h2>Elige tu héroe</h2>
    <label class="dash-field hero-name-field">
      <span>Nombre de tu héroe (opcional)</span>
      <input type="text" id="hero-name" maxlength="24" placeholder="Ej. Glorfindel" autocomplete="off" />
    </label>
    <div class="hero-grid">${cards}</div>
    <button class="btn" data-action="back">${icon("arrowLeft")} Volver</button>
  </section>`;
  return {
    html,
    bind(root) {
      const nameInput = root.querySelector("#hero-name");
      root.querySelectorAll("[data-hero]").forEach((b) => {
        b.onclick = () => ctx.startRun(b.dataset.hero, null, nameInput ? nameInput.value.trim() : "");
      });
      root.querySelector('[data-action="back"]').onclick = () => ctx.go("menu");
    },
  };
}
