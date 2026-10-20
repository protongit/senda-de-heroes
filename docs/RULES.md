# Reglas — Senda de Héroes

## Acciones y energía
- Cada ronda robas **6 cartas** (+bonus de perks) y dispones de **3 acciones** (4 en clases arcanas). Jugar cualquier carta (equipo, recurso, habilidad o efecto) consume **1 acción**.
- **Solo las clases arcanas (Hechicera, Elfa) tienen energía.** Las cartas con coste > 0 **no pueden usarse por personajes sin energía**. Al jugar una carta arcana se paga su coste en energía.
- La energía por ronda es la base de la clase más los bonus del equipo (Bastón, Túnica Rúnica, Amuleto) y de perks.
- **Recursos y cartas de efecto se consumen al usarlos** (un solo uso): salen de tu mazo definitivamente hasta que vuelvas a conseguirlos (mercado, tesoros o botín). Las habilidades vuelven al descarte como siempre, **salvo los potes de combate completo** (Grito de Guerra, Grito de Batalla…): son de **un uso por combate** — se agotan al jugarlos (sin re-robo ni apilamiento) y vuelven al mazo en el siguiente combate.

## Equipo persistente
- Las cartas de equipación se juegan desde la mano y quedan **en la mesa**. Permanecen equipadas **entre rondas y entre combates**.
- El equipo equipado **no forma parte del mazo de robo** (está en la mesa).
- Al jugar un equipo que ocupa un **slot único** ya ocupado, el anterior vuelve al **descarte/mazo** (y sus efectos fusionados se retiran).
- Manos: presupuesto de 2; las piezas de mano **se acumulan** (no se reemplazan entre sí).
- Se puede **vender** en la tienda (se retira del mazo y del equipo).

## Capacidad de equipo
- Slots únicos: `head`, `body`, `feet`, `neck`, `ring`, `back` (1 cada uno). Manos: **1 arma + 1 escudo** como máximo.
- **Intercambio en las manos**: jugar un **arma** sustituye al arma equipada (la anterior va al **descarte**), igual que un **escudo** sustituye al escudo; un **arma a dos manos** sustituye ambos. Ejemplo: espada corta equipada + jugar espada élfica → la élfica baja a la mesa y la corta vuelve al descarte.
- Exclusiones: `heavy` exige fuerza; la armadura debe estar permitida por la clase.
- **Toda restricción se muestra en la carta.**

## Intención enemiga y reacciones
- El enemigo **anuncia su próximo movimiento** (cola de 2 movimientos pre-tirados): se ve su icono, nombre y daño estimado mientras juegas tu turno.
- Al **terminar el turno** se abre una **ventana de reacción**: si tienes una carta de reacción cuyo disparador coincide con el movimiento anunciado (`si el enemigo ataca`, `si se potencia o defiende`), puedes **seleccionarla**.
- **Al seleccionar la reacción se ejecuta y se resuelve el turno enemigo al instante**: verás un resumen con tu reacción, el movimiento enemigo y el cambio de vida, con un botón de continuar (cuenta atrás de 10 s).
- **Cada reacción cuesta 1 acción de tu turno siguiente** (deuda de acciones). Las reacciones no consumen acciones del turno actual.
- Si no juegas reacciones (o no hay válidas), la ventana de reacción se salta automáticamente y pasa al turno enemigo.

## Efectos con duración
- Las cartas de **efecto** (bendiciones, maldiciones, venenos, pociones) crean estados visibles con **duración en rondas** (o todo el combate). Al expirar o acabar el combate se pierden.
- **Son de un solo uso y se pierden para siempre**: al jugarlas, el efecto se aplica y la carta **se consume** — sale de tu mazo definitivamente. Vuelve a conseguirla comprándola en el mercado, hallándola en un tesoro o como botín de un enemigo. Lo mismo aplica a los **recursos** (comida, agua, pociones).
- **La carta jugada aparece en la mesa** mientras dura su efecto, con un contador de rondas restantes y tooltip (tipo, valor y descripción). Los efectos sobre el enemigo se muestran en su propio panel.
- **Fuerza y Vulnerable también son efectos de mesa**: Marca del Cazador (vulnerable ×1.5 daño), Grito de Guerra (fuerza +2 todo el combate)… se ven como cartas activas mientras duran.
- Del jugador hacia sí: `regen` (cura/ronda), `bonusDamage` (+daño), `bonusBlock` (+bloqueo al empezar turno), `strength` (fuerza).
- Al enemigo: `poison` (daño/ronda, **ignora bloqueo**), `weaken` (−% daño enemigo), `vulnerable` (+50% daño recibido).
- Los enemigos élite/jefe también infligen efectos al héroe (maldiciones del Nigromante y del Lich, plaga necrótica).
- Los efectos de cada lado pican al empezar el turno de su dueño.

