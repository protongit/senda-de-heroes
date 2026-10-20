# Contrato — Senda de Héroes

Interfaz congelada entre datos, motor, run, IA y UI. Cualquier cambio aquí debe actualizar a todos los consumidores.

## Instancia de carta (v2)
El mazo de la run guarda **instancias**, no ids:
```js
{ uid: number, cardId: string, upgrade: 0|1, fusedEffectId: string|null }
```
- `uid`: identificador estable dentro de la run (`run.nextUid`).
- `upgrade`: carta mejorada en la fragua (escala valor/efectos/mods por `BALANCE.upgradeFactor`).
- `fusedEffectId`: carta de efecto fusionada al equipo en la fragua (1 por equipo; se vende/pierde con él).
- `resolveCard(inst)` (js/cards.js) materializa la carta resoluble; acepta también strings (compatibilidad duel). La carta resuelta lleva `uid`, `upgrade`, `fusedEffectId` y `fused { id, name, icon, effects, duration }`.
- `run.loadout` guarda **referencias** a las instancias de `run.deck` (no copias): las mejoras/fusiones hechas en la fragua sobre equipo equipado se propagan al siguiente combate. Tras cada combate, run/simulate re-sincronizan el loadout desde `combat.loadout` buscando cada `uid` en `run.deck`.

## Carta
```js
{
  id: string,
  name: string,
  type: "equipment" | "resource" | "skill" | "effect" | "curse",
  subtype: string,          // weapon|armor|helmet|boots|shield|amulet|cloak|relic|food|drink|potion|attack|defense|spell|blessing|curse|burden|debuff|gem|rune
  tags: string[],           // sword|bow|shield|staff|heavy|cloth|leather|plate|oneHanded|twoHanded|ranged
  level: number,
  cost: number,             // energía (solo la pagan los arcanos)
  value: number,            // monedas
  text: string,
  slot: "head"|"body"|"feet"|"neck"|"ring"|"back"|"hand"|"relic"|null,
  reqStr: number,
  mods: { damage?, block?, energy? },   // pasivos de equipo
  effects: [{ kind, value }],           // instantáneos y sobre-el-tiempo (ver abajo)
  marks: [{ kind, value, duration }],  // marcas elementales (v3)
  curseEffects: [{ kind, value, duration? }], // maldición de reliquia (v3)
  onDraw: { damage?, actions? } | null, // lastre de mazo (v3)
  duration: number | null,  // rondas del efecto (solo cartas de efecto; null = todo el combate)
  reaction: { trigger: string[] } | null,  // (v2 F1) cartas de reacción
  scrap: boolean,           // (v2 F2) al jugarla se retira del mazo
  art: string | null,
  icon: string
}
```

## Héroe
```js
{
  id, name, title, arcane: boolean, energyPerRound: number,
  base: { hp, energy, str },
  capacity: { head, body, feet, neck, ring, back, hands, allowedArmor: string[], allowBow, allowShield, allowTwoHanded },
  portrait, icon, startingDeck: string[]   // ids de carta (con repetidos)
}
```

## Enemigo
```js
{
  id, name, level, kind: "normal"|"elite"|"boss",
  hp, portrait, icon,
  ai: "aggressive"|"balanced"|"defensive"|"caster",
  moves: [{ id, name, icon, weight, effects: [{ kind, value }] }],
  rewards: { coins: [min, max], xp, drops: [{ cardId, chance }] }
}
```

## API del motor (js/engine.js)
```
createCombat(heroDef, heroStats, enemyDef, deckInstances, rng, loadoutInstances = []) -> CombatState
canEquip(heroDef, card, loadout) -> { ok: boolean, reason?: string }
playCard(state, cardId) -> { ok, reason? }
endTurn(state) -> void              // entra en fase "reaction" (no resuelve el turno enemigo)
playReaction(state, cardId) -> { ok, reason? }   // solo cartas con reaction, trigger compatible; acumula actionDebt
resolveEnemyTurn(state) -> void     // descarta mano, resuelve el turno enemigo y PAUSA en fase "enemyDone"
continueToHeroTurn(state) -> void   // sale de "enemyDone": ronda+1 y empieza el turno del héroe
enemyIntent(state) -> move | null   // próximo movimiento enemigo (moveQueue[0])
moveTags(move) -> { attack, defend, buff }
reactionMatches(card, move) -> boolean
intentPreview(state) -> { move, tags, damage } | null
isOver(state) -> "hero" | "enemy" | null
drawCards(state, n) -> void
equipCard(state, cardId) -> { ok, reason? }
derivedMods(state) -> { damage, block, energy }
heroDamageBonus(state) -> number
effectValue(state, side, kind) -> number
```

