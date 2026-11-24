import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // Playwright e2e specs run with `npm run test:e2e`, not vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
});
