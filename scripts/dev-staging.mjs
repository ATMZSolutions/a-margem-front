import { spawn } from "node:child_process";
import path from "node:path";
import process, { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  loadEnvFile(path.join(raiz, ".env.staging.local"));
} catch (erro) {
  if (erro.code === "ENOENT") {
    console.error("Crie .env.staging.local com as credenciais do projeto de staging isolado.");
    process.exit(1);
  }
  console.error("Não foi possível carregar .env.staging.local.");
  process.exit(1);
}

function validarDestinoStaging() {
  const ref = process.env.STAGING_PROJECT_REF;
  if (!/^[a-z0-9]{20}$/.test(ref ?? "") || process.env.STAGING_ORIGEM_DESTINO !== "bancos-separados") {
    throw new Error("A referência ou a topologia do staging não confirma bancos separados.");
  }

  let database;
  let supabase;
  try {
    database = new URL(process.env.STAGING_DATABASE_URL ?? "");
    supabase = new URL(process.env.STAGING_SUPABASE_URL ?? "");
  } catch {
    throw new Error("As URLs de banco ou Supabase do staging estão ausentes ou inválidas.");
  }

  const usuario = decodeURIComponent(database.username);
  const bancoDireto = database.hostname === `db.${ref}.supabase.co`;
  const bancoPooler = database.hostname.endsWith(".pooler.supabase.com") && usuario === `postgres.${ref}`;
  const sslValido = ["require", "verify-ca", "verify-full"].includes(database.searchParams.get("sslmode"));
  if (!bancoDireto && !bancoPooler) throw new Error("A URL PostgreSQL não corresponde ao projeto de staging.");
  if (!["postgres:", "postgresql:"].includes(database.protocol) || !sslValido) {
    throw new Error("A URL PostgreSQL do staging precisa usar SSL.");
  }
  if (supabase.protocol !== "https:" || supabase.hostname !== `${ref}.supabase.co` || supabase.pathname !== "/" || supabase.search || supabase.hash) {
    throw new Error("A URL Supabase não corresponde à referência de staging.");
  }

  const chaveStorage = process.env.STAGING_SUPABASE_SECRET_KEY?.trim()
    || process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY?.trim();
  const mimes = (process.env.STAGING_STORAGE_ALLOWED_MIME_TYPES ?? "").split(",").map((mime) => mime.trim());
  const maxFileSizeBytes = Number(process.env.STAGING_STORAGE_MAX_FILE_SIZE_BYTES);
  if (!chaveStorage || !process.env.STAGING_STORAGE_BUCKET || !Number.isSafeInteger(maxFileSizeBytes)
    || maxFileSizeBytes < 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].every((mime) => mimes.includes(mime))) {
    throw new Error("A configuração de Storage do staging está ausente ou inválida.");
  }
  return { databaseUrl: database.toString(), supabaseUrl: supabase.origin, chaveStorage };
}

let destino;
try {
  destino = validarDestinoStaging();
} catch (erro) {
  console.error(erro.message);
  process.exit(1);
}

process.env.DATABASE_URL = destino.databaseUrl;
process.env.SUPABASE_URL = destino.supabaseUrl;
process.env.SUPABASE_STORAGE_SECRET_KEY = destino.chaveStorage;
process.env.SUPABASE_STORAGE_BUCKET = process.env.STAGING_STORAGE_BUCKET;
process.env.SUPABASE_STORAGE_MAX_FILE_SIZE_BYTES = process.env.STAGING_STORAGE_MAX_FILE_SIZE_BYTES;
process.env.SUPABASE_STORAGE_ALLOWED_MIME_TYPES = process.env.STAGING_STORAGE_ALLOWED_MIME_TYPES;
process.env.CONTEUDO_EDITORIAL_SUPABASE_ATIVO = "true";

const args = process.argv.slice(2);
if (args.includes("--check")) {
  console.log("Configuração local do staging isolado validada; nenhuma conexão foi aberta.");
  process.exit(0);
}
const temPorta = args.some((arg) => arg === "--port" || arg === "-p" || arg.startsWith("--port="));
const argumentosNext = [
  path.join(raiz, "node_modules/next/dist/bin/next"),
  "dev",
  "--turbopack",
  ...(temPorta ? [] : ["--port", "3104"]),
  ...args.filter((arg) => arg !== "--check"),
];

const servidor = spawn(process.execPath, argumentosNext, { cwd: raiz, env: process.env, stdio: "inherit" });
for (const sinal of ["SIGINT", "SIGTERM"]) {
  process.on(sinal, () => servidor.kill(sinal));
}
servidor.on("error", () => {
  console.error("Não foi possível iniciar o servidor Next local.");
  process.exitCode = 1;
});
servidor.on("exit", (codigo, sinal) => {
  if (codigo !== null) process.exitCode = codigo;
  else if (sinal) process.exitCode = 1;
});
