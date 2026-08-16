# Fonty (GGBotNet → FIGlet)

## Zdroje TTF

Originály zůstávají v `fonts/source/` (23 souborů).
Staženo z GitHub `fonts-cc0` + DaFont.

## Konverze (Cesta A)

Rasterizace na design **CELL** bez antialiasingu (`Pillow` `fontmode='1'`), výstup `█` + hardblank:

```bash
# venv s Pillow
uv venv .venv-fonts && uv pip install --python .venv-fonts/bin/python pillow

npm run convert-pixel-fonts
# = .venv-fonts/bin/python scripts/ttf_to_flf.py
# + node scripts/generate-font-previews.mjs
```

Jednotlivý font / vynucené CELL:

```bash
.venv-fonts/bin/python scripts/ttf_to_flf.py --cell 8 fonts/source/PublicPixel/PublicPixel.ttf
```

Výstup: `fonts/flf/*.flf` a kopie v `src/fonts/flf/` pro Vite.

## Poznámky

- CELL musí sedět s mřížkou fontu (viz `CELL_HINTS` ve skriptu).
- **Gridtile** má grid pečený v glyphech — FIGlet ho přenese; „bez gridu“ by chtělo extra čištění.
- HomeVideo může mít stejné tvary pro A/a (font).
