# QA — Estadísticas, audio y rebalanceo

Fecha: 2026-11-12 · Servidor: `python3 server.py 8090` (API montada en `/api/*`)
Herramienta: browsermcp (Chrome) + capturas en `/tmp/opencode/shot-*.jpg`.

## Resumen

- Flujo 1P real recorrido de principio a fin (menú → nombre → héroe → senda → combate →
  recompensa → tienda → combate → derrota) sin errores de consola.
- 80 partidas autoplay reales (20 semillas por héroe) + `?autoplay=1&batch=20`.
  Resultados idénticos entre autoplay individual, lote y llamada directa al hook.
- Audio sintetizado y toggles de sonido/música operativos, sin errores en ninguno de los
  13 efectos (incluidos daño, cura, bloqueo, jugar carta, victoria y derrota).
- Cuadro de mando: 7 secciones, filtro por héroe, Refrescar y degradación sin conexión OK.
- **4 problemas encontrados**, todos de UI/estadísticas; ninguno bloquea el juego.
  No se ha modificado código (solo informe).

## Pantallas verificadas

| Pantalla | Estado | Notas |
|---|---|---|
| Menú principal | OK | Botones nuevos «Sonido: Sí/No» y «Música: Sí/No»; alternan y persisten en `localStorage` (`senda-de-heroes.audio`). |
| Selección de héroe | OK | Campo «Nombre de tu héroe (opcional)»; HP 114 / 50 / 62 / 100 correctos. |
| Senda | OK | 2 opciones por paso; avance de profundidad correcto. |
| Combate 1P (rondas reales) | OK | Equipar, atacar, bloquear, terminar turno, resumen enemigo y rondas 1–4 sin errores. |
| Recompensa de combate | OK | 12 🪙, 10 XP, «Sin botín»; Continuar vuelve a la senda. |
| Tienda | OK | Compra de Agua (54 → 48 🪙, Agua ×2, mazo 13 → 14), servicios y salida. |
| Victoria / derrota | OK | «Has caído» muestra `Guerrero «Aria QA»`; la victoria de combate muestra «¡Victoria!». |
| Fin de partida + stats | OK | `POST /api/stats` → 200; historial y ranking recogen la partida. |
| Cuadro de mando | Parcial | 7 secciones OK, filtro y Refrescar OK, «Sin conexión» OK. **Fallo:** el nombre de perfil no aparece en el ranking (bug 1). |
| Autoplay `hero=warrior&seed=1` | OK | Escribe `#autoplay-result` con `data-done="true"`. |
| Autoplay lote 20/héroe | OK | 80 partidas, 38 victorias (47,5 %). |
| Móvil 390×844 | Parcial | Mano con scroll-x y controles de 44 px OK; fallan inputs (13,6 px), botones pequeños (32 px) y el cuadro de mando (overflow). |
| `prefers-reduced-motion` | Auditado | Sin emulación CDP; bloque CSS completo y guardas en `fx.js` (ver abajo). |

### Evidencias clave

- `/tmp/opencode/shot-menu.jpg`, `shot-select.jpg`, `shot-senda.jpg`
- `/tmp/opencode/shot-battle.jpg`, `shot-battle-equip.jpg`, `shot-battle-attack.jpg`,
  `shot-battle-block.jpg`, `shot-battle-enemy.jpg`, `shot-battle-round2.jpg`
- `/tmp/opencode/shot-victory.jpg`, `shot-shop.jpg`, `shot-shop-buy.jpg`,
  `shot-gameover.jpg`
- `/tmp/opencode/shot-dashboard.jpg`, `shot-dashboard-filter.jpg`,
  `shot-dashboard-offline.jpg`
- `/tmp/opencode/shot-batch20.jpg`, `shot-autoplay.jpg`
- `/tmp/opencode/shot-mobile-menu2.jpg`, `shot-mobile-select.jpg`,
  `shot-mobile-battle.jpg`, `shot-mobile-senda2.jpg`, `shot-mobile-dashboard.jpg`

## Partidas reales (autoplay en navegador)

`?autoplay=1&hero=warrior&seed=1` devuelve:

```json
{"hero":"warrior","seed":1,"result":"defeat","depth":6,"steps":7,"level":2,
 "hp":0,"maxHp":124,"coins":173,"deckSize":16,"defeatedBy":"dragon_ceniza"}
```

Se ejecutaron 20 semillas (1–20) por héroe con el hook real `window.game.runAutoplay`
y se leyó `#autoplay-result` en cada una. El lote `?autoplay=1&batch=20` produjo
exactamente los mismos totales (validación cruzada motor/UI).

