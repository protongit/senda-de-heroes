import { resolveCard } from "../cards.js";
import { BALANCE } from "../balance-config.js";
import { esc } from "../ui.js";

function discount(run) {
  return 1 - (run.forgeDiscount || 0);
}

function upgradeCost(run, card) {
  return Math.max(3, Math.ceil((card.value || 0) * BALANCE.forgeUpgradeCostFactor * discount(run)));
}

function fusionCost(run, card) {
  return Math.max(5, Math.ceil((card.value || 0) * BALANCE.forgeFusionCostFactor * discount(run)));
}

export function forge(ctx) {
  const { G } = ctx;
  const run = G.run;
  const selUid = G.forgeSel || null;

  const equippedUids = new Set((run.loadout || []).map((l) => l.uid));

  const improveList = run.deck
    .filter((inst) => !inst.upgrade)
    .map((inst) => {
      const card = resolveCard(inst);
      const cost = upgradeCost(run, card);
      const can = run.coins >= cost;
      const eq = equippedUids.has(inst.uid) ? `<span class="equipped-tag">Equipado</span>` : "";
      return `<div class="forge-item">
        <span>${card.icon} <strong>${esc(card.name)}</strong> <span class="muted">${esc(card.text)}</span> ${eq}</span>
        <button class="btn small" data-improve="${inst.uid}" ${can ? "" : "disabled"}>Mejorar ${cost}🪙</button>
      </div>`;
    })
    .join("") || `<span class="muted">Nada que mejorar.</span>`;

  const equips = run.deck
    .filter((inst) => !inst.fusedEffectId && resolveCard(inst).type === "equipment")
    .map((inst) => {
      const card = resolveCard(inst);
      const selected = selUid === inst.uid;
      const eq = equippedUids.has(inst.uid) ? `<span class="equipped-tag">Equipado</span>` : "";
      return `<button class="forge-eq ${selected ? "selected" : ""}" data-eqsel="${inst.uid}">
        ${card.icon} ${esc(card.name)}${eq}${card.upgrade ? ` <span class="badge upgrade">⭐</span>` : ""}
      </button>`;
    })
    .join("") || `<span class="muted">Sin equipo fusionable.</span>`;

  const effects = run.deck
    .filter((inst) => resolveCard(inst).type === "effect")
    .map((inst) => {
      const card = resolveCard(inst);
      const cost = fusionCost(run, card);
      const can = run.coins >= cost && selUid;
      return `<div class="forge-item ${selUid ? "" : "dim"}">
        <span>${card.icon} <strong>${esc(card.name)}</strong> <span class="muted">${esc(card.text)}</span></span>
        <button class="btn small" data-effsel="${inst.uid}" ${can ? "" : "disabled"} title="${selUid ? "" : "Elige primero un equipo"}">Fusionar ${cost}🪙</button>
      </div>`;
    })
    .join("") || `<span class="muted">No tienes cartas de efecto en el mazo: consíguelas en el mercado (gemas 💎, runas 🔮, bendiciones 🙏, venenos 🧴…) y vuelve a la fragua para fusionarlas.</span>`;

  const selInfo = selUid
    ? (() => {
        const inst = run.deck.find((i) => i.uid === selUid);
        return inst ? `Fusionando en: <strong>${esc(resolveCard(inst).name)}</strong>` : "";
      })()
    : `<span class="muted">Elige un equipo para fusionar.</span>`;

  const toast = G.toast ? `<div class="toast">${G.toast}</div>` : "";
  G.toast = null;

  const html = `
  <section class="screen forge">
    <header class="hud">
      <span>🔨 Fragua</span>
      <span>${run.heroDef.icon} ${run.heroDef.name} · Nv ${run.level}</span>
      <span>🪙 ${run.coins}</span>
    </header>
    <div class="shop-grid">
      <div class="shop-col">
        <h3>Mejorar carta (sube su valor)</h3>
        ${improveList}
      </div>
      <div class="shop-col">
        <h3>Fusionar equipo + efecto</h3>
        <p class="muted">El <strong>material de fusión</strong> es cualquier <strong>carta de efecto</strong>: bendiciones, venenos, maldiciones… y las gemas 💎 y runas 🔮, pensadas para engarzar. Un solo efecto por equipo: si el equipo se vende o se pierde, ambos se descartan.</p>
        <div class="forge-eqs">${equips}</div>
        <p>${selInfo}</p>
        <div class="forge-fx">${effects}</div>
      </div>
    </div>
    <button class="btn primary" data-action="leave">Salir de la fragua</button>
    ${toast}
  </section>`;
  return {
    html,
    bind(root) {
      root.querySelectorAll("[data-improve]").forEach((b) => {
        b.onclick = () => ctx.forgeImprove(parseInt(b.dataset.improve, 10));
      });
      root.querySelectorAll("[data-eqsel]").forEach((b) => {
        b.onclick = () => ctx.forgeSelect(parseInt(b.dataset.eqsel, 10));
      });
      root.querySelectorAll("[data-effsel]").forEach((b) => {
        b.onclick = () => ctx.forgeFuse(selUid, parseInt(b.dataset.effsel, 10));
      });
      root.querySelector('[data-action="leave"]').onclick = () => ctx.leaveForge();
    },
  };
}
