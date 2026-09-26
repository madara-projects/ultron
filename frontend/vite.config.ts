import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    // The API runs separately in development (Docker or `python -m backend`).
    proxy: { "/api": { target: "http://127.0.0.1:8765", changeOrigin: true } },
  },
  preview: { host: "127.0.0.1" },
  build: { target: "es2022" },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
