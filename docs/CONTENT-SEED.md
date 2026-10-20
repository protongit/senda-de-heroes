# Semillas de contenido — Senda de Héroes

Fuente de los datos en `js/`. Nombres en español, valores orientativos; el balance final lo fija `BALANCE.md`.

## Héroes y mazos iniciales (10 cartas)
- **Guerrero** (hp 62, str 5, no arcano): Espada Corta, Armadura de Piel, Escudo Redondo, Comida, Agua, Golpe de Escudo, Finta, Esquiva, Estocada, Grito de Guerra.
- **Enano** (hp 72, str 6, no arcano): Hacha de Guerra, Cota de Malla, Escudo de Roble, Cerveza, Comida, Embate, Fortificar, Aguante, Torbellino, Grito de Batalla.
- **Hechicera** (hp 46, energía 3, arcana): Bastón Arcano, Túnica Rúnica, Amuleto, Poción, Agua, Bola de Fuego, Escudo Arcano, Drenaje, Rayo, Rayo Menor.
- **Elfa** (hp 52, energía 2, arcana): Arco Largo, Capa de Exploradora, Daga Élfica, Pan de Viaje, Agua, Disparo Certero, Paso Sombra, Lluvia de Flechas, Marca del Cazador, Punzada.

## Equipo (valor en monedas)
Espada Corta 20 (+2 daño) · Hacha de Guerra 35 (+4 daño, heavy) · Arco Largo 30 (+3 daño, bow) · Daga Élfica 22 (+2 daño) · Bastón Arcano 30 (+1 daño, +1 energía) · Escudo Redondo 18 (+2 bloqueo) · Escudo de Roble 32 (+4 bloqueo, heavy) · Armadura de Piel 22 (+1 bloqueo, leather) · Cota de Malla 40 (+3 bloqueo, plate, heavy) · Túnica Rúnica 28 (+1 bloqueo, +1 energía, cloth) · Casco de Hierro 15 (+1 bloqueo) · Botas de Cuero 12 (+1 bloqueo) · Amuleto Arcano 25 (+1 energía) · Capa de Exploradora 14 (+1 bloqueo).

## Recursos
Comida 8 (cura 6) · Agua 6 (cura 4) · Poción 16 (cura 10) · Cerveza 10 (cura 6) · Pan de Viaje 8 (cura 5).

## Habilidades
Golpe de Escudo (daño 4 + bloqueo 3) · Finta (bloqueo 5, roba 1) · Esquiva (bloqueo 6) · Estocada (daño 6) · Grito de Guerra (fuerza +2) · Embate (daño 7) · Fortificar (bloqueo 8) · Aguante (cura 4, bloqueo 3) · Torbellino (daño 5 + bloqueo 3) · Grito de Batalla (fuerza +2, roba 1) · Bola de Fuego (coste 1, daño 8) · Escudo Arcano (coste 1, bloqueo 8) · Drenaje (coste 1, daño 4, cura 4) · Rayo (coste 2, daño 12) · Rayo Menor (coste 1, daño 5) · Disparo Certero (daño 5) · Paso Sombra (bloqueo 4, roba 1) · Lluvia de Flechas (daño 7) · Marca del Cazador (vulnerable 2) · Punzada (daño 4, roba 1).

## Enemigos
| id | Nivel | Tipo | HP | Recompensa |
|---|---|---|---|---|
| goblin | 1 | normal | 24 | 8–14 monedas, 10 XP, drop común 25% |
| lobo | 2 | normal | 32 | 12–20, 18 XP, drop común 25% |
| esqueleto | 3 | normal | 44 | 18–28, 28 XP, drop 30% |
| trol | 4 | normal | 62 | 26–38, 40 XP, drop raro 35% |
| nigromante | 5 | elite | 56 | 40–55, 60 XP, drop raro 45% |
| senor_orco | — | boss | 90 | 60–85, 110 XP, drop épico 100% +VIDA |
| lich | — | boss | 130 | 100–150, 160 XP, drop épico 100% +VIDA |

## Movimientos de enemigo (referencia)
Ataques de 4–20, bloqueos de 3–10 y curaciones de 5–8 según nivel; el Nigromante y el Lich drenan vida.

## v3 — Contenido nuevo
- **Reliquias:** Corazón de Trol, Ojo del Lich, Bastión de Obsidiana, Cáliz de la Luna, Corona de Espinas, Guantelete de Ceniza.
- **Maldiciones de mazo:** Peso Muerto, Susurro del Lich, Herida Abierta.
- **Cartas elementales:** Corte Abierto, Fractura, Sangría, Martillo de Forja, Golpe de Yunque, Malla Fundida, Descarga de Escarcha, Arco Estático, Brasa, Lanza Térmica, Flecha de Vendaval, Disparo Tóxico, Flecha Dentada.
- **Cartas de clase (solo duelos):** Provocar, Guardia del Clan, Distracción Arcana, Rescate del Bosque.
- **Desafíos narrativos:** 12 plantillas (2 cacerías, 4 enigmas, 4 pactos, 2 pruebas de mazo).
