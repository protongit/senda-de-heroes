import { BALANCE } from "./balance-config.js";

function C(id, name, o) {
  return {
    id,
    name,
    type: o.type,
    subtype: o.subtype || "",
    tags: o.tags || [],
    level: o.level || 1,
    cost: o.cost || 0,
    value: o.value || 0,
    text: o.text || "",
    slot: o.slot || null,
    reqStr: o.reqStr || 0,
    mods: o.mods || null,
    effects: o.effects || [],
    marks: o.marks || [],
    curseEffects: o.curseEffects || [],
    onDraw: o.onDraw || null,
    duration: o.duration ?? null,
    reaction: o.reaction || null,
    scrap: !!o.scrap,
    art: `assets/cards/${id}.png`,
    icon: o.icon || "❔",
  };
}

export const CARDS = {
  sword_short: C("sword_short", "Espada Corta", { type: "equipment", subtype: "weapon", tags: ["sword", "oneHanded"], slot: "hand", mods: { damage: 3 }, value: 20, text: "+3 daño.", icon: "🗡️" }),
  axe_war: C("axe_war", "Hacha de Guerra", { type: "equipment", subtype: "weapon", tags: ["axe", "oneHanded", "heavy"], slot: "hand", reqStr: 5, mods: { damage: 4 }, value: 35, text: "+5 daño. Requiere fuerza 5.", icon: "🪓" }),
  bow_long: C("bow_long", "Arco Largo", { type: "equipment", subtype: "weapon", tags: ["bow", "twoHanded", "ranged"], slot: "hand", mods: { damage: 4 }, value: 30, text: "+4 daño. A dos manos: sustituye el arma y el escudo equipados.", icon: "🏹" }),
  dagger_elf: C("dagger_elf", "Daga Élfica", { type: "equipment", subtype: "weapon", tags: ["sword", "oneHanded"], slot: "hand", mods: { damage: 3 }, value: 22, text: "+3 daño. Ligera y precisa.", icon: "🗡️" }),
  staff_arcane: C("staff_arcane", "Bastón Arcano", { type: "equipment", subtype: "weapon", tags: ["staff", "twoHanded"], slot: "hand", mods: { damage: 2, energy: 1 }, value: 30, text: "+2 daño y +1 energía. A dos manos.", icon: "🪄" }),
  shield_round: C("shield_round", "Escudo Redondo", { type: "equipment", subtype: "shield", tags: ["shield", "oneHanded"], slot: "hand", mods: { block: 2 }, value: 18, text: "+2 bloqueo.", icon: "🛡️" }),
  shield_oak: C("shield_oak", "Escudo de Roble", { type: "equipment", subtype: "shield", tags: ["shield", "oneHanded", "heavy"], slot: "hand", reqStr: 5, mods: { block: 2 }, value: 32, text: "+2 bloqueo. Requiere fuerza 5.", icon: "🛡️" }),
  armor_leather: C("armor_leather", "Armadura de Piel", { type: "equipment", subtype: "armor", tags: ["leather"], slot: "body", mods: { block: 1 }, value: 22, text: "+1 bloqueo.", icon: "🥋" }),
  armor_chain: C("armor_chain", "Cota de Malla", { type: "equipment", subtype: "armor", tags: ["plate", "heavy"], slot: "body", reqStr: 5, mods: { block: 1 }, value: 40, text: "+1 bloqueo. Requiere fuerza 5.", icon: "⛓️" }),
  robe_runic: C("robe_runic", "Túnica Rúnica", { type: "equipment", subtype: "armor", tags: ["cloth"], slot: "body", mods: { block: 1, energy: 1 }, value: 28, text: "+1 bloqueo y +1 energía.", icon: "🧥" }),
  helm_iron: C("helm_iron", "Casco de Hierro", { type: "equipment", subtype: "helmet", tags: ["plate"], slot: "head", mods: { block: 1 }, value: 15, text: "+1 bloqueo.", icon: "⛑️" }),
  boots_leather: C("boots_leather", "Botas de Cuero", { type: "equipment", subtype: "boots", tags: ["leather"], slot: "feet", mods: { block: 1 }, value: 12, text: "+1 bloqueo.", icon: "🥾" }),
  amulet_arcane: C("amulet_arcane", "Amuleto Arcano", { type: "equipment", subtype: "amulet", tags: [], slot: "neck", mods: { energy: 1 }, value: 25, text: "+1 energía por ronda.", icon: "📿" }),
  cloak_scout: C("cloak_scout", "Capa de Exploradora", { type: "equipment", subtype: "cloak", tags: ["cloth"], slot: "back", mods: { block: 2 }, value: 14, text: "+2 bloqueo.", icon: "🧣" }),
  circlet_arcane: C("circlet_arcane", "Diadema Arcana", { type: "equipment", subtype: "helmet", tags: ["cloth"], slot: "head", mods: { damage: 1 }, value: 18, text: "+1 daño.", icon: "👑" }),

  food: C("food", "Comida", { type: "resource", subtype: "food", effects: [{ kind: "heal", value: 6 }], value: 8, text: "Cura 6.", icon: "🍖" }),
  water: C("water", "Agua", { type: "resource", subtype: "drink", effects: [{ kind: "heal", value: 4 }], value: 6, text: "Cura 4.", icon: "🥛" }),
  potion: C("potion", "Poción", { type: "resource", subtype: "potion", effects: [{ kind: "heal", value: 10 }], value: 16, text: "Cura 10.", icon: "🧪" }),
  beer: C("beer", "Cerveza", { type: "resource", subtype: "drink", effects: [{ kind: "heal", value: 6 }], value: 10, text: "Cura 6 y da ánimos.", icon: "🍺" }),
  bread: C("bread", "Pan de Viaje", { type: "resource", subtype: "food", effects: [{ kind: "heal", value: 5 }], value: 8, text: "Cura 5.", icon: "🍞" }),

  shield_bash: C("shield_bash", "Golpe de Escudo", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 7 }, { kind: "block", value: 4 }], value: 15, text: "7 daño y 4 bloqueo.", icon: "💥" }),
  feint: C("feint", "Finta", { type: "skill", subtype: "defense", effects: [{ kind: "block", value: 5 }, { kind: "draw", value: 1 }], value: 14, text: "5 bloqueo y roba 1.", icon: "🌀" }),
  dodge: C("dodge", "Esquiva", { type: "skill", subtype: "defense", effects: [{ kind: "block", value: 7 }], value: 12, text: "7 bloqueo.", icon: "💨" }),
  lunge: C("lunge", "Estocada", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 9 }], value: 14, text: "9 daño.", icon: "🗡️" }),
  war_cry: C("war_cry", "Grito de Guerra", { type: "skill", subtype: "buff", effects: [{ kind: "strength", value: 2 }], value: 20, text: "+2 fuerza este combate.", icon: "📣" }),
  ram: C("ram", "Embate", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 10 }], value: 16, text: "10 daño.", icon: "💢" }),
  fortify: C("fortify", "Fortificar", { type: "skill", subtype: "defense", effects: [{ kind: "block", value: 9 }], value: 16, text: "9 bloqueo.", icon: "🧱" }),
  endurance: C("endurance", "Aguante", { type: "skill", subtype: "defense", effects: [{ kind: "heal", value: 5 }, { kind: "block", value: 4 }], value: 15, text: "Cura 5 y 4 bloqueo.", icon: "🛡️" }),
  whirlwind: C("whirlwind", "Torbellino", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 8 }, { kind: "block", value: 4 }], value: 16, text: "8 daño y 4 bloqueo.", icon: "🌪️" }),
  battle_cry: C("battle_cry", "Grito de Batalla", { type: "skill", subtype: "buff", effects: [{ kind: "strength", value: 2 }, { kind: "draw", value: 1 }], value: 22, text: "+2 fuerza y roba 1.", icon: "📢" }),

  fireball: C("fireball", "Bola de Fuego", { type: "skill", subtype: "spell", cost: 1, effects: [{ kind: "damage", value: 11 }], value: 22, text: "11 daño. Cuesta 1 energía.", icon: "🔥" }),
  arcane_shield: C("arcane_shield", "Escudo Arcano", { type: "skill", subtype: "spell", cost: 1, effects: [{ kind: "block", value: 8 }], value: 20, text: "10 bloqueo. Cuesta 1 energía.", icon: "🔮" }),
  drain: C("drain", "Drenaje", { type: "skill", subtype: "spell", cost: 1, effects: [{ kind: "damage", value: 6 }, { kind: "heal", value: 4 }], value: 24, text: "6 daño y cura 6. Cuesta 1 energía.", icon: "🩸" }),
  lightning: C("lightning", "Rayo", { type: "skill", subtype: "spell", cost: 2, effects: [{ kind: "damage", value: 16 }], value: 30, text: "16 daño. Cuesta 2 energía.", icon: "⚡" }),
  minor_bolt: C("minor_bolt", "Rayo Menor", { type: "skill", subtype: "spell", cost: 1, effects: [{ kind: "damage", value: 7 }], value: 14, text: "7 daño. Cuesta 1 energía.", icon: "✨" }),
  sure_shot: C("sure_shot", "Disparo Certero", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 8 }], value: 14, text: "8 daño.", icon: "🎯" }),
  shadow_step: C("shadow_step", "Paso Sombra", { type: "skill", subtype: "defense", effects: [{ kind: "block", value: 5 }, { kind: "draw", value: 1 }], value: 14, text: "5 bloqueo y roba 1.", icon: "🌫️" }),
  arrow_rain: C("arrow_rain", "Lluvia de Flechas", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 10 }], value: 18, text: "10 daño.", icon: "🏹" }),
  hunter_mark: C("hunter_mark", "Marca del Cazador", { type: "skill", subtype: "debuff", effects: [{ kind: "vulnerable", value: 2 }], value: 18, text: "El enemigo recibe +50% daño 2 turnos.", icon: "🔻" }),
  sting: C("sting", "Punzada", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 6 }, { kind: "draw", value: 1 }], value: 15, text: "6 daño y roba 1.", icon: "🐝" }),

  poison_vial: C("poison_vial", "Vial Venenoso", { type: "effect", subtype: "debuff", effects: [{ kind: "poison", value: 4 }], duration: 3, value: 18, text: "Veneno: 4 de daño por ronda al enemigo durante 3 rondas (ignora bloqueo).", icon: "🧴" }),
  blessing_war: C("blessing_war", "Bendición de Guerra", { type: "effect", subtype: "blessing", effects: [{ kind: "bonusDamage", value: 3 }], duration: 3, value: 18, text: "+3 de daño durante 3 rondas.", icon: "🙏" }),
  curse_weak: C("curse_weak", "Maldición de Debilidad", { type: "effect", subtype: "curse", effects: [{ kind: "weaken", value: 33 }], duration: 2, value: 20, text: "El enemigo inflige un 33% menos de daño durante 2 rondas.", icon: "☠️" }),
  regen_brew: C("regen_brew", "Brebaje Regenerativo", { type: "effect", subtype: "blessing", effects: [{ kind: "regen", value: 3 }], duration: 3, value: 16, text: "Regeneras 3 de vida por ronda durante 3 rondas.", icon: "🧉" }),
  curse_languor: C("curse_languor", "Maldición de Languidez", { type: "effect", subtype: "curse", effects: [{ kind: "fewerActions", value: 1 }], duration: 2, value: 0, text: "Maldición: -1 acción por ronda durante 2 rondas.", icon: "⛓️" }),
  last_fury: C("last_fury", "Furia Final", { type: "skill", subtype: "buff", scrap: true, effects: [{ kind: "strength", value: 3 }, { kind: "damage", value: 12 }], value: 30, text: "Consumir: +3 fuerza y 12 de daño. Se retira del mazo.", icon: "🔥" }),

  counter_attack: C("counter_attack", "Contraataque", { type: "skill", subtype: "reaction", reaction: { trigger: ["enemy_attack"] }, effects: [{ kind: "damage", value: 8 }], value: 18, text: "Reacción (si el enemigo ataca): 8 de daño. Cuesta 1 acción el próximo turno.", icon: "↩️" }),
  intercept: C("intercept", "Interposición", { type: "skill", subtype: "reaction", reaction: { trigger: ["enemy_attack"] }, effects: [{ kind: "block", value: 8 }], value: 16, text: "Reacción (si el enemigo ataca): 8 de bloqueo. Cuesta 1 acción el próximo turno.", icon: "⛨" }),
  disrupt: C("disrupt", "Cortar el Trance", { type: "skill", subtype: "reaction", reaction: { trigger: ["enemy_buff", "enemy_defend"] }, effects: [{ kind: "weaken", value: 25 }], duration: 2, value: 20, text: "Reacción (si se potencia o defiende): el enemigo hace -25% daño durante 2 rondas. Cuesta 1 acción el próximo turno.", icon: "🔇" }),

  quick_cut: C("quick_cut", "Corte Rápido", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 4 }, { kind: "draw", value: 1 }], value: 12, text: "4 daño y roba 1.", icon: "✂️" }),
  slash_under: C("slash_under", "Tajo Bajo", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 5 }, { kind: "vulnerable", value: 1 }], value: 16, text: "5 daño y el enemigo queda vulnerable 1 turno.", icon: "🪒" }),
  shield_wall: C("shield_wall", "Muro de Escudos", { type: "skill", subtype: "defense", effects: [{ kind: "block", value: 12 }], value: 22, text: "12 bloqueo.", icon: "🧱" }),
  fierce_charge: C("fierce_charge", "Embestida", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 13 }], value: 24, text: "13 daño.", icon: "🐂" }),
  cat_reflex: C("cat_reflex", "Reflejos Felinos", { type: "skill", subtype: "reaction", reaction: { trigger: ["enemy_attack"] }, effects: [{ kind: "draw", value: 2 }], value: 20, text: "Reacción (si el enemigo ataca): roba 2 cartas. Cuesta 1 acción el próximo turno.", icon: "🐈" }),
  web_shot: C("web_shot", "Telaraña", { type: "skill", subtype: "reaction", reaction: { trigger: ["enemy_buff", "enemy_defend"] }, effects: [{ kind: "poison", value: 2 }], duration: 3, value: 20, text: "Reacción (si se potencia o defiende): 2 de veneno/ronda al enemigo durante 3 rondas. Cuesta 1 acción el próximo turno.", icon: "🕸️" }),

  sun_bless: C("sun_bless", "Bendición Solar", { type: "effect", subtype: "blessing", effects: [{ kind: "bonusBlock", value: 3 }], duration: 2, value: 18, text: "+3 de bloqueo al empezar cada ronda durante 2 rondas.", icon: "☀️" }),
  growing_fury: C("growing_fury", "Furia Creciente", { type: "effect", subtype: "blessing", effects: [{ kind: "bonusDamage", value: 2 }], duration: 4, value: 22, text: "+2 de daño durante 4 rondas.", icon: "🔥" }),
  purge_potion: C("purge_potion", "Poción Purgativa", { type: "effect", subtype: "blessing", effects: [{ kind: "regen", value: 5 }], duration: 2, value: 18, text: "Regeneras 5 de vida por ronda durante 2 rondas.", icon: "🍶" }),
  stigma: C("stigma", "Estigma Sombrío", { type: "effect", subtype: "curse", effects: [{ kind: "weaken", value: 25 }], duration: 3, value: 24, text: "El enemigo inflige un 25% menos de daño durante 3 rondas.", icon: "🖤" }),
  blast_charge: C("blast_charge", "Carga Explosiva", { type: "skill", subtype: "attack", scrap: true, effects: [{ kind: "damage", value: 16 }], value: 26, text: "Consumir: 16 de daño. Se retira del mazo.", icon: "💣" }),

  gauntlets_iron: C("gauntlets_iron", "Guanteletes de Hierro", { type: "equipment", subtype: "shield", tags: ["heavy", "oneHanded"], slot: "hand", reqStr: 5, mods: { block: 2 }, value: 30, text: "+2 bloqueo. Requiere fuerza 5.", icon: "🧤" }),
  ring_might: C("ring_might", "Anillo de Poder", { type: "equipment", subtype: "ring", tags: [], slot: "ring", mods: { damage: 1 }, value: 28, text: "+1 daño.", icon: "💍" }),
  boots_swift: C("boots_swift", "Botas Ligeras", { type: "equipment", subtype: "boots", tags: ["leather"], slot: "feet", mods: { block: 1, energy: 1 }, value: 32, text: "+1 bloqueo y +1 energía.", icon: "👢" }),
  mage_cloak: C("mage_cloak", "Capa del Mago", { type: "equipment", subtype: "cloak", tags: ["cloth"], slot: "back", mods: { energy: 1 }, value: 30, text: "+1 energía por ronda.", icon: "🧙" }),
  plate_h: C("plate_h", "Coraza de Placas", { type: "equipment", subtype: "armor", tags: ["plate", "heavy"], slot: "body", reqStr: 6, mods: { block: 2 }, value: 45, text: "+2 bloqueo. Requiere fuerza 6.", icon: "🛡" }),
  reaper_scythe: C("reaper_scythe", "Guadaña", { type: "equipment", subtype: "weapon", tags: ["heavy", "twoHanded"], slot: "hand", reqStr: 6, mods: { damage: 5 }, value: 42, text: "+5 daño. A dos manos. Requiere fuerza 6.", icon: "☠️" }),

  gema_fuego: C("gema_fuego", "Gema de Fuego", { type: "effect", subtype: "gem", effects: [{ kind: "bonusDamage", value: 2 }], value: 14, text: "Gema de engarce: +2 de daño permanente al fusionarla a un equipo.", icon: "💎" }),
  gema_hielo: C("gema_hielo", "Gema de Hielo", { type: "effect", subtype: "gem", effects: [{ kind: "weaken", value: 20 }], value: 14, text: "Gema de engarce: el enemigo equipado inflige un 20% menos de daño, permanente.", icon: "❄️" }),
  gema_vida: C("gema_vida", "Gema Vital", { type: "effect", subtype: "gem", effects: [{ kind: "regen", value: 2 }], value: 12, text: "Gema de engarce: regeneras 2 de vida por ronda, permanente al fusionarla.", icon: "💚" }),
  runa_guarda: C("runa_guarda", "Runa de Guarda", { type: "effect", subtype: "rune", effects: [{ kind: "bonusBlock", value: 2 }], value: 12, text: "Runa de engarce: +2 de bloqueo por ronda, permanente al fusionarla.", icon: "🔮" }),
  runa_poder: C("runa_poder", "Runa de Poder", { type: "effect", subtype: "rune", effects: [{ kind: "bonusDamage", value: 3 }], value: 15, text: "Runa de engarce: +3 de daño permanente al fusionarla a un equipo.", icon: "⚡" }),
  runa_terror: C("runa_terror", "Runa del Terror", { type: "effect", subtype: "rune", effects: [{ kind: "poison", value: 2 }], value: 12, text: "Runa de engarce: 2 de veneno/ronda al enemigo, permanente al fusionarla.", icon: "🌑" }),

  // Maldiciones de mazo: no se juegan; se exorcizan con el hechicero.
  curse_deadweight: C("curse_deadweight", "Peso Muerto", { type: "curse", subtype: "burden", value: 0, text: "Maldición: no se puede jugar. Exorcízala en la tienda.", icon: "🪨" }),
  curse_lich_whisper: C("curse_lich_whisper", "Susurro del Lich", { type: "curse", subtype: "burden", value: 0, onDraw: { actions: 1 }, text: "Maldición: al robarla pierdes 1 acción. Exorcízala en la tienda.", icon: "🌑" }),
  curse_open_wound: C("curse_open_wound", "Herida Abierta", { type: "curse", subtype: "burden", value: 0, onDraw: { damage: 2 }, text: "Maldición: al robarla recibes 2 de daño. Exorcízala en la tienda.", icon: "🩸" }),

  // Reliquias: equipo con slot propio, una activa, beneficio fuerte + maldición.
  relic_troll_heart: C("relic_troll_heart", "Corazón de Trol", {
    type: "equipment", subtype: "relic", slot: "relic", value: 60, icon: "🫀",
    effects: [{ kind: "regen", value: 2 }], curseEffects: [{ kind: "weaken", value: 20 }],
    text: "Regeneras 2/ronda. Maldición: infliges un 20% menos de daño.",
  }),
  relic_lich_eye: C("relic_lich_eye", "Ojo del Lich", {
    type: "equipment", subtype: "relic", slot: "relic", value: 65, icon: "👁️",
    mods: { damage: 3 }, curseEffects: [{ kind: "selfDamage", value: 3 }],
    text: "+3 daño. Maldición: recibes 3 de daño al empezar el combate.",
  }),
  relic_obsidian_bastion: C("relic_obsidian_bastion", "Bastión de Obsidiana", {
    type: "equipment", subtype: "relic", slot: "relic", value: 55, icon: "🛡️",
    effects: [{ kind: "block", value: 4 }], curseEffects: [{ kind: "fewerActions", value: 1, duration: 1 }],
    text: "+4 bloqueo al empezar el combate. Maldición: -1 acción en la primera ronda.",
  }),
  relic_moon_chalice: C("relic_moon_chalice", "Cáliz de la Luna", {
    type: "equipment", subtype: "relic", slot: "relic", value: 70, icon: "🏺",
    effects: [{ kind: "bonusActions", value: 1 }], curseEffects: [{ kind: "poison", value: 2 }],
    text: "+1 acción por ronda. Maldición: 2 de veneno por ronda sobre ti.",
  }),
  relic_thorn_crown: C("relic_thorn_crown", "Corona de Espinas", {
    type: "equipment", subtype: "relic", slot: "relic", value: 58, icon: "👑",
    mods: { damage: 3 }, curseEffects: [{ kind: "poison", value: 1 }],
    text: "+3 daño. Maldición: 1 de veneno por ronda sobre ti.",
  }),
  relic_ashen_gauntlet: C("relic_ashen_gauntlet", "Guantelete de Ceniza", {
    type: "equipment", subtype: "relic", slot: "relic", value: 52, icon: "🧤",
    mods: { damage: 2, block: 1 }, curseEffects: [{ kind: "weaken", value: 15 }],
    text: "+2 daño y +1 bloqueo. Maldición: infliges un 15% menos de daño.",
  }),

  // Cartas elementales nuevas (no modifican las existentes).
  bleed_cut: C("bleed_cut", "Corte Abierto", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 6 }], marks: [{ kind: "bleed", value: 1, duration: 2 }], value: 16, text: "6 daño y aplica Sangrado 2 rondas.", icon: "🩸" }),
  sunder: C("sunder", "Fractura", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 5 }], marks: [{ kind: "fracture", value: 1, duration: 2 }], value: 16, text: "5 daño y aplica Fractura 2 rondas.", icon: "💥" }),
  blood_ritual: C("blood_ritual", "Sangría", { type: "skill", subtype: "buff", effects: [{ kind: "draw", value: 1 }], marks: [{ kind: "bleed", value: 2, duration: 3 }], value: 18, text: "Roba 1 y aplica Sangrado 3 rondas.", icon: "🩸" }),
  forge_hammer: C("forge_hammer", "Martillo de Forja", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 7 }], marks: [{ kind: "burn", value: 1, duration: 2 }], value: 20, text: "7 daño y aplica Quemadura 2 rondas.", icon: "🔨" }),
  anvil_slam: C("anvil_slam", "Golpe de Yunque", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 5 }], marks: [{ kind: "fracture", value: 1, duration: 2 }], value: 18, text: "5 daño y aplica Fractura 2 rondas.", icon: "⚒️" }),
  molten_armor: C("molten_armor", "Malla Fundida", { type: "skill", subtype: "defense", effects: [{ kind: "block", value: 4 }], marks: [{ kind: "burn", value: 1, duration: 2 }], value: 18, text: "4 bloqueo y aplica Quemadura 2 rondas.", icon: "🔥" }),
  frost_bolt: C("frost_bolt", "Descarga de Escarcha", { type: "skill", subtype: "spell", cost: 1, effects: [{ kind: "damage", value: 5 }], marks: [{ kind: "frozen", value: 1, duration: 2 }], value: 22, text: "5 daño y aplica Escarcha 2 rondas. Cuesta 1 energía.", icon: "❄️" }),
  static_arc: C("static_arc", "Arco Estático", { type: "skill", subtype: "spell", cost: 1, effects: [{ kind: "damage", value: 5 }], marks: [{ kind: "shock", value: 1, duration: 2 }], value: 22, text: "5 daño y aplica Electrizado 2 rondas. Cuesta 1 energía.", icon: "⚡" }),
  ember: C("ember", "Brasa", { type: "skill", subtype: "spell", effects: [{ kind: "damage", value: 3 }], marks: [{ kind: "burn", value: 1, duration: 2 }], value: 14, text: "3 daño y aplica Quemadura 2 rondas.", icon: "🔥" }),
  thermal_lance: C("thermal_lance", "Lanza Térmica", { type: "skill", subtype: "spell", cost: 2, effects: [{ kind: "damage", value: 8 }], marks: [{ kind: "burn", value: 1, duration: 2 }, { kind: "frozen", value: 1, duration: 2 }], value: 28, text: "8 daño, Quemadura y Escarcha: detona Choque térmico. Cuesta 2 energía.", icon: "🌡️" }),
  gale_arrow: C("gale_arrow", "Flecha de Vendaval", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 5 }], marks: [{ kind: "wind", value: 1, duration: 2 }], value: 18, text: "5 daño y aplica Viento 2 rondas.", icon: "🌪️" }),
  toxic_shot: C("toxic_shot", "Disparo Tóxico", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 3 }, { kind: "poison", value: 2 }], duration: 3, value: 18, text: "3 daño y 2 de veneno durante 3 rondas.", icon: "🧴" }),
  serrated_arrow: C("serrated_arrow", "Flecha Dentada", { type: "skill", subtype: "attack", effects: [{ kind: "damage", value: 4 }], marks: [{ kind: "bleed", value: 1, duration: 2 }], value: 16, text: "4 daño y aplica Sangrado 2 rondas.", icon: "🏹" }),

  // Cartas de clase para cooperativo (solo mazos de duelo).
  taunt_war: C("taunt_war", "Provocar", { type: "skill", subtype: "defense", effects: [{ kind: "block", value: 5 }, { kind: "taunt", value: 5 }], value: 18, text: "5 bloqueo. En coop, el enemigo te ataca el próximo turno.", icon: "📢" }),
  clan_guard: C("clan_guard", "Guardia del Clan", { type: "skill", subtype: "defense", effects: [{ kind: "block", value: 6 }, { kind: "guard", value: 6 }], value: 18, text: "6 bloqueo. En coop, redirige el próximo ataque contra un aliado hacia ti.", icon: "🛡️" }),
  arcane_veil: C("arcane_veil", "Distracción Arcana", { type: "skill", subtype: "spell", cost: 1, effects: [{ kind: "block", value: 4 }, { kind: "taunt", value: 4 }], value: 20, text: "4 bloqueo. En coop, provoca al enemigo. Cuesta 1 energía.", icon: "🔮" }),
  elf_rescue: C("elf_rescue", "Rescate del Bosque", { type: "skill", subtype: "heal", effects: [{ kind: "heal", value: 4 }, { kind: "rescue", value: 5 }], value: 20, text: "Cura 4. En coop, revive a un aliado caído con 5 de vida.", icon: "🌿" }),
};

