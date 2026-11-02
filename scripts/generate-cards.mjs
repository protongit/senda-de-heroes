import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { CARDS } from "../js/cards.js";
import { CHARACTERS } from "../js/characters.js";
import { ENEMIES } from "../js/enemies.js";

const STYLE =
  "medieval fantasy trading card game art, painterly digital illustration, dramatic warm lighting, rich saturated colors, ornate decorative border, centered composition, high detail, no text, no watermark";

const PATH_STYLE =
  "medieval fantasy trading card game art, painterly digital illustration, dramatic warm lighting, rich saturated colors, cinematic wide composition, high detail, no text, no watermark";

const PATH_PROMPTS = {
  combat: "a dramatic medieval battlefield with two crossed swords planted in the ground, distant castle banners and smoke, ominous sky",
  combat_goblin: "a goblin war band ambushing travelers on a dark forest road, wide cinematic composition, full figures, headroom",
  combat_lobo: "a pack of snarling dire wolves emerging from a snowy forest, wide cinematic composition, full figures, headroom",
  combat_esqueleto: "skeleton warriors with rusty swords rising in an ancient crypt, wide cinematic composition, full figures, headroom",
  combat_trol: "a massive mossy stone troll guarding a forest cave, wide cinematic composition, full figures, headroom",
  combat_nigromante: "a gaunt necromancer in dark robes casting green magic in a ritual chamber, wide cinematic composition, full figures, headroom",
  combat_senor_orco: "an orc warlord with a tall banner leading a warband on a smoky battlefield, wide cinematic composition, full figures, headroom",
  combat_lich: "an ancient lich king on a frozen throne with crown and glowing blue eyes, wide cinematic composition, full figures, headroom",
  shop: "a bustling medieval merchant stall with potions, scrolls, weapons and hanging lanterns, warm inviting light",
  treasure: "an ornate treasure chest overflowing with gold coins and glowing gems in a dark dungeon",
  forge: "a glowing blacksmith forge with an anvil, hammer and flying sparks in a stone workshop",
  challenge: "an ancient rune-covered wayshrine with a glowing magical portal in a misty forest, mysterious atmosphere",
};

