import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Unit-test harness (jsdom + Testing Library). Kept fully separate from the
// Playwright e2e suite: `include` only picks up co-located *.test.tsx units and
// `exclude` hard-blocks the tests/ e2e tree, so `npm run test:unit` and
// `npm run test:e2e` never overlap.
export default defineConfig({
  plugins: [react()],
  // tsconfig.json sets jsx:"preserve" (Next handles JSX at build time). For the
  // unit runner we need the automatic runtime so tests/components don't have to
  // import React explicitly.
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'tests/**', 'out/**', '.next/**'],
  },
})
