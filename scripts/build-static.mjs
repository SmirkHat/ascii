/**
 * Generate static HTML for every route by rendering the app through the built
 * TanStack Start server bundle.
 *
 * Each route produces the *real* SSR output — full <head> with meta tags, the
 * `window.$_TSR` hydration payload (`$tsr-stream-barrier`), and the module
 * scripts — so React hydrates perfectly. A hand-written HTML shell crashes
 * hydration (no `$_TSR`), which is why the pages used to flash and blank out.
 *
 * Route paths are derived from the file-router directory (`src/routes/`):
 *   index.tsx -> "/",  foo-bar.tsx -> "/foo-bar"
 * and written as `dist/client/index.html` and `dist/client/<route>/index.html`
 * so Vercel serves each path as a directory index (no client-side fallback
 * needed for the routes that exist).
 *
 * Usage: run after `vite build` (the server bundle must already exist).
 */
import { mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const serverBundle = join(root, "dist/server/server.js")
const routesDir = join(root, "src/routes")
const outDir = join(root, "dist/client")

// CJS interop: ns.default is module.exports, whose .default is the entry.
const ns = await import(`${serverBundle}`)
const entry = ns.default?.default ?? ns.default

if (!entry?.fetch) {
  throw new Error(
    "Server bundle has no fetch handler. Run `vite build` before build-static.",
  )
}

// Concrete routes only: `foo.tsx`/`index.tsx`. Skips `__root.tsx`,
// `*.lazy.tsx` and `$param` routes (none of which are used here).
const routePaths = readdirSync(routesDir)
  .filter((f) => /^[a-z0-9-]+\.tsx$/.test(f))
  .map((f) => {
    const name = f.replace(/\.tsx$/, "")
    return name === "index" ? "/" : `/${name}`
  })
  .sort()

if (routePaths.length === 0) {
  throw new Error(`No routes found in ${routesDir}`)
}

let rendered = 0
for (const path of routePaths) {
  const request = new Request(`http://localhost${path}`, {
    headers: { accept: "text/html" },
  })

  const response = await entry.fetch(request, {})
  if (!response.ok) {
    throw new Error(
      `SSR render failed for ${path}: ${response.status} ${response.statusText}`,
    )
  }
  const html = await response.text()

  if (!html.includes("$_TSR")) {
    throw new Error(`SSR output missing hydration payload for ${path}`)
  }

  const rel = path === "/" ? "index.html" : `${path.replace(/^\//, "")}/index.html`
  const file = join(outDir, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
  console.log(`  ${path} -> ${rel} (${html.length} bytes)`)
  rendered++
}

console.log(`Generated static HTML for ${rendered} routes`)
