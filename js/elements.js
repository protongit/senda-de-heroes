export const MARK_META = {
  burn: { id: "burn", name: "Quemadura", icon: "🔥", cls: "mark-burn" },
  bleed: { id: "bleed", name: "Sangrado", icon: "🩸", cls: "mark-bleed" },
  fracture: { id: "fracture", name: "Fractura", icon: "💥", cls: "mark-fracture" },
  frozen: { id: "frozen", name: "Escarcha", icon: "❄️", cls: "mark-frozen" },
  shock: { id: "shock", name: "Electrizado", icon: "⚡", cls: "mark-shock" },
  wind: { id: "wind", name: "Viento", icon: "🌪️", cls: "mark-wind" },
  poison: { id: "poison", name: "Veneno", icon: "🧴", cls: "mark-poison" },
};

export const MARK_KINDS = Object.keys(MARK_META);

export function isMark(kind) {
  return !!MARK_META[kind];
}

export function markMeta(kind) {
  return MARK_META[kind] || { id: kind, name: kind, icon: "✦", cls: "" };
}

// Cada reacción consume una marca de cada tipo. La potencia escala con el valor
// de las marcas consumidas para que preparar marcas fuertes merezca la pena.
export const REACTIONS = [
  {
    id: "hemorrhage",
    a: "bleed",
    b: "fracture",
    name: "Hemorragia",
    icon: "🩸",
    base: 10,
    scale: 2,
    effects: [{ kind: "damage" }],
    text: "La herida se abre: hemorragia.",
  },
  {
    id: "forge",
    a: "burn",
    b: "fracture",
    name: "Forja",
    icon: "🔥",
    base: 8,
    scale: 2,
    effects: [{ kind: "damage" }, { kind: "weaken", value: 20 }],
    text: "El metal roto arde y el enemigo pierde fuerza.",
  },
  {
    id: "explosion",
    a: "burn",
    b: "poison",
    name: "Explosión",
    icon: "💥",
    base: 10,
    scale: 2,
    effects: [{ kind: "damage" }],
    text: "El veneno prende: explosión.",
  },
  {
    id: "thermal",
    a: "burn",
    b: "frozen",
    name: "Choque térmico",
    icon: "🌡️",
    base: 8,
    scale: 2,
    effects: [{ kind: "damage" }, { kind: "vulnerable", value: 1 }],
    text: "Fuego y hielo se rompen mutuamente.",
  },
  {
    id: "overload",
    a: "frozen",
    b: "shock",
    name: "Sobrecarga",
    icon: "⚡",
    base: 5,
    scale: 1,
    effects: [{ kind: "damage" }, { kind: "stun" }],
    text: "La escarcha conduce la descarga: el enemigo queda aturdido.",
  },
  {
    id: "plasma",
    a: "burn",
    b: "shock",
    name: "Plasma",
    icon: "✨",
    base: 10,
    scale: 2,
    effects: [{ kind: "damage" }],
    text: "Fuego y rayo se funden en plasma.",
  },
  {
    id: "toxic_cloud",
    a: "poison",
    b: "wind",
    name: "Nube tóxica",
    icon: "🌫️",
    base: 6,
    scale: 1,
    effects: [{ kind: "damage" }, { kind: "poison", value: 2, duration: 2 }],
    text: "El viento esparce el veneno.",
  },
  {
    id: "infection",
    a: "bleed",
    b: "poison",
    name: "Infección",
    icon: "🦠",
    base: 7,
    scale: 1,
    effects: [{ kind: "damage" }, { kind: "poison", value: 1, duration: 2 }],
    text: "La sangre envenenada corre.",
  },
  {
    id: "storm",
    a: "shock",
    b: "wind",
    name: "Tormenta",
    icon: "⛈️",
    base: 8,
    scale: 1,
    effects: [{ kind: "damage" }, { kind: "draw", value: 1 }],
    text: "El vendaval arrastra la chispa.",
  },
];

export function findReaction(entries) {
  for (const reaction of REACTIONS) {
    const a = entries.find((e) => e.kind === reaction.a);
    const b = entries.find((e) => e.kind === reaction.b);
    if (a && b && a !== b) return { reaction, a, b };
  }
  return null;
}

export function reactionDamage(reaction, a, b) {
  return reaction.base + reaction.scale * ((a.value || 0) + (b.value || 0));
}

export function classMarksFor(heroId) {
  switch (heroId) {
    case "warrior":
      return ["bleed", "fracture"];
    case "dwarf":
      return ["burn", "fracture"];
    case "sorceress":
      return ["burn", "frozen", "shock"];
    case "elf":
      return ["poison", "wind", "bleed"];
    default:
      return [];
  }
}