// Cartas nuevas sin arte generado: la UI usa el emoji de respaldo (sin 404).
const NO_ART = [
  "curse_deadweight", "curse_lich_whisper", "curse_open_wound",
  "relic_troll_heart", "relic_lich_eye", "relic_obsidian_bastion",
  "relic_moon_chalice", "relic_thorn_crown", "relic_ashen_gauntlet",
  "bleed_cut", "sunder", "blood_ritual", "forge_hammer", "anvil_slam",
  "molten_armor", "frost_bolt", "static_arc", "ember", "thermal_lance",
  "gale_arrow", "toxic_shot", "serrated_arrow",
  "taunt_war", "clan_guard", "arcane_veil", "elf_rescue",
];
for (const id of NO_ART) if (CARDS[id]) CARDS[id].art = "";

export function getCard(id) {
  const card = CARDS[id];
  if (!card) throw new Error(`Carta desconocida: ${id}`);
  return { ...card };
}

export function makeInstance(cardId, uid) {
  return { uid, cardId, upgrade: 0, fusedEffectId: null };
}

export function instanceKey(inst) {
  return `${inst.cardId}|${inst.upgrade ? 1 : 0}|${inst.fusedEffectId || ""}`;
}

export function resolveCard(inst) {
  if (typeof inst === "string") inst = { cardId: inst };
  const base = CARDS[inst.cardId];
  if (!base) throw new Error(`Carta desconocida: ${inst.cardId}`);
  const card = {
    ...base,
    effects: base.effects.map((e) => ({ ...e })),
    marks: (base.marks || []).map((m) => ({ ...m })),
    curseEffects: (base.curseEffects || []).map((e) => ({ ...e })),
    onDraw: base.onDraw ? { ...base.onDraw } : null,
    mods: base.mods ? { ...base.mods } : null,
    uid: inst.uid ?? null,
    upgrade: !!inst.upgrade,
    fusedEffectId: inst.fusedEffectId || null,
  };
  if (card.upgrade) {
    const f = BALANCE.upgradeFactor;
    card.value = Math.floor(card.value * f);
    if (card.mods) for (const k of Object.keys(card.mods)) card.mods[k] = k === "energy" ? card.mods[k] : Math.ceil(card.mods[k] * f);
    card.effects = card.effects.map((e) => ({ ...e, value: Math.ceil((e.value || 0) * f) }));
    card.marks = (card.marks || []).map((m) => ({ ...m, value: Math.ceil((m.value || 1) * f) }));
    card.text = `${card.text} ⭐Mejorada.`;
  }
  if (card.fusedEffectId) {
    const eff = CARDS[card.fusedEffectId];
    if (!eff) throw new Error(`Efecto desconocido: ${card.fusedEffectId}`);
    card.fused = {
      id: eff.id,
      name: eff.name,
      icon: eff.icon,
      text: eff.text,
      effects: eff.effects.map((e) => ({ ...e })),
      duration: eff.duration,
    };
  }
  return card;
}
