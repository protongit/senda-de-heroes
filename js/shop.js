import { getCard, resolveCard } from "./cards.js";
import { addCardToRun, removeInstanceFromRun } from "./run.js";
import { BALANCE } from "./balance-config.js";

export function price(card) {
  return card.value || 0;
}

export function sellPrice(card, run = null) {
  const ratio = BALANCE.sellRatio + ((run && run.sellBonus) || 0);
  return Math.floor((card.value || 0) * ratio);
}

export function buy(run, cardId) {
  const card = getCard(cardId);
  const cost = price(card);
  if (run.coins < cost) return { ok: false, reason: "Monedas insuficientes" };
  // La mercadería fija NO se agota (compras repetibles); la zona rotativa sí
  if (run.market) {
    const ri = run.market.rotating.findIndex((s) => s.id === cardId);
    if (ri !== -1) run.market.rotating.splice(ri, 1);
  }
  run.coins -= cost;
  addCardToRun(run, cardId);
  return { ok: true, card };
}

export function sell(run, uid) {
  if (run.deck.length <= BALANCE.minDeckToSell) {
    return { ok: false, reason: "No puedes vender con un mazo tan pequeño" };
  }
  const inst = run.deck.find((i) => i.uid === uid);
  if (!inst) return { ok: false, reason: "No tienes esa carta" };
  const card = resolveCard(inst);
  if (card.type === "curse") return { ok: false, reason: "El mercader no compra maldiciones: busca al hechicero" };
  const removed = removeInstanceFromRun(run, uid);
  if (!removed) return { ok: false, reason: "No tienes esa carta" };
  const gained = sellPrice(card, run);
  run.coins += gained;
  return { ok: true, card, gained };
}