const CARD_PROMPTS = {
  sword_short: "a short sword of polished steel with a leather grip on a stone ledge",
  axe_war: "a heavy dwarven war axe with a broad steel blade",
  bow_long: "an elegant elven longbow made of yew wood",
  dagger_elf: "a slender elven dagger with an ornate silver hilt",
  staff_arcane: "a gnarled wooden staff topped with a glowing blue crystal",
  shield_round: "a round wooden shield with an iron boss and leather straps",
  shield_oak: "a large oak shield reinforced with iron bands",
  armor_leather: "a set of sturdy boiled leather armor",
  armor_chain: "a heavy chainmail hauberk of interlocking iron rings",
  robe_runic: "a deep blue mage robe embroidered with glowing silver runes",
  amulet_arcane: "an ornate amulet with a glowing gemstone on a chain",
  cloak_scout: "a dark green hooded scout's cloak",
  helm_iron: "a simple iron helmet with a nose guard resting on a wooden stand",
  boots_leather: "a pair of sturdy brown leather traveling boots",
  circlet_arcane: "an elegant silver headband jewel with a small blue gemstone, displayed on dark velvet",
  food: "a hearty medieval meal of roasted meat and bread on a wooden plate",
  water: "a clear waterskin and a wooden cup of fresh water",
  potion: "a glass potion bottle of glowing red liquid",
  beer: "a wooden tankard of foaming ale",
  bread: "a rustic loaf of travel bread",
  shield_bash: "a warrior slamming a shield into an enemy, impact sparks",
  feint: "a duelist performing a deceptive feint with a sword",
  dodge: "an agile fighter dodging an incoming blow",
  lunge: "a warrior performing a thrusting lunge attack",
  war_cry: "a warrior raising his sword high to rally his allies",
  ram: "a dwarf delivering a powerful shoulder charge",
  fortify: "a warrior raising a shield in a defensive stance",
  endurance: "a wounded hero catching his breath and recovering",
  whirlwind: "a warrior spinning with a weapon in a whirlwind attack",
  battle_cry: "a heroic figure rallying allies with a shout",
  fireball: "a mage casting a blazing fireball spell",
  arcane_shield: "a mage conjuring a shimmering magical barrier",
  drain: "a sorceress draining life energy from an enemy with red wisps",
  lightning: "a glowing blue magical energy orb surrounded by bright sparks",
  minor_bolt: "a small crackling magic bolt of energy",
  sure_shot: "an elven archer loosing an accurate arrow",
  shadow_step: "a cloaked elven figure stepping through shadow",
  arrow_rain: "a volley of arrows raining down from the sky",
  hunter_mark: "a glowing magical rune floating in the air above a stone",
  sting: "a quick precise dagger stab from the shadows",
  poison_vial: "a small glass vial of bubbling green toxic liquid",
  blessing_war: "a warrior kneeling as golden divine light descends on him",
  curse_weak: "a dark purple curse mark hovering over a bent knee enemy",
  regen_brew: "a warm steaming herbal brew in a wooden bowl with leaves",
  curse_languor: "a heavy iron chain coiled around a glowing hourglass",
  last_fury: "a wounded warrior erupting in a blazing aura of final rage",
  counter_attack: "a fighter turning a parry into a swift counter slash",
  intercept: "a defender stepping in front of an ally raising a shield",
  disrupt: "a hooded figure silencing a chanting enemy with a hushing gesture",
  quick_cut: "a swift dagger slash leaving a bright cutting trail in the air",
  slash_under: "a low rising sword cut slipping under an enemy guard",
  shield_wall: "a tall tower shield planted into the ground forming a barrier",
  fierce_charge: "a determined hero dashing forward with swirling dust and motion trails",
  growing_fury: "a focused warrior surrounded by glowing orange energy wisps",
  ring_might: "a polished gold jewelry band resting on velvet with a tiny blue gem",
  boots_swift: "a pair of nimble light leather boots with wing motifs",
  mage_cloak: "a deep purple mage cloak with silver star embroidery",
  plate_h: "a massive ornate plate cuirass polished to a mirror shine",
  reaper_scythe: "a menacing two-handed scythe with a curved black blade",
  gema_fuego: "a glowing fiery red gemstone carved with runes on a dark cloth",
  gema_hielo: "a translucent icy blue crystal gem with frost mist around it",
  gema_vida: "a warm emerald green healing gem pulsing with soft light",
  runa_guarda: "a carved stone rune tile glowing with protective blue shield light",
  runa_poder: "an ancient amber rune stone etched with a fierce glowing symbol",
  runa_terror: "a cracked obsidian rune stone oozing dark purple shadow",

  // Cartas con arte ya generado que faltaban en el manifiesto.
  cat_reflex: "a lithe cat-like rogue leaping away from an incoming strike with swift motion trails",
  web_shot: "a dense spider web strung between dark branches, glistening with green venom",
  sun_bless: "a radiant golden sunburst blessing a kneeling knight in warm light",
  purge_potion: "a glass vial of glowing amber cleansing potion surrounded by floating herbs",
  stigma: "a dark rune brand of shadow floating above a faintly glowing purple sigil",
  blast_charge: "a round black powder bomb with a lit fuse and fiery sparks",
  gauntlets_iron: "a pair of heavy iron gauntlets resting on a stone anvil",

  // Maldiciones de mazo.
  curse_deadweight: "a heavy chained stone weight crushing a small playing card on dark ground",
  curse_lich_whisper: "a ghostly skeletal face whispering dark mist beside a cracked crown",
  curse_open_wound: "a crimson crack glowing across a dark stone tablet with red mist",

  // Reliquias.
  relic_troll_heart: "a large green glowing heart in a mossy amber reliquary",
  relic_lich_eye: "a glowing blue eye encased in an obsidian medallion with silver runes",
  relic_obsidian_bastion: "a shield made of black volcanic glass with glowing orange veins",
  relic_moon_chalice: "an ornate silver chalice filled with glowing moonlight and floating stars",
  relic_thorn_crown: "a jagged iron crown wrapped in dark thorns on a velvet cushion",
  relic_ashen_gauntlet: "a charcoal-black armored gauntlet with glowing embers between its plates",

  // Cartas elementales.
  bleed_cut: "a crimson crescent slash of energy cutting through the air",
  sunder: "a cracked stone armor plate splitting apart with a shockwave",
  blood_ritual: "a glowing red ritual circle with floating crimson ribbons and an ancient chalice",
  forge_hammer: "a massive blacksmith hammer striking a glowing anvil with fiery sparks",
  anvil_slam: "a heavy iron anvil slammed into the ground causing a stone shockwave",
  molten_armor: "a suit of armor glowing with molten metal and orange heat cracks",
  frost_bolt: "a jagged shard of blue ice flying with frost mist and snowflakes",
  static_arc: "a bright blue electrical arc crackling between two metal plates",
  ember: "a single glowing orange ember floating above dark coals",
  thermal_lance: "a lance of fire and ice energy colliding in a swirling beam",
  gale_arrow: "an arrow wrapped in a spiral of wind and swirling leaves",
  toxic_shot: "a green dripping arrow with a bubbling venom trail",
  serrated_arrow: "a barbed arrowhead with jagged edges on a wooden shaft",

  // Cartas de clase para cooperativo.
  taunt_war: "a warrior beating his chest and shouting a challenge with an open hand",
  clan_guard: "a stout dwarf guardian holding a large shield in front of an ally",
  arcane_veil: "a mage conjuring swirling purple illusions to distract an enemy",
  elf_rescue: "an elven ranger offering a hand to a weary companion in a sunlit forest glade, soft green light",
};

