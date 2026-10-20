export const DROP_POOLS = {
  common: ["armor_leather", "shield_round", "helm_iron", "boots_leather", "sword_short", "food", "water", "dodge", "lunge", "regen_brew", "circlet_arcane", "quick_cut", "gema_fuego", "gema_vida", "runa_guarda", "bleed_cut", "ember", "serrated_arrow"],
  uncommon: ["cloak_scout", "dagger_elf", "amulet_arcane", "potion", "arcane_shield", "shield_bash", "sting", "shadow_step", "endurance", "poison_vial", "blessing_war", "counter_attack", "intercept", "slash_under", "cat_reflex", "sun_bless", "purge_potion", "ring_might", "gema_hielo", "runa_poder", "runa_terror", "sunder", "blood_ritual", "forge_hammer", "anvil_slam", "molten_armor", "frost_bolt", "static_arc", "gale_arrow", "toxic_shot"],
  rare: ["axe_war", "shield_oak", "armor_chain", "robe_runic", "staff_arcane", "fireball", "lightning", "whirlwind", "arrow_rain", "war_cry", "curse_weak", "disrupt", "last_fury", "shield_wall", "fierce_charge", "web_shot", "growing_fury", "stigma", "gauntlets_iron", "boots_swift", "mage_cloak", "thermal_lance", "relic_obsidian_bastion", "relic_ashen_gauntlet", "relic_thorn_crown"],
  epic: ["bow_long", "battle_cry", "hunter_mark", "drain", "feint", "fortify", "ram", "last_fury", "blessing_war", "blast_charge", "plate_h", "reaper_scythe", "relic_troll_heart", "relic_lich_eye", "relic_moon_chalice"],
};

export function rollDrops(enemyDef, rng) {
  const found = [];
  for (const drop of enemyDef.rewards.drops) {
    if (rng.chance(drop.chance)) {
      const pool = DROP_POOLS[drop.tier] || DROP_POOLS.common;
      const valid = pool.filter(Boolean);
      if (valid.length) found.push(rng.pick(valid));
    }
  }
  return found;
}

export function rollCoins(enemyDef, rng) {
  const [min, max] = enemyDef.rewards.coins;
  return rng.int(min, max);
}
