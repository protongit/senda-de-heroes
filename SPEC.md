# Senda de Héroes — SPEC

Juego de cartas de construcción de mazos (deckbuilding) para navegador, ambientación medieval-fantástica, con progresión estilo Diablo. Slay the Spire / Star Realms / Dominion. Sin build: HTML + CSS + módulos ES.

## Modos de juego
- **1 jugador:** recorres una senda aleatoria y derrotas al Lich.
- **Cooperativo (2P vs IA):** dos héroes (2 jugadores locales) contra un enemigo de la IA.
- **Competitivo (1v1):** dos héroes cara a cara.

## Héroes (mazo inicial fijo)
Guerrero, Enano (marciales), Hechicera y Elfa (arcanas).

## Reglas clave
- **Ronda:** robas 6 cartas. **Límite de 3 acciones por ronda** (4 en clases arcanas): las cartas consumen una acción.
- **Energía:** solo las clases arcanas tienen energía. **Los personajes sin energía no pueden usar cartas que la requieran** (coste > 0).
- **Intención enemiga:** el enemigo pre-tira 2 movimientos; el actual se anuncia (icono, nombre y daño estimado) durante tu turno.
- **Reacciones:** al terminar el turno se abre una ventana para jugar cartas de reacción cuyo disparador coincida con la intención; cada reacción cuesta 1 acción del turno siguiente (deuda).
- **Equipo persistente:** se juega desde la mano y queda en la mesa entre rondas y combates. El equipo equipado no se roba. Al reemplazar un slot único, el anterior vuelve al mazo y sus efectos fusionados se retiran.
- **Capacidad de equipo:** 1 casco, 1 armadura, 1 botas, 1 amuleto, 1 anillo, 1 capa; **2 manos** (acumulativas). Restricciones visibles en la carta.
- **Efectos con duración:** bendiciones (regen, +daño, +bloqueo), maldiciones y venenos (poison ignora bloqueo, weaken) con duración en rondas o todo el combate; también los infligen élite/jefes.
- **Consumibles (scrap):** algunas cartas se retiran del mazo al jugarlas por un efecto potente.
- **Frugal (fragua):** nodo de senda con dos servicios: mejorar carta (⭐ +50% valor/efectos) y fusionar equipo + carta de efecto (1 por pieza; venta/pérdida descarta ambas).
- **Mercado:** mercadería fija por run + zona de rarezas rotatoria con tier visible.
- **Perks:** cada nivel otorga 1 de 2 ventajas a elegir (sin stats automáticos).
- **Botín:** monedas, XP y drops por tier.
- **Progresión:** niveles con perks + equipo mejorado/fusionado.

## Senda aleatoria
Cada partida genera una senda distinta. **No se muestra el recorrido:** en cada paso el jugador **elige entre dos opciones** (combate, tienda, tesoro o fragua) y avanza hasta el jefe final. En los últimos pasos aparecen el Jefe Orco y el Lich.

## Interfaz
- Cartas grandes en la mano (≈200 px) y en la vista de mazo (≈190 px), con insignias de ⭐ mejorada y 🧉 efecto fusionado.
- **Log de combate lateral**, con la **última acción al principio**, ocultable.
- Chips de estado activos (bloqueo, fuerza, vulnerable, efectos con rondas restantes) para héroe y enemigo.
- Restricciones visibles en cada carta (solo arcanos, fuerza, a dos manos, arco…).

## Criterios de "hecho"
- `node scripts/smoke.mjs` y `node scripts/balance.mjs` en verde.
- Héroes equilibrados (victoria de senda 40–60%) y ningún enemigo imposible.
- Casos de uso verificados con browsermcp (1P, coop y versus) sin errores de consola.
