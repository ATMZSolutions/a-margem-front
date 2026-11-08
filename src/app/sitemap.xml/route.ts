import { listPublishedEspetaculos, listPublishedIntegrantes, listPublishedPremios } from "@/lib/publicContent";
import { getPublicSiteIdentity } from "@/lib/siteContent";
import { isPublicSitePage } from "@/lib/siteMetadata";

const staticUrls = [
  "/", "/agenda", "/sobre", "/coletivo", "/premios", "/espetaculos",
  "/projetos", "/noticias", "/indicacoes", "/contato",
];

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const [espetaculos, premios, integrantes, identity, publicStaticUrls] = await Promise.all([
    listPublishedEspetaculos(),
    listPublishedPremios(),
    listPublishedIntegrantes(),
    getPublicSiteIdentity(),
    Promise.all(staticUrls.map(async (path) => await isPublicSitePage(path) ? path : null)),
  ]);
  const urls = [
    ...publicStaticUrls.filter((path): path is string => path !== null),
    ...espetaculos.map((show) => `/espetaculos/${show.slug}`),
    ...premios.map((premio) => `/premios/${premio.slug}/${premio.year}`),
    ...integrantes.map((person) => `/coletivo/integrante/${person.slug}`),
  ];
  const pageStatusUrls = await Promise.all(urls.map(async (path) => await isPublicSitePage(path) ? path : null));
  const uniqueUrls = [...new Set(pageStatusUrls.filter((path): path is string => path !== null))];
  const baseUrl = identity.dominio.replace(/\/+$/, "");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((path) => `  <url><loc>${xmlEscape(`${baseUrl}${path === "/" ? "" : path}`)}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=60, s-maxage=60" },
  });
}
