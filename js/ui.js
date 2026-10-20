import { MARK_META } from "./elements.js";

export function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function cardRarityClass(card) {
  if (!card) return "";
  if (card.subtype === "relic") return "rarity-relic";
  if ((card.value || 0) >= 50) return "rarity-epic";
  if ((card.value || 0) >= 30) return "rarity-rare";
  return "";
}

export function cardArtHTML(card, cls) {
  const art = card.art
    ? `<img src="${card.art}" alt="" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display=''">`
    : "";
  const icon = `<span class="card-icon"${card.art ? ` style="display:none"` : ""}>${card.icon}</span>`;
  return `<div class="card-art ${cls || ""}">${art}${icon}</div>`;
}

export function badgesHTML(card) {
  let html = "";
  if (card.upgrade) html += `<span class="badge upgrade" title="Carta mejorada">⭐</span>`;
  if (card.subtype === "relic") html += `<span class="badge relic" title="Reliquia: una activa">Reliquia</span>`;
  if (card.fused) html += `<span class="badge fused" title="${esc(card.fused.name)}: ${esc(card.fused.text)}">${card.fused.icon}</span>`;
  return html;
}

export function handCardHTML(card, opts = {}) {
  const disabled = opts.disabled ? "disabled" : "";
  const reason = opts.reason ? `<div class="card-reason">${esc(opts.reason)}</div>` : "";
  const cost = opts.showCost ? `<span class="card-cost">${card.cost}✦</span>` : "";
  const restriction = opts.restriction ? `<span class="card-restriction">⚠ ${esc(opts.restriction)}</span>` : "";
  return `<button class="card type-${card.type} ${cardRarityClass(card)} ${disabled}" data-card-id="${card.id}" ${disabled}>
    ${cost}
    ${cardArtHTML(card)}
    <span class="card-name">${esc(card.name)}</span>
    <span class="card-text">${esc(card.text)}</span>
    ${badgesHTML(card)}
    ${restriction}
    <span class="card-value">${card.value}🪙</span>
    ${reason}
  </button>`;
}

const MOD_META = {
  damage: { icon: "🗡️", label: "daño" },
  block: { icon: "🛡️", label: "bloqueo" },
  energy: { icon: "✦", label: "energía" },
};

function modLine(kind, value) {
  const meta = MOD_META[kind];
  return meta ? `${meta.icon} +${value} ${meta.label}` : `${kind} +${value}`;
}

// Desglose de un modificador: qué carta aporta cada bono
function modSources(state, kind) {
  return state.loadout
    .filter((c) => c.mods && c.mods[kind])
    .map((c) => `${c.icon} ${c.name}${c.upgrade ? " ⭐" : ""}: +${c.mods[kind]}`);
}

export function modsChipHTML(state, kind) {
  const meta = MOD_META[kind];
  if (!meta) return "";
  const sources = modSources(state, kind);
  if (!sources.length) return "";
  const total = state.loadout.reduce((s, c) => s + ((c.mods && c.mods[kind]) || 0), 0);
  const tip = `${meta.icon} +${total} ${meta.label}\n${sources.join("\n")}`;
  return `<span class="chip ${kind === "damage" ? "dmg" : "block"}" tabindex="0" data-tip="${esc(tip)}">${meta.icon} +${total}</span>`;
}

// Tooltip de una carta de equipo en la mesa: rasgos + bonificadores y su origen
function cardTipLines(card) {
  const lines = [];
  if (card.upgrade) lines.push("⭐ Mejorada (+50%)");
  if (card.mods) {
    for (const [kind, value] of Object.entries(card.mods)) {
      if (value) lines.push(modLine(kind, value));
    }
  }
  if (card.fused) {
    const dur = card.fused.duration ? ` (${card.fused.duration} rondas)` : "";
    lines.push(`${card.fused.icon} ${card.fused.name}${dur}: ${card.fused.text}`);
  }
  if (!lines.length) lines.push(card.text);
  return lines;
}

export function cardTip(card) {
  return `${card.name}\n${cardTipLines(card).join("\n")}`;
}

export function miniCardHTML(card) {
  return `<div class="mini-card" tabindex="0" data-tip="${esc(cardTip(card))}">
    ${cardArtHTML(card, "mini")}
    <span>${esc(card.name)}</span>
    ${badgesHTML(card)}
  </div>`;
}

export function deckCardHTML(card, count) {
  const cost = card.cost > 0 ? `<span class="card-cost">${card.cost}✦</span>` : "";
  const restriction = card.reqStr || card.tags.includes("twoHanded") || card.tags.includes("bow")
    ? `<span class="card-restriction">${esc(card.reqStr ? `Fuerza ${card.reqStr}` : card.tags.includes("bow") ? "Arco a 2 manos" : "A dos manos")}</span>`
    : "";
  const fused = card.fused ? `<span class="fused-tag" title="${esc(card.fused.text)}">${card.fused.icon} ${esc(card.fused.name)}</span>` : "";
  return `<div class="deck-card type-${card.type} ${cardRarityClass(card)}">
    ${cost}
    ${cardArtHTML(card)}
    <span class="card-name">${esc(card.name)}</span>
    <span class="card-text">${esc(card.text)}</span>
    ${badgesHTML(card)}
    ${restriction}
    ${fused}
    ${count ? `<span class="deck-count">×${count}</span>` : ""}
  </div>`;
}

