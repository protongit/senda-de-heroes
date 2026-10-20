# Estilo de arte — Senda de Héroes

## Prefijo de estilo común (se antepone a todos los prompts)
`medieval fantasy fantasy trading card game art, painterly digital illustration, dramatic warm lighting, rich saturated colors, ornate decorative border, centered composition, high detail, no text, no watermark`

## Reglas por tipo
- **Cartas** (`assets/cards/<id>.png`): 768×1024 (múltiplo de 16), retrato vertical, objeto/acción centrada, fondo atmosférico.
- **Retratos** (`assets/portraits/<id>.png`): 1024×1024, busto del personaje, mirando al frente.
- Modelo: `flux-2-klein`, `response_format: b64_json`, `seed` fijo por id (reproducible).

## Esquema de `data/image-manifest.json`
```json
[
  { "id": "warrior_sword_1", "group": "cards", "file": "assets/cards/warrior_sword_1.png",
    "prompt": "a short sword of polished steel with a leather grip, resting on a stone ledge",
    "seed": 101, "model": "flux-2-klein", "size": "768x1024" }
]
```
Campos: `id`, `group` (`cards`|`portraits`), `file`, `prompt` (sin el prefijo; el script lo añade), `seed`, `model`, `size`.

## QA visual
- Sin texto ni marcas en la imagen.
- Encuadre centrado y legible a tamaño de carta (≈200×280 px).
- Paleta coherente (maderas, dorados, cuero, piedra, azules/rojos mágicos).
- Degradación: si falta el PNG, la UI muestra el `icon` (emoji/SVG) con fondo CSS.
