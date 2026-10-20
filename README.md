# Senda de Héroes

Juego de cartas de **construcción de mazos** (estilo Slay the Spire / Star Realms / Dominion) con progresión tipo Diablo, ambientado en fantasía medieval. Para navegador, sin build ni dependencias: **HTML + CSS + módulos ES**.

## Modos de juego
- **1 jugador:** recorre una senda aleatoria y derrota al Lich.
- **Cooperativo (2P vs IA):** dos héroes (2 jugadores en el mismo navegador) contra un enemigo controlado por la IA.
- **Competitivo (1v1):** dos héroes se enfrentan cara a cara.

## Cómo jugar
1. Sirve la carpeta y abre el navegador (usa `server.py`, que evita caché de módulos):
   ```bash
   cd senda-de-heroes
   python3 server.py 8090
   ```
   Abre `http://localhost:8090`. Si alguna vez ves la página en blanco tras actualizar el juego, haz una recarga forzada (`Ctrl+Shift+R`).
2. Elige modo y héroe(s). En 1 jugador, la **senda es aleatoria**: en cada paso eliges entre **dos opciones** (combate, tienda, tesoro o fragua) hasta el jefe final. Con probabilidad aparece una **tercera opción de desafío secundario**: una mini-historia con cacerías, enigmas o pactos.
3. En cada ronda robas 6 cartas y tienes **3 acciones** (4 en clases arcanas). El **enemigo anuncia su próximo movimiento** antes de que juegues.
4. **Equipo** → permanece en la mesa entre rondas y combates. **Recursos** curan. **Habilidades** dañan, bloquean o roban. **Efectos** (bendiciones, venenos, maldiciones) duran rondas o todo el combate.
5. **Reacciones**: al terminar el turno, si el movimiento enemigo lo permite, puedes jugarlas desde la mano; cada una **cuesta 1 acción del turno siguiente**.
6. **Fragua**: mejora una carta (⭐ +50% de valor) o **fusiona** una carta de efecto a un equipo (1 por pieza; se descartan juntas si el equipo se vende o pierde).
7. **Mercado**: mercadería fija toda la run + **rarezas de la semana** que rotan en cada visita (Común → Épica). En la tienda pueden aparecer un **hechicero** (elimina maldiciones) y un **curandero** (cura vida) de forma aleatoria.
8. **Niveles**: cada nivel permite **elegir 1 de 2 ventajas (perks)**: vida, fuerza, robo, bloqueo inicial, daño, energía, regateo, herrero, sanación, veneno al golpear o celeridad.
9. Capacidad de equipo: 1 casco, 1 armadura, 1 par de botas, 1 amuleto, 1 anillo, 1 capa; **1 arma + 1 escudo** en las manos — jugar un arma o escudo **sustituye al equipado** (vuelve al descarte) y un arma a dos manos sustituye ambos.
10. **Reliquias**: equipo con slot propio (solo una activa), un beneficio fuerte y una maldición mientras está puesta. Aparecen en jefes, tesoros y mercado.
11. **Sinergias elementales**: las cartas nuevas aplican marcas (sangrado, fractura, quemadura, escarcha, electro, viento, veneno). Al combinar dos marcas compatibles se detona una reacción automática.
12. **Maldiciones de mazo**: élites y jefes pueden añadir lastres no jugables; se eliminan con el hechicero.
13. **Desafíos narrativos**: 12 historias con decisiones morales, pruebas de combate o puzles y epílogos distintos según el resultado. Al terminar verás el balance con monedas, XP, vida, cartas ganadas/perdidas y moralidad. Resolverlos no avanza la senda.
14. El **log de combate** aparece en un lateral, con la última acción arriba y ocultable.
15. Puedes **guardar la partida** desde la senda (💾 Guardar partida); se almacena en el `localStorage` del navegador y aparece como **Continuar partida** en el menú.

## Contenido
- **4 héroes:** Guerrero, Enano, Hechicera (arcana), Elfa (arcana) — mazos iniciales de **12 cartas** cada uno, con cartas de clase adicionales en los mazos de duelo.
- **7 enemigos:** Goblin, Lobo, Esqueleto, Trol, Nigromante (élite) + 2 jefes (Señor Orco, Lich) — con maldiciones, venenos y plaga necrótica.
- **98 cartas**: equipo, habilidades, recursos, efectos, gemas/runas, reacciones, consumibles, **reliquias**, **maldiciones de mazo** y **cartas elementales**. Incluye **11 retratos** (nan.builders, `flux-2-klein`).
- **12 desafíos narrativos** con estilos distintos, decisiones morales y desenlaces variables.
- **Cooperativo táctico:** amenaza, provocar, cubrir y rescatar mediante cartas de clase exclusivas de los duelos.
- **Sendas con ascensión (NG+):** al derrotar al Lich puedes continuar con el mismo héroe (mazo, nivel, perks y monedas) en una senda ★2 con enemigos un 15% más poderosos; cada senda completada sube la dificultad otro 15%.

## Estructura
```
senda-de-heroes/
├── index.html · styles.css
├── Dockerfile · nginx.conf · docker-compose.yml
├── js/
│   ├── main.js          # navegación y flujo (1P, coop, versus, fragua, perks)
│   ├── engine.js        # motor de combate (mazos, energía, acciones, intención, reacciones, efectos)
│   ├── duel.js          # motor multijugador (coop y competitivo)
│   ├── run.js · shop.js · simulate.js · perks.js
│   ├── cards.js · characters.js · enemies.js · loot.js · balance-config.js · rng.js · ai.js · ui.js
│   ├── challenges.js · elements.js · save.js
│   └── screens/ (menu, select, senda, battle, reward, shop, forge, perk, deck, gameover, duelsetup, duelbattle, challenge)
├── data/image-manifest.json
├── scripts/ (generate-cards.mjs, smoke.mjs, balance.mjs)
├── assets/{cards,portraits}/
└── docs/
```

## Pruebas
```bash
node scripts/smoke.mjs         # 370 comprobaciones (reglas, instancias, efectos, reacciones, fragua, mercado, perks, maldiciones, reliquias, marcas, desafíos, coop)
node scripts/balance.mjs 500   # tasas de victoria -> docs/balance-report.json
```
Balance final y metodología en [`BALANCE.md`](./BALANCE.md).

## Contenedor (Docker)
```bash
docker buildx build --load -t senda-de-heroes .
docker run -d --name senda-de-heroes -p 8080:80 senda-de-heroes
# o con compose (recomendado):
docker compose up -d --build
```
Abre `http://localhost:8080`. El contenedor sirve el juego con nginx (gzip para JS/CSS, caché larga para imágenes y `no-cache` para código).

## Modo de pruebas / autoplay
- Una partida: `?autoplay=1&hero=warrior&seed=1` → resultado en `#autoplay-result`.
- Lote: `?autoplay=1&batch=20` → 20 partidas por héroe y tabla resumen.
- Multijugador: `?duel=coop` o `?duel=versus` abren la configuración correspondiente.

## Regenerar el arte
```bash
NAN_API_KEY=sk-... node scripts/generate-cards.mjs            # salta los existentes
NAN_API_KEY=sk-... node scripts/generate-cards.mjs --force    # regenera todo
NAN_API_KEY=sk-... node scripts/generate-cards.mjs --only=fireball,lich
```
Modelo `flux-2-klein` (768×1024 cartas, 1024×1024 retratos), `b64_json`, semilla fija. Si falta un PNG, la UI usa emoji/fondo CSS.