## Consumibles (scrap)
- Algunas cartas se **consumen al jugarlas**: salen del mazo para siempre (y de la run al terminar el combate) a cambio de un efecto potente (p. ej. Furia Final).

## Fragua (nodo de la senda)
- **Mejorar carta**: pagas monedas (~60% del valor) y la carta queda **⭐ mejorada** (+50% en valor, efectos y mods).
- **Fusionar**: pagas un coste algo mayor y unes una **carta de efecto** a una de **equipo** (1 efecto por equipo). El efecto se activa en cada combate mientras el equipo esté puesto; **si el equipo se vende o pierde, ambos se descartan**.
- **¿Qué cartas son material de fusión?** Cualquier **carta de efecto**: bendiciones 🙏☀️, venenos 🧴, maldiciones ☠️🖤… y las **gemas 💎 y runas 🔮**, que son materiales específicos de engarce (no jugables en combate: su único uso es fusionarlas en la fragua).
- **Las gemas y runas fusionadas son permanentes**: su efecto dura para siempre mientras el equipo esté puesto (sin rondas). Una espada +1 con una Gema de Fuego (+2) golpea a +3 hasta que la carta de espada+gema se venda o se pierda. El resto de efectos fusionados (bendiciones, venenos…) respeta la duración indicada en su carta.
- El perk **Mano de Herrero** reduce los costes de fragua a la mitad.

## Historial de cambios del juego
Resumen de lo añadido sobre el núcleo original (mazo, acciones, equipo, combate):
1. **Equipo persistente** por slots con capacidad física (pesado, arco, a dos manos) y venta en tienda.
2. **Intención enemiga** (movimiento pre-anunciado) y **reacciones** (1 por ventana; seleccionar una resuelve el turno enemigo; cuesta 1 acción del turno siguiente).
3. **Fruga con mejoras ⭐ y fusión** de efectos a equipos (gemas 💎 y runas 🔮 como material específico).
4. **Mercado dual**: mercadería fija + rarezas rotativas con tier visible; agua y comida siempre disponibles.
5. **Perks a elegir** al subir de nivel (sin stats automáticos).
6. **Consumibles permanentes**: recursos y cartas de efecto se pierden al usarlas hasta volver a conseguirlos; jefes y élites infligen maldiciones, veneno y plaga.
7. **Ascensión NG+**: continuar con el héroe tras derrotar al Lich; enemigos +15% por senda.
8. **v3**: desafíos narrativos con moralidad, reliquias con maldición, maldiciones de mazo y servicios de tienda, marcas elementales con reacciones automáticas y cooperativo táctico con amenaza/cubrir/rescatar.

## Mercado
- La tienda tiene dos zonas: **mercadería fija** (surtido estable toda la run; **no se agota** — puedes comprar tantas copias como necesites, ideal para reponer consumibles) y **rarezas de la semana** (4 huecos con rareza visible Común/Infrecuente/Rara/Épica que **rotan aleatoriamente en cada visita**; lo comprado desocupa el hueco hasta la siguiente rotación).
- Compra = valor de la carta; venta = 50% (+25% por nivel de Regateo).

## Perks al subir de nivel
- Al ganar XP, cada nivel otorga **1 de 2 ventajas a elegir** (vida, fuerza, energía, robo, bloqueo inicial, daño, regateo, herrero, sanación, veneno al golpear, celeridad). Ya no hay subidas automáticas de stats.
- La elección aparece tras la pantalla de recompensa; en autoplay se elige automáticamente.

