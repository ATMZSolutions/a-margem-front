import { espetaculosData } from "@/data/espetaculos";
import { integrantes } from "@/data/integrantes";
import { premios } from "@/data/premios";
import { slugify } from "@/utils/helpers";

const BASE_URL = "https://www.amargem.com.br";

const staticUrls = [
  "/", "/agenda", "/sobre", "/coletivo", "/premios", "/espetaculos",
  "/projetos", "/noticias", "/indicacoes", "/contato",
];

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function GET(): Response {
  const urls = [
    ...staticUrls,
    ...espetaculosData.map((show) => `/espetaculos/${slugify(show.title)}`),
    ...premios.map((premio) => `/premios/${slugify(premio.title)}/${premio.year}`),
    ...integrantes.map((person) => `/coletivo/integrante/${person.id}`),
  ];
  const uniqueUrls = [...new Set(urls)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((path) => `  <url><loc>${xmlEscape(`${BASE_URL}${path}`)}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
