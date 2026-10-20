import { getCard, resolveCard, instanceKey } from "../cards.js";
import { price, sellPrice } from "../shop.js";
import { MARKET_TIER_LABEL, healerPrices } from "../run.js";
import { BALANCE } from "../balance-config.js";
import { cardArtHTML, badgesHTML, esc, cardTip, barHTML } from "../ui.js";

function marketItemHTML(card, extra) {
  const can = true;
  return `<div class="shop-item">
    ${cardArtHTML(card, "shop-art")}
    <div class="shop-info">
      <strong>${card.name}</strong> ${extra || ""}
      <span class="muted">${card.text}</span>
      <span>${price(card)} 🪙</span>
    </div>
    <button class="btn small" data-buy="${card.id}" ${can ? "" : "disabled"}>Comprar</button>
  </div>`;
}

export function shop(ctx) {
  const { G } = ctx;
  const run = G.run;
  const market = run.market || { stable: [], rotating: [] };

  const stableZone = market.stable
    .map((id) => marketItemHTML(getCard(id), `<span class="rarity tier-common">Fija</span>`))
    .join("") || `<span class="muted">Mercadería agotada.</span>`;

  const rotatingZone = market.rotating
    .map(({ id, tier }) => marketItemHTML(getCard(id), `<span class="rarity tier-${tier}">${MARKET_TIER_LABEL[tier]}</span>`))
    .join("") || `<span class="muted">Sin rarezas esta semana.</span>`;

  const equippedUids = new Set((run.loadout || []).map((l) => l.uid));
  const groups = new Map();
  for (const inst of run.deck) {
    const card = resolveCard(inst);
    if (card.type === "curse") continue;
    const key = instanceKey(inst);
    if (!groups.has(key)) groups.set(key, { card, uids: [] });
    groups.get(key).uids.push(inst.uid);
  }
  const sellList = [...groups.values()]
    .map(({ card, uids }) => {
      const equipped = uids.filter((u) => equippedUids.has(u)).length;
      const eq = equipped ? ` <span class="equipped-tag">Equipado${equipped > 1 ? ` x${equipped}` : ""}</span>` : "";
      return `<div class="sell-item" tabindex="0" data-tip="${esc(cardTip(card))}">
        <span>${card.icon} ${esc(card.name)} <span class="muted">×${uids.length}</span>${eq}${badgesHTML(card)}</span>
        <button class="btn small ghost" data-sell="${uids[0]}">Vender +${sellPrice(card, run)}🪙</button>
      </div>`;
    })
    .join("");

  const services = run.shopServices || {};
  const heal = healerPrices(run);
  const curses = run.deck
    .filter((inst) => resolveCard(inst).type === "curse")
    .map((inst) => {
      const card = resolveCard(inst);
      return `<div class="shop-service-row">
        <span>${card.icon} <strong>${esc(card.name)}</strong> <span class="muted">${esc(card.text)}</span></span>
        <button class="btn small" data-exorcise="${inst.uid}" ${run.coins >= BALANCE.curseRemovalCost ? "" : "disabled"}>Exorcizar ${BALANCE.curseRemovalCost}🪙</button>
      </div>`;
    })
    .join("");
  const curandero = services.curandero
    ? `<div class="shop-service">
        <h4>🌿 Curandero</h4>
        <p class="muted">Cura tus heridas por monedas.</p>
        <div class="heal-hp">${barHTML("Vida", run.hp, run.maxHp, "hp")}</div>
        <div class="shop-service-actions">
          <button class="btn small" data-heal="small" ${run.coins >= heal.smallCost && heal.missing > 0 ? "" : "disabled"}>Venda · +${heal.smallAmount}❤️ · ${heal.smallCost}🪙</button>
          <button class="btn small" data-heal="full" ${run.coins >= heal.fullCost && heal.missing > 0 ? "" : "disabled"}>Cura completa · +${heal.fullAmount}❤️ · ${heal.fullCost}🪙</button>
        </div>
      </div>`
    : "";
  const hechicero = services.hechicero
    ? `<div class="shop-service">
        <h4>🧙 Hechicero</h4>
        <p class="muted">Purga las maldiciones que pesan en tu mazo.</p>
        ${curses || `<span class="muted">No hay maldiciones que purgar.</span>`}
      </div>`
    : "";
  const servicesZone = curandero || hechicero
    ? `${curandero}${hechicero}`
    : `<p class="muted">Hoy no hay servicios disponibles en la tienda.</p>`;

  const toast = G.toast ? `<div class="toast">${G.toast}</div>` : "";
  G.toast = null;

  const html = `
  <section class="screen shop">
    <header class="hud">
      <span>🛒 Mercader</span>
      <span>${run.heroDef.icon} ${run.heroDef.name} · Nv ${run.level}</span>
      <span>🪙 ${run.coins}</span>
    </header>
    <div class="shop-grid">
      <div class="shop-col">
        <h3>Mercadería fija</h3>
        ${stableZone}
        <h3 style="margin-top:14px">Rarezas de la semana</h3>
        ${rotatingZone}
      </div>
      <div class="shop-col">
        <h3>Servicios</h3>
        <div class="shop-services">${servicesZone}</div>
        <h3 style="margin-top:14px">Tu mazo (vender)</h3>
        <div class="sell-list">${sellList}</div>
      </div>
    </div>
    <button class="btn primary" data-action="leave">Salir de la tienda</button>
    ${toast}
  </section>`;
  return {
    html,
    bind(root) {
      root.querySelectorAll("[data-buy]").forEach((b) => {
        b.onclick = () => ctx.buy(b.dataset.buy);
      });
      root.querySelectorAll("[data-sell]").forEach((b) => {
        b.onclick = () => ctx.sell(parseInt(b.dataset.sell, 10));
      });
      root.querySelectorAll("[data-heal]").forEach((b) => {
        b.onclick = () => ctx.shopHeal(b.dataset.heal);
      });
      root.querySelectorAll("[data-exorcise]").forEach((b) => {
        b.onclick = () => ctx.shopExorcise(parseInt(b.dataset.exorcise, 10));
      });
      root.querySelector('[data-action="leave"]').onclick = () => ctx.leaveShop();
    },
  };
}
