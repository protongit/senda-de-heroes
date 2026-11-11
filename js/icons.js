// Sprite SVG inline: iconografía de interfaz que sustituye a los emoji del HUD.
// Trazo de 1.8 sobre rejilla de 24, currentColor -> se tiñe con CSS.
const PATHS = {
  heart: "M12 20.2c-.4 0-.8-.2-1-.5-3.4-3.1-6.2-5.9-6.2-9.3A4.2 4.2 0 0 1 9 6.4c1.2 0 2.3.6 3 1.6.7-1 1.8-1.6 3-1.6a4.2 4.2 0 0 1 4.2 4c0 3.4-2.8 6.2-6.2 9.3-.2.3-.6.5-1 .5z",
  coin: "M12 4.6a7.4 7.4 0 1 0 0 14.8 7.4 7.4 0 0 0 0-14.8zm0 3.6a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6z",
  spark: "M12 3.4l1.9 5.3 5.3 1.9-5.3 1.9L12 17.8l-1.9-5.3-5.3-1.9 5.3-1.9z",
  bolt: "M13.6 3.2 6.4 13.1h4.1l-1.2 7.7 7.4-10.1h-4.2z",
  shield: "M12 3.3 5.2 6v5.5c0 4 2.8 7.4 6.8 9.2 4-1.8 6.8-5.2 6.8-9.2V6z",
  sword: "M20.1 3.9h-3.5l-7.3 7.3 3.5 3.5 7.3-7.3zM9.3 11.2 4.6 15.9m2.6-2.6-2.3 2.3m2.3 2.3-2.3-2.3m9.1 3.5-2.9 2.9h-3.1l-2.4-2.4 2.9-2.9",
  swords: "M4.4 4.4h3.4l10.2 10.2v3.4m-3.4 3.4H11L4.4 11.4V8m16.1-3.6H17L6.6 16.8v3.4m3.4-3.4H13l7.1-7.1",
  road: "M9.6 3.6 6.2 20.4m7.8-16.8 3.4 16.8M12 6.2v2.2m0 3.4v2.2m0 3.4v2.2",
  save: "M5 5.8h11L19 8.8v9.4H5zm2.6 0v4.4h8.8V5.8M8.4 18.2v-4.2h7.2v4.2",
  hammer: "M4.3 13.6 10.4 7.5l3.1 3.1-6.1 6.1zm6.2-6.2 3.9-3.9 4 4-3.9 3.9M11.5 18.3l3.2-3.2",
  bag: "M7.4 8.6V6.4a4.6 4.6 0 0 1 9.2 0v2.2M5.4 8.6h13.2l-1 11.2H6.4z",
  gem: "M8.6 3.8h6.8l3.8 5.2L12 20.4 4.8 9zM4.8 9h14.4M8.6 3.8 12 9l3.4-5.2",
  skull: "M12 3.4a6.6 6.6 0 0 0-6.6 6.6c0 2.2 1 3.6 2 4.6v3h9.2v-3c1-1 2-2.4 2-4.6A6.6 6.6 0 0 0 12 3.4zM9.4 10.6h.01m5.2 0h.01M12 13.4l-1 2h2z",
  target: "M12 4.6a7.4 7.4 0 1 0 0 14.8 7.4 7.4 0 0 0 0-14.8zm0 3.7a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4zM12 2.4v2.2m0 14.8v2.2M2.4 12h2.2m14.8 0h2.2",
  star: "M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z",
  book: "M4.6 4.4h9.8a3.6 3.6 0 0 1 3.6 3.6v11.6H8.2a3.6 3.6 0 0 1-3.6-3.6zM4.6 4.4v11.6a3.6 3.6 0 0 1 3.6-3.6h9.8",
  scroll: "M6.4 4.6h9.6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8.4m7.6-15a2 2 0 0 0-2 2v9.4m-3.6-7.4h5.6m-5.6 3.4h5.6",
  door: "M6.4 3.8h9.4v16.4H6.4zM13.6 12.6h.01",
  flame: "M12 20.4c3.4 0 5.6-2.2 5.6-5.2 0-4.6-4.6-5.6-4-11.6-2.8 1.2-5 4-5 7 0 1.2-.8 1.8-1.6 1.8-.8 0-1.4-.6-1.6-1.4-.6 1-.8 2-.8 3.2 0 3 2.4 6.2 7.4 6.2z",
  droplet: "M12 3.6c3 4 6 6.6 6 9.8a6 6 0 0 1-12 0c0-3.2 3-5.8 6-9.8z",
  feather: "M20 4.4c-4.6-1.6-9.6.6-11.8 4.8-1 2-1.4 4.2-1.2 6.4L4.4 20.4m5.2-9.6h6.6m-5.2 3.6h4.4",
  scales: "M12 4.6v15.4M6 6.6l6-2 6 2M8.6 20.2H4l2.3-5.6zM20 20.2h-4.6l2.3-5.6z",
  cards: "M8.6 6.6h9.2a2 2 0 0 1 2 2v9.4a2 2 0 0 1-2 2H8.6a2 2 0 0 1-2-2V8.6a2 2 0 0 1 2-2zm-2 2.6H6.4a2 2 0 0 0-2 2v9.4m2-9.4",
  arrowRight: "M4.8 12h14.4m-5.4-5.4L19.2 12l-5.4 5.4",
  arrowLeft: "M19.2 12H4.8m5.4-5.4L4.8 12l5.4 5.4",
  chevron: "M6.6 9.6 12 15l5.4-5.4",
  strength: "M6.4 8.6h3.1l2.5 4.4 2.5-4.4h3.1M4.4 6.4v11.2m15.2-11.2v11.2M8.6 5v2.8m6.8-2.8v2.8",
  vulnerable: "M12 4.6v10.8m0 0 4-4m-4 4-4-4M5.2 19.4h13.6",
  hourglass: "M7.4 4.6h9.2M7.4 19.4h9.2M8.6 4.6c0 3.4 3.4 4.6 3.4 7.4 0 2.8-3.4 4-3.4 7.4m6.8-14.8c0 3.4-3.4 4.6-3.4 7.4 0 2.8 3.4 4 3.4 7.4",
  lock: "M8.6 10.6V8.4a3.4 3.4 0 0 1 6.8 0v2.2M6.4 10.6h11.2v9H6.4zM12 13.6v2.8",
  crown: "M4.4 8l3.4 3 4.2-5.4 4.2 5.4 3.4-3-1.6 10.4H6z",
  hand: "M9.4 12.4V5.6a1.5 1.5 0 0 1 3 0v5.6m0-1.2V4.4a1.5 1.5 0 0 1 3 0v6.4m0-1.4a1.5 1.5 0 0 1 3 0v6.4c0 3.2-2.4 5.2-5.6 5.2s-5.2-1.6-6.6-4.2L6 14.6a1.5 1.5 0 0 1 2.6-1.5z",
  trophy: "M8 3.6h8v2a4 4 0 0 1-2.4 3.6V13h1.6v1.6H8.8V13h1.6V9.2A4 4 0 0 1 8 5.6V3.6zM5.4 5.2H4.2v.6a2.8 2.8 0 0 0 2.6 2.6m10.4-3.2h1.2v.6a2.8 2.8 0 0 1-2.6 2.6",
  chart: "M4.4 19.6V4.4m0 15.2h15.2M8.2 15.6v-4.6m4 4.6V7.6m4 8v-3.4",
  sound: "M4.4 9.6h3.2l4-3.4v11.6l-4-3.4H4.4zM15.2 9.6a3.4 3.4 0 0 1 0 4.8M17.6 7.4a6.6 6.6 0 0 1 0 9.2",
  mute: "M4.4 9.6h3.2l4-3.4v11.6l-4-3.4H4.4zM16 9.6l4.6 4.8m0-4.8-4.6 4.8",
  trash: "M5.2 7.4h13.6M9.4 7.4V5.8h5.2v1.6M6.4 7.4l.7 10.8h9.8l.7-10.8M10.2 10.6v4.8m3.6-4.8v4.8",
};

export const ICON_NAMES = Object.keys(PATHS);

let spriteInjected = false;

export function injectSprite() {
  if (spriteInjected || typeof document === "undefined") return;
  spriteInjected = true;
  const symbols = ICON_NAMES.map(
    (n) => `<symbol id="ic-${n}" viewBox="0 0 24 24">${pathFor(n)}</symbol>`,
  ).join("");
  const el = document.createElement("div");
  el.id = "icon-sprite";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`;
  document.body.prepend(el);
}

function pathFor(name) {
  return `<path d="${PATHS[name]}"/>`;
}

// <i> es un slot de tamaño: em y línea se heredan del texto que acompaña.
export function icon(name, cls) {
  if (!PATHS[name]) return "";
  return `<svg class="i${cls ? ` ${cls}` : ""}" aria-hidden="true" focusable="false"><use href="#ic-${name}"/></svg>`;
}
