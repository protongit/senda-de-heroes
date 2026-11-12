# Arquitectura — Senda de Héroes

## Visión general
```
index.html ──> js/main.js ──> js/screens/*.js (render + interacción)
                    │                  │
                    │                  ▼
                    └──────────> js/ui.js (render de mesa/cartas/log)
                    │
                    ▼
              js/run.js  ──────►  js/engine.js (lógica pura)
                    │                  ▲
                    │                  │
              js/shop.js          js/ai.js
                    │                  │
                    ▼                  ▼
              js/cards.js · characters.js · enemies.js · loot.js · balance-config.js · rng.js
                    │
                    ├── js/challenges.js (historias, puzzles, moralidad)
                    ├── js/elements.js (marcas y reacciones)
                    └── js/duel.js (coop/versus: amenaza, cubrir, rescatar)
```

## Capas
- **Datos (js/*.js):** puro, sin DOM. Cartas, héroes, enemigos, botín, parámetros de balance.
- **Motor (js/engine.js):** funciones puras y deterministas (con `rng` inyectable). Combate, mazos, capacidad, energía, XP. Importable en Node para tests.
- **Run (js/run.js):** estado de la partida (héroe, nodo, monedas, XP, mazo persistente) y su avance. Sin DOM.
- **UI (js/ui.js, js/screens/*, index.html, styles.css):** render y eventos. Degrada arte a SVG/CSS.
- **IA (js/ai.js):** política del enemigo y del héroe (autoplay para tests).
- **Audio (js/audio.js):** sonido y música sintetizados con Web Audio; se activa con el primer gesto.
- **Estadísticas (js/records.js ↔ api.py):** identidad anónima (UUID + nombre), registro de partidas y ranking. `api.py` es stdlib (`http.server` + `sqlite3`); `server.py` lo monta bajo `/api/*` y sirve a la vez los estáticos, por lo que un único contenedor basta en producción (Knative/nan.builders). Solo se almacenan datos de juego (sin IP, cabeceras ni cookies).

La dificultad de los enemigos se escala por `BALANCE.enemyScale` y por `BALANCE.depthPower` (curva por profundidad), aplicado en `getEnemy(id, ascension, power)`.

## Decisiones (ADRs)
- **ADR-001** Vanilla JS con módulos ES; sin build ni dependencias.
- **ADR-002** El motor es puro y sin DOM para poder simular partidas en Node (smoke y balance).
- **ADR-003** RNG con semilla inyectable para reproducibilidad (mismas semillas entre héroes).
- **ADR-004** El arte real solo se usa si el PNG existe; siempre hay respaldo SVG/emoji.
- **ADR-005** El modo autoplay (`?autoplay=1`) reutiliza `ai.js` para que browsermcp valide partidas reales.
- **ADR-006** Un único punto de parámetros de balance (`js/balance-config.js`).
