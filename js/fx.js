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

/* Estela de daño: la capa roja bajo el relleno retrocede del pct viejo al nuevo.
   Solo animamos transform (scaleX con --g); el relleno se pinta con width estática. */
function damageTrail(bar, unit, prevHp) {
  if (!bar) return;
  const ghost = bar.querySelector(".bar-ghost");
  if (!ghost) return;
  const max = unit.maxHp || unit.hp || 1;
  const from = Math.max(0, Math.min(1, prevHp / max));
  const to = Math.max(0, Math.min(1, (Number(unit.hp) || 0) / max));
  if (from <= to || reduced()) {
    ghost.style.setProperty("--g", to.toFixed(4));
    return;
  }
  ghost.style.transition = "none";
  ghost.style.setProperty("--g", from.toFixed(4));
  void ghost.offsetWidth; // fijar el punto de partida antes de animar
  ghost.style.removeProperty("transition");
  ghost.style.setProperty("--g", to.toFixed(4));
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
    damageTrail(bar, unit, prev.hp);
  } else if (hpDelta > 0) {
    floatFrom(panel, `+${hpDelta}`, "heal");
    pulseBar(bar);
    damageTrail(bar, unit, prev.hp);
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
    pulseIntent(root, prev.intentKey);
  }
  combatSnaps.set(combat, {
    hero: unitState(combat.hero),
    enemy: unitState(combat.enemy),
    intentKey: intentKey(root),
  });
}

// La intención cambia de una ronda a otra: un solo destello al reaparecer,
// nunca un latido continuo (es una superficie que se mira cientos de veces).
function intentKey(root) {
  const chip = root.querySelector(".intent-chip");
  return chip ? chip.textContent.trim() : "";
}

function pulseIntent(root, prevKey) {
  const chip = root.querySelector(".intent-chip");
  if (!chip || reduced()) return;
  const key = intentKey(root);
  if (!prevKey || key === prevKey) return;
  flashClass(chip, "intent-new", 320);
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

/* ---------- embestida y destello de impacto ---------- */
export function lunge(el) {
  if (!el || reduced()) return;
  flashClass(el, "fx-lunge", 460);
}

export function hitFlash(el) {
  if (!el || reduced()) return;
  flashClass(el, "fx-hit-flash", 320);
}

const seenSummaries = new WeakSet();

// Cuando el enemigo ya actuó, teatralizamos su golpe una sola vez:
// embestida del agresor y destello sobre el panel que recibe.
export function enemyActed(root, summary) {
  if (!root || !summary || seenSummaries.has(summary) || reduced()) return;
  seenSummaries.add(summary);
  const attacks = (summary.entries || []).some((l) => l.kind === "damage");
  if (!attacks) return;
  const enemyPanel = root.querySelector('[data-combatant="enemy"]');
  const heroPanel = root.querySelector('[data-combatant="hero"]');
  const portrait = enemyPanel && enemyPanel.querySelector(".portrait");
  lunge(portrait || enemyPanel);
  hitFlash(heroPanel);
}

/* ---------- feedback de pulsación en pantallas táctiles ----------
   En touch, :active no se aplica a elementos sin handler propio, así que
   marcamos la clase en pointerdown: la interfaz responde al bajar el dedo. */
export function initPressFeedback(root) {
  if (typeof document === "undefined" || !root || root.dataset.pressBound === "1") return;
  root.dataset.pressBound = "1";
  const PRESSABLE = ".btn, .card:not(:disabled), .hero-card, .option-card, .forge-eq, .challenge-choice";
  let pressed = null;
  const release = () => {
    if (pressed) pressed.classList.remove("pressed");
    pressed = null;
  };
  root.addEventListener(
    "pointerdown",
    (e) => {
      release();
      if (reduced()) return;
      const el = e.target.closest(PRESSABLE);
      if (el && !el.disabled) {
        pressed = el;
        el.classList.add("pressed");
      }
    },
    { passive: true },
  );
  for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
    root.addEventListener(type, release, { passive: true });
  }
}

/* ---------- inclinación 3D + brillo que sigue al puntero ----------
   Solo puntero fino; escribe el transform del propio elemento, no variables
   heredadas, para no recalcular el subtree de cada carta. */
