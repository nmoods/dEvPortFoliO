import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const basecampSource = fileURLToPath(new URL('./packages/basecamp-ui/src/index.js', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Consume the workspace package from source so edits hot-reload without a library rebuild.
    alias: [{ find: /^@nmoods\/basecamp-ui$/, replacement: basecampSource }],
  },
  test: {
    exclude: ['**/node_modules/**', 'packages/**'],
  },
})
