import { canEquip, cardRestriction } from "../engine.js";
import { currentUnit, derivedEnergy } from "../duel.js";
import { barHTML, handCardHTML, chipsHTML, marksChipsHTML, logHTML, miniCardHTML, portraitHTML } from "../ui.js";
import { syncDuel, playCard as fxPlayCard } from "../fx.js";

function unitPanel(unit, active, isEnemy) {
  const cls = [isEnemy ? "enemy-panel" : "hero-panel", active ? "active-combatant" : ""].join(" ");
  const headCls = isEnemy ? "enemy-head" : "hero-head";
  return `<div class="${cls}" data-unit-id="${unit.id}">
    <div class="${headCls}">
      ${portraitHTML(unit.icon, unit.portrait, isEnemy ? "enemy-portrait" : "hero-portrait-sm")}
      <div class="panel-info">
        <h3>${unit.name}${active ? " ▸" : ""}</h3>
        ${barHTML("Vida", unit.hp, unit.maxHp, "hp")}
        <div class="chips">${chipsHTML(unit)} ${marksChipsHTML(unit.marks)}</div>
      </div>
    </div>
    <div class="loadout">${(unit.loadout || []).map(miniCardHTML).join("") || ""}</div>
  </div>`;
}

export function duelbattle(ctx) {
  const { G } = ctx;
  const d = G.duel;
  if (!d) return { html: "", bind() {} };

  if (d.winner) {
    const win = d.mode === "coop" ? d.winner === "players" : true;
    const text = d.mode === "coop"
      ? (d.winner === "players" ? "¡Los héroes ganan!" : "El enemigo os ha derrotado")
      : `Gana ${d.winner}`;
    return {
      html: `<section class="screen gameover ${win ? "win" : "lose"}"><h1>${text}</h1><button class="btn primary" data-action="menu">Volver al menú</button></section>`,
      bind(root) {
        root.querySelector('[data-action="menu"]').onclick = () => ctx.go("menu");
      },
    };
  }

  const active = currentUnit(d);
  const activeIsPlayer = active && active.side === "player";
  const hand = activeIsPlayer
    ? active.deck.hand
        .map((card) => {
          let reason = null;
          if (card.type === "equipment") {
            const c = canEquip(active.heroDef, card, active.loadout, active.str);
            if (!c.ok) reason = c.reason;
          } else if (card.cost > 0 && !active.arcane) reason = "Solo arcanos";
          else if (active.arcane && active.energy < card.cost) reason = "Energía insuficiente";
          return handCardHTML(card, { disabled: !!reason, reason, showCost: card.cost > 0, restriction: cardRestriction(card, active.heroDef) });
        })
        .join("")
    : "";

  const energyHud = active && active.arcane ? `<span class="energy">✦ ${active.energy}/${active.energyPerRound + derivedEnergy(active)}</span>` : "";
  const toast = G.toast ? `<div class="toast">${G.toast}</div>` : "";
  G.toast = null;

  const panels = d.players.map((p) => unitPanel(p, active === p, false)).join("");
  const enemyPanel = d.enemy ? unitPanel(d.enemy, active === d.enemy, true) : "";

  const html = `
  <section class="screen battle">
    <header class="hud">
      <span>Ronda ${d.round}</span>
      <span>${d.mode === "coop" ? "Cooperativo vs IA" : "Competitivo 1v1"}</span>
      <span>Turno: ${active.name}</span>
      ${energyHud}
      ${active && active.side === "player" ? `<span>Acciones: ${active.actions}</span>` : ""}
    </header>
    <div class="battle-layout">
      <div class="battle-main">
        <div class="arena arena-3">
          ${panels}
          ${enemyPanel}
        </div>
        <div class="hand">${hand}</div>
        <div class="battle-controls">
          <button class="btn primary" data-action="end" ${activeIsPlayer ? "" : "disabled"}>${activeIsPlayer ? `Terminar turno (${active.name})` : "Turno de la IA..."}</button>
        </div>
      </div>
      ${logHTML(d.log, G.logHidden, d.players[0]?.icon || "⚔️", d.enemy?.icon || d.players[1]?.icon || "👹")}
    </div>
    ${toast}
  </section>`;
  return {
    html,
    bind(root) {
      syncDuel(d, root);
      root.querySelectorAll("[data-card-id]").forEach((b) => {
        if (b.disabled) return;
        b.onclick = () => fxPlayCard(b, () => ctx.duelPlay(b.dataset.cardId));
      });
      const end = root.querySelector('[data-action="end"]');
      if (end) end.onclick = () => ctx.duelEnd();
      const toggle = root.querySelector('[data-action="toggle-log"]');
      if (toggle) toggle.onclick = () => ctx.toggleLog();
    },
  };
}