## Senda aleatoria
- En cada paso se ofrecen **dos opciones** entre combate, tienda, tesoro y (desde el paso 2) **fragua**, hasta el Jefe Orco y el Lich final.

## Ascensión (NG+)
- Al derrotar al Lich, la pantalla de victoria ofrece **"Continuar con tu héroe → Senda ★N+1"**: conservas mazo, equipo, nivel, XP, monedas y perks; te curas por completo y empiezas una senda nueva.
- Cada senda de ascensión aplica **+15% de vida y daño a todos los enemigos**, acumulativo (★3 = +30%, ★4 = +45%…). El HUD de la senda muestra la insignia ⭐ con el modificador.

## Multijugador
- **Cooperativo (2P vs IA)** y **Competitivo (1v1)** funcionan como antes. Las reacciones y la fragua están pensadas para el modo 1 jugador; en duelos no hay tienda ni progresión, así que no aparecen cartas de reacción ni de efecto.

## Maldiciones de mazo
- Algunos movimientos de élite/jefe imponen **lastres** que se añaden al mazo al ganar el combate: **Peso Muerto** (no jugable), **Susurro del Lich** (−1 acción al robarla) y **Herida Abierta** (2 daño al robarla).
- No se pueden jugar ni vender. Se eliminan en la tienda con el **hechicero** por monedas.

## Reliquias
- Son cartas de equipo con slot propio (`relic`). Solo puede haber **una reliquia activa**.
- Se juegan desde la mano y permanecen entre combates, igual que el resto del equipo. Al sustituirlas, la anterior vuelve al descarte y se retiran sus efectos.
- Cada reliquia aporta un **beneficio fuerte** y una **maldición** mientras está equipada. Se pueden vender.

## Sinergias elementales
- Las cartas elementales aplican **marcas** al enemigo: Sangrado 🩸, Fractura 💥, Quemadura 🔥, Escarcha ❄️, Electrizado ⚡, Viento 🌪️ y Veneno 🧴.
- Al coincidir dos marcas compatibles se detona automáticamente una **reacción** y se consumen: Hemorragia, Forja, Explosión, Choque térmico, Sobrecarga (aturde), Plasma, Nube tóxica, Infección y Tormenta.
- Las marcas duran unas rondas y funcionan en 1P, cooperativo y versus.

## Desafíos secundarios
- En la senda puede aparecer una **tercera opción** con probabilidad. No aparece en pasos de jefe.
- Cada desafío cuenta una historia con introducción, una prueba (cacería, enigma o pacto) y un epílogo distinto según el resultado.
- **Resolverlo no avanza la profundidad**: se consume la opción y se vuelve a la misma senda para elegir una de las dos rutas normales.
- Puedes **rechazar el desafío** desde la introducción: la opción se consume y vuelves a la senda sin penalización.
- Perder una cacería o prueba de combate **termina la partida**. Fallar un enigma aplica una penalización y vuelve a la senda.
- Las decisiones morales suman **merced, codicia, honor o corrupción** y alteran recompensas y textos. La crónica de desafíos aparece en el resumen final.
- Las recompensas pueden ser monedas, XP, cartas, reliquias, curación, vida máxima o eliminación de maldiciones.

## Tienda: hechicero y curandero
- Al entrar en la tienda se tira qué servicios aparecen: **hechicero** (elimina una maldición), **curandero** (cura vida) o ninguno.
- El curandero ofrece una cura parcial barata y una cura completa cara. Solo cura vida actual.

## Cooperativo táctico
- El enemigo ataca según la **amenaza** generada por daño y curación.
- **Provocar** fuerza el objetivo enemigo; **Cubrir** redirige el próximo ataque contra un aliado; **Rescatar** revive a un héroe caído una vez por combate.
- Un héroe a 0 de vida queda **caído**, no muerto. Si todos caen, derrota.
- Estas cartas de clase solo se añaden a los mazos de duelo, no al loot de 1P.