export function lootSlotHTML(card, index = 0, extra = "") {
  return `<div class="loot-slot ${cardRarityClass(card)} ${extra}" data-reveal style="--i:${index}">
    ${deckCardHTML(card)}
  </div>`;
}

export function barHTML(label, cur, max, cls) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
  return `<div class="bar ${cls || ""}">
    <div class="bar-fill" style="width:${pct}%"></div>
    <span class="bar-label">${label}: ${cur}/${max}</span>
  </div>`;
}

export function portraitHTML(icon, portrait, cls) {
  const img = portrait
    ? `<img src="${portrait}" alt="" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display=''">`
    : "";
  const ico = `<span class="portrait-icon"${portrait ? ` style="display:none"` : ""}>${icon}</span>`;
  return `<div class="portrait ${cls || ""}">${img}${ico}</div>`;
}

export function chipsHTML(unit) {
  const chips = [];
  if (unit.downed) chips.push(`<span class="chip downed">💀 Caído</span>`);
  if (unit.block > 0) chips.push(`<span class="chip block">🛡️ ${unit.block}</span>`);
  if (unit.strength > 0) chips.push(`<span class="chip str">💪 ${unit.strength}</span>`);
  if (unit.vulnerable > 0) chips.push(`<span class="chip vuln">🔻 ${unit.vulnerable}</span>`);
  if (unit.guard > 0) chips.push(`<span class="chip guard">🛡️ Cubriendo</span>`);
  if (unit.threat > 0) chips.push(`<span class="chip threat">🎯 ${unit.threat}</span>`);
  return chips.join("");
}

export function marksChipsHTML(marks) {
  if (!marks || !marks.length) return "";
  return marks
    .map((mark) => {
      const meta = MARK_META[mark.kind] || { name: mark.kind, icon: "✦", cls: "" };
      return `<span class="chip mark ${meta.cls}" title="${esc(meta.name)}">${meta.icon} ${esc(meta.name)} ${mark.remaining}</span>`;
    })
    .join("");
}

const EFFECT_CLASS = {
  poison: "curse",
  weaken: "curse",
  fewerActions: "curse",
  regen: "bless",
  bonusDamage: "bless",
  bonusBlock: "bless",
};

export function effectsChipsHTML(effects, side) {
  if (!effects || !effects.length) return "";
  return effects
    .filter((e) => e.side === side)
    .map((e) => {
      const cls = EFFECT_CLASS[e.kind] || "bless";
      const dur = e.remaining != null ? ` ${e.remaining}` : "";
      return `<span class="chip effect ${cls}" title="${esc(e.name)}">${e.icon} ${esc(e.name)}${dur}</span>`;
    })
    .join("");
}

const EFFECT_KIND_LABEL = {
  poison: "Veneno",
  weaken: "Debilidad",
  fewerActions: "Menos acciones",
  regen: "Regeneración",
  bonusDamage: "Daño extra",
  bonusBlock: "Bloqueo extra",
  vulnerable: "Vulnerable",
  strength: "Fuerza",
};

// Cartas de efecto activas en la mesa: duran lo que dure el efecto
export function tableEffectsHTML(effects, side) {
  if (!effects || !effects.length) return "";
  return effects
    .filter((e) => e.side === side)
    .map((e) => {
      const kind = EFFECT_KIND_LABEL[e.kind] || e.kind;
      const dur = e.remaining != null ? `${e.remaining} ronda${e.remaining === 1 ? "" : "s"} restante${e.remaining === 1 ? "" : "s"}` : "durante todo el combate";
      const lines = [`${kind}: ${e.value}`, dur];
      if (e.desc) lines.push(e.desc);
      return `<div class="mini-card effect-mini" tabindex="0" data-tip="${esc(`${e.name}\n${lines.join("\n")}`)}">
        <div class="card-art mini"><span class="card-icon">${e.icon}</span></div>
        <span class="effect-name">${esc(e.name)}</span>
        <span class="effect-rounds">${e.remaining ?? "∞"}</span>
      </div>`;
    })
    .join("");
}

export function logHTML(log, hidden, heroIcon = "⚔️", enemyIcon = "👹") {
  const rows = log
    .slice()
    .reverse()
    .map((l) => {
      const actor = l.actor || "system";
      const kind = l.kind || "info";
      if (actor === "system") {
        return `<div class="log-row system"><span class="log-text">${esc(l.text)}</span></div>`;
      }
      const icon = l.icon || (actor === "hero" ? heroIcon : enemyIcon);
      return `<div class="log-row ${actor}"><span class="log-actor">${icon}</span><span class="log-text kind-${kind}">${esc(l.text)}</span></div>`;
    })
    .join("");
  return `<aside class="combat-log ${hidden ? "hidden" : ""}">
    <button class="btn small ghost log-toggle" data-action="toggle-log" title="Mostrar/ocultar log">📜</button>
    <div class="log-body">${rows}</div>
  </aside>`;
}
