import { derivedMods, canEquip, cardRestriction, intentPreview, reactionMatches } from "../engine.js";
import { barHTML, handCardHTML, chipsHTML, effectsChipsHTML, marksChipsHTML, modsChipHTML, tableEffectsHTML, logHTML, miniCardHTML, portraitHTML, esc } from "../ui.js";
import { syncCombat, playCard as fxPlayCard } from "../fx.js";

export function battle(ctx) {
  const { G } = ctx;
  const s = G.combat;
  if (!s) return { html: "", bind() {} };
  const mods = derivedMods(s);
  const run = G.run;
  const enemy = s.enemy;
  const hero = s.hero;
  const reacting = s.phase === "reaction";
  const enemyDone = s.phase === "enemyDone";
  const heroActive = !enemyDone;
  const enemyActive = enemyDone;
  const intent = intentPreview(s);

  const hand = s.deck.hand
    .map((card) => {
      let reason = null;
      let disabled = false;
      if (reacting) {
        if (!card.reaction) {
          reason = "Solo reacciones ahora";
          disabled = true;
        } else if (intent && !reactionMatches(card, intent.move)) {
          reason = "El movimiento enemigo no la activa";
          disabled = true;
        } else if (card.cost > 0 && !hero.arcane) {
          reason = "Requiere energía (solo arcanos)";
          disabled = true;
        } else if (card.cost > 0 && hero.energy < card.cost) {
          reason = "Energía insuficiente";
          disabled = true;
        }
      } else {
        if (card.type === "curse") {
          reason = "Maldición: no se puede jugar";
          disabled = true;
        } else if (s.restrictions?.noResources && (card.type === "resource" || card.type === "effect")) {
          reason = "Prueba: sin recursos ni efectos";
          disabled = true;
        } else if (s.restrictions?.noEffects && card.type === "effect") {
          reason = "Prueba: sin cartas de efecto";
          disabled = true;
        } else if (s.restrictions?.noEquipment && card.type === "equipment") {
          reason = "Prueba: sin equipo";
          disabled = true;
        } else if (card.type === "equipment") {
          const c = canEquip(run.heroDef, card, s.loadout, hero.str);
          if (!c.ok) reason = c.reason;
        } else if (card.subtype === "gem" || card.subtype === "rune") {
          reason = "Material de fusión: úsala en la fragua";
        } else if (card.reaction) {
          reason = "Reacción: se juega al terminar el turno";
        } else if (card.cost > 0 && !hero.arcane) {
          reason = "Requiere energía (solo arcanos)";
        } else if (hero.arcane && hero.energy < card.cost) {
          reason = "Energía insuficiente";
        }
      }
      const restriction = cardRestriction(card, run.heroDef);
      return handCardHTML(card, { disabled, reason, showCost: card.cost > 0, restriction });
    })
    .join("");

  const loadout = s.loadout.length
    ? s.loadout.map(miniCardHTML).join("")
    : `<span class="muted">Sin equipo en la mesa</span>`;

  const energyHud = hero.arcane ? `<span class="energy">✦ ${hero.energy}/${hero.energyPerRound + mods.energy}</span>` : "";
  const intentChip = !reacting && intent
    ? `<div class="intent-chip">Prepara: ${intent.move.icon} ${esc(intent.move.name)}${intent.damage > 0 ? ` · ≈${intent.damage}⚔️` : ""}</div>`
    : "";
  const reactionBanner = reacting && intent
    ? `<div class="intent-banner">⚔️ ${esc(s.enemyDef.name)} prepara ${intent.move.icon} <strong>${esc(intent.move.name)}</strong>${
        intent.damage > 0 ? ` (≈${intent.damage} de daño)` : ""
      } — juega reacciones o pasa</div>`
    : "";
  const restrictionText = s.restrictions
    ? [
        s.restrictions.noResources ? "sin recursos ni efectos" : "",
        s.restrictions.noEffects && !s.restrictions.noResources ? "sin cartas de efecto" : "",
        s.restrictions.noEquipment ? "sin equipo" : "",
      ].filter(Boolean).join(" · ")
    : "";
  const challengeBanner = s.challenge
    ? `<div class="challenge-banner">${s.challenge.icon || "🎯"} <strong>${esc(s.challenge.title)}</strong>${s.challenge.trial?.roundLimit ? ` · límite: ${s.challenge.trial.roundLimit} rondas` : ""}${restrictionText ? ` · ${esc(restrictionText)}` : ""}</div>`
    : "";
  const toast = G.toast ? `<div class="toast">${G.toast}</div>` : "";
  G.toast = null;

  const EFFECT_LABELS = {
    damage: (v) => `⚔️ ${v} de daño`,
    block: (v) => `🛡️ ${v} de bloqueo`,
    heal: (v) => `💚 ${v} de curación`,
    strength: (v) => `💪 +${v} de fuerza`,
    vulnerable: (v) => `🔻 Vulnerable ${v} ronda${v === 1 ? "" : "s"}`,
    poison: (v) => `🧴 Veneno ${v}/ronda`,
    weaken: (v) => `🔇 -${v}% de daño`,
    fewerActions: (v) => `⛓️ -${v} acción`,
    bonusDamage: (v) => `🗡️ +${v} de daño`,
    bonusBlock: (v) => `🛡️ +${v} de bloqueo/ronda`,
    regen: (v) => `💚 ${v} de cura/ronda`,
    draw: (v) => `🃏 Roba ${v}`,
    energy: (v) => `✦ +${v} de energía`,
  };
  const effectLabel = (eff) => (EFFECT_LABELS[eff.kind] ? EFFECT_LABELS[eff.kind](eff.value) : `${eff.kind} ${eff.value}`);

  let enemyTurnView = "";
  if (enemyDone && s.enemyTurnSummary) {
    const sum = s.enemyTurnSummary;
    const moveEffects = (sum.move?.effects || []).map((e) => `<li>${effectLabel(e)}</li>`).join("");
    const summaryRows = sum.entries
      .map((l) => {
        const actor = l.actor || "system";
        if (actor === "system") return `<div class="log-row system"><span class="log-text">${esc(l.text)}</span></div>`;
        const icon = l.icon || (actor === "hero" ? run.heroDef.icon : s.enemyDef.icon);
        return `<div class="log-row ${actor}"><span class="log-actor">${icon}</span><span class="log-text kind-${l.kind || "info"}">${esc(l.text)}</span></div>`;
      })
      .join("");
    const delta = sum.heroHpAfter - sum.heroHpBefore;
    const hpDelta = delta === 0
      ? `<p class="hp-delta">Vida del héroe: sin cambios (${sum.heroHpAfter}/${hero.maxHp})</p>`
      : `<p class="hp-delta ${delta < 0 ? "down" : "up"}">Vida del héroe: ${sum.heroHpBefore} → ${sum.heroHpAfter} (${delta > 0 ? "+" : ""}${delta})</p>`;
    enemyTurnView = `
    <div class="enemy-turn-view">
      <div class="enemy-move-card">
        <span class="enemy-move-icon">${sum.move?.icon || s.enemyDef.icon}</span>
        <h3>${esc(sum.move?.name || "Turno enemigo")}</h3>
        <ul class="move-effects">${moveEffects || "<li>Sin efectos</li>"}</ul>
      </div>
      <div class="enemy-turn-summary">
        <h4>Resumen del turno enemigo</h4>
        ${summaryRows || `<p class="muted">El enemigo no hizo nada.</p>`}
        ${hpDelta}
      </div>
    </div>`;
  }

  const html = `
  <section class="screen battle">
    <header class="hud">
      <span>Ronda ${s.round}</span>
      <span>${run.heroDef.icon} ${run.heroDef.name} Nv ${run.level}</span>
      ${energyHud}
      <span>Acciones: ${hero.actions}${hero.actionDebt ? ` (deuda: ${hero.actionDebt})` : ""}</span>
      <span>🪙 ${run.coins}</span>
    </header>

    ${challengeBanner}
    <div class="battle-layout">
      <div class="battle-main">
        <div class="arena">
          <div class="enemy-panel ${enemyActive ? "active-combatant" : ""}" data-combatant="enemy">
            <div class="enemy-head">
              ${portraitHTML(s.enemyDef.icon, s.enemyDef.portrait, "enemy-portrait")}
              <div class="panel-info">
                <h3>${s.enemyDef.name}</h3>
                ${barHTML("Vida", enemy.hp, enemy.maxHp, "hp")}
                <div class="chips">${chipsHTML(enemy)} ${effectsChipsHTML(s.effects, "enemy")} ${marksChipsHTML(s.marks.enemy)}</div>
                ${intentChip}
              </div>
            </div>
            ${tableEffectsHTML(s.effects, "enemy") ? `<div class="loadout"><span class="loadout-title">Efectos activos</span>${tableEffectsHTML(s.effects, "enemy")}</div>` : ""}
          </div>

          <div class="hero-panel ${heroActive ? "active-combatant" : ""}" data-combatant="hero">
            <div class="hero-head">
              ${portraitHTML(run.heroDef.icon, run.heroDef.portrait, "hero-portrait-sm")}
              <div class="panel-info">
                <h3>${run.heroDef.name}</h3>
                ${barHTML("Vida", hero.hp, hero.maxHp, "hp")}
                <div class="chips">${chipsHTML(hero)} ${effectsChipsHTML(s.effects, "hero")} ${marksChipsHTML(s.marks.hero)} ${modsChipHTML(s, "damage")} ${modsChipHTML(s, "block")}</div>
              </div>
            </div>
            <div class="loadout">
              <span class="loadout-title">Mesa</span>
              ${loadout}
            </div>
            ${tableEffectsHTML(s.effects, "hero") ? `<div class="loadout"><span class="loadout-title">Efectos activos</span>${tableEffectsHTML(s.effects, "hero")}</div>` : ""}
          </div>
        </div>

        ${enemyTurnView}
        ${reactionBanner}
        ${enemyDone ? "" : `<div class="hand">${hand}</div>`}

        <div class="battle-controls">
          ${
            enemyDone
              ? `<button class="btn primary continue-btn" data-action="continue">Continuar ▶<span class="continue-counter">10</span></button>`
              : reacting
                ? `<button class="btn primary" data-action="resolve">No reaccionar ▶</button>`
                : `<button class="btn primary" data-action="end">Terminar turno</button>`
          }
          <button class="btn" data-action="deck">Ver mazo (${s.deck.draw.length}/${s.deck.discard.length}${s.exhaustedUids.length ? ` · ${s.exhaustedUids.length} agotada${s.exhaustedUids.length > 1 ? "s" : ""}` : ""})</button>
        </div>
      </div>
      ${logHTML(s.log, G.logHidden, run.heroDef.icon, s.enemyDef.icon)}
    </div>
    ${toast}
  </section>`;
  return {
    html,
    bind(root) {
      syncCombat(s, root);
      if (enemyDone) {
        let left = 10;
        const counterEl = root.querySelector(".continue-counter");
        if (G.enemyTimer) clearInterval(G.enemyTimer);
        G.enemyTimer = setInterval(() => {
          left -= 1;
          if (counterEl) counterEl.textContent = Math.max(0, left);
          if (left <= 0) {
            clearInterval(G.enemyTimer);
            G.enemyTimer = null;
            ctx.continueEnemyTurn();
          }
        }, 1000);
      } else if (G.enemyTimer) {
        clearInterval(G.enemyTimer);
        G.enemyTimer = null;
      }
      root.querySelectorAll("[data-card-id]").forEach((b) => {
        if (b.disabled) return;
        b.onclick = () =>
          fxPlayCard(b, () => (reacting ? ctx.playReaction(b.dataset.cardId) : ctx.playCard(b.dataset.cardId)));
      });
      const continueBtn = root.querySelector('[data-action="continue"]');
      if (continueBtn) continueBtn.onclick = () => ctx.continueEnemyTurn();
      const endBtn = root.querySelector(reacting ? '[data-action="resolve"]' : '[data-action="end"]');
      if (endBtn) endBtn.onclick = () => (reacting ? ctx.resolveReaction() : ctx.endTurn());
      root.querySelector('[data-action="deck"]').onclick = () => ctx.go("deck", { back: "battle" });
      const toggle = root.querySelector('[data-action="toggle-log"]');
      if (toggle) toggle.onclick = () => ctx.toggleLog();
    },
  };
}
