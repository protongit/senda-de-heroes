# Diseño de balance — Senda de Héroes

## Objetivos medibles
- **Equidad de héroes:** victoria de senda completa dentro de **50% ±10** (40–60%) por héroe, con las mismas semillas entre héroes.
- **Enemigos normales:** 30–80% de victoria del jugador.
- **Jefes:** 20–60% de victoria del jugador.
- **Ningún enemigo imposible:** si en 20 partidas la victoria es 0% → bajar stats.

## Método
- Semillas fijas `seed = 1..N` idénticas entre héroes (mismo barajado y misma secuencia de enemigos por tier).
- 500 partidas headless por héroe (`scripts/balance.mjs`) + 20 partidas reales por combinación (browsermcp).
- Autoplay determinista para el héroe (js/ai.js) para que la medición no dependa del jugador humano.

## Presupuesto de stats
- Héroes: rango de VIDA 45–70; arcanos con 2–3 energía inicial; fuerza 4–6.
- Equipo: daño pasivo 1–4, bloqueo pasivo 1–4, energía +1 (arcanos).
- Enemigos por nivel (referencia): HP = 20 + 12·nivel; daño por turno ≈ 3 + 2·nivel; jefes ×2 HP y daño +50%.
- XP: umbral de nivel `T(L)` creciente por tramos; XP por enemigo ≈ 8 + 10·nivel.

## Reglas de ajuste automático
1. Si la victoria media de héroes se desvía de 50%: ajustar VIDA base del héroe ±5 y/o la potencia del mazo inicial.
2. Si un héroe queda fuera de 40–60%: dar/quitar +1 a su stat principal o cambiar una carta del mazo inicial.
3. Por enemigo: si `<30%` de victoria → reducir daño o HP un 10–15%; si `>80%` → subirlo un 10–15%.
4. Re-correr lotes completos tras cada ajuste; parar cuando TODO cumpla.

## Salidas
- `scripts/balance.mjs` produce un resumen JSON/markdown.
- `BALANCE.md` documenta el antes/después y las tasas finales.
