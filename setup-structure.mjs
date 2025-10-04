// setup-structure.mjs
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const base = "src";

const pages = [
  "agenda",
  "sobre",
  "coletivo",
  "premios",
  "espetaculos",
  "projetos",
  "noticias",
  "contato",
];

// cria pasta recursivamente
function createDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
    console.log("📂 Pasta criada:", path);
  } else {
    console.log("⚠️ Já existe pasta:", path);
  }
}

// cria arquivo só se não existir
function createFile(path, content) {
  if (!existsSync(path)) {
    writeFileSync(path, content);
    console.log("✅ Arquivo criado:", path);
  } else {
    console.log("⚠️ Já existe arquivo:", path);
  }
}

// layout.tsx e page.tsx (HOME)
createDir(join(base, "app"));
createFile(
  join(base, "app/layout.tsx"),
  `import "./globals.css";
import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex">
        <aside className="w-64 bg-black text-white p-4">
          <Sidebar />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
`
);

createFile(
  join(base, "app/page.tsx"),
  `export default function Home() {
  return <h1 className="text-2xl font-bold">Home</h1>;
}
`
);

// cria páginas do menu
pages.forEach((p) => {
  const dir = join(base, "app", p);
  createDir(dir);
  createFile(
    join(dir, "page.tsx"),
    `export default function ${p[0].toUpperCase() + p.slice(1)}Page() {
  return <h1 className="text-2xl font-bold">${p.toUpperCase()}</h1>;
}
`
  );
});

// cria estrutura API exemplo
createDir(join(base, "app/api/agenda"));
createFile(
  join(base, "app/api/agenda/route.ts"),
  `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Agenda list" });
}
`
);

// components
createDir(join(base, "components"));
createFile(
  join(base, "components/Sidebar.tsx"),
  `export default function Sidebar() {
  return (
    <nav className="flex flex-col gap-2">
      <a href="/">Home</a>
      <a href="/agenda">Agenda</a>
      <a href="/sobre">Sobre</a>
      <a href="/coletivo">Coletivo</a>
      <a href="/premios">Prêmios</a>
      <a href="/espetaculos">Espetáculos</a>
      <a href="/projetos">Projetos</a>
      <a href="/noticias">Notícias</a>
      <a href="/contato">Contato</a>
    </nav>
  );
}
`
);

// prisma
createDir("prisma");
createFile(
  "prisma/schema.prisma",
  `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Agenda {
  id        Int      @id @default(autoincrement())
  titulo    String
  data      DateTime
  local     String
  createdAt DateTime @default(now())
}

model Noticia {
  id        Int      @id @default(autoincrement())
  titulo    String
  conteudo  String
  createdAt DateTime @default(now())
}
`
);

console.log("🚀 Estrutura verificada/criada com sucesso!");
