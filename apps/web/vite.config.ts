import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Server code reads secrets (ENCRYPTION_KEY, BETTER_AUTH_SECRET…) from process.env.
  for (const [name, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) process.env[name] ??= value

  // Uncommon default so it can keep running alongside other local apps.
  const port = Number(process.env.PORT ?? 4710)

  return {
    // strictPort: falling back to another port would break BETTER_AUTH_URL and the session cookie.
    server: { port, strictPort: true },
    preview: { port, strictPort: true },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    ssr: {
      external: ['better-sqlite3'],
    },
    plugins: [tanstackStart(), nitro(), viteReact(), tailwindcss()],
  }
})