### Por héroe (20 partidas cada uno)

| Héroe | Victorias | % | Profundidad mín.–máx. | Derrotas por jefe/enemigo |
|---|---:|---:|---|---|
| Guerrero | 11/20 | 55 % | 5–7 | señor_abismo 3, dragón_ceniza 2, reina_arañas 2, señor_orco 1, lich 1 |
| Enano | 7/20 | 35 % | 3–7 | lich 4, reina_arañas 3, ogro 3, dragón_ceniza 2, señor_orco 1 |
| Hechicera | 10/20 | 50 % | 3–7 | señor_orco 3, dragón_ceniza 2, lich 2, ogro 1, señor_abismo 1, reina_arañas 1 |
| Elfa | 10/20 | 50 % | 4–7 | señor_orco 4, dragón_ceniza 2, reina_arañas 2, trol 1, señor_abismo 1 |

Total: 38/80 victorias (47,5 %). Con 20 partidas por héroe la varianza es alta (el
Enano cae al 35 %); la referencia estable es la tanda de 500 partidas de abajo.

### Por enemigo (encuentros dentro de las 80 partidas)

| Enemigo | Victorias del jugador | % | Muestra |
|---|---:|---:|---:|
| esqueleto | 16/16 | 100 % | 16 |
| capitán_osario | 7/7 | 100 % | 7 |
| dragón_ceniza | 6/14 | 43 % | 14 |
| bandido | 20/20 | 100 % | 20 |
| trol | 31/32 | 97 % | 32 |
| lich | 14/21 | 67 % | 21 |
| oso | 20/20 | 100 % | 20 |
| señor_orco | 18/27 | 67 % | 27 |
| reina_arañas | 11/19 | 58 % | 19 |
| goblin | 24/24 | 100 % | 24 |
| ogro | 12/16 | 75 % | 16 |
| señor_abismo | 7/12 | 58 % | 12 |
| lobo | 24/24 | 100 % | 24 |
| espectro | 4/4 | 100 % | 4 |
| vampiro | 8/8 | 100 % | 8 |
| nigromante | 4/4 | 100 % | 4 |

268 encuentros en total. La muestra por enemigo depende de cuántas veces aparece en la
senda (no son 20 combates forzados por enemigo); los porcentajes de muestras <10 son
poco significativos.

### Balance headless de control

`node scripts/balance.mjs 500`: Guerrero 46,6 %, Enano 44,6 %, Hechicera 45,0 %,
Elfa 43,4 % (media 44,9 %). Coincide con lo documentado en `BALANCE.md` (banda 40–60 %
y diferencia máxima 3,2 puntos). `depthPower` = 0,8 / 0,88 / 1,05 / 1,12 / 1,18 / 1,12 / 1,07.

## Problemas encontrados

### 1. El nombre de perfil guardado no aparece en el ranking

- **Esperado:** al pulsar «Guardar nombre» en «Mi perfil», la columna «Jugador» del
  ranking muestra el nombre para las partidas de ese jugador (o se avisa de que solo
  se aplicará a partidas futuras).
- **Real:** `Aria QA` queda en `localStorage` y en el campo «Mi perfil», pero el ranking
  sigue mostrando `—` en todas las filas propias, incluso tras «Refrescar». La API
  devuelve `player.name = ""` y `playerName: ""`.
- **Causa:** `setPlayerName()` (`js/records.js:40`) solo escribe en `localStorage`;
  el manejador `save-name` (`js/screens/dashboard.js:267-273`) no llama a la API.
  `api.py` no tiene endpoint para actualizar `players.name`: solo lo actualiza
  `record_run()` cuando se envía una partida nueva (`api.py:124`). Por tanto, cambiar
  el nombre no renombra las partidas ya registradas.
- **Evidencia:** `shot-dashboard.jpg` (Jugador «—» con perfil «Aria QA»),
  `GET /api/stats` → `player.name: ""`, `GET /api/ranking` → `playerName: ""`.
- **Severidad:** media (funcionalidad de estadísticas incompleta; no rompe el juego).

### 2. Inputs a 13,6 px en móvil → zoom automático en iOS

- **Esperado:** inputs con `font-size >= 16px` en móvil para evitar el zoom de Safari.
- **Real:** `#hero-name` y `#dash-name` miden `font-size: 13.6px` a 390 px de ancho.
- **Causa:** `.dash-field` fija `font-size: 0.85rem` (`styles.css:2111`) y el input usa
  `font: inherit` (`styles.css:2112`).