### CombatState (v2)
```js
{
  ..., // hero (con actionDebt, drawBonus, startBlock, damageBonus, onHitPoison), enemy (con moveQueue)
  effects: [{ uid, cardId, name, icon, side: "hero"|"enemy", kind, value, remaining, sourceUid, desc }],
  scrappedUids: number[],   // uids consumidos este combate (purga en finishCombat)
  exhaustedUids: number[],  // uids agotados este combate: efectos/recursos (purga permanente vía scrappedUids) y buffs de combate completo (vuelven tras el combate)
  enemyTurnSummary: { move: { id, name, icon, effects }, heroHpBefore, heroHpAfter, entries } | null,
  // fases: "hero" -> "reaction" -> "enemy" -> "enemyDone" -> "hero" (o "over")
}
```
- `enemyTurnSummary` se rellena en `resolveEnemyTurn` (movimiento lanzado, vida del héroe antes/después y entradas de log generadas) y se consume en la vista de turno enemigo de la UI; `continueToHeroTurn` lo limpia. El autoplay lo encadena sin pausa.
- El equipo fusionado activa su efecto al **iniciar el combate** (loadout inicial) y al **equiparlo** en pleno combate; al **reemplazar** la pieza, sus efectos activos se retiran (`sourceUid`). Las **gemas 💎 y runas 🔮** fusionadas son **permanentes** (`duration: null` → `remaining: null`, sin expiración); el resto de efectos fusionados respeta la `duration` de su carta.
- **Intercambio en las manos**: jugar un arma sustituye al arma equipada, un escudo al escudo, y un arma a dos manos sustituye ambas — lo sustituido va al **descarte** (`canEquip` permite el cambio y `playCard` lo ejecuta).
- **Fuerza y Vulnerable viven en `state.effects`** (no en contadores): `strength` con `remaining: null` (todo el combate), `vulnerable` con `remaining: value` (rondas, tick al empezar el turno de su dueño). El daño los lee con `effectValue(state, lado, kind)`. La UI los pinta con `effectsChipsHTML` y como cartas en la mesa con `tableEffectsHTML(effects, side)` (js/ui.js). `duel.js` conserva sus contadores propios.

## API de run (js/run.js)
```
createRun(heroId, seed) -> RunState
addCardToRun(run, cardId) -> Instancia
removeInstanceFromRun(run, uid) -> Instancia | null
continueRunAscension(prev) -> RunState   // NG+: mismo héroe (mazo, nivel, perks, monedas), ascensión+1, hp al máximo
currentNode(run) -> Node
advance(run) -> void
grantRewards(run, enemyDef, rng) -> RewardSummary
levelThreshold(level) -> number
finishCombat(run, winner, enemyDef, combat?) -> "victory"|"defeat"|"continue"
  // purga scrappedUids (incluidas las cartas de efecto y recursos jugados: se pierden hasta volver a conseguirlos);
  // cuenta niveles pendientes (run.pendingLevels, 1 perk por nivel)
ensureMarket(run) -> { stable: string[], rotating: [{ id, tier }] }  // surtido fijo de la run (no se agota: compras repetibles)
rotateMarket(run) -> market                       // re-tira la zona rotativa (mapRng)
MARKET_TIER_LABEL = { common, uncommon, rare, epic }
```
- Nodos de la senda: `combat`, `shop`, `treasure`, `forge` (desde profundidad ≥ 1).
- `run.ascension` (0 = primera senda): `getEnemy(id, ascension)` escala enemigos ×(1 + `BALANCE.ascensionStep` × ascensión) sobre `enemyScale` (⭐Senda N+1 = +15%).
- RunState incluye: `perks`, `pendingLevels`, `scrapped`, `drawBonus`, `startBlock`, `damageBonus`, `onHitPoison`, `sellBonus`, `forgeDiscount`, `afterWinHeal`, `market`.

## API de shop (js/shop.js)
```
buy(run, cardId) -> { ok, reason? }      // crea instancia y retira la carta del mercado
sell(run, uid) -> { ok, reason? }        // por uid (incluye equipo equipado; aplica sellBonus)
price(card) -> number
sellPrice(card, run?) -> number          // 50% + run.sellBonus
```

## API de perks (js/perks.js)
```
PERKS -> [{ id, name, icon, text, arcaneOnly?, maxStacks, apply(run) }]
perkOptions(run) -> [perk, perk]         // 2 opciones válidas (mapRng), filtra arcaneOnly y maxStacks
applyPerk(run, perkId) -> perk | null
```

