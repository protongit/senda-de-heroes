# QA en navegador con browsermcp — Senda de Héroes

Servidor estático: `python3 -m http.server 8090` (el 8080 estaba ocupado por otro servicio del workspace).

## Casos de uso recorridos (interactivo)
1. **Menú** → carga correcta (`Senda de Héroes`).
2. **Selección de héroe** → 4 héroes con stats, energía y capacidad.
3. **Senda (mapa)** → 10 nodos con estado (hecho/actual/bloqueado).
4. **Combate** (Guerrero vs Goblin):
   - Reparto de 6 cartas y contador de mazo (4/0).
   - Equipar Escudo Redondo (chip "🛡️ +2", aparece en "Mesa").
   - Estocada: 9 de daño (Goblin 30→21).
   - Terminar turno → turno del enemigo (Goblin "Puñalada", 10 de daño), robo y barajado del descarte, ronda 2.
   - Equipar Espada Corta (chip "🗡️ +3") y Golpe de Escudo (10 daño + 6 bloqueo).
   - Estocada final → **Victoria**.
5. **Recompensa** → 9 🪙, 10 XP y botín (Estocada añadida al mazo).
6. **Tienda (Mercader)** → 5 artículos en venta, lista del mazo con precios de venta; compra de Botas de Cuero (34→22 🪙, añadida al mazo); salida → avance de nodo.
7. **Consola del navegador** → sin errores.

## Partidas reales automatizadas (autoplay)
`http://localhost:8090/?autoplay=1&batch=20` ejecuta 20 partidas por héroe (80 en total) sobre el motor y la UI reales.

| Héroe | Victoria (20 partidas) |
|---|---|
| Guerrero | 50% |
| Enano | 45% |
| Hechicera | 60% |
| Elfa | 40% |

Resultado de enemigos (por combate): Goblin/Lobo/Esqueleto 100%, Trol 89%, Nigromante 92%, Señor Orco 72%, Lich 83%. Ningún enemigo imposible.

> Nota: las 20 partidas son una muestra pequeña; la medida estable es `node scripts/balance.mjs 500` (ver `BALANCE.md`), con todos los héroes entre 46.4% y 50.4%.

## Segunda ronda de QA (nuevas mecánicas)
- **Menú de 3 modos** (1 jugador, cooperativo, competitivo) correcto.
- **Senda aleatoria:** en cada paso se ofrecen 2 opciones; no se muestra el recorrido.
- **Combate 1P:** cartas grandes, badge de **restricción** visible (p. ej. "⚠ A dos manos" en el Arco Largo), **log lateral** con última acción arriba y botón "Ocultar/Mostrar log".
- **Cooperativo:** selección de 2 héroes + enemigo; combate con 2 héroes y el enemigo; la IA actúa tras ambos jugadores (p. ej. "Goblin usa Guardia").
- **Competitivo:** dos héroes alternan turnos; atacar resta vida al rival (Guerrero 108 → Elfa 99 con Estocada); el turno pasa al otro jugador.
- **Victoria/derrota:** pantalla final correcta (Hechicera, Nivel 4, Paso 7).
- **Consola del navegador:** sin errores.
- **Lote real:** 80 partidas (20 por héroe) → Guerrero 45%, Enano 35%, Hechicera 60%, Elfa 50%.

## Tercera ronda de QA (v3, headless Chrome + CDP)
- **Menú y carga:** sin errores de consola.
- **Desafío narrativo (enigma):** introducción → puzzle → fallo → epílogo → vuelta a la senda. La profundidad no avanza.
- **Desafío de pacto:** elección, recompensa de monedas, contador de moralidad y crónica.
- **Desafío de cacería:** introducción → combate → elección moral → epílogo → vuelta a la senda. `depth` permanece igual.
- **Tercera opción de senda:** visible con icono y hint de desafío.
- **Tienda:** sección de servicios con curandero y hechicero; cura y exorcismo renderizados.
- **Cooperativo:** cartas de clase en los mazos de duelo, chips de amenaza/guardia/caído y marcas elementales.
- **Autoplay:** `?autoplay=1&hero=warrior&seed=1` termina y escribe `#autoplay-result`.
- **Consola:** sin errores (queda un 404 de favicon, irrelevante).
