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
        // Mantém o gate de 100% nos módulos com suítes de rota correspondentes;
        // acrescente novas rotas aqui junto com seus testes.
        "src/app/api/admin/agenda/route.ts",
        "src/app/api/admin/auth/route.ts",
        "src/app/api/admin/auth/verificar/route.ts",
        "src/app/api/admin/livros/route.ts",
        "src/app/api/admin/noticias/route.ts",
        "src/app/api/admin/projeto/route.ts",
        "src/app/api/admin/sobre/route.ts",
        "src/app/api/upload/route.ts",
        "src/components/admin/CabecalhoSecao.tsx",
        "src/components/admin/CampoAdmin.tsx",
        "src/components/admin/EstadoLista.tsx",
        "src/components/admin/ModalAdmin.tsx",
        "src/components/admin/ModalConfirmarSenha.tsx",
        "src/components/admin/campo-imagem-admin.tsx",
        "src/components/admin/imagem-ampliavel.tsx",
        "src/components/admin/Noticia.tsx",
        "src/components/admin/subcomponents/NoticiaCard.tsx",
        "src/app/admin/login/page.tsx",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
