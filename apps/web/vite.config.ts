import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Server code reads secrets (ENCRYPTION_KEY, BETTER_AUTH_SECRET…) from process.env.
  for (const [name, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) process.env[name] ??= value

  return {
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    ssr: {
      external: ['better-sqlite3'],
    },
    plugins: [tanstackStart(), nitro(), viteReact(), tailwindcss()],
  }
})
