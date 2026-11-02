# Guía de UI — Senda de Héroes

Sistema visual de `styles.css` + `js/icons.js` + `js/fx.js` + `js/ui.js`.
Estas reglas viven aquí porque las skills de diseño de las que proceden
(`animate`, `emil-design-eng`, `apple-design`, `animation-performance`,
`remove-animations`) están instaladas globalmente y no versionadas.

## Principios (de las skills)

1. **Solo se animan `transform` y `opacity`.** Nada de animar `width`, `height`,
   `top/left`, `box-shadow` ni filtros en bucle. Excepción única: el acordeón de
   ayuda (`fx.js → accordion()`), donde medir y animar `height` es la vía honesta.
2. **Curvas fuertes, nunca las débiles de CSS.** `ease-in` está prohibido en UI;
   entrar con `--ease-out`, mover con `--ease-in-out`, cajones con `--ease-drawer`.
3. **La UI por debajo de 300 ms.** El presupuesto de festejo se gasta donde hay
   recompensa: botín, nivel, victoria y derrota.
4. **Nada en bucle infinito que compita por atención.** Los glows de rareza, el
   brillo de botones y el pulso de intención son **disparos únicos** que ocurren
   al mirar (hover) o al cambiar el estado. Solo la atmósfera (brasas y shafts
   de luz) es continua: es barata (transform), lenta y no informa nada.
5. **El feedback se siente antes de verse.** Press = `scale(0.975)` inmediato;
   daño = número flotante + shake + estela roja en la barra; intención nueva =
   un solo destello.
6. **`prefers-reduced-motion` = menos movimiento, no cero feedback.** Duraciones
   a 1 ms, brasas fuera, tilt fuera; los cambios de estado siguen siendo legibles.

## Tokens de motion

```css
--ease-out:    cubic-bezier(.23, 1, .32, 1);   /* entradas */
--ease-in-out: cubic-bezier(.77, 0, .175, 1);  /* movimientos */
--ease-drawer: cubic-bezier(.32, .72, 0, 1);   /* acordeón */
--dur-press: 130ms;  --dur-fast: 160ms;  --dur-base: 210ms;
--dur-slow: 280ms;   --dur-reveal: 560ms;      /* solo recompensas */
```

## Tipografía y color

- **Cinzel** (display: títulos, nombres de carta/héroe), **Inter** (UI y cifras,
  con `tabular-nums`), **Spectral** (prosa: textos de carta, desafíos).
  Self-hosted en `assets/fonts/*.woff2` (subset latin, ~132 KB) con `preload`
  en `index.html` y `font-display: swap`. Sin CDN.
- Paleta: violeta-noche como superficie (`--bg`, `--panel*`), latón/oro como
  acento (`--gold*`), semánticos fijos: daño `--danger`, cura `--good`,
  energía/bloqueo `--mana`, efectos `--violet`.
- Atmósfera: degradados radiales fijos en `body`, grano SVG estático con
  `mix-blend-mode: soft-light`, viñeta, y dos capas animadas solo con `transform`
  (`body::after` shafts, `.atmos .ember` brasas generadas en `initAmbience()`).

## Iconografía (`js/icons.js`)

- Sprite SVG inline (~30 símbolos, rejilla 24, `stroke: currentColor`,
  `stroke-width: 2.15`) inyectado con `injectSprite()` al arrancar.
- `icon(nombre, cls)` devuelve `<svg class="i …"><use/></svg>`. Se usa en HUD,
  chips, botones, costes de carta y barras — la interfaz no lleva emoji.
- El **contenido** conserva sus emoji (iconos de carta, marcas, movimientos
  enemigos, retratos de actor en el log): son arte, no UI.
- A ~13 px un trazo de 1.8 desaparece: en `.chip`, `.hud` y `.hero-stats` los
  iconos se agrandan a `1.15em` en vez de afinar el trazo.

## Barras de vida (`ui.js → barHTML` + `fx.js → damageTrail`)

- El relleno `.bar-fill` se pinta con `width` **estática** (sin transición).
- **Tinte por porcentaje**, decidido en `barHTML()`: verde >50 %, `.hp-warn`
  ámbar >25 %, `.hp-crit` rojo por debajo. El color comunica urgencia antes
  de leer los números.
- **Estela de daño**: `.bar-ghost` (rojo, bajo el relleno) se deja en el
  porcentaje viejo con `transition: none` y se suelta al nuevo con
  `transform: scaleX(var(--g))` (620 ms ease-out, retardo 240 ms). Solo GPU.
- `applyDiff()` detecta el cambio de HP entre renders (misma instancia de
  estado) y dispara float + shake + pulso + estela **una vez** por evento.

## Tilt 3D y press

- `data-tilt` en cartas de mano, héroes y opciones de senda. `initTilt()`
  (solo `hover:hover and pointer:fine`) escribe `--tx/--ty/--mx/--my/--px/--py`
  **en el propio elemento** — nunca variables heredadas al subtree, para no
  recalcular estilos de toda la carta en cada `pointermove` (va a `rAF`).
- `.foil` es un degradado radial posicionado por `--mx/--my`: brillo especular
  que sigue al puntero.
- Press: `:active` en puntero fino; en táctil `initPressFeedback()` añade
  `.pressed` en `pointerdown` (los listeners viven en `#app`, que sobrevive a
  los re-renders; `main.js → go()` los re-asegura al cambiar de vista).

## Orden de entrada de pantallas

- Cada vista nueva recibe `.screen-enter` (280 ms, 10 px de subida).
- Cartas y opciones escalonan con `animation-delay: calc(var(--i) * 60–80ms)`
  sobre `card-up` / `loot-in`. El botín destacado añade un `burst` radial una
  sola vez detrás de la carta.
- Las monedas de recompensa suben con `countUp()` (720 ms, easing cúbico);
  con reduced-motion se escribe el valor final directamente.

## Responsive y móvil

- 4 breakpoints: 980 (log y tienda a una columna), 900 (abanico de mano),
  720 (arena apilada, senda con scroll horizontal), 480 (botones de 44 px,
  controles de combate a ancho completo).
- `env(safe-area-inset-*)` en el padding de `#app` y en el toast;
  `-webkit-tap-highlight-color: transparent`; `touch-action: manipulation`
  en botones; `viewport-fit=cover`.

## Cómo tocar esto sin romperlo

- Las clases usadas por el JS son un contrato: tras editar `styles.css`,
  verificar cobertura con el script de inventario de selectores
  (compara `class="…"` estáticos en `js/` contra los selectores del CSS).
  `smoke.mjs` cubre lógica, no estilos.
- Añadir un icono nuevo: una entrada en `PATHS` de `js/icons.js` y ya.
- Animaciones nuevas: pasar el filtro de las skills — ¿debería animarse?
  ¿solo transform/opacity? ¿una vez o en bucle? ¿interrumpible? ¿reduced-motion?

## Arte de fondo

- `assets/paths/menu|victory|defeat.png` (1024×640, `flux-2-klein`, prompts en
  `scripts/generate-cards.mjs → PATH_PROMPTS`, entradas en
  `data/image-manifest.json`). Se consumen vía `--art-*` en `:root`; si falta
  el PNG, el CSS degrada a degradado plano sin hueco visible.
- El escenario de combate (`.arena-stage`) usa `assets/paths/combat_<enemigo>.png`
  desenfocado y oscurecido; `--stage` se fija en pantalla.
