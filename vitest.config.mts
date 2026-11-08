import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/configuracao-testes.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/conteudo/**/*.test.mjs"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "scripts/conteudo/inventario.mjs",
        "scripts/conteudo/adaptadores.mjs",
        "scripts/conteudo/banco.mjs",
        "scripts/conteudo/reconciliacao.mjs",
        "scripts/conteudo/migracao.mjs",
        "src/lib/adminConfig.ts",
        "src/lib/adminInput.ts",
        "src/lib/adminRequest.ts",
        "src/lib/adminSession.ts",
        "src/lib/cache-administrativo.ts",
        "src/app/api/admin/**/route.ts",
        "src/app/api/upload/route.ts",
        "src/components/admin/CabecalhoSecao.tsx",
        "src/components/admin/EstadoLista.tsx",
        "src/components/admin/campo-imagem-admin.tsx",
        "src/components/admin/imagem-ampliavel.tsx",
        "src/components/admin/Noticia.tsx",
        "src/components/admin/subcomponents/NoticiaCard.tsx",
        "src/app/admin/login/page.tsx",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
