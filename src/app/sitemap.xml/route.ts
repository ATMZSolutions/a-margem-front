import { MetadataRoute } from "next";

const BASE_URL = "https://www.amargem.com.br";

const firstDayOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);

export const GET = (): Response => {
  const urls: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: firstDayOfMonth(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE_URL}/agenda`, lastModified: firstDayOfMonth(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/sobre`, lastModified: firstDayOfMonth(), changeFrequency: "yearly", priority: 0.8 },
    { url: `${BASE_URL}/coletivo`, lastModified: firstDayOfMonth(), changeFrequency: "yearly", priority: 0.8 },
    { url: `${BASE_URL}/premios`, lastModified: firstDayOfMonth(), changeFrequency: "yearly", priority: 0.7 },
    { url: `${BASE_URL}/espetaculos`, lastModified: firstDayOfMonth(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/projetos`, lastModified: firstDayOfMonth(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/noticias`, lastModified: firstDayOfMonth(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/indicacoes`, lastModified: firstDayOfMonth(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contato`, lastModified: firstDayOfMonth(), changeFrequency: "yearly", priority: 0.6 },
  ];

  // Converte para XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(({ url, lastModified, priority, changeFrequency }) => {
    const isoDate = lastModified instanceof Date ? lastModified.toISOString() : new Date().toISOString();
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${isoDate}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
};
