#!/usr/bin/env python3
"""
Convert pixel TTF/OTF → FIGlet .flf (█ + space/hardblank, no half-blocks).

Rasterizes each glyph on its design CELL with Pillow fontmode='1' (no AA).

Usage:
  .venv-fonts/bin/python scripts/ttf_to_flf.py
  .venv-fonts/bin/python scripts/ttf_to_flf.py --cell 8 path/to/font.ttf
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "fonts" / "source"
OUT_DIR = ROOT / "fonts" / "flf"
RAW_DIR = ROOT / "src" / "fonts" / "flf"

HARDBLANK = "$"
ENDMARK = "@"
INK = "█"

CELL_HINTS: dict[str, int] = {
    "PublicPixel": 8,
    "PixeloidSans": 9,
    "PixeloidSans-Bold": 9,
    "PixeloidMono": 9,
    "HomeVideo-Regular": 20,
    "HomeVideo-Bold": 20,
    "RasterForge": 8,  # 256u grid @ 2048 UPM; CELL=5 collapses glyphs
    "Gridtile": 16,
    "Ithaca": 16,
    "Cairopixel": 16,  # 64u grid @ 1024 UPM; CELL=8 collapses glyphs
    "Pixelbasel": 16,  # 64u @ 1024 — CELL=8 loses detail
    "DarkByte": 16,  # 64u @ 1024 — CELL=8 fills counters
    "Bitrimus": 16,  # 64u @ 1024 — CELL=8 makes A≈R
    "Pixelzone": 16,  # 64u @ 1024 — CELL=8 is solid bars
    "Vaticanus": 16,
    "Zeitmax-Regular": 16,
    "Zeitmax-Italic": 16,
    "Yazo": 32,  # native 64u grid @ 2048 UPM (keep real aspect — matches SVG wordmarks)
    "Fortzilla-Regular": 16,
    "Fortzilla-Italic": 16,
    "Fortzilla-Light": 16,
    "Fortzilla-Light-Italic": 16,
    "Pixelated_Elegance": 16,
}

# Horizontal-only nearest-neighbor stretch (width × N, height unchanged).
WIDTH_SCALE: dict[str, int] = {}

# Vertical squash/stretch after raster (1.0 = native). <1 flattens.
HEIGHT_SCALE: dict[str, float] = {
    "Yazo": 0.4,
    "Pixelzone": 0.5,
}

REQUIRED_CHARS = [chr(c) for c in range(32, 127)] + list("ÄÖÜäöüß")
DETECT_SIZES = (5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24)


def list_fonts(directory: Path) -> list[Path]:
    return sorted(
        p
        for p in directory.rglob("*")
        if p.suffix.lower() in {".ttf", ".otf"} and p.is_file()
    )


def crispness_score(img: Image.Image) -> float:
    pixels = list(img.getdata())
    if not pixels:
        return -1.0
    solid = sum(1 for p in pixels if p < 8 or p > 247)
    mid = sum(1 for p in pixels if 40 <= p <= 215)
    ink = sum(1 for p in pixels if p > 8)
    if ink == 0:
        return -1.0
    return solid / len(pixels) - mid / max(ink, 1)


def render_glyph_cell(font: ImageFont.FreeTypeFont, char: str, cell: int) -> Image.Image:
    """Binary (no-AA) render into a CELL-tall bitmap; width covers advance + bearings."""
    try:
        adv = max(1, int(round(font.getlength(char))))
    except Exception:
        adv = max(1, cell // 2)

    if char == " ":
        return Image.new("L", (adv, cell), 0)

    bbox = font.getbbox(char)
    if not bbox:
        return Image.new("L", (adv, cell), 0)

    left, _top, right, _bottom = bbox
    x0 = min(0, left)
    width = max(adv, right) - x0
    width = max(1, width)

    img = Image.new("L", (width, cell), 0)
    draw = ImageDraw.Draw(img)
    draw.fontmode = "1"
    draw.text((-x0, 0), char, font=font, fill=255)
    return img


def stretch_width(img: Image.Image, scale: int) -> Image.Image:
    """Nearest-neighbor horizontal scale; height stays the same."""
    if scale <= 1:
        return img
    w, h = img.size
    return img.resize((max(1, w * scale), h), resample=Image.Resampling.NEAREST)


def _row_bands(img: Image.Image) -> list[tuple[tuple[int, ...], int]]:
    """Group consecutive identical binary rows into (row_samples, count)."""
    px = img.load()
    w, h = img.size
    bands: list[tuple[tuple[int, ...], int]] = []
    for y in range(h):
        row = tuple(255 if px[x, y] > 127 else 0 for x in range(w))
        if bands and bands[-1][0] == row:
            bands[-1] = (row, bands[-1][1] + 1)
        else:
            bands.append((row, 1))
    return bands


def scale_height(img: Image.Image, scale: float, target_h: int | None = None) -> Image.Image:
    """
    Vertical scale that keeps 1px feature bands (e.g. E / F open rows).

    Plain nearest-neighbor drops thin runs when scale < 1; instead we scale
    each run of identical rows and never shrink an ink run below 1 row, then
    grow/shrink thicker runs to hit target_h.
    """
    if abs(scale - 1.0) < 1e-6 and target_h is None:
        return img

    w, h = img.size
    if target_h is None:
        target_h = max(1, int(round(h * scale)))
    target_h = max(1, target_h)
    if target_h == h and abs(scale - 1.0) < 1e-6:
        return img

    bands = _row_bands(img)
    # Initial allocation — keep interior blank gaps (i-tittle, colon, etc.)
    counts: list[int] = []
    for i, (row, count) in enumerate(bands):
        ink = any(v > 127 for v in row)
        if ink:
            counts.append(max(1, int(round(count * scale))))
            continue
        leading = all(not any(v > 127 for v in b[0]) for b in bands[:i])
        trailing = all(not any(v > 127 for v in b[0]) for b in bands[i + 1 :])
        if leading or trailing:
            counts.append(max(0, int(round(count * scale))))
        else:
            # Interior hole between ink runs — never drop to 0
            counts.append(max(1, int(round(count * scale))))

    def total() -> int:
        return sum(counts)

    # Shrink: never strip the top blank band first — prefer bottom blanks / thick ink.
    # Never collapse interior blank gaps below 1.
    def min_keep_for(i: int) -> int:
        row = bands[i][0]
        ink = any(v > 127 for v in row)
        if ink:
            return 1
        leading = all(not any(v > 127 for v in b[0]) for b in bands[:i])
        trailing = all(not any(v > 127 for v in b[0]) for b in bands[i + 1 :])
        return 0 if (leading or trailing) else 1

    while total() > target_h:
        candidates: list[int] = []
        for i, ((row, _), c) in enumerate(zip(bands, counts)):
            min_keep = min_keep_for(i)
            # Keep at least the initially allocated top blank when possible
            if i == 0 and not any(v > 127 for v in row) and c <= max(
                0, int(round(bands[0][1] * scale))
            ):
                continue
            if c > min_keep:
                candidates.append(i)
        if not candidates:
            # fallback: any compressible
            candidates = [
                i for i, c in enumerate(counts) if c > min_keep_for(i)
            ]
        if not candidates:
            break
        # Prefer bottom-most among the thickest
        max_c = max(counts[i] for i in candidates)
        bottom_thick = [i for i in candidates if counts[i] == max_c]
        i = bottom_thick[-1]
        counts[i] -= 1

    # Grow: prefer thickest ink bands (or blanks if somehow no ink)
    while total() < target_h:
        ink_idxs = [
            i
            for i, (row, _) in enumerate(bands)
            if any(v > 127 for v in row)
        ]
        pool = ink_idxs or list(range(len(bands)))
        i = max(pool, key=lambda j: counts[j])
        counts[i] += 1

    out_rows: list[tuple[int, ...]] = []
    for (row, _), c in zip(bands, counts):
        out_rows.extend([row] * c)

    # Safety pad/trim if still off (shouldn't happen often)
    if len(out_rows) < target_h:
        pad = (0,) * w
        out_rows.extend([pad] * (target_h - len(out_rows)))
    elif len(out_rows) > target_h:
        out_rows = out_rows[:target_h]

    out = Image.new("L", (w, target_h), 0)
    opx = out.load()
    for y, row in enumerate(out_rows):
        for x, v in enumerate(row):
            opx[x, y] = v
    return out


def detect_cell(font_path: Path) -> int:
    best_size = 8
    best_score = float("-inf")
    for size in DETECT_SIZES:
        try:
            font = ImageFont.truetype(str(font_path), size=size)
        except OSError:
            continue
        img = render_glyph_cell(font, "A", size)
        score = crispness_score(img)
        ascent, descent = font.getmetrics()
        fit = 1.0 - abs((ascent + descent) - size) / max(size, 1)
        score += fit * 0.35
        if score > best_score:
            best_score = score
            best_size = size
    return best_size


def image_to_rows(img: Image.Image) -> list[str]:
    """Threshold L image → FIGlet rows (INK / HARDBLANK)."""
    px = img.load()
    w, h = img.size
    rows: list[str] = []
    for y in range(h):
        row = []
        for x in range(w):
            row.append(INK if px[x, y] > 127 else HARDBLANK)
        rows.append("".join(row))
    return rows


def format_fig_char(rows: list[str]) -> str:
    out = []
    for i, row in enumerate(rows):
        mark = ENDMARK * 2 if i == len(rows) - 1 else ENDMARK
        out.append(f"{row}{mark}")
    return "\n".join(out)


def empty_rows(height: int, width: int) -> list[str]:
    return [HARDBLANK * max(1, width) for _ in range(height)]


def trim_global_blank_rows(
    chars: list[tuple[str, list[str]]],
    height: int,
    baseline: int,
) -> tuple[list[tuple[str, list[str]]], int, int]:
    def blank(y: int) -> bool:
        return all(all(c == HARDBLANK for c in rows[y]) for _, rows in chars)

    top = 0
    while top < height and blank(top):
        top += 1
    bottom = height - 1
    while bottom > top and blank(bottom):
        bottom -= 1

    if top >= height or top > bottom:
        return chars, height, baseline

    trimmed = [(ch, rows[top : bottom + 1]) for ch, rows in chars]
    return trimmed, bottom - top + 1, max(1, baseline - top)


def _first_ink_row(rows: list[str]) -> int | None:
    for y, row in enumerate(rows):
        if any(c == INK for c in row):
            return y
    return None


def _compress_row_run(rows: list[str], prefer_bottom: bool = True) -> list[str] | None:
    """Remove one row from the thickest run with count>1 (keeps 1px feature bands)."""
    if len(rows) < 2:
        return None
    bands: list[tuple[str, int, int]] = []  # row, count, start_index
    for i, row in enumerate(rows):
        if bands and bands[-1][0] == row:
            r, c, s = bands[-1]
            bands[-1] = (r, c + 1, s)
        else:
            bands.append((row, 1, i))
    compressible = [(idx, c, s) for idx, (_, c, s) in enumerate(bands) if c > 1]
    if not compressible:
        return None
    # Prefer bottom-most thickest run so top alignment stays stable
    if prefer_bottom:
        band_i = max(compressible, key=lambda t: (t[1], t[2]))[0]
    else:
        band_i = max(compressible, key=lambda t: t[1])[0]
    row, count, start = bands[band_i]
    # drop one row from this run
    drop_at = start + count - 1  # drop from end of run
    return rows[:drop_at] + rows[drop_at + 1 :]


def align_ink_tops(
    chars: list[tuple[str, list[str]]],
    height: int,
) -> list[tuple[str, list[str]]]:
    """
    Nudge *uppercase* letters so their first ink row matches the median.

    Lowercase / punctuation keep native seats (x-height, tittle, baseline).
    Pulling them to the cap line makes ``i``/``t``/``a`` look vertically wrong.
    """
    def is_upper_letter(ch: str) -> bool:
        return len(ch) == 1 and ch.isupper() and ch.isalpha()

    upper_starts = [
        _first_ink_row(rows)
        for (ch, rows) in chars
        if is_upper_letter(ch)
    ]
    valid = sorted(s for s in upper_starts if s is not None)
    if not valid:
        return chars
    target = valid[len(valid) // 2]

    aligned: list[tuple[str, list[str]]] = []
    for ch, rows in chars:
        start = _first_ink_row(rows)
        if not is_upper_letter(ch) or not rows or start is None or start == target:
            aligned.append((ch, rows))
            continue

        width = len(rows[0])
        blank = HARDBLANK * width
        shift = target - start
        new_rows = list(rows)

        if shift > 0:
            new_rows = [blank] * shift + new_rows
            while len(new_rows) > height:
                compressed = _compress_row_run(new_rows, prefer_bottom=True)
                if compressed is None:
                    new_rows = new_rows[:height]
                    break
                new_rows = compressed
            new_rows = new_rows[:height]
        else:
            cut = -shift
            new_rows = new_rows[cut:]
            while len(new_rows) < height:
                new_rows.append(blank)
            new_rows = new_rows[:height]

        new_start = _first_ink_row(new_rows)
        if new_start is not None and new_start < target:
            pad = target - new_start
            new_rows = [blank] * pad + new_rows
            while len(new_rows) > height:
                compressed = _compress_row_run(new_rows, prefer_bottom=True)
                if compressed is None:
                    new_rows = new_rows[:height]
                    break
                new_rows = compressed
            new_rows = new_rows[:height]

        while len(new_rows) < height:
            new_rows.append(blank)
        aligned.append((ch, new_rows[:height]))

    return aligned


def convert_font(font_path: Path, cell_override: int | None = None) -> dict:
    base = font_path.stem.replace(" ", "_")
    cell = cell_override or CELL_HINTS.get(base) or detect_cell(font_path)
    width_scale = max(1, int(WIDTH_SCALE.get(base, 1)))
    height_scale = float(HEIGHT_SCALE.get(base, 1.0))
    if height_scale <= 0:
        height_scale = 1.0
    font = ImageFont.truetype(str(font_path), size=cell)
    ascent, descent = font.getmetrics()

    src_height = cell
    height = max(1, int(round(src_height * height_scale)))
    baseline = max(1, min(height, int(round((ascent if ascent > 0 else src_height) * height_scale))))

    chars: list[tuple[str, list[str]]] = []
    max_len = 0

    for ch in REQUIRED_CHARS:
        try:
            if ch == " ":
                try:
                    w = max(1, int(round(font.getlength(" "))))
                except Exception:
                    w = max(1, cell // 2)
                rows = empty_rows(height, w * width_scale)
            else:
                img = render_glyph_cell(font, ch, cell)
                img = stretch_width(img, width_scale)
                img = scale_height(img, height_scale, target_h=height)
                rows = image_to_rows(img)
                if len(rows) != height:
                    rows = (rows + empty_rows(height, len(rows[0]) if rows else 1))[:height]
        except Exception as err:
            print(f"  ! glyph {ch!r}: {err}", file=sys.stderr)
            rows = empty_rows(height, max(1, cell // 2) * width_scale)

        max_len = max(max_len, *(len(r) + 2 for r in rows))
        chars.append((ch, rows))

    chars = align_ink_tops(chars, height)
    chars, final_h, final_base = trim_global_blank_rows(chars, height, baseline)
    if final_h < 1:
        raise RuntimeError(f"empty raster for {base} (CELL={cell})")

    scale_bits: list[str] = []
    if width_scale > 1:
        scale_bits.append(f"width×{width_scale}")
    if abs(height_scale - 1.0) >= 1e-6:
        scale_bits.append(f"height×{height_scale:g}")
    scale_note = f", {', '.join(scale_bits)}" if scale_bits else ""
    comments = [
        f"{base} — pixel TTF→FLF (CELL={cell}px{scale_note}, fontmode=1, no AA)",
        "Designer: GGBotNet · converter: ascii-smht/scripts/ttf_to_flf.py",
        f"Ink={INK}, hardblank={HARDBLANK}, no half-blocks",
        f"ascent={ascent} descent={descent} baseline={final_base}",
    ]
    header = (
        f"flf2a{HARDBLANK} {final_h} {final_base} {max_len} 15 {len(comments)} 0 144 0"
    )
    body = "\n".join(format_fig_char(rows) for _, rows in chars)
    flf = f"{header}\n" + "\n".join(comments) + f"\n{body}\n"

    try:
        source = str(font_path.relative_to(SOURCE_DIR))
    except ValueError:
        source = str(font_path)

    return {
        "id": base,
        "cell": cell,
        "height": final_h,
        "flf": flf,
        "source": source,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("fonts", nargs="*", type=Path)
    parser.add_argument("--cell", type=int, default=None)
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    files = [p.resolve() for p in args.fonts] if args.fonts else list_fonts(SOURCE_DIR)
    if not files:
        print("No fonts found.", file=sys.stderr)
        return 1

    # Full rebuild clears stale outputs; single-font runs keep the rest.
    converting_all = not args.fonts
    if converting_all:
        for old in OUT_DIR.glob("*.flf"):
            old.unlink()
        for old in RAW_DIR.glob("*.flf"):
            old.unlink()

    manifest: list[dict] = []
    if not converting_all:
        manifest_path = OUT_DIR / "manifest.json"
        if manifest_path.exists():
            try:
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                manifest = []

    failed = 0
    updated_ids: set[str] = set()
    for path in files:
        try:
            result = convert_font(path, cell_override=args.cell)
            name = f"{result['id']}.flf"
            (OUT_DIR / name).write_text(result["flf"], encoding="utf-8")
            (RAW_DIR / name).write_text(result["flf"], encoding="utf-8")
            scale = WIDTH_SCALE.get(result["id"], 1)
            hscale = HEIGHT_SCALE.get(result["id"], 1.0)
            scale_bit = f", width×{scale}" if scale > 1 else ""
            if abs(hscale - 1.0) >= 1e-6:
                scale_bit += f", height×{hscale:g}"
            print(
                f"✓ {result['source']} → {name} "
                f"(CELL={result['cell']}px, h={result['height']}{scale_bit})"
            )
            entry = {
                "id": result["id"],
                "file": name,
                "source": result["source"],
                "cell": result["cell"],
                "height": result["height"],
            }
            updated_ids.add(result["id"])
            manifest = [m for m in manifest if m.get("id") != result["id"]]
            manifest.append(entry)
        except Exception as err:
            failed += 1
            print(f"✗ {path}: {err}", file=sys.stderr)

    manifest.sort(key=lambda m: str(m.get("id", "")))
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\nDone: {len(updated_ids)} converted, {failed} failed, {len(manifest)} in manifest → {OUT_DIR}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
