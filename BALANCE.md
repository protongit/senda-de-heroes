# Balance — Senda de Héroes

## Resultado final (v3.2, 500 partidas headless por héroe, `enemyScale = 0.88` + curva `depthPower`, mazos iniciales de 12 cartas, 98 cartas y 16 enemigos)

### Equidad de héroes (criterio: 50% ±10)
| Héroe | Victoria (500 headless) |
|---|---|
| Guerrero | 46.6% |
| Enano | 44.6% |
| Hechicera | 45.0% |
| Elfa | 43.4% |

Media ≈ 44.9%; todos dentro de 40–60% y con un rango muy apretado (3.2 puntos, frente a los 12 de v3.1).

### Curva de dificultad (v3.2)
Se añade `BALANCE.depthPower` (multiplicador por `run.depth` 0..6) para aplanar la curva:
- **Inicio fácil** (depth 0–1: ×0.80–0.88) para conservar vida.
- **Medio más exigente** (depth 2–4: ×1.05–1.18) y **jefe intermedio** (depth 5: ×1.12).
- **Jefe final** (depth 6: ×1.07) compensado para seguir siendo el pico.

Con `enemyScale = 0.88` (antes 0.94) la victoria de run se mantiene ≈ 45% mientras el mid-game deja de ser trivial:
| Enemigo | v3.1 | v3.2 |
|---|---|---|
| Ogro (tier 4) | 91.7% | 85.4% |
| Nigromante (élite) | 96.8% | 95.2% |
| Señor Orco (jefe intermedio) | 84.0% | 76.4% |
| Jefes finales (4) | ~51% | 46.5–53.8% |

Ajuste de vida de héroes para apretar la banda: Enano 44→50, Hechicera 56→62, Elfa 104→100 (Guerrero sin cambios).

### Enemigos (por combate, condicionado a alcanzarlos; `enemyScale = 0.88`, curva `depthPower`)
| Enemigo | Nivel | Tipo | Victoria del jugador | Turnos |
|---|---|---|---|---|
| Bandido | 1 | normal | 100.0% | 2.4 |
| Goblin | 1 | normal | 100.0% | 2.4 |
| Lobo | 2 | normal | 100.0% | 2.5 |
| Oso | 2 | normal | 100.0% | 2.6 |
| Esqueleto | 3 | normal | 99.7% | 3.5 |
| Espectro | 3 | normal | 100.0% | 3.4 |
| Ogro | 4 | normal | 85.4% | 4.7 |
| Trol | 4 | normal | 94.5% | 4.5 |
| Nigromante | 5 | élite | 95.2% | 5.7 |
| Vampiro | 5 | élite | 98.9% | 5.1 |
| Capitán Osario | 6 | jefe intermedio | 88.7% | 6.4 |
| Señor Orco | 6 | jefe intermedio | 76.4% | 5.3 |
| Dragón de Ceniza | 7 | jefe final | 52.2% | 6.1 |
| Lich | 7 | jefe final | 52.3% | 7.4 |
| Reina de las Arañas | 7 | jefe final | 46.5% | 8.4 |
| Señor del Abismo | 7 | jefe final | 53.8% | 7.6 |

Los **jefes finales** siguen siendo el pico real de dificultad (46.5–53.8%), con el mid-game (tier 4, jefes intermedios) claramente más exigente que en v3.1.

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
