import { esc } from "../ui.js";
import { icon as ic } from "../icons.js";
import { getEnemy } from "../enemies.js";
import { gameoverFx } from "../fx.js";
import { recordRun } from "../records.js";

// Título letra a letra: cada carácter recibe su índice --i para el stagger de entrada.
function splitTitle(text) {
  return Array.from(text)
    .map((ch, i) =>
      ch === " "
        ? `<span class="go-ch sp" style="--i:${i}" aria-hidden="true">&nbsp;</span>`
        : `<span class="go-ch" style="--i:${i}">${esc(ch)}</span>`
    )
    .join("");
}

export function gameover(ctx) {
  const { G, payload } = ctx;
  const run = G.run;
  const win = payload && payload.win;
  const nextAscension = run ? (run.ascension || 0) + 2 : 2;
  const finalBossName = run && run.finalBossId ? getEnemy(run.finalBossId).name : "el guardián de la senda";
  const title = win ? "¡Victoria!" : "Has caído";
  const sub = win
    ? `Has derrotado al jefe final: ${esc(finalBossName)} y completado la Senda de Héroes.`
    : "La senda termina aquí... por ahora.";
  const summary = run
    ? `<p class="muted">${run.heroDef.icon} ${run.heroDef.name}${run.heroName ? ` «${esc(run.heroName)}»` : ""} · Nivel ${run.level} · Senda ★${(run.ascension || 0) + 1} · ${ic("heart")} ${run.hp}/${run.maxHp} · ${ic("coin")} ${run.coins} · ${ic("cards")} ${run.deck.length} cartas</p>`
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
    <div class="go-actions">
      <h2>¿Qué quieres hacer ahora?</h2>
      <div class="options">
        <button class="option-card" data-action="continue" data-tilt>
          <span class="option-icon">${ic("star")}</span>
          <span class="option-label">Continuar → Senda ★${nextAscension}</span>
          <span class="option-hint">Conservas mazo, equipo, nivel, perks y monedas · te curas del todo · los enemigos serán un 15% más poderosos</span>
        </button>
        <button class="option-card" data-action="menu" data-tilt>
          <span class="option-icon">${ic("door")}</span>
          <span class="option-label">Volver al menú</span>
          <span class="option-hint">Abandona la partida</span>
        </button>
      </div>
    </div>`;
  } else {
    choices = `<div class="go-actions"><button class="btn primary" data-action="menu">${ic("arrowLeft")} Volver al menú</button></div>`;
  }

  const html = `
  <section class="screen gameover ${win ? "win" : "lose"}">
    <div class="go-stage">
      <span class="go-rays" aria-hidden="true"></span>
      <span class="go-shock" aria-hidden="true"></span>
      <h1 class="gameover-title" aria-label="${esc(title)}">${splitTitle(title)}</h1>
    </div>
    <p class="go-sub">${sub}</p>
    ${summary || morality ? `<div class="go-panel">
      ${summary}
      ${morality}
    </div>` : ""}
    ${chronicle}
    ${choices}
  </section>`;
  return {
    html,
    bind(root) {
      // Registra la partida terminada en las estadísticas (solo partidas reales).
      if (G.run && G.run.finished && !G.autoplay && !G.run.__recorded) {
        G.run.__recorded = true;
        recordRun(G.run);
      }
      const cont = root.querySelector('[data-action="continue"]');
      if (cont) cont.onclick = () => ctx.continueAscension();
      root.querySelector('[data-action="menu"]').onclick = () => ctx.go("menu");
      gameoverFx(root, !!win);
    },
  };
}
