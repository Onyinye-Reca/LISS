import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve the shared package to its TypeScript source so Vite bundles
      // real ESM named exports (the CJS dist hides them from Rollup) and HMR
      // picks up changes without a rebuild. Typecheck still uses dist types.
      "@liss11/shared": fileURLToPath(
        new URL("../../packages/shared/src/index.ts", import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
    open: true, // launch the browser at http://localhost:5173 on dev start
  },
});
