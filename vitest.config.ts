import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node", // Lightweight, node environment is perfect for pure helper math/string unit testing.
    globals: true,
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "tests/**/*.spec.ts"], // Exclude Playwright e2e tests
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
