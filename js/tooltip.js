// Tooltip global que sigue al puntero: delegación de eventos sobre [data-tip]
const el = () => {
  let t = document.getElementById("game-tooltip");
  if (!t) {
    t = document.createElement("div");
    t.id = "game-tooltip";
    document.body.appendChild(t);
  }
  return t;
};

function place(tip, x, y) {
  const t = el();
  t.textContent = tip;
  t.classList.add("visible");
  const pad = 14;
  let left = x + pad;
  let top = y + pad;
  const w = t.offsetWidth;
  const h = t.offsetHeight;
  if (left + w > window.innerWidth - 8) left = Math.max(8, x - w - pad);
  if (top + h > window.innerHeight - 8) top = Math.max(8, y - h - pad);
  t.style.left = `${left}px`;
  t.style.top = `${top}px`;
}

export function initTooltips() {
  document.addEventListener("mouseover", (e) => {
    const target = e.target.closest("[data-tip]");
    if (target) place(target.dataset.tip, e.clientX, e.clientY);
  });
  document.addEventListener("mousemove", (e) => {
    const t = document.getElementById("game-tooltip");
    if (!t || !t.classList.contains("visible")) return;
    const target = e.target.closest("[data-tip]");
    if (target) place(target.dataset.tip, e.clientX, e.clientY);
    else t.classList.remove("visible");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("[data-tip]")) el().classList.remove("visible");
  });
  document.addEventListener("focusin", (e) => {
    const target = e.target.closest("[data-tip]");
    if (target) {
      const r = target.getBoundingClientRect();
      place(target.dataset.tip, r.left + r.width / 2, r.bottom + 4);
    }
  });
  document.addEventListener("focusout", () => el().classList.remove("visible"));
}