const PORTRAITS = {
  warrior: "a veteran human warrior in worn steel armor with sword and round shield, stern face",
  dwarf: "a stout bearded dwarf defender in heavy armor with a war axe and oak shield",
  sorceress: "a female sorceress in a blue runic robe holding a glowing arcane staff",
  elf: "a lithe elven ranger in a green cloak drawing a longbow",
  goblin: "a sneering green goblin with a rusty dagger",
  lobo: "a ferocious grey dire wolf snarling",
  esqueleto: "an undead skeleton warrior in tarnished armor with a chipped sword",
  trol: "a large mossy stone troll guardian standing in a misty forest",
  nigromante: "a gaunt necromancer in dark robes with glowing green eyes",
  senor_orco: "a proud orc chieftain warrior in tribal armor holding a tall banner",
  lich: "an ancient lich king with a crown, skeletal face, glowing blue eyes and dark robes",
};

function buildManifest() {
  let previous = [];
  try {
    previous = JSON.parse(readFileSync(new URL("../data/image-manifest.json", import.meta.url), "utf8"));
  } catch {
    // Primera generación: no hay manifiesto previo.
  }
  const previousSeeds = new Map(previous.map((entry) => [entry.id, entry.seed]));
  let nextSeed = Math.max(1000, ...previous.map((entry) => entry.seed || 0)) + 1;

  const entries = [];
  const addEntry = (entry) => {
    entry.seed = previousSeeds.get(entry.id) ?? nextSeed++;
    entries.push(entry);
  };
  for (const id of Object.keys(CARDS)) {
    const prompt = CARD_PROMPTS[id];
    if (!prompt) continue;
    addEntry({
      id,
      group: "cards",
      file: `assets/cards/${id}.png`,
      prompt,
      seed: 0,
      model: "flux-2-klein",
      size: "768x1024",
    });
  }
  for (const id of Object.keys(CHARACTERS)) {
    addEntry({ id, group: "portraits", file: `assets/portraits/${id}.png`, prompt: PORTRAITS[id], seed: 0, model: "flux-2-klein", size: "1024x1024" });
  }
  for (const id of Object.keys(ENEMIES)) {
    addEntry({ id, group: "portraits", file: `assets/portraits/${id}.png`, prompt: PORTRAITS[id], seed: 0, model: "flux-2-klein", size: "1024x1024" });
  }
  for (const id of Object.keys(PATH_PROMPTS)) {
    addEntry({ id, group: "paths", file: `assets/paths/${id}.png`, prompt: PATH_PROMPTS[id], seed: 0, model: "flux-2-klein", size: "1024x640" });
  }
  return entries;
}

function getApiKey() {
  if (process.env.NAN_API_KEY) return process.env.NAN_API_KEY;
  try {
    const cfg = JSON.parse(readFileSync(`${process.env.HOME}/.config/opencode/opencode.json`, "utf8"));
    return cfg.provider?.nan?.options?.apiKey;
  } catch {
    return null;
  }
}

async function generateOne(entry, apiKey, force) {
  if (existsSync(entry.file) && !force) {
    return { id: entry.id, status: "skip" };
  }
  const body = {
    model: entry.model,
    prompt: `${entry.group === "paths" ? PATH_STYLE : STYLE}, ${entry.prompt}`,
    size: entry.size,
    n: 1,
    response_format: "b64_json",
    seed: entry.seed,
  };
  const res = await fetch("https://api.nan.builders/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    return { id: entry.id, status: "error", error: `${res.status} ${text.slice(0, 160)}` };
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) return { id: entry.id, status: "error", error: "sin b64_json" };
  mkdirSync(entry.file.slice(0, entry.file.lastIndexOf("/")), { recursive: true });
  writeFileSync(entry.file, Buffer.from(b64, "base64"));
  return { id: entry.id, status: "ok" };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.split("=")[1].split(",") : null;
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

  const manifest = buildManifest();
  writeFileSync(new URL("../data/image-manifest.json", import.meta.url), JSON.stringify(manifest, null, 2));

  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Falta NAN_API_KEY (variable de entorno o ~/.config/opencode/opencode.json).");
    process.exit(1);
  }

  let done = 0;
  let skipped = 0;
  let errors = 0;
  const targets = manifest.filter((e) => !only || only.includes(e.id));
  for (const entry of targets) {
    if (done + skipped >= limit) break;
    const result = await generateOne(entry, apiKey, force);
    if (result.status === "ok") {
      done++;
      console.log(`  ✓ ${entry.file}`);
    } else if (result.status === "skip") {
      skipped++;
    } else {
      errors++;
      console.error(`  ✗ ${entry.id}: ${result.error}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log(`\nArte: ${done} generadas, ${skipped} ya existían, ${errors} errores.`);
}

main();
