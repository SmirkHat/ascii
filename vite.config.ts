import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    port: 3000,
    allowedHosts: ['.local', 'sponsors-extras-merely-pat.trycloudflare.com'],
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    tailwindcss(),
    // tanstackStart() must come before viteReact()
    tanstackStart(),
    viteReact(),
  ],
})
