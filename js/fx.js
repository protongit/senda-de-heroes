const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let layerEl = null;

function layer() {
  if (layerEl && layerEl.isConnected) return layerEl;
  layerEl = document.getElementById("fx-layer");
  if (!layerEl) {
    layerEl = document.createElement("div");
    layerEl.id = "fx-layer";
    layerEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(layerEl);
  }
  return layerEl;
}

function cleanup(node, ms) {
  let done = false;
  const remove = () => {
    if (done) return;
    done = true;
    node.remove();
  };
  node.addEventListener("animationend", remove, { once: true });
  window.setTimeout(remove, ms);
}

function flashClass(el, cls, ms) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  let done = false;
  const clear = () => {
    if (done) return;
    done = true;
    el.classList.remove(cls);
  };
  el.addEventListener("animationend", clear, { once: true });
  window.setTimeout(clear, ms);
}

export function floatAt(x, y, text, kind = "damage") {
  if (typeof document === "undefined" || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const el = document.createElement("span");
  el.className = `fx-float fx-${kind}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty("--drift", `${Math.round((Math.random() * 2 - 1) * 24)}px`);
  layer().appendChild(el);
  cleanup(el, 1150);
  return el;
}

export function floatFrom(el, text, kind = "damage") {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (!rect.width && !rect.height) return null;
  return floatAt(rect.left + rect.width / 2, rect.top + Math.min(72, rect.height * 0.36), text, kind);
}

export function shake(el) {
  if (!el || reduced()) return;
  flashClass(el, "fx-shake", 620);
}

export function pulseBar(bar) {
  if (!bar || reduced()) return;
  flashClass(bar, "fx-hp-pulse", 900);
}

export function ko(el) {
  if (!el) return;
  el.classList.add("fx-ko");
}

export function playCard(el, done) {
  if (!el || reduced() || el.dataset.fxBusy === "1") {
    done();
    return;
  }
  el.dataset.fxBusy = "1";
  el.classList.add("fx-card-play");
  let called = false;
  const finish = () => {
    if (called) return;
    called = true;
    done();
  };
  el.addEventListener("animationend", finish, { once: true });
  window.setTimeout(finish, 240);
}

export function revealItems(root) {
  if (!root) return;
  root.querySelectorAll("[data-reveal]").forEach((el, i) => {
    el.style.setProperty("--i", String(i));
    el.classList.add("fx-reveal");
  });
}

const combatSnaps = new WeakMap();
const duelSnaps = new WeakMap();

function unitState(unit) {
  return {
    hp: Number(unit && unit.hp) || 0,
    block: Number(unit && unit.block) || 0,
    downed: !!(unit && unit.downed),
  };
}

function applyDiff(panel, prev, unit) {
  if (!panel || !prev) return;
  const next = unitState(unit);
  const hpDelta = next.hp - prev.hp;
  const blockDelta = next.block - prev.block;
  const bar = panel.querySelector(".bar.hp");

  if (hpDelta < 0) {
    floatFrom(panel, `-${Math.abs(hpDelta)}`, "damage");
    shake(panel);
    pulseBar(bar);
  } else if (hpDelta > 0) {
    floatFrom(panel, `+${hpDelta}`, "heal");
    pulseBar(bar);
  }

  if (blockDelta > 0) {
    floatFrom(panel, `+${blockDelta} 🛡`, "block");
  } else if (blockDelta < 0 && hpDelta <= 0) {
    floatFrom(panel, `-${Math.abs(blockDelta)} 🛡`, "block");
  }

  if ((next.hp <= 0 && prev.hp > 0) || (next.downed && !prev.downed)) ko(panel);
}

export function syncCombat(combat, root) {
  if (!combat || !root) return;
  const prev = combatSnaps.get(combat);
  if (prev) {
    applyDiff(root.querySelector('[data-combatant="hero"]'), prev.hero, combat.hero);
    applyDiff(root.querySelector('[data-combatant="enemy"]'), prev.enemy, combat.enemy);
  }
  combatSnaps.set(combat, { hero: unitState(combat.hero), enemy: unitState(combat.enemy) });
}

export function syncDuel(duel, root) {
  if (!duel || !root) return;
  const prev = duelSnaps.get(duel);
  if (prev) {
    const units = [...(duel.players || []), ...(duel.enemy ? [duel.enemy] : [])];
    for (const unit of units) {
      const old = prev.get(unit.id);
      if (!old) continue;
      const id = String(unit.id).replace(/"/g, '\\"');
      applyDiff(root.querySelector(`[data-unit-id="${id}"]`), old, unit);
    }
  }
  const map = new Map();
  for (const unit of [...(duel.players || []), ...(duel.enemy ? [duel.enemy] : [])]) {
    map.set(unit.id, unitState(unit));
  }
  duelSnaps.set(duel, map);
}

export function koCombatant(el) {
  if (el) ko(el);
}

export { reduced as prefersReducedMotion };
