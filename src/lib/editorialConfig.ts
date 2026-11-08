export function supabaseEditorialAtivo(): boolean {
  return process.env.CONTEUDO_EDITORIAL_SUPABASE_ATIVO === "true";
}
