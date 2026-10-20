import { resolveCard, instanceKey } from "../cards.js";
import { deckCardHTML } from "../ui.js";

export function deck(ctx) {
  const { G } = ctx;
  const back = (ctx.payload && ctx.payload.back) || "senda";
  const run = G.run;
  const exhausted = new Set(G.combat && !G.combat.winner ? G.combat.exhaustedUids : []);
  const consumed = new Set(G.combat && !G.combat.winner ? G.combat.scrappedUids : []);
  const groups = { equipment: [], skill: [], resource: [], effect: [], curse: [] };
  for (const inst of run.deck) {
    const card = resolveCard(inst);
    (groups[card.type] || groups.skill).push(card);
  }
  const equippedUids = new Set((run.loadout || []).map((l) => l.uid));

  const section = (title, cards) => {
    if (!cards.length) return "";
    const counts = {};
    for (const card of cards) {
      const key = instanceKey({ cardId: card.id, upgrade: card.upgrade ? 1 : 0, fusedEffectId: card.fusedEffectId });
      (counts[key] = counts[key] || { card, n: 0, equipped: 0, exhausted: 0 }).n++;
      if (equippedUids.has(card.uid)) counts[key].equipped++;
      if (exhausted.has(card.uid)) counts[key].exhausted++;
      if (consumed.has(card.uid)) counts[key].permanent = true;
    }
    const items = Object.values(counts)
      .map(({ card, n, equipped, exhausted, permanent }) => {
        const eq = equipped ? `<span class="equipped-tag">Equipado${equipped > 1 ? ` x${equipped}` : ""}</span>` : "";
        const ex = exhausted ? `<span class="exhausted-tag">${permanent ? "Consumida (un solo uso)" : "Agotada este combate"}</span>` : "";
        return `<div class="deck-item">${deckCardHTML(card, n)}${eq}${ex}</div>`;
      })
      .join("");
    return `<h3>${title} (${cards.length})</h3><div class="deck-grid">${items}</div>`;
  };
  const html = `
  <section class="screen deck-view">
    <header class="hud">
      <span>Mazo de ${run.heroDef.name}</span>
      <span>${run.deck.length} cartas</span>
      <span>Equipado: ${(run.loadout || []).length}</span>
    </header>
    ${section("Equipo", groups.equipment)}
    ${section("Habilidades", groups.skill)}
    ${section("Efectos", groups.effect)}
    ${section("Recursos", groups.resource)}
    ${section("Maldiciones", groups.curse)}
    <button class="btn primary" data-action="back">Volver</button>
  </section>`;
  return {
    html,
    bind(root) {
      root.querySelector('[data-action="back"]').onclick = () => ctx.go(back);
    },
  };
}
