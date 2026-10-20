# Revisión — Senda de Héroes

Revisión de consistencia entre contrato (`docs/CONTRACT.md`), datos, motor, run, IA y UI.

## Hallazgos corregidos
1. **Texto/stats de equipo de bloqueo incoherentes.** Varias piezas mostraban "+N bloqueo por ronda" pero su mod no se aplicaba al inicio de ronda (solo suma a las cartas de bloqueo). Corregido: textos ajustados a "+N bloqueo" y alineados con `mods.block` (Escudo de Roble, Cota de Malla, Capa de Exploradora).
2. **Daño de "Fuerza" ambiguo.** El stat `str` se usa como capacidad física (umbral de equipo `heavy`), no como daño. Documentado en `BALANCE.md` para evitar confusión con el buff de Fuerza en combate.
3. **Explosión de poder de los no-arcanos.** Sin coste, jugar la mano entera hacía el juego trivial. Resuelto con un **límite de acciones por ronda** (mecánica universal, parámetro en `balance-config.js`) manteniendo que solo los arcanos gastan energía.
4. **Prompt de arte bloqueado por política de contenido.** `trol`, `senor_orco`, `war_cry`, `lightning` y `hunter_mark` fueron rechazados; prompts suavizados y regenerados con éxito.
5. **Import inexistente** en `js/screens/battle.js` (`cardsList`): habría roto el enlace del módulo (error de carga ESM). Eliminado.

## Verificaciones
- `node scripts/smoke.mjs`: 60 comprobaciones OK — reglas de capacidad (arcos/escudos/pesado/dos manos), ciclo de mazos y barajado, compra/venta, y 20 simulaciones de run sin excepciones.
- Casos de uso reales con **browsermcp**: menú → selección de héroe → senda → combate (equipar, atacar, bloquear, terminar turno, robo/barajado) → recompensa (monedas/XP/botín) → tienda (comprar, vender, salir) → avance de nodo. Sin errores de consola.

## Riesgos/pendientes (fuera del MVP)
- El cooperativo/competitivo multijugador no está implementado (arquitectura preparada).
- Solo hay un enemigo por tier (variedad limitada); los pools por nivel ya existen para ampliar.
- El arte generado tiene un borde decorativo con números pequeños del modelo; no afecta la legibilidad de la carta.

## Segunda revisión (nuevas mecánicas y 2 jugadores)
1. **Referencias obsoletas a `run.path`/`nodeIndex`** tras pasar a senda aleatoria: `gameover.js` fallaba. Corregido a `run.depth`.
2. **Id de enemigo inexistente** (`"troll"` vs `"trol"`) como valor por defecto del cooperativo: rompía el inicio del duelo. Corregido a `"goblin"`.
3. **Manejo de errores visible**: `go()` y un listener global muestran cualquier excepción en pantalla en lugar de dejar la vista anterior congelada.
4. **Regla de energía** aplicada de forma coherente: personajes sin energía no pueden jugar cartas con coste (motor, IA y UI).
5. **Equipo persistente** integrado en motor, run, simulador, tienda (venta de equipo equipado) y UI (vista de mazo con etiqueta "Equipado").
6. **Opciones de senda siempre idénticas** (bug en `rollOptions`): el bucle re-añadía `shuffled[0]`, así que las dos opciones eran siempre la misma (dos cofres, dos esqueletos…). Reescrito para elegir 2 opciones **distintas** al azar (combate, tienda, tesoro y, a mayor profundidad, hasta dos combates de distinto nivel). Verificado con varias semillas.
