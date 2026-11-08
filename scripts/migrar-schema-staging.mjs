import { spawn } from "node:child_process";
import path from "node:path";
import process, { loadEnvFile } from "node:process";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const arquivo of [".env.staging.local", ".env.staging"]) {
  try { loadEnvFile(path.join(raiz, arquivo)); } catch (erro) {
    if (erro.code !== "ENOENT") {
      console.error("Não foi possível carregar a configuração local de staging.");
      process.exit(1);
    }
  }
}

function validarStaging() {
  const ref = process.env.STAGING_PROJECT_REF;
  if (!/^[a-z0-9]{20}$/.test(ref ?? "") || process.env.STAGING_ORIGEM_DESTINO !== "bancos-separados") {
    throw new Error("A referência ou a topologia não confirma um staging separado da origem.");
  }

  let banco;
  let supabase;
  try {
    banco = new URL(process.env.STAGING_DATABASE_URL ?? "");
    supabase = new URL(process.env.STAGING_SUPABASE_URL ?? "");
  } catch {
    throw new Error("As URLs de banco ou Supabase do staging estão ausentes ou inválidas.");
  }

  const usuario = decodeURIComponent(banco.username);
  const hostDireto = banco.hostname === `db.${ref}.supabase.co`;
  const hostPooler = banco.hostname.endsWith(".pooler.supabase.com") && usuario === `postgres.${ref}`;
  const sslValido = ["require", "verify-ca", "verify-full"].includes(banco.searchParams.get("sslmode"));
  if (!["postgres:", "postgresql:"].includes(banco.protocol) || !banco.username || !banco.password || !sslValido || (!hostDireto && !hostPooler)) {
    throw new Error("A URL PostgreSQL não corresponde ao projeto staging com SSL.");
  }
  if (supabase.protocol !== "https:" || supabase.hostname !== `${ref}.supabase.co` || supabase.pathname !== "/" || supabase.search || supabase.hash) {
    throw new Error("A URL Supabase não corresponde à referência staging.");
  }
  return { ref, databaseUrl: banco.toString() };
}

let destino;
try { destino = validarStaging(); } catch (erro) {
  console.error(erro.message);
  process.exit(1);
}

const { values, positionals } = parseArgs({
  options: {
    ambiente: { type: "string" },
    aplicar: { type: "boolean" },
    check: { type: "boolean" },
    status: { type: "boolean" },
  },
  allowPositionals: true,
});

const operacoes = [values.aplicar, values.check, values.status].filter(Boolean).length;
if (positionals.length || values.ambiente !== "staging" || operacoes !== 1) {
  console.error("Use --ambiente staging e escolha exatamente uma opção: --check, --status ou --aplicar.");
  process.exit(1);
}

if (values.check) {
  console.log(`Configuração validada para staging isolado (${destino.ref}); nenhuma conexão foi aberta.`);
  process.exit(0);
}

const prismaCli = path.join(raiz, "node_modules/prisma/build/index.js");
const comando = values.status ? "status" : "deploy";
const migracao = spawn(process.execPath, [prismaCli, "migrate", comando, "--schema", "prisma/schema.prisma"], {
  cwd: raiz,
  env: { ...process.env, DATABASE_URL: destino.databaseUrl },
  stdio: "inherit",
});

for (const sinal of ["SIGINT", "SIGTERM"]) process.on(sinal, () => migracao.kill(sinal));
migracao.on("error", () => {
  console.error("Não foi possível iniciar a CLI Prisma para o staging.");
  process.exitCode = 1;
});
migracao.on("exit", (codigo, sinal) => {
  if (codigo !== null) process.exitCode = codigo;
  else if (sinal) process.exitCode = 1;
});