- **Evidencia:** medición en iframe 390×844 (`inputFont: "13.6px"`),
  `shot-mobile-select.jpg`, `shot-mobile-dashboard.jpg`.
- **Severidad:** media en iOS (zoom al enfocar el campo).

### 3. Botones pequeños por debajo de 44 px en móvil

- **Esperado:** todos los botones con altura táctil ≥44 px en móvil.
- **Real:** «Sonido», «Música», «Refrescar», «Guardar nombre» y «Borrar mis datos»
  miden 32 px. El resto cumple (menú 53–82 px, controles de combate 44 px).
- **Causa:** `.btn.small { min-height: 32px }` (`styles.css:315-319`) tiene mayor
  especificidad que la regla móvil `.btn { min-height: 44px }` (`styles.css:2060`).
- **Evidencia:** `shot-mobile-menu2.jpg`; alturas medidas `[32, 32, 32, 44]` en el
  cuadro de mando.
- **Severidad:** baja/media (accesibilidad táctil).

### 4. El cuadro de mando desborda horizontalmente en móvil

- **Esperado:** las tablas se desplazan dentro de su sección o se convierten en tarjetas;
  el ancho de la página no supera el viewport.
- **Real:** a 390 px, `documentElement.scrollWidth = 616` y la tabla mide 549,5 px.
  Las KPIs de «Resumen» se estiran a 549 px y la segunda columna queda cortada.
- **Causa:** `.dash-table { width: 100% }` (`styles.css:2120`) sin contenedor con
  `overflow-x: auto`; el `min-content` de las 9 columnas ensancha `.dash-body`, y con
  él la rejilla `.dash-kpis`.
- **Evidencia:** `shot-mobile-dashboard.jpg`.
- **Severidad:** media (pantalla de estadísticas difícil de usar en móvil).

### Nota sobre consola

En la pestaña reutilizada aparece un `404` histórico de
`/api/stats?playerId=…` (petición anterior a que la API estuviera sirviendo). No se
reproduce en una pestaña nueva: consola vacía, sin errores ni warnings, y todas las
peticiones actuales (`/`, `/api/stats`, `/api/ranking`) responden 200. No es un fallo
del código actual.

## Móvil 390×844

browsermcp no expone emulación de viewport/dispositivo; se verificó con un iframe
same-origin de 390×844 (el `meta viewport` del juego se aplica al iframe) y mediciones
`getBoundingClientRect`/`getComputedStyle`.

- Menú: apilado, botones principales a ancho completo y ≥44 px. Falla solo el par
  Sonido/Música (32 px, bug 3).
- Selección: tarjetas apiladas, campo de nombre visible; falla el tamaño de fuente
  (bug 2).
- Senda: las dos opciones se apilan y caben (375 px de scroll real). En esta versión no
  existe el elemento `.path`; el scroll horizontal de la senda ya no aplica.
- Combate: `.hand` con `overflow-x: auto`, `scrollWidth 904` vs `clientWidth 359`, tarjetas
  de 144 px; «Terminar turno» y «Ver mazo» a 44 px. **OK.**
- Cuadro de mando: desborda (bug 4) y los inputs/botones pequeños fallan (bugs 2 y 3).

## `prefers-reduced-motion`

Sin emulación disponible (ni CDP ni flag de Chrome expuesto por browsermcp). Auditoría
estática:

- `styles.css:2064` desactiva las tres animaciones infinitas (`shafts`, `ember-rise`,
  `stage-breathe`), las brasas, el shake/lunge/pulso y reduce transiciones a 60 ms.
- `js/fx.js` comprueba `prefers-reduced-motion` en `reduced()` y lo aplica a tilt,
  countUp, estela, acordeón, confeti de victoria y efectos de gameover.
- Los únicos temporizadores persistentes son la música (`setInterval` de 8 s, audio) y
  la cuenta atrás del turno enemigo (funcional, no animación).
- Contenido y textos permanecen visibles; no hay animaciones en bucle fuera de las
  desactivadas.

## Regresión

- `node scripts/smoke.mjs` → **398 comprobaciones OK, 0 fallos**.
- `node scripts/balance.mjs 500` → ejecutado sin errores; cifras en la tabla de balance.
- `GET /api/health` → `{"ok": true}`.
- Consola limpia en pestaña nueva durante todo el recorrido (ver nota del 404 histórico).