## Efectos soportados
- **Instantáneos:** `damage`, `block`, `heal`, `draw`, `energy`, `strength`, `vulnerable`. Los incrementos se reinician al terminar el combate salvo `strength` (por combate) y `vulnerable` (turnos indicados por `value`).
- **Sobre el tiempo (v2):** crean una entrada en `state.effects` con duración `duration` (null = todo el combate).
  - Del que juega hacia sí: `regen` (cura/ronda), `bonusDamage` (+daño saliente), `bonusBlock` (+bloqueo al empezar turno).
  - Al defensor: `poison` (daño/ronda, ignora bloqueo), `weaken` (−value% daño saliente), `fewerActions` (−value acciones/ronda, **siempre lado héroe**).
  - Los efectos de lado héroe pican al empezar el turno del héroe; los de lado enemigo, al empezar el turno del enemigo. Expiran solos o al acabar el combate.
- **Fusión:** el efecto fusionado a un equipo se activa al comenzar cada combate (lado héroe para bendiciones, enemigo para veneno/debilidad).

## v3 — Maldiciones, reliquias, marcas, desafíos y coop

### Carta (campos nuevos)
```js
{
  type: "equipment" | "resource" | "skill" | "effect" | "curse",
  subtype: "...|relic|burden|gem|rune",
  slot: "...|relic",
  marks: [{ kind: "burn"|"bleed"|"fracture"|"frozen"|"shock"|"wind"|"poison", value, duration }],
  curseEffects: [{ kind, value, duration? }], // maldición de reliquia
  onDraw: { damage?: number, actions?: number } | null, // maldiciones de mazo
}
```
- `type: "curse"` es un lastre no jugable. Las cartas de efecto con `subtype: "curse"` siguen siendo jugables.
- Las reliquias son `type: "equipment"`, `subtype: "relic"`, `slot: "relic"`.

### Combate (estado nuevo)
```js
{
  marks: { hero: [{ kind, value, remaining }], enemy: [...] },
  pendingCurseIds: [{ cardId, count }],
  restrictions: { noResources?, noEffects?, noEquipment? } | null,
  challenge: ChallengeNode | null,
  enemy: { ..., stunned: boolean },
}
```
- `applyMarks(state, marks, source)`, `expireMarks(state, side)`, `checkElementReactions(state, side)`.
- Las reacciones elementales consumen una marca de cada tipo y aplican daño/aturdimiento/estados.
- `applyRelic(state, card)` aplica beneficio y `curseEffects` con `sourceUid`; al sustituir la reliquia se retiran.

### Run (estado nuevo)
```js
{
  challengeRng, serviceRng,
  challengesSeen, challengeDoneDepth,
  morality: { mercy, greed, honor, corruption },
  chronicle: [{ id, title, result, choice, text }],
  shopServices: { hechicero, curandero } | null,
}
```
- `rollOptions(run)` añade una opción `{ type: "challenge", ... }` con probabilidad, nunca en pasos de jefe.
- `consumeChallenge(run)` elimina la opción, incrementa `challengesSeen` y fija `challengeDoneDepth` sin avanzar profundidad.
- `applyChallengeReward(run, reward)` / `applyChallengePenalty(run, penalty)`.
- `finishCombat(..., options)` acepta `{ advance: false }` para desafíos.
- `rollShopServices(run, force)`, `healAtShop(run, mode)`, `removeCurseAtShop(run, uid)`.
- `finishCombat` añade `rewards.curses` y persiste `pendingCurseIds` en el mazo.

### Duelo (coop)
- `unit.threat`, `unit.guard`, `unit.forcedTarget`, `unit.downed`, `unit.rescued`, `unit.marks`, `unit.poison`, `unit.weaken`, `unit.stunned`.
- `chooseEnemyTarget(duel)` prioriza guardia > provocación > amenaza > vida.
- Efectos nuevos: `taunt`, `guard`, `rescue`; `applyDuelMarks(duel, source, marks)`.
- `heroDef.duelCards` se añade solo a los mazos de duelo.

### Efectos nuevos v3
- Instantáneos: `addCurse` (encola un lastre), `selfDamage`, `bonusActions`.
- Solo duelos: `taunt` (amenaza + objetivo forzado), `guard` (redirige el próximo ataque), `rescue` (revive a un aliado caído).
- Marcas elementales: `burn`, `bleed`, `fracture`, `frozen`, `shock`, `wind`, `poison`; las reacciones se resuelven en `js/elements.js`.
