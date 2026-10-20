import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { CARDS } from "../js/cards.js";
import { CHARACTERS } from "../js/characters.js";
import { ENEMIES } from "../js/enemies.js";

const STYLE =
  "medieval fantasy trading card game art, painterly digital illustration, dramatic warm lighting, rich saturated colors, centered composition, high detail, no text, no watermark";

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
  const entries = [];
  let seed = 1000;
  for (const id of Object.keys(CARDS)) {
    const prompt = CARD_PROMPTS[id];
    if (!prompt) continue;
    entries.push({
      id,
      group: "cards",
      file: `assets/cards/${id}.png`,
      prompt,
      seed: seed++,
      model: "flux-2-klein",
      size: "768x1024",
    });
  }
  for (const id of Object.keys(CHARACTERS)) {
    entries.push({ id, group: "portraits", file: `assets/portraits/${id}.png`, prompt: PORTRAITS[id], seed: seed++, model: "flux-2-klein", size: "1024x1024" });
  }
  for (const id of Object.keys(ENEMIES)) {
    entries.push({ id, group: "portraits", file: `assets/portraits/${id}.png`, prompt: PORTRAITS[id], seed: seed++, model: "flux-2-klein", size: "1024x1024" });
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
    prompt: `${STYLE}, ${entry.prompt}`,
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
