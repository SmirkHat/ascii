# ascii-smht

Pracovní web pro sadu nástrojů na zpracování ASCII artu, textu a obrázků.
Cílová subdoména: **ascii.smht.eu**

## Stack

- TanStack Start (file-based routing, SSR)
- React 19 + TypeScript v strict režimu
- Tailwind CSS v4 (CSS-first `@theme`, bez `tailwind.config.js`)
- shadcn/ui ve stylu New York, s CSS variables a Lucide ikonami
- Geist + Geist Mono přes Fontsource
- Vite 8 a pnpm 10

Sdílené komponenty používají shadcn tokeny z `src/styles/app.css`. Komplexní
stávající ovládací prvky (select, sheet, number field) zůstávají postavené na
Base UI, aby se zachovalo jejich chování; vizuálně sdílejí stejný New York
design systém a brand tokeny.

## Spuštění

```bash
cd ascii-smht
cp .env.example .env   # doplňte IMAGE_GEN_API_KEY podle potřeby
pnpm install
pnpm dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000), pokud port
není obsazený.

### AI generování (volitelné)

Pro `/ai-ascii` nastavte v `.env`:

| Proměnná            | Popis                                                  |
| ------------------- | ------------------------------------------------------ |
| `IMAGE_GEN_URL`     | URL Cloudflare Workeru (např. `https://….workers.dev`) |
| `IMAGE_GEN_API_KEY` | stejný secret jako `API_KEY` na Workeru                |

Referenční kód Workeru je v `workers/image-gen.js` (Flux Schnell).

## Skripty

| Příkaz                 | Popis                           |
| ---------------------- | ------------------------------- |
| `pnpm dev`             | vývojový server                 |
| `pnpm build`           | produkční build                 |
| `pnpm start`           | spuštění produkčního serveru    |
| `pnpm preview`         | náhled buildu                   |
| `pnpm typecheck`       | TypeScript kontrola             |
| `pnpm lint`            | ESLint                          |
| `pnpm generate-routes` | přegenerovat `routeTree.gen.ts` |

## Struktura

```
src/
  components/
    layout/          # header, footer, theme toggle, shell
    tools/           # sdílené UI nástrojů (upload, canvas, export…)
    ui/              # shadcn komponenty a interaktivní primitives
  lib/               # čistá logika a brand konfigurace
  routes/            # file-based routy
  styles/app.css     # Tailwind, tokeny a system-first theme
```

## Routy

- `/` — přehled nástrojů
- `/image-to-ascii` — PNG/JPG/WebP/GIF/SVG → ASCII (canvas rasterizace)
- `/ai-ascii` — prompt → Flux Schnell → ASCII
- `/text-to-banner` — FIGlet banner
- `/braille` — braille art (scaffold)
- `/editor` — ASCII editor (scaffold)
- `/gallery` — galerie (prázdný stav)
