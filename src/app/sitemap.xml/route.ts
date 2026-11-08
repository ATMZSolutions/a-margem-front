import { listPublishedEspetaculos, listPublishedIntegrantes, listPublishedPremios } from "@/lib/publicContent";

const BASE_URL = "https://www.amargem.com.br";

const staticUrls = [
  "/", "/agenda", "/sobre", "/coletivo", "/premios", "/espetaculos",
  "/projetos", "/noticias", "/indicacoes", "/contato",
];

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const [espetaculos, premios, integrantes] = await Promise.all([
    listPublishedEspetaculos(),
    listPublishedPremios(),
    listPublishedIntegrantes(),
  ]);
  const urls = [
    ...staticUrls,
    ...espetaculos.map((show) => `/espetaculos/${show.slug}`),
    ...premios.map((premio) => `/premios/${premio.slug}/${premio.year}`),
    ...integrantes.map((person) => `/coletivo/integrante/${person.slug}`),
  ];
  const uniqueUrls = [...new Set(urls)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((path) => `  <url><loc>${xmlEscape(`${BASE_URL}${path}`)}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=60, s-maxage=60" },
  });
}
