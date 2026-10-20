export function senda(ctx) {
  const run = ctx.G.run;
  const options = run.options || [];
  const icon = (n) => {
    if (n.type === "shop") return "🛒";
    if (n.type === "treasure") return "💎";
    if (n.type === "forge") return "🔨";
    if (n.type === "challenge") return n.icon || "🎯";
    return "⚔️";
  };
  const hint = (n) => {
    if (n.type === "shop") return "Comprar, vender y servicios";
    if (n.type === "treasure") return "Monedas y botín";
    if (n.type === "forge") return "Mejorar y fusionar";
    if (n.type === "challenge") return n.hint || "Desafío secundario";
    return "Enfrentamiento";
  };
  const buttons = options
    .map(
      (n, i) => `<button class="option-card ${n.type === "challenge" ? "challenge-option-card" : ""}" style="--i:${i}" data-option="${i}">
        <span class="option-icon">${icon(n)}</span>
        <span class="option-label">${n.label || (n.type === "shop" ? "Tienda" : "Combate")}</span>
        <span class="option-hint">${hint(n)}</span>
      </button>`
    )
    .join("");
  const toast = ctx.G.toast ? `<div class="toast">${ctx.G.toast}</div>` : "";
  ctx.G.toast = null;
  const html = `
  <section class="screen senda">
    <header class="hud">
      <span>${run.heroDef.icon} ${run.heroDef.name} · Nv ${run.level}</span>
      ${run.ascension ? `<span class="ascension-tag">⭐ Senda ★${run.ascension + 1} · enemigos +${Math.round((run.ascension * 15))}%</span>` : ""}
      <span>❤️ ${run.hp}/${run.maxHp}</span>
      <span>🪙 ${run.coins}</span>
      <span>✨ ${run.xp} XP</span>
      <span>Paso ${run.depth + 1}</span>
    </header>
    <h2>Elige tu camino</h2>
    <p class="muted">La senda cambia en cada partida. Escoge una de las dos opciones.</p>
    <div class="options">${buttons}</div>
    <button class="btn" data-action="deck">Ver mazo (${run.deck.length})</button>
    <button class="btn" data-action="save">💾 Guardar partida</button>
    ${toast}
  </section>`;
  return {
    html,
    bind(root) {
      root.querySelectorAll("[data-option]").forEach((b) => {
        b.onclick = () => ctx.chooseOption(parseInt(b.dataset.option, 10));
      });
      root.querySelector('[data-action="deck"]').onclick = () => ctx.go("deck", { back: "senda" });
      root.querySelector('[data-action="save"]').onclick = () => ctx.saveGame();
    },
  };
}
