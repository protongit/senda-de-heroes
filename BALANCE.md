# Balance — Senda de Héroes

## Resultado final (v3.1, 500 partidas headless por héroe, `enemyScale = 0.94`, mazos iniciales de 12 cartas, 98 cartas y 16 enemigos)

### Equidad de héroes (criterio: 50% ±10)
| Héroe | Victoria (500 headless) |
|---|---|
| Guerrero | 51.6% |
| Enano | 43.4% |
| Hechicera | 41.2% |
| Elfa | 53.4% |

Media ≈ 47.4%; todos dentro de 40–60%.

### Enemigos (por combate, condicionado a alcanzarlos; `enemyScale = 0.94`)
| Enemigo | Nivel | Tipo | Victoria del jugador | Turnos |
|---|---|---|---|---|
| Bandido | 1 | normal | 100.0% | 2.6 |
| Goblin | 1 | normal | 100.0% | 2.6 |
| Lobo | 2 | normal | 100.0% | 2.7 |
| Oso | 2 | normal | 100.0% | 2.8 |
| Esqueleto | 3 | normal | 99.7% | 3.4 |
| Espectro | 3 | normal | 100.0% | 3.3 |
| Ogro | 4 | normal | 91.7% | 4.4 |
| Trol | 4 | normal | 96.5% | 4.3 |
| Nigromante | 5 | élite | 96.8% | 5.1 |
| Vampiro | 5 | élite | 99.4% | 4.6 |
| Capitán Osario | 6 | jefe intermedio | 92.9% | 6.2 |
| Señor Orco | 6 | jefe intermedio | 84.0% | 5.2 |
| Dragón de Ceniza | 7 | jefe final | 52.2% | 6.1 |
| Lich | 7 | jefe final | 51.4% | 7.6 |
| Reina de las Arañas | 7 | jefe final | 51.2% | 8.7 |
| Señor del Abismo | 7 | jefe final | 51.8% | 7.5 |

Los **jefes finales** son el pico real de dificultad y quedan agrupados en torno al 51–52%. Los combates normales siguen siendo mayoritariamente favorables, como en la curva anterior.

### Jefes finales rotativos
- Cuatro jefes finales: Lich, Dragón de Ceniza, Reina de las Arañas y Señor del Abismo.
- Cada senda consume uno de una **bolsa sin repetición**; no vuelve a salir el mismo hasta que hayan aparecido todos.
- Al agotarse la bolsa se baraja un nuevo orden.
- La bolsa y el jefe asignado se guardan en la partida y **viajan entre sendas de ascensión** (`continueRunAscension`).
- La semilla de la bolsa usa un RNG independiente (`run.bossRng`), separado del RNG de mapa y del de combate.

### Ascensión (NG+)
Cada senda completada aplica `BALANCE.ascensionStep` (+15%) sobre la vida y los efectos numéricos de **todos** los enemigos, acumulativo: ★2 = ×1.15, ★3 = ×1.30… Sobre `enemyScale`: goblin 38 → ★2 43 → ★3 49.

Como en una senda de ~7 combates la victoria de run es el **producto** de las tasas por combate, la banda estricta por enemigo es incompatible con un 50% de run. Se prioriza: reto real, todos los enemigos derrotables y **curva con los jefes como pico**.

## Nota metodológica
- La senda es **aleatoria con elección entre 2 opciones**: se usa un **RNG de mapa independiente** (`run.mapRng = seed ^ 0x9e3779b9`) que fija las mismas opciones para los 4 héroes con la misma semilla; el combate usa otro RNG (por héroe).
- Las cartas son **instancias** (`uid`), con mejora de fragua y fusiones deterministas.
- La **intención enemiga** (movimiento pre-anunciado) y los **perks** hacen al jugador notablemente más fuerte que en v1: el barrido de `ENEMY_SCALE` pasó de 0.9 (v1) a **0.92** (v2) para recuperar la banda 40–60%.

## Ajuste fino (barrido con 300 partidas por valor)
| ENEMY_SCALE | Media de victoria |
|---|---|
| 0.90 | ~60% |
| 0.92 | ~50% |
| 0.94 | ~45% |
| 0.96 | ~38% |
| 0.98 | ~28% |
| 1.00 | ~24% |

Respuesta muy empinada: pequeño cambio de escala se amplifica al ser el producto de ~7 combates.

## Mecánicas nuevas de v3.1
- **16 enemigos**: dos opciones por tier (normal/élite), dos jefes intermedios y cuatro jefes finales.
- **Bolsa de jefes finales** sin repetición, persistente entre ascensiones.
- **Maldiciones de mazo** impuestas por Nigromante, Vampiro, Capitán Osario, Lich, Reina de las Arañas y Señor del Abismo; se exorcizan en la tienda con el hechicero.
- **Reliquias** de slot único con beneficio fuerte y maldición; aparecen en jefes, tesoros y mercado.
- **Marcas elementales** con reacciones automáticas; solo cartas nuevas, sin tocar las existentes.
- **Desafíos narrativos** opcionales que no avanzan profundidad y pueden dar recompensas variadas.
- **Cooperativo táctico** con amenaza, provocar, cubrir y rescatar; cartas de clase solo en duelos.
- Ajuste de vida base para mantener la banda: Hechicera 56, Elfa 104.

## Mecánicas clave que condicionan el balance
- **Límite de acciones** (3 marciales / 4 arcanos) + **deuda de reacciones** (1 acción del turno siguiente por reacción).
- **Energía solo para arcanos.**
- **Equipo persistente entre combates** + mejoras de fragua (×1.5) y fusiones → enemigos reescalados.
- **Perks al subir de nivel** (sustituyen a las subidas automáticas): +robo, +bloqueo inicial, +daño, celeridad, etc.
- **Mercado fijo + rotativo**: compra automática del autoplay (1 carta asequible por visita).
- **Mazos iniciales de 12 cartas** (2 más que en v1). Las adiciones se eligieron por medición: las cartas de **bloqueo/sustento** valen +20–30 puntos de victoria para héroes frágiles (crean muros imposibles de romper para la IA y estancan combates contra los jefes finales), así que Guerrero y Enano recibieron daño/defensa neutra y la Hechicera obtuvo un equipo nuevo sin bloqueo (**Diadema Arcana**, +1 daño, tela). La Elfa lleva una segunda **Punzada** (daño + robo) para equilibrar su motor.
- **Fix de fragua (v2.2)**: mejorar/fusionar equipo **ya equipado** no se aplicaba (loadout desfasado); al arreglarlo los héroes ganaron ~+5 puntos globalmente → escala subida de 0.93 a **0.94**. La mejora de cartas ya no escala el mod de **energía** (evita duplicar ✦ con Bastón/Amuleto/Túnica).
- **Consumibles (v2.4)**: las cartas de **efecto y recursos se pierden para siempre** al usarlas (hasta volver a comprarlas/hallarlas). La IA ajustó su política de curación (emergencias primero, curarse si falta vida real) y la Hechicera arranca con **2 pociones** (sosten para asedios largos): su victoria pasó de 36.8% → 47.2%.

## Reproducir
```bash
cd senda-de-heroes
node scripts/smoke.mjs        # batería de humo
node scripts/balance.mjs 500  # informe -> docs/balance-report.json
ENEMY_SCALE=0.94 node scripts/balance.mjs 300  # (opcional) probar otra dificultad
```