export function initTilt(root) {
  if (typeof window === "undefined" || !root || root.dataset.tiltBound === "1") return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  root.dataset.tiltBound = "1";
  let current = null;
  let frame = 0;

  const reset = (el) => {
    if (!el) return;
    el.style.removeProperty("--tx");
    el.style.removeProperty("--ty");
    el.style.removeProperty("--mx");
    el.style.removeProperty("--my");
    el.style.removeProperty("--px");
    el.style.removeProperty("--py");
  };

  const track = (el, x, y) => {
    if (reduced()) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dx = Math.min(1, Math.max(0, (x - r.left) / r.width)) - 0.5;
    const dy = Math.min(1, Math.max(0, (y - r.top) / r.height)) - 0.5;
    const strong = el.classList.contains("option-card") || el.classList.contains("hero-card");
    const amp = strong ? 7 : 4.5;
    el.style.setProperty("--ty", `${(dx * amp * 2).toFixed(2)}deg`);
    el.style.setProperty("--tx", `${(-dy * amp * 2).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${((dx + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((dy + 0.5) * 100).toFixed(1)}%`);
    if (strong) {
      el.style.setProperty("--px", `${(-dx * 14).toFixed(1)}px`);
      el.style.setProperty("--py", `${(-dy * 10).toFixed(1)}px`);
    }
  };

  root.addEventListener("pointermove", (e) => {
    const el = e.target.closest("[data-tilt]");
    if (el !== current) {
      reset(current);
      current = el;
      if (el) {
        let foil = el.querySelector(".foil");
        if (!foil) {
          foil = document.createElement("span");
          foil.className = "foil";
          foil.setAttribute("aria-hidden", "true");
          el.appendChild(foil);
        }
      }
    }
    if (!current) return;
    const { clientX, clientY } = e;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      track(current, clientX, clientY);
    });
  });

  root.addEventListener("pointerleave", () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    reset(current);
    current = null;
  });
}

/* ---------- brasas del fondo ---------- */
export function initAmbience() {
  if (typeof document === "undefined") return;
  const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let host = document.querySelector(".atmos");
  if (isReduced) {
    if (host) host.remove();
    return;
  }
  if (host && host.dataset.built === "1") return;
  if (!host) {
    host = document.createElement("div");
    host.className = "atmos";
    host.setAttribute("aria-hidden", "true");
    document.body.insertBefore(host, document.body.firstChild);
  }
  host.dataset.built = "1";
  const count = window.matchMedia("(max-width: 720px)").matches ? 14 : 26;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "ember";
    el.style.left = `${Math.random() * 100}%`;
    el.style.setProperty("--sz", `${(2 + Math.random() * 3).toFixed(1)}px`);
    el.style.setProperty("--dx", `${(Math.random() * 120 - 60).toFixed(0)}px`);
    el.style.setProperty("--op", (0.35 + Math.random() * 0.45).toFixed(2));
    el.style.setProperty("--dur", `${(11 + Math.random() * 15).toFixed(1)}s`);
    el.style.setProperty("--delay", `${(-Math.random() * 22).toFixed(1)}s`);
    frag.appendChild(el);
  }
  host.replaceChildren(frag);
}

/* ---------- acordeón (único sitio donde animamos height) ----------
   Medimos el contenido: animar a `auto` no funciona y dejar el
   height fijo rompería el reflujo al redimensionar la ventana. */
export function accordion(panel, open) {
  if (!panel) return;
  const DUR = 210;
  if (reduced()) {
    panel.classList.toggle("hidden", !open);
    panel.style.height = "";
    return;
  }
  if (open) {
    panel.classList.remove("hidden");
    const h = panel.scrollHeight;
    panel.style.height = "0px";
    panel.style.opacity = "0";
    requestAnimationFrame(() => {
      panel.style.height = `${h}px`;
      panel.style.opacity = "1";
    });
    setTimeout(() => {
      panel.style.height = "";
      panel.style.opacity = "";
    }, DUR + 40);
  } else {
    panel.style.height = `${panel.scrollHeight}px`;
    requestAnimationFrame(() => {
      panel.style.height = "0px";
      panel.style.opacity = "0";
    });
    setTimeout(() => {
      panel.classList.add("hidden");
      panel.style.height = "";
      panel.style.opacity = "";
    }, DUR + 40);
  }
}

/* ---------- contador de monedas ---------- */
export function countUp(el, to, format) {
  if (!el) return;
  const target = Number(to) || 0;
  if (reduced()) {
    el.textContent = format ? format(target) : String(target);
    return;
  }
  const from = Number(el.dataset.countFrom) || 0;
  const dur = 720;
  const t0 = performance.now();
  el.dataset.countFrom = String(target);
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    const value = Math.round(from + (target - from) * eased);
    el.textContent = format ? format(value) : String(value);
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export { reduced as prefersReducedMotion };
