import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // Todo el código de la aplicación cuenta, tenga o no pruebas.
      include: ["src/**/*.{ts,tsx}"],
      // Exclusiones sin lógica (justificadas en docs/INFORME_PRUEBAS.md):
      // - main.tsx: entrypoint, solo monta providers sobre #root.
      // - features/**/types: solo declaraciones de tipos, no emiten JS.
      //   (shared/types/ErrorCode.ts sí se ejecuta y sigue contando.)
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/features/**/types/**",
      ],
      reporter: ["text-summary", "text", "html", "lcov", "json-summary"],
      reportsDirectory: "coverage",
    },
  },
});
