# QA — Rediseño visual «espectacular»

Fecha: 2026-11-02 · Rama: `diseno-espectacular` · Servidor: `python3 server.py 8099`
Herramienta: browsermcp (Chrome, 1568×725) + capturas en `/tmp/opencode/shot-*.jpg`.

## Pantallas verificadas (partidas reales)

| Pantalla | Estado | Notas |
|---|---|---|
| Menú (con/sin partida guardada) | OK | Arte `menu.png`, acordeón de ayuda, botones con iconos |
| Selección de héroe | OK | Retraso escalonado, tilt, auras por clase |
| Senda (2 y 3 opciones) | OK | Cartas de opción con arte; badge de desafío en esquina |
| Combate — ronda | OK | Tinte verde al 100 %, intención con destello único |
| Combate — golpe | OK | Flotante, shake, pulso y **estela de daño** (`--g` animado) |
| Combate — resumen enemigo | OK | Tarjeta de movimiento, Δ de vida, contador de auto-continuar |
| Recompensa | OK | `countUp` de monedas, botín escalonado, pill de nivel |
| Perk (subida de nivel) | OK | Opciones con borde dorado, HUD «1 pendiente» |
| Tienda | OK | Rareza en línea con el nombre (corregido), servicios, venta |
| Fragua | OK | Etiqueta «Equipado» en línea (corregido), selección de fusión |
| Mazo | OK | Rejilla con bordes de rareza y contador ×N |
| Desafío (intro/puzle/elección/balance) | OK | Acento lateral por estilo, runas, recompensa destacada |
| Game over — derrota | OK | Arte `defeat.png`, título «Has caído» |
| Game over — victoria | OK | Arte `victory.png` + velo oscurecido (corregido contraste) |
| Cooperativo (3 paneles) | OK | Oro en combatiente activo, estela también en duelos |
| Competitivo 1v1 | OK | HUD de energía arcana, costes con rayo |

## Correcciones aplicadas durante el QA

1. `barHTML()` añade tiers `hp-warn`/`hp-crit` (antes la vida era roja al 100 %).
2. `damageTrail()` en `fx.js`: nadie escribía `--g`; la estela ahora funciona.
3. `.i`: `stroke-width` 1.8 → 2.15 y agrandado a 1.15em en chips/HUD (ilegibles a ~13 px).
4. Toggle del log: icono suelto → botón «Registro» con chevrón que rota.
5. `.shop-info`: la insignia de rareza se estiraba a todo el ancho → fila propia.
6. `.forge-item`: `position: relative` + `.equipped-tag` en línea.
7. `#autoplay-result:empty` oculto y `pointer-events: none` (tapaba botones inferiores).
8. Victoria: velo radial más opaco + sombras de texto (el arte dorado lavaba el texto).
9. Título del cofre: «¡Victoria!» → «¡Tesoro!» (mismo banner de recompensa).
10. `injectSprite` se importaba del módulo equivocado (error residual de consola).

## Pruebas no ejecutables en este entorno

- **Móvil 390×844**: la ventana emergente script-opened no es alcanzable por CDP
  (timeouts de entrada/captura). Auditado estáticamente: bloques 980/900/720/480,
  safe-areas, `min-height: 44px` y scroll-x en senda/mano.
- **`prefers-reduced-motion`**: sin emulación CDP expuesta; bloque CSS completo
  y `reduced()` respetado en `fx.js` (countUp, brasas, tilt, estela, acordeón).

## Regresión

- `node scripts/smoke.mjs` → **398 comprobaciones OK, 0 fallos** (tras todos los cambios).
- `node --check` limpio en los 20 módulos.
- `node scripts/balance.mjs 500` → idéntico a la línea base (motor y datos intactos;
  solo cambió la capa de pantalla/UI).
- Consola limpia en pestañas nuevas durante todo el recorrido.
