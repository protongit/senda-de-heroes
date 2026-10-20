import { esc } from "../ui.js";

export function gameover(ctx) {
  const { G, payload } = ctx;
  const run = G.run;
  const win = payload && payload.win;
  const nextAscension = run ? (run.ascension || 0) + 2 : 2;
  const summary = run
    ? `<p class="muted">${run.heroDef.icon} ${run.heroDef.name} · Nivel ${run.level} · Senda ★${(run.ascension || 0) + 1} · ❤️ ${run.hp}/${run.maxHp} · 🪙 ${run.coins} · ${run.deck.length} cartas</p>`
    : "";

  const morality = run && run.morality
    ? `<p class="muted">Moralidad: 🕊️ ${run.morality.mercy || 0} merced · 🪙 ${run.morality.greed || 0} codicia · ⚖️ ${run.morality.honor || 0} honor · 🖤 ${run.morality.corruption || 0} corrupción</p>`
    : "";
  const chronicle = run && run.chronicle && run.chronicle.length
    ? `<details class="chronicle"><summary>Crónica de la senda (${run.chronicle.length})</summary><ul>${run.chronicle
        .map((c) => `<li><strong>${esc(c.title)}</strong> — ${esc(c.result)}${c.choice ? ` · ${esc(c.choice)}` : ""}<br><span class="muted">${esc(c.text || "")}</span></li>`)
        .join("")}</ul></details>`
    : "";

  let choices = "";
  if (win && run) {
    choices = `
    <h2>¿Qué quieres hacer ahora?</h2>
    <div class="options">
      <button class="option-card" data-action="continue">
        <span class="option-icon">⭐</span>
        <span class="option-label">Continuar → Senda ★${nextAscension}</span>
        <span class="option-hint">Conservas mazo, equipo, nivel, perks y monedas · te curas del todo · los enemigos serán un 15% más poderosos</span>
      </button>
      <button class="option-card" data-action="menu">
        <span class="option-icon">🚪</span>
        <span class="option-label">Volver al menú</span>
        <span class="option-hint">Abandona la partida</span>
      </button>
    </div>`;
  } else {
    choices = `<button class="btn primary" data-action="menu">Volver al menú</button>`;
  }

  const html = `
  <section class="screen gameover ${win ? "win" : "lose"}">
    <h1 class="gameover-title">${win ? "¡Victoria!" : "Has caído"}</h1>
    <p>${win ? "Has derrotado al Lich y completado la Senda de Héroes." : "La senda termina aquí... por ahora."}</p>
    ${summary}
    ${morality}
    ${chronicle}
    ${choices}
  </section>`;
  return {
    html,
    bind(root) {
      const cont = root.querySelector('[data-action="continue"]');
      if (cont) cont.onclick = () => ctx.continueAscension();
      root.querySelector('[data-action="menu"]').onclick = () => ctx.go("menu");
    },
  };
}
