export const CHARACTERS = {
  warrior: {
    id: "warrior",
    name: "Guerrero",
    title: "Veterano de la Marca",
    arcane: false,
    energyPerRound: 0,
    actionsPerRound: 3,
    base: { hp: 114, energy: 0, str: 7 },
    icon: "⚔️",
    portrait: "assets/portraits/warrior.png",
    capacity: { head: 1, body: 1, feet: 1, neck: 1, ring: 1, back: 1, relic: 1, hands: 2, allowedArmor: ["leather", "plate"], allowBow: true, allowShield: true, allowTwoHanded: true },
    startingDeck: ["sword_short", "armor_leather", "shield_round", "helm_iron", "food", "water", "shield_bash", "feint", "dodge", "lunge", "war_cry", "ram"],
    duelCards: ["bleed_cut", "sunder", "taunt_war"],
  },
  dwarf: {
    id: "dwarf",
    name: "Enano",
    title: "Defensor de las Cuevas",
    arcane: false,
    energyPerRound: 0,
    actionsPerRound: 3,
    base: { hp: 44, energy: 0, str: 5 },
    icon: "🛡️",
    portrait: "assets/portraits/dwarf.png",
    capacity: { head: 1, body: 1, feet: 1, neck: 1, ring: 1, back: 1, relic: 1, hands: 2, allowedArmor: ["leather", "plate"], allowBow: false, allowShield: true, allowTwoHanded: true },
    startingDeck: ["axe_war", "armor_chain", "shield_oak", "boots_leather", "beer", "food", "ram", "shield_bash", "dodge", "whirlwind", "battle_cry", "fortify"],
    duelCards: ["forge_hammer", "anvil_slam", "clan_guard"],
  },
  sorceress: {
    id: "sorceress",
    name: "Hechicera",
    title: "Tejedora de Arcanos",
    arcane: true,
    energyPerRound: 2,
    actionsPerRound: 4,
    base: { hp: 56, energy: 2, str: 2 },
    icon: "🔮",
    portrait: "assets/portraits/sorceress.png",
    capacity: { head: 1, body: 1, feet: 1, neck: 1, ring: 1, back: 1, relic: 1, hands: 2, allowedArmor: ["cloth"], allowBow: false, allowShield: false, allowTwoHanded: true },
    startingDeck: ["staff_arcane", "robe_runic", "amulet_arcane", "circlet_arcane", "potion", "potion", "fireball", "arcane_shield", "drain", "lightning", "minor_bolt", "shadow_step"],
    duelCards: ["frost_bolt", "static_arc", "arcane_veil"],
  },
  elf: {
    id: "elf",
    name: "Elfa",
    title: "Guardiana del Bosque",
    arcane: true,
    energyPerRound: 2,
    actionsPerRound: 4,
    base: { hp: 104, energy: 2, str: 4 },
    icon: "🏹",
    portrait: "assets/portraits/elf.png",
    capacity: { head: 1, body: 1, feet: 1, neck: 1, ring: 1, back: 1, relic: 1, hands: 2, allowedArmor: ["cloth", "leather"], allowBow: true, allowShield: true, allowTwoHanded: true },
    startingDeck: ["bow_long", "cloak_scout", "dagger_elf", "armor_leather", "bread", "water", "sure_shot", "shadow_step", "arrow_rain", "hunter_mark", "sting", "sting"],
    duelCards: ["gale_arrow", "toxic_shot", "elf_rescue"],
  },
};

export function getCharacter(id) {
  const c = CHARACTERS[id];
  if (!c) throw new Error(`Héroe desconocido: ${id}`);
  return c;
}
